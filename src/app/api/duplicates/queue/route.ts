/**
 * GET /api/duplicates/queue
 *
 * Retrieves the queue of potential duplicates with profile data.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { PotentialDuplicate, DuplicateStatus, MatchReasons } from '@/lib/duplicates/types';

export async function GET(request: NextRequest) {
  const authResult = await requireAdminContext();

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.reason === 'not_authenticated' ? 'Unauthorized' : 'Forbidden' },
      { status: authResult.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Parse query params
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as DuplicateStatus | null;
    const minConfidence = parseInt(url.searchParams.get('minConfidence') || '0', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('potential_duplicates')
      .select('*')
      .gte('confidence_score', minConfidence)
      .order('confidence_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: duplicates, error: queryError, count } = await query;

    if (queryError) {
      console.error('[DuplicateQueue] Error fetching queue:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch duplicate queue' },
        { status: 500 }
      );
    }

    if (!duplicates || duplicates.length === 0) {
      return NextResponse.json({
        duplicates: [],
        total: 0,
        hasMore: false,
      });
    }

    // Collect unique profile IDs
    const profileIds = new Set<string>();
    for (const dup of duplicates) {
      profileIds.add(dup.profile_a_id);
      profileIds.add(dup.profile_b_id);
    }

    // Fetch profile data
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, maiden_name, nickname, middle_name, birth_date, birth_place, birth_city, birth_country, death_date, death_place, gender, avatar_url, occupation, bio, phone, current_city, current_country, is_living')
      .in('id', Array.from(profileIds));

    if (profilesError) {
      console.error('[DuplicateQueue] Error fetching profiles:', profilesError);
    }

    // Create profile lookup map
    const profileMap = new Map(
      (profiles || []).map(p => [p.id, p])
    );

    // Enrich duplicates with profile data
    const enrichedDuplicates = duplicates.map(dup => ({
      ...dup,
      match_reasons: dup.match_reasons as MatchReasons,
      profile_a: profileMap.get(dup.profile_a_id) || undefined,
      profile_b: profileMap.get(dup.profile_b_id) || undefined,
    })) as PotentialDuplicate[];

    // Get total count for pending
    const { count: pendingCount } = await supabase
      .from('potential_duplicates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return NextResponse.json({
      duplicates: enrichedDuplicates,
      total: count || duplicates.length,
      pendingCount: pendingCount || 0,
      hasMore: duplicates.length === limit,
    });
  } catch (error) {
    console.error('[DuplicateQueue] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
