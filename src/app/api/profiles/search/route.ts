/**
 * API Endpoint: /api/profiles/search
 *
 * Fuzzy search for user profiles using pg_trgm trigram similarity.
 * Supports partial name matching and typo tolerance.
 *
 * Query Parameters:
 *   - q: Search query (required, min 2 characters)
 *   - limit: Max results (default 20, max 50)
 *   - mode: 'single' (default) or 'fullname' (for "John Smith" style queries)
 *
 * Returns: Array of matching profiles sorted by similarity score
 *
 * Uses PostgreSQL pg_trgm extension for fast fuzzy matching.
 * Migration: 20260205210000_fulltext_search_pg_trgm.sql
 */

import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextRequest, NextResponse } from 'next/server';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Response type for search results
interface ProfileSearchResult {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  maiden_name: string | null;
  birth_date: string | null;
  gender: string | null;
  avatar_url: string | null;
  similarity_score: number;
}

export async function GET(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);
  const searchParams = req.nextUrl.searchParams;
  const startTime = Date.now();

  // Extract query parameters
  const query = searchParams.get('q')?.trim() || '';
  const limitParam = parseInt(searchParams.get('limit') || '20', 10);
  const mode = searchParams.get('mode') || 'single';

  // Validate query
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Search query must be at least 2 characters' },
      { status: 400 }
    );
  }

  // Validate limit
  const limit = Math.min(Math.max(1, limitParam), 50);

  // Validate mode
  if (!['single', 'fullname'].includes(mode)) {
    return NextResponse.json(
      { error: 'Invalid mode. Use "single" or "fullname"' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      await logAudit({
        action: 'profile_search_unauthorized',
        method: 'GET',
        path: '/api/profiles/search',
        responseStatus: 401,
        errorMessage: 'Unauthorized',
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    apiLogger.info({ query, limit, mode }, 'Profile search request');

    // Choose the appropriate search function
    const functionName = mode === 'fullname'
      ? 'search_profiles_fullname'
      : 'search_profiles';

    // Call the appropriate search function
    const { data, error } = await supabase.rpc(functionName as never, {
      search_query: query,
      limit_count: limit,
      ...(mode === 'single' ? { min_similarity: 0.1 } : {}),
    } as never) as { data: ProfileSearchResult[] | null; error: Error | null };

    if (error) {
      apiLogger.error({ error: error.message, query }, 'Profile search failed');

      // Check if function doesn't exist (migration not applied)
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        return await fallbackSearch(supabase, query, limit, requestMeta);
      }

      throw error;
    }

    const durationMs = Date.now() - startTime;
    const results = data || [];

    apiLogger.info({
      query,
      resultCount: results.length,
      durationMs,
    }, 'Profile search completed');

    await logAudit({
      action: 'profile_search_success',
      method: 'GET',
      path: '/api/profiles/search',
      responseStatus: 200,
      responseBody: {
        query,
        resultCount: results.length,
        durationMs,
        mode,
      },
      ...requestMeta,
    });

    return NextResponse.json({
      results,
      meta: {
        query,
        count: results.length,
        durationMs,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;

    apiLogger.error({ error: errorMessage, query }, 'Profile search exception');

    await logAudit({
      action: 'profile_search_exception',
      method: 'GET',
      path: '/api/profiles/search',
      responseStatus: 500,
      errorMessage,
      errorStack,
      ...requestMeta,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Fallback search using basic ILIKE when pg_trgm is not available
 * Used when migration hasn't been applied yet
 */
async function fallbackSearch(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  query: string,
  limit: number,
  requestMeta: Record<string, unknown>
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    apiLogger.info('Using fallback ILIKE search (pg_trgm not available)');

    const searchPattern = `%${query}%`;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, middle_name, last_name, maiden_name, birth_date, gender, avatar_url')
      .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},middle_name.ilike.${searchPattern},maiden_name.ilike.${searchPattern}`)
      .limit(limit);

    if (error) {
      throw error;
    }

    const durationMs = Date.now() - startTime;
    const results: ProfileSearchResult[] = (data || []).map((profile) => ({
      id: profile.id,
      first_name: profile.first_name,
      middle_name: profile.middle_name,
      last_name: profile.last_name,
      maiden_name: profile.maiden_name,
      birth_date: profile.birth_date,
      gender: profile.gender,
      avatar_url: profile.avatar_url,
      similarity_score: 0.5, // Placeholder score for fallback
    }));

    await logAudit({
      action: 'profile_search_success',
      method: 'GET',
      path: '/api/profiles/search',
      responseStatus: 200,
      responseBody: {
        query,
        resultCount: results.length,
        durationMs,
        fallback: true,
      },
      ...requestMeta,
    });

    return NextResponse.json({
      results,
      meta: {
        query,
        count: results.length,
        durationMs,
        fallback: true,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    await logAudit({
      action: 'profile_search_exception',
      method: 'GET',
      path: '/api/profiles/search',
      responseStatus: 500,
      errorMessage,
      ...requestMeta,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
