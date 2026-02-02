import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { DiscoveryApiResponse, DiscoveryResult, MatchReason } from '@/types/bridge-request';

/**
 * GET /api/bridges/discover
 * Find potential bridge candidates for the current user
 */
export async function GET() {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  try {
    // Call the discovery function
    // Using type assertion since migration may not be applied yet
    const { data: rawCandidates, error: discoverError } = await (admin as any).rpc('find_bridge_candidates', {
      p_user_id: user.id,
    });

    if (discoverError) {
      console.error('[Bridges Discover] Failed to find candidates:', discoverError);
      return NextResponse.json({ error: 'Failed to discover candidates' }, { status: 500 });
    }

    type RawCandidate = { candidate_id: string; match_score: number; match_reasons: MatchReason[] };
    const typedCandidates = rawCandidates as RawCandidate[] | null;

    if (!typedCandidates || typedCandidates.length === 0) {
      const response: DiscoveryApiResponse = { candidates: [] };
      return NextResponse.json(response);
    }

    // Get profile info for candidates
    const candidateIds = typedCandidates.map((c) => c.candidate_id);
    const { data: profiles, error: profileError } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url, birth_place')
      .in('id', candidateIds);

    if (profileError) {
      console.error('[Bridges Discover] Failed to fetch profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Map profiles to candidates
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const candidates: DiscoveryResult[] = typedCandidates.map(
      (c) => ({
        candidate_id: c.candidate_id,
        match_score: c.match_score,
        match_reasons: c.match_reasons || [],
        profile: profileMap.get(c.candidate_id) || {
          id: c.candidate_id,
          first_name: null,
          last_name: null,
          avatar_url: null,
          birth_place: null,
        },
      })
    );

    const response: DiscoveryApiResponse = { candidates };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Bridges Discover] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
