/**
 * API: /api/tree-data
 * Returns tree data for visualization using PostgreSQL recursive CTEs.
 *
 * PERFORMANCE: Uses get_tree_for_proband() — single database round-trip
 * replacing the previous N-query iteration approach.
 * (Migration: 20260206120000_improve_recursive_cte_tree.sql)
 *
 * Query params:
 *   root_id  — UUID of the person to center the tree on (defaults to current user)
 *   mode     — 'ancestors' | 'descendants' | 'hourglass' (default: 'hourglass')
 *   depth    — traversal depth 1-10 (default: 4)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { TreeData, TreeMode } from '@/components/tree/types';
import { treeLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate via SSR (cookies)
  const supabaseSSR = await getSupabaseSSR();
  const {
    data: { user },
    error: authError,
  } = await supabaseSSR.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const rootId = searchParams.get('root_id') || user.id;
  const mode = (searchParams.get('mode') || 'hourglass') as TreeMode;
  const depth = Math.min(Math.max(parseInt(searchParams.get('depth') || '4', 10), 1), 10);

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Use the optimized recursive CTE function — SINGLE database call
    interface TreeRpcResponse {
      persons: TreeData['persons'];
      parentChild: TreeData['parentChild'];
      unions: TreeData['unions'];
      unionChildren: TreeData['unionChildren'];
      _meta?: {
        proband_id: string;
        mode: string;
        max_depth: number;
        person_count: number;
      };
    }

    const { data, error } = await supabaseAdmin.rpc('get_tree_for_proband' as never, {
      proband_id: rootId,
      mode,
      max_depth: depth,
    } as never) as { data: TreeRpcResponse | null; error: Error | null };

    if (error) {
      treeLogger.error(
        { error: error.message, rootId, mode },
        'Recursive CTE function failed'
      );

      // Fallback to legacy N-query approach if the function doesn't exist yet
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        treeLogger.info('Falling back to legacy N-query approach');
        return await legacyTreeDataFetch(supabaseAdmin, rootId);
      }

      throw error;
    }

    const treeData: TreeData = {
      persons: data?.persons || [],
      parentChild: data?.parentChild || [],
      unions: data?.unions || [],
      unionChildren: data?.unionChildren || [],
    };

    const durationMs = Date.now() - startTime;

    treeLogger.info(
      {
        rootId,
        mode,
        depth,
        personsCount: treeData.persons.length,
        durationMs,
        usedRecursiveCTE: true,
      },
      'Tree data fetched successfully via recursive CTE'
    );

    const response = NextResponse.json(treeData);
    // Cache tree data briefly — tree changes are infrequent but reads are frequent.
    // private: only browser cache (not CDN), max-age: 30s fresh, swr: serve stale for 60s while revalidating.
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    treeLogger.error({ error: errorMessage, rootId }, 'Tree data fetch failed');
    return NextResponse.json(
      { error: 'Failed to fetch tree data' },
      { status: 500 }
    );
  }
}

/**
 * Legacy fallback using N-query approach.
 * Used when recursive CTE function doesn't exist (migration not applied).
 */
async function legacyTreeDataFetch(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  rootId: string,
): Promise<NextResponse> {
  // Get user profile for root person
  const { data: rootProfile, error: rootError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', rootId)
    .single();

  let actualRootProfile: Record<string, unknown> = rootProfile as Record<string, unknown>;

  if (rootError) {
    const { data: pendingRoot } = await supabaseAdmin
      .from('pending_relatives')
      .select('*')
      .eq('id', rootId)
      .single();

    if (!pendingRoot) {
      return NextResponse.json(
        { error: 'Root person not found' },
        { status: 404 }
      );
    }

    actualRootProfile = {
      id: pendingRoot.id,
      first_name: pendingRoot.first_name,
      last_name: pendingRoot.last_name,
      gender: null,
      birth_date: pendingRoot.date_of_birth,
      death_date: null,
      avatar_url: null,
    };
  }

  // Get ALL relatives from the family tree
  const { data: allPendingRels, error: allRelError } = await supabaseAdmin
    .from('pending_relatives')
    .select('*');

  if (allRelError) throw allRelError;

  // Find connected relatives
  const connectedUserIds = new Set<string>([rootId]);
  const allRelatives: Record<string, unknown>[] = [];

  for (const rel of allPendingRels || []) {
    if (rel.id === rootId) {
      connectedUserIds.add(rel.invited_by);
    }
    if (rel.invited_by === rootId) {
      allRelatives.push(rel);
      connectedUserIds.add(rel.id);
    }
  }

  for (const rel of allPendingRels || []) {
    if (
      connectedUserIds.has(rel.invited_by) &&
      !allRelatives.find((r: Record<string, unknown>) => r.id === rel.id)
    ) {
      allRelatives.push(rel);
      connectedUserIds.add(rel.id);
    }
  }

  // Build persons array
  const persons = [
    {
      id: actualRootProfile.id as string,
      name: `${actualRootProfile.first_name || ''} ${actualRootProfile.last_name || ''}`.trim() || 'Unknown',
      gender: (actualRootProfile.gender as string) || null,
      birth_date: (actualRootProfile.birth_date as string) || null,
      death_date: (actualRootProfile.death_date as string) || null,
      photo_url: (actualRootProfile.avatar_url as string) || null,
      is_alive: !actualRootProfile.death_date,
    },
  ];

  for (const rel of allRelatives) {
    persons.push({
      id: rel.id as string,
      name: `${rel.first_name} ${rel.last_name}`,
      gender: null,
      birth_date: (rel.date_of_birth as string) || null,
      death_date: null,
      photo_url: null,
      is_alive: !(rel.is_deceased as boolean),
    });
  }

  // Build parent_child links
  const parentChild = [];
  for (const rel of allRelatives) {
    if (rel.relationship_type === 'parent') {
      if (rel.related_to_user_id && rel.related_to_relationship === 'parent') {
        parentChild.push({
          parent_id: rel.id as string,
          child_id: rel.related_to_user_id as string,
        });
      } else {
        parentChild.push({
          parent_id: rel.id as string,
          child_id: rel.invited_by as string,
        });
      }
    } else if (rel.relationship_type === 'child') {
      parentChild.push({
        parent_id: rel.invited_by as string,
        child_id: rel.id as string,
      });
    }
  }

  // Build unions
  const unions: Record<string, unknown>[] = [];
  const unionChildren: Record<string, unknown>[] = [];

  for (const rel of allRelatives) {
    if (rel.relationship_type === 'spouse') {
      const p1 = rel.invited_by as string;
      const p2 = rel.id as string;
      const sortedIds = [p1, p2].sort();
      const unionId = `U:${sortedIds[0]}:${sortedIds[1]}`;

      unions.push({
        union_id: unionId,
        p1: sortedIds[0],
        p2: sortedIds[1],
        marriage_date: rel.marriage_date || null,
        divorce_date: rel.divorce_date || null,
      });

      for (const childRel of allRelatives) {
        if (childRel.relationship_type === 'child') {
          if (childRel.invited_by === p1 || childRel.invited_by === p2) {
            unionChildren.push({
              union_id: unionId,
              child_id: childRel.id as string,
            });
          }
        }
      }
    }
  }

  return NextResponse.json({
    persons,
    parentChild,
    unions,
    unionChildren,
  });
}
