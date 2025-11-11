/**
 * /api/relationships-depth/route.ts
 * 
 * Миссия: НОВЫЙ API для получения родственников с ПРАВИЛЬНОЙ классификацией по глубине
 * 
 * Исправляет проблему: дедушки попадали в Parents вместо Grandparents
 * 
 * Возвращает родственников по категориям:
 * - parents: depth = 1 (РОВНО один шаг вверх)
 * - grandparents: depth = 2 (РОВНО два шага вверх)  
 * - children: depth = 1 (РОВНО один шаг вниз)
 * - grandchildren: depth = 2 (РОВНО два шага вниз)
 * - siblings: люди с общими родителями
 * - spouses: супруги через relationships
 * 
 * Используется: на странице /relations (relationships page)
 * Заменяет: старый /api/relationships (который работал с pending_relatives)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { logAudit } from '@/lib/audit/logger';

/**
 * Person - структура человека из gt_v_person
 */
interface Person {
  id: string;
  name: string;
  gender: string | null;
  birth_date: string | null;
  death_date: string | null;
  photo_url: string | null;
  is_alive: boolean;
}

/**
 * PersonWithDepth - Person + depth для ancestors/descendants
 */
interface PersonWithDepth extends Person {
  depth: number;
}

/**
 * Spouse - супруг с датами брака
 */
interface Spouse extends Person {
  marriage_date: string | null;
  divorce_date: string | null;
}

/**
 * RelationshipsDepthResponse - структура ответа API
 */
interface RelationshipsDepthResponse {
  parents: Person[];
  grandparents: Person[];
  children: Person[];
  grandchildren: Person[];
  siblings: Person[];
  spouses: Spouse[];
}

/**
 * GET /api/relationships-depth
 * 
 * Query params:
 * - proband_id: UUID человека (по умолчанию текущий пользователь)
 * 
 * Алгоритм:
 * 1. Вызывает get_ancestors_with_depth(person_id, 3) - получает ancestors с depth
 * 2. Фильтрует: parents = depth===1, grandparents = depth===2
 * 3. Вызывает get_descendants_with_depth(person_id, 3)
 * 4. Фильтрует: children = depth===1, grandchildren = depth===2
 * 5. Вызывает get_siblings(person_id)
 * 6. Вызывает get_spouses(person_id)
 */
export async function GET(request: NextRequest) {
  // Using getSupabaseAdmin()

  // Проверка авторизации
  const {
    data: { user },
    error: authError,
  } = await getSupabaseAdmin().auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Получение proband_id из query (или использовать текущего пользователя)
  const searchParams = request.nextUrl.searchParams;
  const probandId = searchParams.get('proband_id') || user.id;

  try {
    // =======================
    // 1. ПРЕДКИ (ANCESTORS) с глубиной
    // =======================
    const { data: ancestors, error: ancestorsError } = await getSupabaseAdmin().rpc(
      'get_ancestors_with_depth',
      {
        person_id: probandId,
        max_depth: 3, // Получаем до 3 поколений вверх
      }
    );

    if (ancestorsError) {
      console.error('[RELATIONSHIPS-DEPTH] Ancestors error:', ancestorsError);
      throw ancestorsError;
    }

    // Фильтруем по глубине: СТРОГО depth = 1 или depth = 2
    const parents = (ancestors || []).filter((p: PersonWithDepth) => p.depth === 1);
    const grandparents = (ancestors || []).filter((p: PersonWithDepth) => p.depth === 2);

    console.log(`[RELATIONSHIPS-DEPTH] Parents (depth=1): ${parents.length}, Grandparents (depth=2): ${grandparents.length}`);

    // =======================
    // 2. ПОТОМКИ (DESCENDANTS) с глубиной
    // =======================
    const { data: descendants, error: descendantsError } = await getSupabaseAdmin().rpc(
      'get_descendants_with_depth',
      {
        person_id: probandId,
        max_depth: 3, // Получаем до 3 поколений вниз
      }
    );

    if (descendantsError) {
      console.error('[RELATIONSHIPS-DEPTH] Descendants error:', descendantsError);
      throw descendantsError;
    }

    // Фильтруем по глубине
    const children = (descendants || []).filter((p: PersonWithDepth) => p.depth === 1);
    const grandchildren = (descendants || []).filter((p: PersonWithDepth) => p.depth === 2);

    console.log(`[RELATIONSHIPS-DEPTH] Children (depth=1): ${children.length}, Grandchildren (depth=2): ${grandchildren.length}`);

    // =======================
    // 3. SIBLINGS (братья/сёстры)
    // =======================
    const { data: siblings, error: siblingsError } = await getSupabaseAdmin().rpc(
      'get_siblings',
      {
        person_id: probandId,
      }
    );

    if (siblingsError) {
      console.error('[RELATIONSHIPS-DEPTH] Siblings error:', siblingsError);
      throw siblingsError;
    }

    console.log(`[RELATIONSHIPS-DEPTH] Siblings: ${(siblings || []).length}`);

    // =======================
    // 4. SPOUSES (супруги)
    // =======================
    const { data: spouses, error: spousesError } = await getSupabaseAdmin().rpc(
      'get_spouses',
      {
        person_id: probandId,
      }
    );

    if (spousesError) {
      console.error('[RELATIONSHIPS-DEPTH] Spouses error:', spousesError);
      throw spousesError;
    }

    console.log(`[RELATIONSHIPS-DEPTH] Spouses: ${(spouses || []).length}`);

    // Формирование ответа
    const response: RelationshipsDepthResponse = {
      parents: parents || [],
      grandparents: grandparents || [],
      children: children || [],
      grandchildren: grandchildren || [],
      siblings: siblings || [],
      spouses: spouses || [],
    };

    // Логирование успешного запроса
    await logAudit({
      action: 'relationships_depth_api_success',
      method: 'GET',
      path: '/api/relationships-depth',
      responseStatus: 200,
      responseBody: {
        proband_id: probandId,
        counts: {
          parents: response.parents.length,
          grandparents: response.grandparents.length,
          children: response.children.length,
          grandchildren: response.grandchildren.length,
          siblings: response.siblings.length,
          spouses: response.spouses.length,
        },
      },
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 минут кеш
      },
    });
  } catch (error) {
    console.error('[RELATIONSHIPS-DEPTH] API error:', error);

    await logAudit({
      action: 'relationships_depth_api_error',
      method: 'GET',
      path: '/api/relationships-depth',
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseBody: { proband_id: probandId },
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch relationships',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

