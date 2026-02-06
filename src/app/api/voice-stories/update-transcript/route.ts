import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { mediaLogger } from '@/lib/logger';

interface UpdateTranscriptRequest {
  storyId: string;
  transcript: string;
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UpdateTranscriptRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.storyId || typeof body.transcript !== 'string') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Fetch the story to check authorization
  const { data: story, error: storyError } = await admin
    .from('voice_stories')
    .select('narrator_profile_id, target_profile_id')
    .eq('id', body.storyId)
    .single();

  if (storyError || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // Check authorization: must be narrator or profile owner
  if (story.narrator_profile_id !== user.id && story.target_profile_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update the transcript
  const { error: updateError } = await admin
    .from('voice_stories')
    .update({ transcript_text: body.transcript })
    .eq('id', body.storyId);

  if (updateError) {
    mediaLogger.error({ error: updateError.message, storyId: body.storyId }, 'Failed to update transcript');
    return NextResponse.json({ error: 'Failed to update transcript' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
