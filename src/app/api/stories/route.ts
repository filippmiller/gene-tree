
import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { logAudit } from '@/lib/audit/logger';

/**
 * POST /api/stories
 * Create a new story (metadata after file upload)
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      subject_id, 
      media_type, 
      media_url, 
      content, 
      title, 
      taken_date,
      visibility = 'family' 
    } = body;

    if (!subject_id || !media_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create Story Record
    const { data: storyData, error: createError } = await supabase
      .from('stories')
      .insert({
        author_id: user.id,
        subject_id,
        media_type,
        media_url,
        content,
        title,
        taken_date,
        visibility,
        status: user.id === subject_id ? 'approved' : 'pending', // Auto-approve if self-post
      } as any)
      .select()
      .single();

    if (createError) {
      console.error('Error creating story:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    const story = storyData as any;

    // 2. Create Notification (if not self-post)
    if (user.id !== subject_id) {
      const { data: notificationData, error: notifyError } = await supabase
        .from('notifications')
        .insert({
          event_type: 'STORY_SUBMITTED',
          actor_profile_id: user.id,
          primary_profile_id: subject_id,
          related_profile_id: user.id,
          payload: {
            story_id: story.id,
            media_type: media_type,
            preview: content?.substring(0, 50) || 'New story added'
          }
        } as any)
        .select()
        .single();

      if (notifyError) {
        console.error('Error creating notification:', notifyError);
      } else if (notificationData) {
        const notification = notificationData as any;
        // Add recipient
        const { error: recipientError } = await supabase
          .from('notification_recipients')
          .insert({
            notification_id: notification.id,
            profile_id: subject_id,
            is_read: false
          } as any);
          
        if (recipientError) {
             console.error('Error adding notification recipient:', recipientError);
        }
      }
    }

    await logAudit({
      action: 'CREATE_STORY',
      entityType: 'story',
      entityId: story.id,
      requestBody: { media_type, subject_id } as any
    });

    return NextResponse.json(story);

  } catch (error: any) {
    console.error('Error in POST /api/stories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
