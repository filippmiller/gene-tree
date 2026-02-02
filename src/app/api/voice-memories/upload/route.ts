import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { SignedUploadRequest, SignedUploadResponse } from '@/types/voice-memory';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DURATION = 60; // 60 seconds

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SignedUploadRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    profile_id,
    title,
    description,
    duration_seconds,
    file_size_bytes,
    content_type,
    privacy_level = 'family',
  } = body;

  // Validation
  if (!duration_seconds || duration_seconds <= 0 || duration_seconds > MAX_DURATION) {
    return NextResponse.json(
      { error: `Duration must be between 1 and ${MAX_DURATION} seconds` },
      { status: 400 }
    );
  }

  if (!file_size_bytes || file_size_bytes > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File size exceeds 10MB limit' },
      { status: 400 }
    );
  }

  if (!content_type || !content_type.startsWith('audio/')) {
    return NextResponse.json(
      { error: 'Only audio files are allowed' },
      { status: 400 }
    );
  }

  if (!['public', 'family', 'private'].includes(privacy_level)) {
    return NextResponse.json(
      { error: 'Invalid privacy level' },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // If profile_id provided, check permission to attach memory to that profile
  if (profile_id) {
    const { data: canUpload } = await admin.rpc('can_upload_to_profile', {
      profile_id,
      user_id: user.id,
    });

    if (!canUpload) {
      return NextResponse.json(
        { error: 'You do not have permission to add memories to this profile' },
        { status: 403 }
      );
    }
  }

  // Generate storage path: <user_id>/<uuid>.<ext>
  const fileId = crypto.randomUUID();
  const fileExt = content_type.includes('webm') ? 'webm' :
                  content_type.includes('mp4') ? 'mp4' :
                  content_type.includes('ogg') ? 'ogg' :
                  content_type.includes('wav') ? 'wav' : 'webm';
  const storagePath = `${user.id}/${fileId}.${fileExt}`;

  // Create signed upload URL
  const { data: signedData, error: signedError } = await admin
    .storage
    .from('voice-memories')
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (signedError || !signedData) {
    console.error('[VOICE_MEMORIES] Failed to create signed URL', signedError);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }

  // Create pending voice_memories record
  // Using any type here since voice_memories table is new and not yet in generated types
  const { data: memory, error: memoryError } = await (admin as any)
    .from('voice_memories')
    .insert({
      user_id: user.id,
      profile_id: profile_id || null,
      title: title || null,
      description: description || null,
      storage_path: storagePath,
      duration_seconds,
      file_size_bytes,
      privacy_level,
    })
    .select('id')
    .single();

  if (memoryError || !memory) {
    console.error('[VOICE_MEMORIES] Failed to create record', memoryError);
    return NextResponse.json(
      { error: 'Failed to create memory record' },
      { status: 500 }
    );
  }

  const response: SignedUploadResponse = {
    upload_url: signedData.signedUrl,
    token: signedData.token,
    storage_path: storagePath,
    memory_id: (memory as { id: string }).id,
  };

  return NextResponse.json(response);
}
