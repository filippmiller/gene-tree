import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { createNotification } from '@/lib/notifications';
import type { CreateCommentRequest, GetCommentsResponse, ThreadedComment, CommentWithAuthor } from '@/types/comments';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/stories/[id]/comments
 * Get all comments for a story (threaded)
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: storyId } = await params;

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', storyId)
      .maybeSingle();

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Get all comments with author info
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: allComments, error: commentsError } = await (supabase as any)
      .from('story_comments')
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
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json({ error: commentsError.message }, { status: 500 });
    }

    // Build threaded structure
    const commentMap = new Map<string, ThreadedComment>();
    const rootComments: ThreadedComment[] = [];

    // First pass: create all comment objects
    for (const comment of allComments || []) {
      const threadedComment: ThreadedComment = {
        ...comment,
        author: comment.author as CommentWithAuthor['author'],
        replies: [],
        replyCount: 0,
      };
      commentMap.set(comment.id, threadedComment);
    }

    // Second pass: build tree structure
    for (const comment of allComments || []) {
      const threadedComment = commentMap.get(comment.id)!;
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        const parent = commentMap.get(comment.parent_id)!;
        parent.replies.push(threadedComment);
        parent.replyCount++;
      } else {
        rootComments.push(threadedComment);
      }
    }

    const response: GetCommentsResponse = {
      comments: rootComments,
      total: allComments?.length || 0,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error in GET /api/stories/[id]/comments:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/stories/[id]/comments
 * Add a new comment to a story
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: storyId } = await params;
    const body: CreateCommentRequest = await req.json();
    const { content, parent_id, mentioned_profile_ids } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Content exceeds maximum length of 2000 characters' }, { status: 400 });
    }

    // Verify story exists
    // Note: Using 'as any' until types are regenerated
    const { data: story, error: storyError } = await (supabase as any)
      .from('stories')
      .select('id, subject_id, author_id, title')
      .eq('id', storyId)
      .maybeSingle();

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const storyData = story as any;

    // If replying, verify parent comment exists
    if (parent_id) {
      const { data: parentComment } = await (supabase as any)
        .from('story_comments')
        .select('id, story_id, author_id')
        .eq('id', parent_id)
        .maybeSingle();

      if (!parentComment || parentComment.story_id !== storyId) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    // Create comment
    const { data: comment, error: createError } = await (supabase as any)
      .from('story_comments')
      .insert({
        story_id: storyId,
        author_id: user.id,
        parent_id: parent_id || null,
        content: content.trim(),
        mentioned_profile_ids: mentioned_profile_ids || [],
      })
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

    if (createError) {
      console.error('Error creating comment:', createError);
      if (createError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const commentPreview = content.trim().substring(0, 100);

    // Send notifications
    // 1. To story subject (if not the commenter)
    if (storyData.subject_id !== user.id) {
      await createNotification({
        eventType: 'COMMENT_ADDED',
        actorUserId: user.id,
        primaryProfileId: storyData.subject_id,
        payload: {
          story_id: storyId,
          comment_id: comment.id,
          comment_preview: commentPreview,
          story_title: storyData.title,
        },
      });
    }

    // 2. To parent comment author (if replying and not self)
    if (parent_id) {
      const { data: parentComment } = await (supabase as any)
        .from('story_comments')
        .select('author_id')
        .eq('id', parent_id)
        .maybeSingle();

      if (parentComment && parentComment.author_id !== user.id) {
        await createNotification({
          eventType: 'COMMENT_REPLY',
          actorUserId: user.id,
          primaryProfileId: parentComment.author_id,
          payload: {
            story_id: storyId,
            comment_id: comment.id,
            parent_comment_id: parent_id,
            comment_preview: commentPreview,
          },
        });
      }
    }

    // 3. To mentioned profiles
    if (mentioned_profile_ids && mentioned_profile_ids.length > 0) {
      const uniqueMentionedIds = Array.from(new Set(mentioned_profile_ids));
      for (const mentionedId of uniqueMentionedIds) {
        if (mentionedId !== user.id && mentionedId !== storyData.subject_id) {
          await createNotification({
            eventType: 'MENTION_IN_COMMENT',
            actorUserId: user.id,
            primaryProfileId: mentionedId,
            payload: {
              story_id: storyId,
              comment_id: comment.id,
              comment_preview: commentPreview,
              story_title: storyData.title,
            },
          });
        }
      }
    }

    // Record activity event
    try {
      const admin = getSupabaseAdmin();
      await (admin as any).rpc('record_activity_event', {
        p_event_type: 'comment_added',
        p_actor_id: user.id,
        p_subject_type: 'story',
        p_subject_id: storyId,
        p_display_data: {
          comment_preview: commentPreview,
          story_title: storyData.title,
        },
        p_visibility: 'family',
      });
    } catch {
      // Activity recording is optional
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        author: comment.author,
        replies: [],
        replyCount: 0,
      },
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/stories/[id]/comments:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
