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
 */

import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextRequest, NextResponse } from 'next/server';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import type { TreeData, TreeMode } from '@/components/tree/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);
  const searchParams = req.nextUrl.searchParams;
  
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
    const { data: { user } } = await getSupabaseAdmin().auth.getUser();
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

    // Получаем ID людей в зависимости от режима
    let personIds: string[];
    if (mode === 'ancestors') {
      personIds = await getAncestors(getSupabaseAdmin(), proband_id, depth);
    } else if (mode === 'descendants') {
      personIds = await getDescendants(getSupabaseAdmin(), proband_id, depth);
    } else {
      // hourglass - и предки, и потомки
      const ancestorIds = await getAncestors(getSupabaseAdmin(), proband_id, depth);
      const descendantIds = await getDescendants(getSupabaseAdmin(), proband_id, depth);
      personIds = Array.from(new Set([...ancestorIds, ...descendantIds]));
    }

    // Добавляем proband если его нет
    if (!personIds.includes(proband_id)) {
      personIds.push(proband_id);
    }

    // Получаем полные данные
    const treeData = await fetchTreeData(getSupabaseAdmin(), personIds);

    await logAudit({
      action: 'tree_fetch_success',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 200,
      responseBody: { 
        personsCount: treeData.persons.length, 
        linksCount: treeData.parentChild.length,
        mode,
        depth 
      },
      ...requestMeta,
    });

    return NextResponse.json(treeData, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err: any) {
    await logAudit({
      action: 'tree_fetch_exception',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 500,
      errorMessage: err.message,
      errorStack: err.stack,
      ...requestMeta,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * getAncestors - получить всех предков через рекурсивный обход вверх
 * 
 * Использует VIEW gt_v_parent_child для обхода связей parent→child в обратном направлении
 * Итеративно проходит по уровням, от детей к родителям
 * 
 * @param getSupabaseAdmin() - getSupabaseAdmin() клиент
 * @param probandId - UUID стартового человека
 * @param maxDepth - максимальная глубина (количество поколений)
 * @returns массив UUID всех найденных предков
 */
async function getAncestors(supabaseAdmin: any, probandId: string, maxDepth: number): Promise<string[]> {
  const ancestors = new Set<string>();
  let currentLevel = [probandId];

  for (let depth = 0; depth < maxDepth && currentLevel.length > 0; depth++) {
    const { data: parents } = await getSupabaseAdmin()
      .from('gt_v_parent_child')
      .select('parent_id')
      .in('child_id', currentLevel);

    if (!parents || parents.length === 0) break;

    const parentIds = parents.map((p: any) => p.parent_id);
    parentIds.forEach((id: string) => ancestors.add(id));
    currentLevel = parentIds;
  }

  return Array.from(ancestors);
}

/**
 * getDescendants - получить всех потомков через рекурсивный обход вниз
 * 
 * Использует VIEW gt_v_parent_child для обхода связей parent→child
 * Итеративно проходит по уровням, от родителей к детям
 * 
 * @param getSupabaseAdmin() - getSupabaseAdmin() клиент
 * @param probandId - UUID стартового человека
 * @param maxDepth - максимальная глубина
 * @returns массив UUID всех найденных потомков
 */
async function getDescendants(supabaseAdmin: any, probandId: string, maxDepth: number): Promise<string[]> {
  const descendants = new Set<string>();
  let currentLevel = [probandId];

  for (let depth = 0; depth < maxDepth && currentLevel.length > 0; depth++) {
    const { data: children } = await getSupabaseAdmin()
      .from('gt_v_parent_child')
      .select('child_id')
      .in('parent_id', currentLevel);

    if (!children || children.length === 0) break;

    const childIds = children.map((c: any) => c.child_id);
    childIds.forEach((id: string) => descendants.add(id));
    currentLevel = childIds;
  }

  return Array.from(descendants);
}

/**
 * fetchTreeData - получить полные данные дерева для списка людей
 * 
 * Выполняет 4 параллельных запроса к VIEW:
 * 1. gt_v_person - данные о людях
 * 2. gt_v_parent_child - связи родитель→ребёнок
 * 3. gt_v_union - виртуальные узлы браков/партнёрств
 * 4. gt_v_union_child - связи союз→ребёнок
 * 
 * @param getSupabaseAdmin() - getSupabaseAdmin() клиент
 * @param personIds - массив UUID людей для включения в дерево
 * @returns объект TreeData с полными данными для визуализации
 */
async function fetchTreeData(supabaseAdmin: any, personIds: string[]): Promise<TreeData> {
  const [personsResult, parentChildResult, unionsResult, unionChildrenResult] =
    await Promise.all([
      // 1. Получаем данные о людях из VIEW
      getSupabaseAdmin().from('gt_v_person').select('*').in('id', personIds),
      
      // 2. Получаем связи родитель→ребёнок между этими людьми
      getSupabaseAdmin()
        .from('gt_v_parent_child')
        .select('*')
        .or(`parent_id.in.(${personIds.join(',')}),child_id.in.(${personIds.join(',')})`),
      
      // 3. Получаем союзы (браки) между этими людьми
      getSupabaseAdmin()
        .from('gt_v_union')
        .select('*')
        .or(`p1.in.(${personIds.join(',')}),p2.in.(${personIds.join(',')})`),
      
      // 4. Получаем связи союз→ребёнок
      getSupabaseAdmin().from('gt_v_union_child').select('*').in('child_id', personIds),
    ]);

  if (personsResult.error) throw personsResult.error;
  if (parentChildResult.error) throw parentChildResult.error;
  if (unionsResult.error) throw unionsResult.error;
  if (unionChildrenResult.error) throw unionChildrenResult.error;

  return {
    persons: (personsResult.data || []) as any,
    parentChild: (parentChildResult.data || []) as any,
    unions: (unionsResult.data || []) as any,
    unionChildren: (unionChildrenResult.data || []) as any,
  };
}

