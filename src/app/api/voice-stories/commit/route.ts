import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { createNotification } from '@/lib/notifications';
import { mediaLogger } from '@/lib/logger';

interface CommitVoiceRequest {
  storyId: string;
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CommitVoiceRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.storyId) {
    return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Fetch story
  const { data: story, error: storyError } = await admin
    .from('voice_stories')
    .select('*')
    .eq('id', body.storyId)
    .single();

  if (storyError || !story) {
    mediaLogger.error({ error: storyError?.message, storyId: body.storyId }, 'Voice story not found during commit');
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  if (story.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Auto-approve self-stories (narrator recording about themselves)
  if (story.narrator_profile_id === story.target_profile_id) {
    await admin
      .from('voice_stories')
      .update({ status: 'approved' })
      .eq('id', story.id);
  }

  // Create media_jobs entry for future transcription
  const { error: jobError } = await admin
    .from('media_jobs')
    .insert({
      kind: 'transcribe_voice',
      payload: {
        story_id: story.id,
        bucket: story.bucket,
        path: story.path,
      },
      status: 'queued',
    } as any);

  if (jobError) {
    mediaLogger.error({ error: jobError.message, storyId: story.id }, 'Failed to enqueue transcription job');
  }

  // For now we consider story ready to be visible (still pending/needs moderation)

  await createNotification({
    eventType: 'media_added',
    actorUserId: user.id,
    primaryProfileId: story.target_profile_id,
    relatedProfileId: null,
    payload: {
      story_id: story.id,
      media_type: 'video', // treat as special media type for now
      kind: 'voice_story',
    },
  });

  return NextResponse.json({ success: true, story });
}
