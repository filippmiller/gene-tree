// ============================================================================
// POST /api/media/approve
// Одобрение фото владельцем профиля или модератором
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase-admin';
import type { ApprovePhotoRequest, ApprovePhotoResponse } from '@/types/media';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    const body: ApprovePhotoRequest = await request.json();
    const { photoId, visibility } = body;

    if (!photoId) {
      return NextResponse.json(
        { error: 'Missing photoId' },
        { status: 400 }
      );
    }

    // Получаем запись photo
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      console.error('[APPROVE] Photo not found:', photoError);
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Проверяем права: владелец профиля или модератор
    const { data: isOwner } = await supabase
      .rpc('is_profile_owner', {
        profile_id: photo.target_profile_id,
        user_id: user.id,
      });

    const { data: isAdmin } = await supabase
      .rpc('current_user_is_admin');

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only profile owner or admin can approve photos' },
        { status: 403 }
      );
    }

    // Обновляем статус фото
    const updateData: any = {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    };

    if (visibility) {
      updateData.visibility = visibility;
    }

    const { data: updatedPhoto, error: updateError } = await supabase
      .from('photos')
      .update(updateData)
      .eq('id', photoId)
      .select('*')
      .single();

    if (updateError || !updatedPhoto) {
      console.error('[APPROVE] Failed to update photo:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve photo' },
        { status: 500 }
      );
    }

    // Создаём запись в photo_reviews
    const { error: reviewError } = await supabase
      .from('photo_reviews')
      .insert({
        photo_id: photoId,
        action: 'approve',
        actor: user.id,
      });

    if (reviewError) {
      console.error('[APPROVE] Failed to create review:', reviewError);
    }

    // Создаём job для перемещения файла из incoming → approved
    if (photo.bucket === 'media' && photo.path.includes('/incoming/')) {
      const adminSupabase = getAdminClient();
      const approvedPath = photo.path.replace('/incoming/', '/approved/');
      
      const { error: jobError } = await adminSupabase
        .from('media_jobs')
        .insert({
          kind: 'move_to_approved',
          payload: {
            photo_id: photoId,
            bucket: photo.bucket,
            from_path: photo.path,
            to_path: approvedPath,
          },
          status: 'queued',
        });

      if (jobError) {
        console.error('[APPROVE] Failed to create move job:', jobError);
      }
    }

    const response: ApprovePhotoResponse = {
      success: true,
      photo: updatedPhoto,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[APPROVE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

