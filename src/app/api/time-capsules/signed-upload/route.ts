import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type {
  TimeCapsuleSignedUploadRequest,
  TimeCapsuleSignedUploadResponse,
} from '@/lib/time-capsules/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'video/webm',
  'video/mp4',
  'video/quicktime',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

function getMediaType(contentType: string): 'audio' | 'video' | 'image' | null {
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('image/')) return 'image';
  return null;
}

function getFileExtension(contentType: string): string {
  const extensions: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return extensions[contentType] || 'bin';
}

/**
 * POST /api/time-capsules/signed-upload
 * Get a signed URL for uploading media to a time capsule
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: TimeCapsuleSignedUploadRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { file_size_bytes, content_type } = body;

  // Validation
  if (!file_size_bytes || file_size_bytes > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File size exceeds 50MB limit' },
      { status: 400 }
    );
  }

  if (!content_type || !ALLOWED_MIME_TYPES.includes(content_type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: audio, video, or images' },
      { status: 400 }
    );
  }

  const mediaType = getMediaType(content_type);
  if (!mediaType) {
    return NextResponse.json(
      { error: 'Invalid media type' },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // Generate storage path: <user_id>/<uuid>.<ext>
  const fileId = crypto.randomUUID();
  const fileExt = getFileExtension(content_type);
  const storagePath = `${user.id}/${fileId}.${fileExt}`;

  // Create signed upload URL
  const { data: signedData, error: signedError } = await admin
    .storage
    .from('time-capsule-media')
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (signedError || !signedData) {
    console.error('[TIME_CAPSULES] Failed to create signed URL', signedError);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }

  const response: TimeCapsuleSignedUploadResponse = {
    upload_url: signedData.signedUrl,
    token: signedData.token,
    storage_path: storagePath,
  };

  return NextResponse.json(response);
}
