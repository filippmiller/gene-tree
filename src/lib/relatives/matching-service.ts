/**
 * Matching Service - Finds potential relatives who share ancestors
 *
 * This service:
 * - Queries all users' ancestor lists
 * - Finds users with shared ancestors
 * - Calculates relationship degree
 * - Ranks matches by closeness
 * - Respects privacy settings
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type {
  PotentialRelative,
  MatchingPreferences,
  ConnectionRequest,
  ConnectionRequestWithProfiles,
  ConnectionRequestFilters,
  FindRelativesOptions,
} from './types';
import {
  calculateRelationshipLabel,
  formatAncestorLifespan,
  getAncestorsWithProfiles,
} from './ancestor-finder';

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Find potential relatives for a user
 * Uses database function for efficient matching
 */
export async function findPotentialRelatives(
  supabase: SupabaseClientType,
  userId: string,
  options: FindRelativesOptions = {},
  locale: 'en' | 'ru' = 'en'
): Promise<PotentialRelative[]> {
  const { maxDepth = 6, limit = 50 } = options;

  // First, get the user's ancestors with profile info
  const ancestors = await getAncestorsWithProfiles(supabase, userId, maxDepth);

  if (ancestors.length === 0) {
    return [];
  }

  const ancestorIds = ancestors.map((a) => a.ancestor_id);
  const ancestorMap = new Map(ancestors.map((a) => [a.ancestor_id, a]));

  // Find other users who share these ancestors (via ancestor_cache)
  // Using type assertion since ancestor_cache table is new
  const { data: matchingCaches, error: cacheError } = await supabase
    .from('ancestor_cache' as 'audit_logs')
    .select('user_id, ancestor_id, depth')
    .in('ancestor_id', ancestorIds)
    .neq('user_id', userId)
    .lte('depth', maxDepth) as unknown as {
      data: Array<{ user_id: string; ancestor_id: string; depth: number }> | null;
      error: Error | null;
    };

  if (cacheError) {
    console.error('Error querying ancestor cache:', cacheError);
    return [];
  }

  if (!matchingCaches || matchingCaches.length === 0) {
    return [];
  }

  // Get unique user IDs
  const potentialUserIds = [...new Set(matchingCaches.map((c) => c.user_id))];

  // Check matching preferences
  // Using type assertion since matching_preferences table is new
  const { data: preferences, error: prefError } = await supabase
    .from('matching_preferences' as 'audit_logs')
    .select('user_id, allow_matching')
    .in('user_id', potentialUserIds)
    .eq('allow_matching', true) as unknown as {
      data: Array<{ user_id: string; allow_matching: boolean }> | null;
      error: Error | null;
    };

  if (prefError) {
    console.error('Error checking preferences:', prefError);
    return [];
  }

  const allowedUserIds = new Set(preferences?.map((p) => p.user_id) || []);

  // Filter to allowed users
  const filteredCaches = matchingCaches.filter((c) => allowedUserIds.has(c.user_id));

  if (filteredCaches.length === 0) {
    return [];
  }

  // Check for existing relationships (to exclude)
  const { data: existingRelationships } = await supabase
    .from('relationships')
    .select('user1_id, user2_id')
    .or(
      potentialUserIds
        .map((uid) => `and(user1_id.eq.${userId},user2_id.eq.${uid}),and(user1_id.eq.${uid},user2_id.eq.${userId})`)
        .join(',')
    );

  const connectedUserIds = new Set<string>();
  (existingRelationships || []).forEach((r) => {
    if (r.user1_id === userId) connectedUserIds.add(r.user2_id);
    if (r.user2_id === userId) connectedUserIds.add(r.user1_id);
  });

  // Check for pending/accepted connection requests
  // Using type assertion since connection_requests table is new
  const { data: existingRequests } = await supabase
    .from('connection_requests' as 'audit_logs')
    .select('from_user_id, to_user_id')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .in('status', ['pending', 'accepted']) as unknown as {
      data: Array<{ from_user_id: string; to_user_id: string }> | null;
    };

  (existingRequests || []).forEach((r) => {
    if (r.from_user_id === userId) connectedUserIds.add(r.to_user_id);
    if (r.to_user_id === userId) connectedUserIds.add(r.from_user_id);
  });

  // Group matches by user, keeping the closest ancestor
  const userMatches = new Map<string, { ancestorId: string; theirDepth: number }>();

  for (const cache of filteredCaches) {
    if (connectedUserIds.has(cache.user_id)) continue;

    const existing = userMatches.get(cache.user_id);
    if (!existing || cache.depth < existing.theirDepth) {
      userMatches.set(cache.user_id, {
        ancestorId: cache.ancestor_id,
        theirDepth: cache.depth,
      });
    }
  }

  if (userMatches.size === 0) {
    return [];
  }

  // Get profiles for matched users
  const matchedUserIds = [...userMatches.keys()];
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', matchedUserIds);

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return [];
  }

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Build result with relationship descriptions
  const results: PotentialRelative[] = [];

  for (const [relativeUserId, match] of userMatches) {
    const profile = profileMap.get(relativeUserId);
    const ancestor = ancestorMap.get(match.ancestorId);

    if (!profile || !ancestor) continue;

    const userDepth = ancestor.depth;
    const relativeDepth = match.theirDepth;
    const closeness = userDepth + relativeDepth;

    const relationshipDesc = calculateRelationshipLabel(userDepth, relativeDepth, locale);
    const ancestorLifespan = formatAncestorLifespan(ancestor.birth_year, ancestor.death_year);

    results.push({
      relative_user_id: relativeUserId,
      relative_name: `${profile.first_name} ${profile.last_name}`.trim(),
      relative_avatar_url: profile.avatar_url,
      shared_ancestor_id: match.ancestorId,
      shared_ancestor_name: ancestor.name || 'Unknown',
      shared_ancestor_birth_year: ancestor.birth_year ?? null,
      shared_ancestor_death_year: ancestor.death_year ?? null,
      user_depth: userDepth,
      relative_depth: relativeDepth,
      relationship_closeness: closeness,
      relationship_description: `${relationshipDesc} via ${ancestor.name || 'shared ancestor'} ${ancestorLifespan}`.trim(),
    });
  }

  // Sort by closeness and limit
  results.sort((a, b) => a.relationship_closeness - b.relationship_closeness);

  return results.slice(0, limit);
}

