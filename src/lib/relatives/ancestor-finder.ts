/**
 * Ancestor Finder - Traverses the family tree to find ancestors
 *
 * This module provides utilities for:
 * - Finding all ancestors of a user up to a given depth
 * - Caching ancestor lists for performance
 * - Finding common ancestors between two users
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { AncestorInfo, SharedAncestor } from './types';

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Get all ancestors of a user using the database function
 * This leverages the existing fn_get_ancestors PostgreSQL function
 */
export async function getAncestors(
  supabase: SupabaseClientType,
  userId: string,
  maxDepth: number = 8
): Promise<AncestorInfo[]> {
  const { data, error } = await supabase.rpc('fn_get_ancestors', {
    p_person: userId,
    p_max_depth: maxDepth,
  });

  if (error) {
    console.error('Error fetching ancestors:', error);
    return [];
  }

  return (data || []).map((row: { ancestor_id: string; depth: number; path: string[] }) => ({
    ancestor_id: row.ancestor_id,
    depth: row.depth,
    path: row.path,
  }));
}

/**
 * Get ancestors with profile information
 */
export async function getAncestorsWithProfiles(
  supabase: SupabaseClientType,
  userId: string,
  maxDepth: number = 8
): Promise<AncestorInfo[]> {
  const ancestors = await getAncestors(supabase, userId, maxDepth);

  if (ancestors.length === 0) {
    return [];
  }

  const ancestorIds = ancestors.map((a) => a.ancestor_id);

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, birth_date, death_date')
    .in('id', ancestorIds);

  if (error) {
    console.error('Error fetching ancestor profiles:', error);
    return ancestors;
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return ancestors.map((ancestor) => {
    const profile = profileMap.get(ancestor.ancestor_id);
    return {
      ...ancestor,
      name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : undefined,
      birth_year: profile?.birth_date ? new Date(profile.birth_date).getFullYear() : null,
      death_year: profile?.death_date ? new Date(profile.death_date).getFullYear() : null,
    };
  });
}

/**
 * Find shared ancestors between two users
 * Uses client-side computation since the DB function may not exist yet
 */
export async function findSharedAncestors(
  supabase: SupabaseClientType,
  userId1: string,
  userId2: string,
  maxDepth: number = 8
): Promise<SharedAncestor[]> {
  // Get ancestors for both users
  const [ancestors1, ancestors2] = await Promise.all([
    getAncestorsWithProfiles(supabase, userId1, maxDepth),
    getAncestorsWithProfiles(supabase, userId2, maxDepth),
  ]);

  // Find common ancestors
  const ancestors2Map = new Map(ancestors2.map((a) => [a.ancestor_id, a]));
  const sharedAncestors: SharedAncestor[] = [];

  for (const a1 of ancestors1) {
    const a2 = ancestors2Map.get(a1.ancestor_id);
    if (a2) {
      sharedAncestors.push({
        ancestor_id: a1.ancestor_id,
        user1_depth: a1.depth,
        user2_depth: a2.depth,
        ancestor_name: a1.name || 'Unknown',
        birth_year: a1.birth_year,
        death_year: a1.death_year,
      });
    }
  }

  // Sort by closeness (sum of depths)
  sharedAncestors.sort((a, b) =>
    (a.user1_depth + a.user2_depth) - (b.user1_depth + b.user2_depth)
  );

  return sharedAncestors;
}

/**
 * Refresh the ancestor cache for a user
 * Call this after relationship changes
 */
export async function refreshAncestorCache(
  supabase: SupabaseClientType,
  userId: string,
  maxDepth: number = 8
): Promise<number> {
  // Get ancestors and upsert into cache
  const ancestors = await getAncestors(supabase, userId, maxDepth);

  if (ancestors.length === 0) {
    return 0;
  }

  // Delete existing cache
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('ancestor_cache')
    .delete()
    .eq('user_id', userId);

  // Insert new cache entries
  const cacheEntries = ancestors.map((a) => ({
    user_id: userId,
    ancestor_id: a.ancestor_id,
    depth: a.depth,
    path: a.path,
    last_computed: new Date().toISOString(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ancestor_cache')
    .insert(cacheEntries);

  if (error) {
    console.error('Error refreshing ancestor cache:', error);
    return 0;
  }

  return ancestors.length;
}

/**
 * Get cached ancestors for a user
 * Falls back to computing if cache is empty
 */
export async function getCachedAncestors(
  supabase: SupabaseClientType,
  userId: string,
  maxDepth: number = 8
): Promise<AncestorInfo[]> {
  // Try cache first
  // Using type assertion since ancestor_cache table is new
  const { data: cached, error: cacheError } = await supabase
    .from('ancestor_cache' as 'audit_logs')
    .select('ancestor_id, depth, path')
    .eq('user_id', userId)
    .lte('depth', maxDepth) as unknown as {
      data: Array<{ ancestor_id: string; depth: number; path: string[] }> | null;
      error: Error | null;
    };

  if (!cacheError && cached && cached.length > 0) {
    return cached.map((row) => ({
      ancestor_id: row.ancestor_id,
      depth: row.depth,
      path: row.path,
    }));
  }

  // Cache miss - compute and cache
  const ancestors = await getAncestors(supabase, userId, maxDepth);

  if (ancestors.length > 0) {
    // Don't await - fire and forget
    refreshAncestorCache(supabase, userId, maxDepth).catch(console.error);
  }

  return ancestors;
}

/**
 * Calculate relationship label based on ancestor depths
 * Returns both English and Russian labels
 */
export function calculateRelationshipLabel(
  userDepth: number,
  relativeDepth: number,
  locale: 'en' | 'ru' = 'en'
): string {
  const totalDepth = userDepth + relativeDepth;
  const generation = Math.min(userDepth, relativeDepth);
  const removal = Math.abs(userDepth - relativeDepth);

  // Same generation (siblings, cousins)
  if (userDepth === relativeDepth) {
    if (userDepth === 1) {
      return locale === 'en' ? 'Sibling' : 'Брат/Сестра';
    }
    const cousinDegree = userDepth - 1;
    if (cousinDegree === 1) {
      return locale === 'en' ? 'First Cousin' : 'Двоюродный брат/сестра';
    }
    if (cousinDegree === 2) {
      return locale === 'en' ? 'Second Cousin' : 'Троюродный брат/сестра';
    }
    if (cousinDegree === 3) {
      return locale === 'en' ? 'Third Cousin' : 'Четвероюродный брат/сестра';
    }
    return locale === 'en'
      ? `${ordinal(cousinDegree)} Cousin`
      : `${cousinDegree + 1}-юродный брат/сестра`;
  }

  // Different generations (cousins removed)
  if (generation >= 1) {
    const cousinDegree = generation;
    const removedLabel = locale === 'en'
      ? `${removal}x removed`
      : `${removal} колено`;

    if (cousinDegree === 1) {
      return locale === 'en'
        ? `First Cousin, ${removedLabel}`
        : `Двоюродный, ${removedLabel}`;
    }
    if (cousinDegree === 2) {
      return locale === 'en'
        ? `Second Cousin, ${removedLabel}`
        : `Троюродный, ${removedLabel}`;
    }
    return locale === 'en'
      ? `${ordinal(cousinDegree)} Cousin, ${removedLabel}`
      : `${cousinDegree + 1}-юродный, ${removedLabel}`;
  }

  return locale === 'en' ? 'Distant Relative' : 'Дальний родственник';
}

/**
 * Helper to get ordinal suffix for English
 */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format ancestor lifespan for display
 */
export function formatAncestorLifespan(
  birthYear: number | null | undefined,
  deathYear: number | null | undefined
): string {
  if (!birthYear && !deathYear) return '';
  if (birthYear && deathYear) return `(${birthYear}-${deathYear})`;
  if (birthYear) return `(b. ${birthYear})`;
  if (deathYear) return `(d. ${deathYear})`;
  return '';
}
