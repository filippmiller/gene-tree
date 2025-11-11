// ============================================================================
// POST /api/media/commit
// Подтверждает загрузку файла и создаёт jobs для обработки
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

import type { CommitUploadRequest, CommitUploadResponse } from '@/types/media';

export async function POST(request: NextRequest) {
  try {
    // Using getSupabaseAdmin()
    
    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    const body: CommitUploadRequest = await request.json();
    const { photoId, width, height, sha256 } = body;

    if (!photoId) {
      return NextResponse.json(
        { error: 'Missing photoId' },
        { status: 400 }
      );
    }

    // Получаем запись photo
    const { data: photo, error: photoError } = await getSupabaseAdmin()
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      console.error('[COMMIT] Photo not found:', photoError);
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Проверяем права (автор загрузки)
    if (photo.uploaded_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Проверяем что файл действительно загружен в storage
    // Using getSupabaseAdmin() for admin operations
    if (!getSupabaseAdmin()) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }
    
    const { data: fileExists, error: storageError } = await getSupabaseAdmin()
      .storage
      .from(photo.bucket)
      .list(photo.path.split('/').slice(0, -1).join('/'), {
        search: photo.path.split('/').pop(),
      });

    if (storageError || !fileExists || fileExists.length === 0) {
      console.error('[COMMIT] File not found in storage:', storageError);
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      );
    }

    // Обновляем метаданные фото
    const updateData: any = {};
    if (width) updateData.width = width;
    if (height) updateData.height = height;
    if (sha256) updateData.sha256 = sha256;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await getSupabaseAdmin()
        .from('photos')
        .update(updateData)
        .eq('id', photoId);

      if (updateError) {
        console.error('[COMMIT] Failed to update photo metadata:', updateError);
      }
    }

    // Создаём jobs для обработки
    const jobs: string[] = [];

    // Job 1: Strip EXIF (очистка метаданных)
    const { data: exifJob, error: exifJobError } = await getSupabaseAdmin()
      .from('media_jobs')
      .insert({
        kind: 'strip_exif',
        payload: {
          photo_id: photoId,
          bucket: photo.bucket,
          path: photo.path,
        } as any,
        status: 'queued',
      } as any)
      .select('id')
      .single();

    if (!exifJobError && exifJob) {
      jobs.push((exifJob as any).id);
    }

    // Job 2: Generate hash (если не предоставлен)
    if (!sha256) {
      const { data: hashJob, error: hashJobError } = await getSupabaseAdmin()
        .from('media_jobs')
        .insert({
          kind: 'hash',
          payload: {
            photo_id: photoId,
            bucket: photo.bucket,
            path: photo.path,
          } as any,
          status: 'queued',
        } as any)
        .select('id')
        .single();

      if (!hashJobError && hashJob) {
        jobs.push((hashJob as any).id);
      }
    }

    // Job 3: Generate thumbnails
    const { data: thumbJob, error: thumbJobError } = await getSupabaseAdmin()
      .from('media_jobs')
      .insert({
        kind: 'thumbnail',
        payload: {
          photo_id: photoId,
          bucket: photo.bucket,
          path: photo.path,
          sizes: [1024, 512, 256],
        } as any,
        status: 'queued',
      } as any)
      .select('id')
      .single();

    if (!thumbJobError && thumbJob) {
      jobs.push((thumbJob as any).id);
    }

    // Получаем обновлённое фото
    const { data: updatedPhoto, error: fetchError } = await getSupabaseAdmin()
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError || !updatedPhoto) {
      console.error('[COMMIT] Failed to fetch updated photo:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated photo' },
        { status: 500 }
      );
    }

    const response: CommitUploadResponse = {
      success: true,
      photo: updatedPhoto as any,
      jobs,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[COMMIT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