/**
 * Get user's matching preferences
 */
export async function getMatchingPreferences(
  supabase: SupabaseClientType,
  userId: string
): Promise<MatchingPreferences | null> {
  // Using type assertion since matching_preferences table is new
  const { data, error } = await supabase
    .from('matching_preferences' as 'audit_logs')
    .select('*')
    .eq('user_id', userId)
    .single() as unknown as { data: MatchingPreferences | null; error: { code?: string; message?: string } | null };

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error);
    return null;
  }

  return data;
}

/**
 * Update user's matching preferences
 */
export async function updateMatchingPreferences(
  supabase: SupabaseClientType,
  userId: string,
  preferences: Partial<Omit<MatchingPreferences, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<MatchingPreferences | null> {
  // Using type assertion since matching_preferences table is new
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('matching_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single() as { data: MatchingPreferences | null; error: Error | null };

  if (error) {
    console.error('Error updating preferences:', error);
    return null;
  }

  return data;
}

/**
 * Create a connection request
 */
export async function createConnectionRequest(
  supabase: SupabaseClientType,
  fromUserId: string,
  toUserId: string,
  sharedAncestorId: string,
  message?: string,
  relationshipDescription?: string
): Promise<ConnectionRequest | null> {
  // Using type assertion since connection_requests table is new
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('connection_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      shared_ancestor_id: sharedAncestorId,
      message: message || null,
      relationship_description: relationshipDescription || null,
      status: 'pending',
    })
    .select()
    .single() as { data: ConnectionRequest | null; error: Error | null };

  if (error) {
    console.error('Error creating connection request:', error);
    return null;
  }

  return data;
}

/**
 * Update connection request status
 */
export async function updateConnectionRequestStatus(
  supabase: SupabaseClientType,
  requestId: string,
  status: 'accepted' | 'declined' | 'cancelled'
): Promise<ConnectionRequest | null> {
  // Using type assertion since connection_requests table is new
  const { data, error } = await supabase
    .from('connection_requests' as 'audit_logs')
    .update({
      status,
      responded_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', requestId)
    .select()
    .single() as unknown as { data: ConnectionRequest | null; error: Error | null };

  if (error) {
    console.error('Error updating connection request:', error);
    return null;
  }

  return data;
}

/**
 * Get connection requests for a user
 */
export async function getConnectionRequests(
  supabase: SupabaseClientType,
  userId: string,
  filters: ConnectionRequestFilters = {}
): Promise<ConnectionRequestWithProfiles[]> {
  const { status = 'all', direction = 'all' } = filters;

  // Using type assertion since connection_requests table is new
  // Build the query based on filters
  let baseQuery = supabase
    .from('connection_requests' as 'audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  // Filter by direction
  if (direction === 'sent') {
    baseQuery = baseQuery.eq('from_user_id', userId);
  } else if (direction === 'received') {
    baseQuery = baseQuery.eq('to_user_id', userId);
  } else {
    baseQuery = baseQuery.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
  }

  // Filter by status
  if (status !== 'all') {
    baseQuery = baseQuery.eq('status', status);
  }

  const { data: rawRequests, error } = await baseQuery as unknown as {
    data: ConnectionRequest[] | null;
    error: Error | null;
  };

  if (error || !rawRequests) {
    console.error('Error fetching connection requests:', error);
    return [];
  }

  // Fetch user profiles for the requests
  const userIds = new Set<string>();
  rawRequests.forEach((r) => {
    userIds.add(r.from_user_id);
    userIds.add(r.to_user_id);
    if (r.shared_ancestor_id) userIds.add(r.shared_ancestor_id);
  });

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url, birth_date, death_date')
    .in('id', [...userIds]);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  );

  // Map requests with profiles
  return rawRequests.map((request) => ({
    ...request,
    from_user: {
      id: request.from_user_id,
      first_name: profileMap.get(request.from_user_id)?.first_name || 'Unknown',
      last_name: profileMap.get(request.from_user_id)?.last_name || '',
      avatar_url: profileMap.get(request.from_user_id)?.avatar_url || null,
    },
    to_user: {
      id: request.to_user_id,
      first_name: profileMap.get(request.to_user_id)?.first_name || 'Unknown',
      last_name: profileMap.get(request.to_user_id)?.last_name || '',
      avatar_url: profileMap.get(request.to_user_id)?.avatar_url || null,
    },
    shared_ancestor: request.shared_ancestor_id
      ? {
          id: request.shared_ancestor_id,
          first_name: profileMap.get(request.shared_ancestor_id)?.first_name || 'Unknown',
          last_name: profileMap.get(request.shared_ancestor_id)?.last_name || '',
          birth_date: profileMap.get(request.shared_ancestor_id)?.birth_date || null,
          death_date: profileMap.get(request.shared_ancestor_id)?.death_date || null,
        }
      : null,
  }));
}

/**
 * Get pending connection request count for a user
 */
export async function getPendingRequestCount(
  supabase: SupabaseClientType,
  userId: string
): Promise<number> {
  // Using type assertion since connection_requests table is new
  const { count, error } = await supabase
    .from('connection_requests' as 'audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .eq('status', 'pending') as unknown as { count: number | null; error: Error | null };

  if (error) {
    console.error('Error counting pending requests:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Check if a connection request already exists between two users
 */
export async function hasExistingRequest(
  supabase: SupabaseClientType,
  fromUserId: string,
  toUserId: string
): Promise<boolean> {
  // Using type assertion since connection_requests table is new
  const { count, error } = await supabase
    .from('connection_requests' as 'audit_logs')
    .select('*', { count: 'exact', head: true })
    .or(
      `and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),` +
      `and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`
    )
    .in('status', ['pending', 'accepted']) as unknown as { count: number | null; error: Error | null };

  if (error) {
    console.error('Error checking existing requests:', error);
    return false;
  }

  return (count || 0) > 0;
}
