// ============================================================================
// POST /api/media/signed-upload
// Создаёт signed URL для загрузки фото в media bucket
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server-admin';

import type { SignedUploadRequest, SignedUploadResponse } from '@/types/media';

export async function POST(request: NextRequest) {
  try {
    // Using supabaseAdmin
    
    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    const body: SignedUploadRequest = await request.json();
    const {
      target_profile_id,
      type,
      visibility = 'private',
      file_ext,
      content_type,
      size,
      caption,
    } = body;

    // Валидация
    if (!target_profile_id || !type || !file_ext || !content_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (25 MB)
    if (size > 26214400) {
      return NextResponse.json(
        { error: 'File size exceeds 25 MB limit' },
        { status: 400 }
      );
    }

    // Проверяем права на загрузку в профиль
    const { data: canUpload, error: permError } = await supabaseAdmin
      .rpc('can_upload_to_profile', {
        profile_id: target_profile_id,
        user_id: user.id,
      });

    if (permError) {
      console.error('[SIGNED_UPLOAD] Permission check failed:', permError);
      return NextResponse.json(
        { error: 'Permission check failed' },
        { status: 500 }
      );
    }

    if (!canUpload) {
      return NextResponse.json(
        { error: 'You do not have permission to upload to this profile' },
        { status: 403 }
      );
    }

    // Генерируем путь в media bucket
    // Структура: profiles/<profile_id>/incoming/<uuid>.<ext>
    const fileId = crypto.randomUUID();
    const fileName = `${fileId}.${file_ext}`;
    const path = `profiles/${target_profile_id}/incoming/${fileName}`;

    // Используем admin client для создания signed URL
    // Using supabaseAdmin for admin operations
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }
    
    const { data: signedData, error: signedError } = await supabaseAdmin
      .storage
      .from('media')
      .createSignedUploadUrl(path, {
        upsert: false,  // не перезаписывать существующие
      });

    if (signedError || !signedData) {
      console.error('[SIGNED_UPLOAD] Failed to create signed URL:', signedError);
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    // Создаём запись в photos таблице (status=pending)
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .insert({
        bucket: 'media',
        path,
        uploaded_by: user.id,
        target_profile_id,
        type,
        status: 'pending',
        visibility,
        caption: caption || null,
      })
      .select('id')
      .single();

    if (photoError || !photo) {
      console.error('[SIGNED_UPLOAD] Failed to create photo record:', photoError);
      return NextResponse.json(
        { error: 'Failed to create photo record' },
        { status: 500 }
      );
    }

    const response: SignedUploadResponse = {
      uploadUrl: signedData.signedUrl,
      token: signedData.token,
      bucket: 'media',
      path,
      photoId: photo.id,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[SIGNED_UPLOAD] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


