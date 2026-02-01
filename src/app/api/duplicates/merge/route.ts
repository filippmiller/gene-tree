/**
 * POST /api/duplicates/merge
 *
 * Merges two duplicate profiles into one.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { mergeProfiles } from '@/lib/duplicates/merge-service';
import type { MergeRequest } from '@/lib/duplicates/types';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

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
    const { duplicateId, keepProfileId, mergeProfileId, fieldsToMerge } = body as MergeRequest;

    // Validate request
    if (!duplicateId || !keepProfileId || !mergeProfileId) {
      return NextResponse.json(
        { error: 'Missing required fields: duplicateId, keepProfileId, mergeProfileId' },
        { status: 400 }
      );
    }

    if (keepProfileId === mergeProfileId) {
      return NextResponse.json(
        { error: 'Cannot merge a profile with itself' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify the duplicate record exists and is pending
    const { data: duplicate, error: dupError } = await supabase
      .from('potential_duplicates')
      .select('*')
      .eq('id', duplicateId)
      .single();

    if (dupError || !duplicate) {
      return NextResponse.json(
        { error: 'Duplicate record not found' },
        { status: 404 }
      );
    }

    if (duplicate.status !== 'pending') {
      return NextResponse.json(
        { error: `Duplicate has already been ${duplicate.status}` },
        { status: 400 }
      );
    }

    // Verify profile IDs match the duplicate record
    const validProfiles = (
      (duplicate.profile_a_id === keepProfileId && duplicate.profile_b_id === mergeProfileId) ||
      (duplicate.profile_a_id === mergeProfileId && duplicate.profile_b_id === keepProfileId)
    );

    if (!validProfiles) {
      return NextResponse.json(
        { error: 'Profile IDs do not match the duplicate record' },
        { status: 400 }
      );
    }

    // Perform the merge
    const result = await mergeProfiles(
      supabase,
      { duplicateId, keepProfileId, mergeProfileId, fieldsToMerge },
      authResult.user.id
    );

    // Log the merge action
    await logAudit({
      action: result.success ? 'duplicate_merge_success' : 'duplicate_merge_failed',
      entityType: 'potential_duplicates',
      entityId: duplicateId,
      method: 'POST',
      path: '/api/duplicates/merge',
      requestBody: { keepProfileId, mergeProfileId },
      responseStatus: result.success ? 200 : 500,
      responseBody: result,
      errorMessage: result.error,
      ...extractRequestMeta(request),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Merge failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mergeHistoryId: result.mergeHistoryId,
      relationshipsTransferred: result.relationshipsTransferred,
      message: `Successfully merged profiles. ${result.relationshipsTransferred} relationships transferred.`,
    });
  } catch (error) {
    console.error('[DuplicateMerge] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
