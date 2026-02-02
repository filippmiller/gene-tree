import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

interface RouteParams {
  params: Promise<{ id: string; tagId: string }>;
}

/**
 * DELETE /api/profiles/:id/honor-tags/:tagId
 *
 * Remove an honor tag from a profile
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: profileId, tagId } = await params;
    const supabase = await getSupabaseSSR();
    const supabaseAdmin = getSupabaseAdmin();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the profile honor tag
    // Tables not yet in generated types, using 'as any'
    const { data: profileTag, error: fetchError } = await (supabaseAdmin as any)
      .from('profile_honor_tags')
      .select('id, profile_id, added_by')
      .eq('id', tagId)
      .eq('profile_id', profileId)
      .single();

    if (fetchError || !profileTag) {
      return NextResponse.json(
        { error: 'Honor tag not found on this profile' },
        { status: 404 }
      );
    }

    // Check permissions: can delete if:
    // - Own profile
    // - Added by current user
    const isOwnProfile = profileId === user.id;
    const wasAddedByUser = profileTag.added_by === user.id;

    if (!isOwnProfile && !wasAddedByUser) {
      return NextResponse.json(
        { error: 'Not authorized to remove this honor tag' },
        { status: 403 }
      );
    }

    // Delete the tag
    const { error: deleteError } = await (supabaseAdmin as any)
      .from('profile_honor_tags')
      .delete()
      .eq('id', tagId);

    if (deleteError) {
      console.error('Error deleting honor tag:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove honor tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/profiles/:id/honor-tags/:tagId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profiles/:id/honor-tags/:tagId
 *
 * Update an honor tag (e.g., toggle featured)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: profileId, tagId } = await params;
    const supabase = await getSupabaseSSR();
    const supabaseAdmin = getSupabaseAdmin();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { is_featured, display_order } = body;

    // Check if it's own profile
    if (profileId !== user.id) {
      return NextResponse.json(
        { error: 'Can only update honor tags on own profile' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (typeof is_featured === 'boolean') {
      updates.is_featured = is_featured;
    }
    if (typeof display_order === 'number') {
      updates.display_order = display_order;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the tag
    // Tables not yet in generated types, using 'as any'
    const { data: updatedTag, error: updateError } = await (supabaseAdmin as any)
      .from('profile_honor_tags')
      .update(updates)
      .eq('id', tagId)
      .eq('profile_id', profileId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating honor tag:', updateError);
      return NextResponse.json(
        { error: 'Failed to update honor tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tag: updatedTag });
  } catch (error) {
    console.error('Error in PATCH /api/profiles/:id/honor-tags/:tagId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
