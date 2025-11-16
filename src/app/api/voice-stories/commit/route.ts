import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { createNotification } from '@/lib/notifications';

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
    console.error('[VOICE_COMMIT] Story not found', storyError);
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  if (story.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Optional: check that file exists in storage (skipped for now to keep it light)

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
    console.error('[VOICE_COMMIT] Failed to enqueue transcription job', jobError);
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
