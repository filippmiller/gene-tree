import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranscribeRequest {
  storyId: string;
}

interface TranscribeResponse {
  success: boolean;
  transcript?: string;
  language?: string;
  confidence?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<TranscribeResponse>> {
  // Verify authentication
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let body: TranscribeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.storyId) {
    return NextResponse.json({ success: false, error: 'Missing storyId' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Fetch the voice story
  const { data: story, error: storyError } = await admin
    .from('voice_stories')
    .select('*')
    .eq('id', body.storyId)
    .single();

  if (storyError || !story) {
    console.error('[TRANSCRIBE] Story not found', storyError);
    return NextResponse.json({ success: false, error: 'Story not found' }, { status: 404 });
  }

  // Check authorization: must be narrator or profile owner
  if (story.narrator_profile_id !== user.id && story.target_profile_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Download the audio file from Supabase Storage
  const { data: audioData, error: downloadError } = await admin.storage
    .from(story.bucket)
    .download(story.path);

  if (downloadError || !audioData) {
    console.error('[TRANSCRIBE] Failed to download audio', downloadError);
    return NextResponse.json({ success: false, error: 'Failed to download audio file' }, { status: 500 });
  }

  try {
    // Convert Blob to File for OpenAI API
    const audioBuffer = await audioData.arrayBuffer();
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    // Extract results
    const transcriptText = transcription.text;
    const transcriptLang = transcription.language || null;
    // Calculate average confidence from segments if available
    let transcriptConfidence: number | null = null;
    if ('segments' in transcription && Array.isArray(transcription.segments)) {
      const segments = transcription.segments as Array<{ avg_logprob?: number }>;
      if (segments.length > 0) {
        const avgLogProb = segments.reduce((sum, seg) => sum + (seg.avg_logprob || 0), 0) / segments.length;
        // Convert log probability to confidence score (0-1)
        transcriptConfidence = Math.exp(avgLogProb);
      }
    }

    // Update the voice_stories record with transcript
    const { error: updateError } = await admin
      .from('voice_stories')
      .update({
        transcript_text: transcriptText,
        transcript_lang: transcriptLang,
        transcript_confidence: transcriptConfidence,
      })
      .eq('id', body.storyId);

    if (updateError) {
      console.error('[TRANSCRIBE] Failed to update story with transcript', updateError);
      return NextResponse.json({ success: false, error: 'Failed to save transcript' }, { status: 500 });
    }

    // Update media_jobs if exists
    await admin
      .from('media_jobs')
      .update({ status: 'completed' })
      .eq('payload->>story_id', body.storyId)
      .eq('kind', 'transcribe_voice');

    return NextResponse.json({
      success: true,
      transcript: transcriptText,
      language: transcriptLang || undefined,
      confidence: transcriptConfidence || undefined,
    });
  } catch (error) {
    console.error('[TRANSCRIBE] OpenAI API error', error);

    // Update media_jobs to failed if exists
    await admin
      .from('media_jobs')
      .update({
        status: 'failed',
        payload: {
          story_id: body.storyId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      .eq('payload->>story_id', body.storyId)
      .eq('kind', 'transcribe_voice');

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Transcription failed'
    }, { status: 500 });
  }
}
