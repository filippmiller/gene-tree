/**
 * GET /api/duplicates/scan
 * POST /api/duplicates/scan
 *
 * Scans profiles for potential duplicates and adds them to the queue.
 * Supports full scan, deceased-only scan, and incremental scan.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { scanForDuplicates, scanForDeceasedDuplicates } from '@/lib/duplicates/detector';
import type { ProfileData } from '@/lib/duplicates/types';
import type { EnhancedProfileData, DuplicateScanOptions } from '@/types/duplicate';
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
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // Get parameters from query
    const url = new URL(request.url);
    const minConfidence = parseInt(url.searchParams.get('minConfidence') || '50', 10);
    const scanType = (url.searchParams.get('scanType') || 'full') as 'full' | 'deceased_only' | 'incremental';
    const includeRelationships = url.searchParams.get('includeRelationships') === 'true';

    // Fetch profiles based on scan type
    let profileQuery = supabase
      .from('user_profiles')
      .select('id, first_name, last_name, maiden_name, nickname, middle_name, birth_date, birth_place, birth_city, birth_country, death_date, death_place, gender, avatar_url, is_living')
      .not('first_name', 'is', null)
      .not('last_name', 'is', null);

    if (scanType === 'deceased_only') {
      profileQuery = profileQuery.eq('is_living', false);
    }

    const { data: profiles, error: profilesError } = await profileQuery;

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

    // Build shared relatives map if requested
    let sharedRelativesMap: Map<string, number> | undefined;
    if (includeRelationships && scanType === 'deceased_only') {
      sharedRelativesMap = new Map();
      // Get all relationships for deceased profiles
      const deceasedIds = (profiles || []).filter(p => !p.is_living).map(p => p.id);

      if (deceasedIds.length > 0) {
        const { data: relationships } = await supabase
          .from('relationships')
          .select('user1_id, user2_id')
          .or(`user1_id.in.(${deceasedIds.join(',')}),user2_id.in.(${deceasedIds.join(',')})`);

        // Build adjacency map
        const relMap = new Map<string, Set<string>>();
        for (const rel of relationships || []) {
          if (!relMap.has(rel.user1_id)) relMap.set(rel.user1_id, new Set());
          if (!relMap.has(rel.user2_id)) relMap.set(rel.user2_id, new Set());
          relMap.get(rel.user1_id)!.add(rel.user2_id);
          relMap.get(rel.user2_id)!.add(rel.user1_id);
        }

        // Count shared relatives for each pair
        for (let i = 0; i < deceasedIds.length; i++) {
          for (let j = i + 1; j < deceasedIds.length; j++) {
            const id1 = deceasedIds[i] < deceasedIds[j] ? deceasedIds[i] : deceasedIds[j];
            const id2 = deceasedIds[i] < deceasedIds[j] ? deceasedIds[j] : deceasedIds[i];
            const rels1 = relMap.get(id1) || new Set();
            const rels2 = relMap.get(id2) || new Set();
            const shared = [...rels1].filter(r => rels2.has(r)).length;
            if (shared > 0) {
              sharedRelativesMap.set(`${id1}:${id2}`, shared);
            }
          }
        }
      }
    }

    // Scan for duplicates based on type
    let duplicates;
    if (scanType === 'deceased_only') {
      duplicates = scanForDeceasedDuplicates(
        profiles as EnhancedProfileData[],
        minConfidence,
        existingPairSet,
        sharedRelativesMap
      );
    } else {
      duplicates = scanForDuplicates(
        profiles as ProfileData[],
        minConfidence,
        existingPairSet
      );
    }

    // Insert new potential duplicates
    let inserted = 0;
    for (const dup of duplicates) {
      const isDeceasedPair = scanType === 'deceased_only' ||
        ('is_deceased_pair' in dup && dup.is_deceased_pair);
      const sharedRelatives = 'shared_relatives_count' in dup ? dup.shared_relatives_count : 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('potential_duplicates')
        .insert({
          profile_a_id: dup.profile_a_id,
          profile_b_id: dup.profile_b_id,
          confidence_score: dup.confidence_score,
          match_reasons: dup.match_reasons,
          status: 'pending',
          is_deceased_pair: isDeceasedPair,
          shared_relatives_count: sharedRelatives,
        });

      if (!insertError) {
        inserted++;
      } else if (!insertError.message?.includes('duplicate key')) {
        console.error('[DuplicateScan] Error inserting duplicate:', insertError);
      }
    }

    const durationMs = Date.now() - startTime;

    // Log scan history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('duplicate_scan_history').insert({
      scanned_by: authResult.user.id,
      profiles_scanned: profiles?.length || 0,
      duplicates_found: duplicates.length,
      duplicates_inserted: inserted,
      scan_type: scanType,
      min_confidence: minConfidence,
      duration_ms: durationMs,
    });

    // Log the scan action
    await logAudit({
      action: 'duplicate_scan',
      entityType: 'potential_duplicates',
      method: 'GET',
      path: '/api/duplicates/scan',
      responseStatus: 200,
      responseBody: { found: duplicates.length, inserted, scanType },
      ...extractRequestMeta(request),
    });

    return NextResponse.json({
      success: true,
      scanType,
      profilesScanned: profiles?.length || 0,
      duplicatesFound: duplicates.length,
      duplicatesInserted: inserted,
      durationMs,
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

// POST endpoint for more controlled scans with options
export async function POST(request: NextRequest) {
  const authResult = await requireAdminContext();

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.reason === 'not_authenticated' ? 'Unauthorized' : 'Forbidden' },
      { status: authResult.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  try {
    const body = await request.json();
    const options: DuplicateScanOptions = {
      scanType: body.scanType || 'full',
      minConfidence: body.minConfidence || 50,
      includeRelationshipMatching: body.includeRelationshipMatching ?? true,
    };

    // Build URL with query params and call GET handler
    const url = new URL(request.url);
    url.searchParams.set('scanType', options.scanType);
    url.searchParams.set('minConfidence', options.minConfidence.toString());
    url.searchParams.set('includeRelationships', options.includeRelationshipMatching.toString());

    // Create a new request with the updated URL
    const getRequest = new NextRequest(url, {
      method: 'GET',
      headers: request.headers,
    });

    return GET(getRequest);
  } catch (error) {
    console.error('[DuplicateScan POST] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
