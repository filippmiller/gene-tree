// ============================================================================
// POST /api/media/reject
// Отклонение фото владельцем профиля или модератором
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server-admin';

import type { RejectPhotoRequest, RejectPhotoResponse } from '@/types/media';

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
    const body: RejectPhotoRequest = await request.json();
    const { photoId, reason } = body;

    if (!photoId) {
      return NextResponse.json(
        { error: 'Missing photoId' },
        { status: 400 }
      );
    }

    // Получаем запись photo
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      console.error('[REJECT] Photo not found:', photoError);
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Проверяем права: владелец профиля или модератор
    const { data: isOwner } = await supabaseAdmin
      .rpc('is_profile_owner', {
        profile_id: photo.target_profile_id ?? '',
        user_id: user.id,
      });

    const { data: isAdmin } = await supabaseAdmin
      .rpc('current_user_is_admin');

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only profile owner or admin can reject photos' },
        { status: 403 }
      );
    }

    // Обновляем статус фото
    const { data: updatedPhoto, error: updateError } = await supabaseAdmin
      .from('photos')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        rejection_reason: reason || null,
      })
      .eq('id', photoId)
      .select('*')
      .single();

    if (updateError || !updatedPhoto) {
      console.error('[REJECT] Failed to update photo:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject photo' },
        { status: 500 }
      );
    }

    // Создаём запись в photo_reviews
    const { error: reviewError } = await supabaseAdmin
      .from('photo_reviews')
      .insert({
        photo_id: photoId,
        action: 'reject',
        actor: user.id,
        reason: reason || null,
      });

    if (reviewError) {
      console.error('[REJECT] Failed to create review:', reviewError);
    }

    // Создаём job для удаления файла (опционально, через некоторое время)
    // Using supabaseAdmin for admin operations
    if (true) {
      const { error: jobError } = await supabaseAdmin
        .from('media_jobs')
        .insert({
          kind: 'delete',
          payload: {
            photo_id: photoId,
            bucket: photo.bucket,
            path: photo.path,
            delay_hours: 24,
          } as any,
          status: 'queued',
        } as any);

      if (jobError) {
        console.error('[REJECT] Failed to create delete job:', jobError);
      }
    }

    const response: RejectPhotoResponse = {
      success: true,
      photo: updatedPhoto as any,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[REJECT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


