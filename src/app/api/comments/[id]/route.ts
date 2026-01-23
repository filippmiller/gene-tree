import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { UpdateCommentRequest } from '@/types/comments';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/comments/[id]
 * Edit a comment (only by author)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;
    const body: UpdateCommentRequest = await req.json();
    const { content, mentioned_profile_ids } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Content exceeds maximum length of 2000 characters' }, { status: 400 });
    }

    // Verify comment exists and belongs to user
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: existingComment, error: fetchError } = await (supabase as any)
      .from('story_comments')
      .select('id, author_id, story_id')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.author_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
    }

    // Update comment
    const updateData: Record<string, unknown> = {
      content: content.trim(),
    };

    if (mentioned_profile_ids !== undefined) {
      updateData.mentioned_profile_ids = mentioned_profile_ids;
    }

    const { data: updatedComment, error: updateError } = await (supabase as any)
      .from('story_comments')
      .update(updateData)
      .eq('id', commentId)
      .select(`
        id,
        story_id,
        author_id,
        parent_id,
        content,
        mentioned_profile_ids,
        created_at,
        updated_at,
        author:user_profiles!author_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      if (updateError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comment: updatedComment,
    });

  } catch (error: unknown) {
    console.error('Error in PATCH /api/comments/[id]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/comments/[id]
 * Delete a comment (only by author)
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;

    // Verify comment exists and belongs to user
    const { data: existingComment, error: fetchError } = await (supabase as any)
      .from('story_comments')
      .select('id, author_id, story_id')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.author_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    // Delete comment (cascades to child comments)
    const { error: deleteError } = await (supabase as any)
      .from('story_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      if (deleteError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: commentId,
    });

  } catch (error: unknown) {
    console.error('Error in DELETE /api/comments/[id]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
