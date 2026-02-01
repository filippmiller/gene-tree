/**
 * GET /api/duplicates/scan
 *
 * Scans all profiles for potential duplicates and adds them to the queue.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { scanForDuplicates } from '@/lib/duplicates/detector';
import type { ProfileData } from '@/lib/duplicates/types';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

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

    // Get minimum confidence from query params (default: 50)
    const url = new URL(request.url);
    const minConfidence = parseInt(url.searchParams.get('minConfidence') || '50', 10);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, maiden_name, nickname, middle_name, birth_date, birth_place, birth_city, birth_country, death_date, death_place, gender, avatar_url')
      .not('first_name', 'is', null)
      .not('last_name', 'is', null);

    if (profilesError) {
      console.error('[DuplicateScan] Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // Get existing duplicate pairs to skip
    const { data: existingPairs } = await supabase
      .from('potential_duplicates')
      .select('profile_a_id, profile_b_id');

    const existingPairSet = new Set(
      (existingPairs || []).map(p => `${p.profile_a_id}:${p.profile_b_id}`)
    );

    // Scan for duplicates
    const duplicates = scanForDuplicates(
      profiles as ProfileData[],
      minConfidence,
      existingPairSet
    );

    // Insert new potential duplicates
    let inserted = 0;
    for (const dup of duplicates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('potential_duplicates')
        .insert({
          profile_a_id: dup.profile_a_id,
          profile_b_id: dup.profile_b_id,
          confidence_score: dup.confidence_score,
          match_reasons: dup.match_reasons,
          status: 'pending',
        });

      if (!insertError) {
        inserted++;
      } else if (!insertError.message.includes('duplicate key')) {
        console.error('[DuplicateScan] Error inserting duplicate:', insertError);
      }
    }

    // Log the scan action
    await logAudit({
      action: 'duplicate_scan',
      entityType: 'potential_duplicates',
      method: 'GET',
      path: '/api/duplicates/scan',
      responseStatus: 200,
      responseBody: { found: duplicates.length, inserted },
      ...extractRequestMeta(request),
    });

    return NextResponse.json({
      success: true,
      profilesScanned: profiles?.length || 0,
      duplicatesFound: duplicates.length,
      duplicatesInserted: inserted,
      duplicates: duplicates.slice(0, 10), // Return first 10 for preview
    });
  } catch (error) {
    console.error('[DuplicateScan] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
