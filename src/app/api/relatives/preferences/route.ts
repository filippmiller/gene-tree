/**
 * GET /api/relatives/preferences
 * Get user's matching preferences
 *
 * PUT /api/relatives/preferences
 * Update user's matching preferences
 *
 * Body:
 * - allow_matching?: boolean
 * - notify_on_match?: boolean
 * - min_ancestor_depth?: number (1-10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { getMatchingPreferences, updateMatchingPreferences } from '@/lib/relatives';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  const requestMeta = extractRequestMeta(request);

  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const preferences = await getMatchingPreferences(supabaseAdmin, user.id);

    // Return defaults if no preferences exist
    if (!preferences) {
      return NextResponse.json({
        user_id: user.id,
        allow_matching: true,
        notify_on_match: true,
        min_ancestor_depth: 2,
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in GET /api/relatives/preferences:', error);

    await logAudit({
      action: 'get_matching_preferences_error',
      method: 'GET',
      path: '/api/relatives/preferences',
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ...requestMeta,
    });

    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const requestMeta = extractRequestMeta(request);

  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { allow_matching, notify_on_match, min_ancestor_depth } = body;

    // Validate min_ancestor_depth if provided
    if (min_ancestor_depth !== undefined) {
      const depth = parseInt(min_ancestor_depth, 10);
      if (isNaN(depth) || depth < 1 || depth > 10) {
        return NextResponse.json(
          { error: 'min_ancestor_depth must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    const updatedPreferences = await updateMatchingPreferences(
      supabaseAdmin,
      user.id,
      {
        ...(allow_matching !== undefined && { allow_matching }),
        ...(notify_on_match !== undefined && { notify_on_match }),
        ...(min_ancestor_depth !== undefined && { min_ancestor_depth }),
      }
    );

    if (!updatedPreferences) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    await logAudit({
      action: 'update_matching_preferences',
      entityType: 'matching_preferences',
      entityId: user.id,
      method: 'PUT',
      path: '/api/relatives/preferences',
      requestBody: body,
      responseStatus: 200,
      ...requestMeta,
    });

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error('Error in PUT /api/relatives/preferences:', error);

    await logAudit({
      action: 'update_matching_preferences_error',
      method: 'PUT',
      path: '/api/relatives/preferences',
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ...requestMeta,
    });

    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
