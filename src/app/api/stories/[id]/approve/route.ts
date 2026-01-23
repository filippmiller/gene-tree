
import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { logAudit } from '@/lib/audit/logger';

/**
 * POST /api/stories/[id]/approve
 * Approve a pending story
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Verify ownership (Subject must be the one approving)
    // We can rely on RLS for update, but let's be explicit for the notification logic
    // 1. Verify ownership (Subject must be the one approving)
    // We can rely on RLS for update, but let's be explicit for the notification logic
    const { data: storyData, error: fetchError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !storyData) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const story = storyData as any;

    if (story.subject_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Only the subject can approve' }, { status: 403 });
    }

    // 2. Update Status
    const { error: updateError } = await (supabase
      .from('stories') as any)
      .update({ status: 'approved' })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 3. Notify Author
    if (story.author_id !== user.id) {
      const { data: notificationData } = await supabase
        .from('notifications')
        .insert({
          event_type: 'STORY_APPROVED',
          actor_profile_id: user.id,
          primary_profile_id: story.author_id,
          related_profile_id: user.id,
          payload: {
            story_id: story.id,
            title: story.title || 'Your story'
          }
        } as any)
        .select()
        .single();

      if (notificationData) {
        const notification = notificationData as any;
        await supabase
          .from('notification_recipients')
          .insert({
            notification_id: notification.id,
            profile_id: story.author_id,
            is_read: false
          } as any);
      }
    }

    await logAudit({
      action: 'APPROVE_STORY',
      entityType: 'story',
      entityId: id,
      requestBody: { approver: user.id } as any
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in approve story:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
