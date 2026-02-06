import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { mediaLogger } from '@/lib/logger';

interface SignedVoiceUploadRequest {
  target_profile_id: string;
  duration_seconds?: number;
  size: number;
  content_type: string;
  file_ext: string;
  title?: string;
  visibility?: 'public' | 'family' | 'private';
}

interface SignedVoiceUploadResponse {
  uploadUrl: string;
  token: string;
  bucket: 'audio';
  path: string;
  storyId: string;
}

const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SignedVoiceUploadRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { target_profile_id, duration_seconds, size, content_type, file_ext, title, visibility } = body;

  if (!target_profile_id || !size || !content_type || !file_ext) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!content_type.startsWith('audio/')) {
    return NextResponse.json({ error: 'Only audio files are allowed' }, { status: 400 });
  }

  if (size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: 'Audio file exceeds 50MB limit' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Permission check: can this user attach stories to this profile?
  const { data: canUpload, error: permError } = await admin.rpc('can_upload_to_profile', {
    profile_id: target_profile_id,
    user_id: user.id,
  });

  if (permError) {
    mediaLogger.error({ error: permError.message, userId: user.id, target_profile_id }, 'Permission check failed for voice upload');
    return NextResponse.json({ error: 'Permission check failed' }, { status: 500 });
  }

  if (!canUpload) {
    return NextResponse.json({ error: 'You do not have permission to add stories to this profile' }, { status: 403 });
  }

  // Generate storage path: audio/<profile_id>/<uuid>.<ext>
  const fileId = crypto.randomUUID();
  const safeExt = file_ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'webm';
  const fileName = `${fileId}.${safeExt}`;
  const path = `stories/${target_profile_id}/${fileName}`;

  // Create signed upload URL using admin client
  const { data: signedData, error: signedError } = await admin
    .storage
    .from('audio')
    .createSignedUploadUrl(path, { upsert: false });

  if (signedError || !signedData) {
    mediaLogger.error({ error: signedError?.message, userId: user.id, path }, 'Failed to create signed upload URL');
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }

  // Create draft voice_stories row
  const { data: story, error: storyError } = await admin
    .from('voice_stories')
    .insert({
      target_profile_id,
      narrator_profile_id: user.id,
      created_by: user.id,
      bucket: 'audio',
      path,
      duration_seconds: duration_seconds ?? null,
      size_bytes: size,
      title: title || null,
      visibility: visibility || 'family',
      status: 'pending',
    })
    .select('id')
    .single();

  if (storyError || !story) {
    mediaLogger.error({ error: storyError?.message, userId: user.id, path }, 'Failed to create voice_stories row');
    return NextResponse.json({ error: 'Failed to create story record' }, { status: 500 });
  }

  const response: SignedVoiceUploadResponse = {
    uploadUrl: signedData.signedUrl,
    token: signedData.token,
    bucket: 'audio',
    path,
    storyId: story.id,
  };

  return NextResponse.json(response);
}
