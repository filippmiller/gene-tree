/**
 * API Endpoint: /api/tree
 *
 * Миссия: Получение данных семейного дерева для визуализации
 *
 * Поддерживает 3 режима:
 * - ancestors: предки (вверх по дереву от proband)
 * - descendants: потомки (вниз по дереву от proband)
 * - hourglass: песочные часы (и предки, и потомки)
 *
 * Параметры запроса:
 * - proband_id: UUID человека (корень дерева)
 * - mode: 'ancestors' | 'descendants' | 'hourglass' (по умолчанию 'ancestors')
 * - depth: глубина обхода 1-10 (по умолчанию 4)
 *
 * Возвращает TreeData: {persons, parentChild, unions, unionChildren}
 * Используется в: компонент TreeCanvas на странице /tree/[id]
 *
 * PERFORMANCE: Uses PostgreSQL recursive CTEs for 10-50x faster tree loading
 * (Migration: 20260205200000_recursive_cte_tree_functions.sql)
 */

import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextRequest, NextResponse } from 'next/server';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import type { TreeData, TreeMode } from '@/components/tree/types';
import { treeLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);
  const searchParams = req.nextUrl.searchParams;
  const startTime = Date.now();

  // Извлекаем параметры запроса
  const proband_id = searchParams.get('proband_id');
  const mode = (searchParams.get('mode') || 'ancestors') as TreeMode;
  const depth = parseInt(searchParams.get('depth') || '4', 10);

  // Валидация
  if (!proband_id) {
    await logAudit({
      action: 'tree_fetch_missing_proband',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 400,
      errorMessage: 'proband_id is required',
      ...requestMeta,
    });
    return NextResponse.json({ error: 'proband_id is required' }, { status: 400 });
  }

  if (!['ancestors', 'descendants', 'hourglass'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  if (depth < 1 || depth > 10) {
    return NextResponse.json({ error: 'depth must be 1-10' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      await logAudit({
        action: 'tree_fetch_unauthorized',
        method: 'GET',
        path: '/api/tree',
        responseStatus: 401,
        errorMessage: 'Unauthorized',
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    treeLogger.info({ proband_id, mode, depth }, 'Fetching tree data with recursive CTE');

    // Use the optimized recursive CTE function - SINGLE database call!
    // Note: Using type assertion since function is created via migration
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

    const { data, error } = await supabase.rpc('get_tree_for_proband' as never, {
      proband_id,
      mode,
      max_depth: depth,
    } as never) as { data: TreeRpcResponse | null; error: Error | null };

    if (error) {
      treeLogger.error({ error: error.message, proband_id, mode }, 'Recursive CTE function failed');

      // Fallback to legacy N-query approach if function doesn't exist
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        treeLogger.info('Falling back to legacy N-query approach');
        return await legacyTreeFetch(req, proband_id, mode, depth, requestMeta);
      }

      throw error;
    }

    const durationMs = Date.now() - startTime;

    // Extract tree data from response
    const treeData: TreeData = {
      persons: data?.persons || [],
      parentChild: data?.parentChild || [],
      unions: data?.unions || [],
      unionChildren: data?.unionChildren || [],
    };

    treeLogger.info({
      proband_id,
      mode,
      depth,
      personsCount: treeData.persons.length,
      durationMs,
    }, 'Tree data fetched successfully');

    await logAudit({
      action: 'tree_fetch_success',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 200,
      responseBody: {
        personsCount: treeData.persons.length,
        linksCount: treeData.parentChild.length,
        mode,
        depth,
        durationMs,
        usedRecursiveCTE: true,
      },
      ...requestMeta,
    });

    return NextResponse.json(treeData, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;

    treeLogger.error({ error: errorMessage, proband_id, mode }, 'Tree fetch failed');

    await logAudit({
      action: 'tree_fetch_exception',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 500,
      errorMessage,
      errorStack,
      ...requestMeta,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Legacy fallback using N-query approach
 * Used when recursive CTE function doesn't exist (migration not applied)
 */
async function legacyTreeFetch(
  req: NextRequest,
  proband_id: string,
  mode: TreeMode,
  depth: number,
  requestMeta: Record<string, unknown>
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const supabase = getSupabaseAdmin();

    // Get person IDs using N-query iteration (legacy approach)
    let personIds: string[];
    if (mode === 'ancestors') {
      personIds = await getAncestorsLegacy(supabase, proband_id, depth);
    } else if (mode === 'descendants') {
      personIds = await getDescendantsLegacy(supabase, proband_id, depth);
    } else {
      // hourglass - и предки, и потомки
      const ancestorIds = await getAncestorsLegacy(supabase, proband_id, depth);
      const descendantIds = await getDescendantsLegacy(supabase, proband_id, depth);
      personIds = Array.from(new Set([...ancestorIds, ...descendantIds]));
    }

    // Add proband if missing
    if (!personIds.includes(proband_id)) {
      personIds.push(proband_id);
    }

    // Fetch full tree data
    const treeData = await fetchTreeDataLegacy(supabase, personIds);
    const durationMs = Date.now() - startTime;

    treeLogger.info({
      proband_id,
      mode,
      depth,
      personsCount: treeData.persons.length,
      durationMs,
      legacy: true,
    }, 'Tree data fetched (legacy N-query)');

    await logAudit({
      action: 'tree_fetch_success',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 200,
      responseBody: {
        personsCount: treeData.persons.length,
        linksCount: treeData.parentChild.length,
        mode,
        depth,
        durationMs,
        usedRecursiveCTE: false,
      },
      ...requestMeta,
    });

    return NextResponse.json(treeData, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;

    await logAudit({
      action: 'tree_fetch_exception',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 500,
      errorMessage,
      errorStack,
      ...requestMeta,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Legacy getAncestors - N-query iteration (DEPRECATED, kept for fallback)
 */
async function getAncestorsLegacy(supabase: ReturnType<typeof getSupabaseAdmin>, probandId: string, maxDepth: number): Promise<string[]> {
  const ancestors = new Set<string>();
  let currentLevel = [probandId];

  for (let depth = 0; depth < maxDepth && currentLevel.length > 0; depth++) {
    const { data: parents } = await supabase
      .from('gt_v_parent_child')
      .select('parent_id')
      .in('child_id', currentLevel);

    if (!parents || parents.length === 0) break;

    const parentIds = parents
      .map((p) => p.parent_id)
      .filter((id): id is string => id !== null);
    parentIds.forEach((id) => ancestors.add(id));
    currentLevel = parentIds;
  }

  return Array.from(ancestors);
}

/**
 * Legacy getDescendants - N-query iteration (DEPRECATED, kept for fallback)
 */
async function getDescendantsLegacy(supabase: ReturnType<typeof getSupabaseAdmin>, probandId: string, maxDepth: number): Promise<string[]> {
  const descendants = new Set<string>();
  let currentLevel = [probandId];

  for (let depth = 0; depth < maxDepth && currentLevel.length > 0; depth++) {
    const { data: children } = await supabase
      .from('gt_v_parent_child')
      .select('child_id')
      .in('parent_id', currentLevel);

    if (!children || children.length === 0) break;

    const childIds = children
      .map((c) => c.child_id)
      .filter((id): id is string => id !== null);
    childIds.forEach((id) => descendants.add(id));
    currentLevel = childIds;
  }

  return Array.from(descendants);
}

/**
 * Legacy fetchTreeData - Multiple parallel queries (DEPRECATED, kept for fallback)
 */
async function fetchTreeDataLegacy(supabase: ReturnType<typeof getSupabaseAdmin>, personIds: string[]): Promise<TreeData> {
  const [personsResult, parentChildResult, unionsResult, unionChildrenResult] =
    await Promise.all([
      supabase.from('gt_v_person').select('*').in('id', personIds),
      supabase
        .from('gt_v_parent_child')
        .select('*')
        .or(`parent_id.in.(${personIds.join(',')}),child_id.in.(${personIds.join(',')})`),
      supabase
        .from('gt_v_union')
        .select('*')
        .or(`p1.in.(${personIds.join(',')}),p2.in.(${personIds.join(',')})`),
      supabase.from('gt_v_union_child').select('*').in('child_id', personIds),
    ]);

  if (personsResult.error) throw personsResult.error;
  if (parentChildResult.error) throw parentChildResult.error;
  if (unionsResult.error) throw unionsResult.error;
  if (unionChildrenResult.error) throw unionChildrenResult.error;

  return {
    persons: (personsResult.data || []) as unknown as TreeData['persons'],
    parentChild: (parentChildResult.data || []) as unknown as TreeData['parentChild'],
    unions: (unionsResult.data || []) as unknown as TreeData['unions'],
    unionChildren: (unionChildrenResult.data || []) as unknown as TreeData['unionChildren'],
  };
}
