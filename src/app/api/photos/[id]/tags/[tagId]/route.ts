import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { ConfirmTagRequest, PhotoTagWithProfile } from '@/types/photo-tags';

interface RouteParams {
  params: Promise<{
    id: string;
    tagId: string;
  }>;
}

/**
 * PATCH /api/photos/[id]/tags/[tagId]
 * Confirm or update a photo tag (only by tagged person)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: photoId, tagId } = await params;
    const body: ConfirmTagRequest = await req.json();
    const { is_confirmed } = body;

    if (typeof is_confirmed !== 'boolean') {
      return NextResponse.json({ error: 'is_confirmed must be a boolean' }, { status: 400 });
    }

    // Verify tag exists and user is the tagged person
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: existingTag, error: fetchError } = await (supabase as any)
      .from('photo_tags')
      .select('id, photo_id, tagged_profile_id')
      .eq('id', tagId)
      .eq('photo_id', photoId)
      .maybeSingle();

    if (fetchError || !existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    if (existingTag.tagged_profile_id !== user.id) {
      return NextResponse.json({ error: 'Only the tagged person can confirm or deny tags' }, { status: 403 });
    }

    // Update the tag
    const { data: updatedTag, error: updateError } = await (supabase as any)
      .from('photo_tags')
      .update({
        is_confirmed,
        confirmed_at: is_confirmed ? new Date().toISOString() : null,
      })
      .eq('id', tagId)
      .select(`
        id,
        photo_id,
        tagged_profile_id,
        x_percent,
        y_percent,
        width_percent,
        height_percent,
        tagged_by,
        is_confirmed,
        confirmed_at,
        created_at,
        tagged_profile:user_profiles!tagged_profile_id (
          first_name,
          last_name,
          avatar_url
        ),
        tagger:user_profiles!tagged_by (
          first_name,
          last_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating photo tag:', updateError);
      if (updateError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tag: updatedTag as PhotoTagWithProfile,
    });

  } catch (error: unknown) {
    console.error('Error in PATCH /api/photos/[id]/tags/[tagId]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/photos/[id]/tags/[tagId]
 * Remove a photo tag (by tagger or tagged person)
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: photoId, tagId } = await params;

    // Verify tag exists and user has permission to delete
    const { data: existingTag, error: fetchError } = await (supabase as any)
      .from('photo_tags')
      .select('id, photo_id, tagged_profile_id, tagged_by')
      .eq('id', tagId)
      .eq('photo_id', photoId)
      .maybeSingle();

    if (fetchError || !existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check permission: must be tagger or tagged person
    if (existingTag.tagged_by !== user.id && existingTag.tagged_profile_id !== user.id) {
      return NextResponse.json({
        error: 'Only the tagger or tagged person can remove this tag'
      }, { status: 403 });
    }

    // Delete the tag
    const { error: deleteError } = await (supabase as any)
      .from('photo_tags')
      .delete()
      .eq('id', tagId);

    if (deleteError) {
      console.error('Error deleting photo tag:', deleteError);
      if (deleteError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: tagId,
    });

  } catch (error: unknown) {
    console.error('Error in DELETE /api/photos/[id]/tags/[tagId]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
