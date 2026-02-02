/**
 * GET /api/duplicates/[id]
 * PATCH /api/duplicates/[id]
 *
 * Get or update a single duplicate record.
 * Admin-only endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import type { ExtendedDuplicateStatus } from '@/types/duplicate';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdminContext();

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.reason === 'not_authenticated' ? 'Unauthorized' : 'Forbidden' },
      { status: authResult.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();

    // Fetch the duplicate record
    const { data: duplicate, error } = await supabase
      .from('potential_duplicates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !duplicate) {
      return NextResponse.json(
        { error: 'Duplicate record not found' },
        { status: 404 }
      );
    }

    // Fetch profile data for both profiles
    const profileIds = [duplicate.profile_a_id, duplicate.profile_b_id];
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id, first_name, last_name, maiden_name, nickname, middle_name,
        birth_date, birth_place, birth_city, birth_country,
        death_date, death_place, gender, avatar_url,
        occupation, bio, phone, current_city, current_country, is_living
      `)
      .in('id', profileIds);

    if (profilesError) {
      console.error('[DuplicateGet] Error fetching profiles:', profilesError);
    }

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Get relationship counts for both profiles
    const { data: relCounts } = await supabase
      .from('relationships')
      .select('user1_id, user2_id')
      .or(`user1_id.in.(${profileIds.join(',')}),user2_id.in.(${profileIds.join(',')})`);

    const relationshipCounts: Record<string, number> = {};
    profileIds.forEach((id) => {
      relationshipCounts[id] = (relCounts || []).filter(
        (r) => r.user1_id === id || r.user2_id === id
      ).length;
    });

    // Get story counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: storyCounts } = await (supabase as any)
      .from('family_stories')
      .select('subject_id')
      .in('subject_id', profileIds);

    const storyCountMap: Record<string, number> = {};
    profileIds.forEach((id) => {
      storyCountMap[id] = (storyCounts || []).filter((s: { subject_id: string }) => s.subject_id === id).length;
    });

    // Get reviewer info if resolved
    let reviewerInfo = null;
    if (duplicate.reviewed_by) {
      const { data: reviewer } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .eq('id', duplicate.reviewed_by)
        .single();
      reviewerInfo = reviewer;
    }

    // Enrich the duplicate with profile data
    const enrichedDuplicate = {
      ...duplicate,
      profile_a: {
        ...profileMap.get(duplicate.profile_a_id),
        relationships_count: relationshipCounts[duplicate.profile_a_id] || 0,
        stories_count: storyCountMap[duplicate.profile_a_id] || 0,
      },
      profile_b: {
        ...profileMap.get(duplicate.profile_b_id),
        relationships_count: relationshipCounts[duplicate.profile_b_id] || 0,
        stories_count: storyCountMap[duplicate.profile_b_id] || 0,
      },
      reviewer: reviewerInfo,
    };

    return NextResponse.json({ duplicate: enrichedDuplicate });
  } catch (error) {
    console.error('[DuplicateGet] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdminContext();

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.reason === 'not_authenticated' ? 'Unauthorized' : 'Forbidden' },
      { status: authResult.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, resolutionNotes } = body as {
      status: ExtendedDuplicateStatus;
      resolutionNotes?: string;
    };

    // Validate status
    const validStatuses: ExtendedDuplicateStatus[] = [
      'pending',
      'confirmed_same',
      'confirmed_different',
      'merged',
      'not_duplicate',
      'dismissed',
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify the duplicate record exists
    const { data: existing, error: existingError } = await supabase
      .from('potential_duplicates')
      .select('id, status')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Duplicate record not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      updateData.reviewed_by = authResult.user.id;
      updateData.reviewed_at = new Date().toISOString();
    }
    if (resolutionNotes !== undefined) {
      updateData.resolution_notes = resolutionNotes;
    }

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('potential_duplicates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[DuplicatePatch] Error updating:', updateError);
      return NextResponse.json(
        { error: 'Failed to update duplicate record' },
        { status: 500 }
      );
    }

    // Log the action
    await logAudit({
      action: `duplicate_status_changed_to_${status}`,
      entityType: 'potential_duplicates',
      entityId: id,
      method: 'PATCH',
      path: `/api/duplicates/${id}`,
      requestBody: { status, resolutionNotes },
      responseStatus: 200,
      ...extractRequestMeta(request),
    });

    return NextResponse.json({
      success: true,
      duplicate: updated,
    });
  } catch (error) {
    console.error('[DuplicatePatch] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
