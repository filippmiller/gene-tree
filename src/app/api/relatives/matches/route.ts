/**
 * GET /api/relatives/matches
 *
 * Find potential relatives who share ancestors with the current user.
 * Respects privacy settings and excludes already-connected users.
 *
 * Query params:
 * - maxDepth: Maximum ancestor depth to search (default: 6)
 * - limit: Maximum number of results (default: 50)
 * - locale: Language for relationship labels (en/ru, default: en)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { findPotentialRelatives, getMatchingPreferences } from '@/lib/relatives';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  const requestMeta = extractRequestMeta(request);

  try {
    // Authenticate user
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has matching enabled
    const supabaseAdmin = getSupabaseAdmin();
    const preferences = await getMatchingPreferences(supabaseAdmin, user.id);

    if (preferences && !preferences.allow_matching) {
      return NextResponse.json({
        matches: [],
        message: 'Matching is disabled in your preferences',
      });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const maxDepth = Math.min(parseInt(searchParams.get('maxDepth') || '6', 10), 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const locale = (searchParams.get('locale') || 'en') as 'en' | 'ru';

    // Find potential relatives
    const matches = await findPotentialRelatives(
      supabaseAdmin,
      user.id,
      { maxDepth, limit },
      locale
    );

    // Log successful query
    await logAudit({
      action: 'find_relatives_success',
      entityType: 'relative_matches',
      method: 'GET',
      path: '/api/relatives/matches',
      responseStatus: 200,
      responseBody: { matchCount: matches.length },
      ...requestMeta,
    });

    return NextResponse.json({
      matches,
      total: matches.length,
    });
  } catch (error) {
    console.error('Error in GET /api/relatives/matches:', error);

    await logAudit({
      action: 'find_relatives_error',
      method: 'GET',
      path: '/api/relatives/matches',
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ...requestMeta,
    });

    return NextResponse.json(
      { error: 'Failed to find potential relatives' },
      { status: 500 }
    );
  }
}
