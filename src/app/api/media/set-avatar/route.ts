// ============================================================================
// POST /api/media/set-avatar
// Установка основной аватарки профиля
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server-admin';
import type { SetAvatarRequest, SetAvatarResponse } from '@/types/media';

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
    const body: SetAvatarRequest = await request.json();
    const { photoId, profileId } = body;

    if (!photoId || !profileId) {
      return NextResponse.json(
        { error: 'Missing photoId or profileId' },
        { status: 400 }
      );
    }

    // Проверяем права на профиль
    const { data: isOwner } = await supabaseAdmin
      .rpc('is_profile_owner', {
        profile_id: profileId,
        user_id: user.id,
      });

    if (!isOwner) {
      return NextResponse.json(
        { error: 'You do not own this profile' },
        { status: 403 }
      );
    }

    // Проверяем что фото существует и это аватарка
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      console.error('[SET_AVATAR] Photo not found:', photoError);
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Если это новая аватарка из avatars bucket - авто-approve
    if (photo.bucket === 'avatars' && photo.status === 'pending') {
      const { error: approveError } = await supabaseAdmin
        .from('photos')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          type: 'avatar',
        })
        .eq('id', photoId);

      if (approveError) {
        console.error('[SET_AVATAR] Failed to approve avatar:', approveError);
      }
    }

    // Архивируем старую аватарку (если есть)
    const { data: currentProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('current_avatar_id')
      .eq('id', profileId)
      .single();

    if (currentProfile?.current_avatar_id) {
      const { error: archiveError } = await supabaseAdmin
        .from('photos')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
        })
        .eq('id', currentProfile.current_avatar_id);

      if (archiveError) {
        console.error('[SET_AVATAR] Failed to archive old avatar:', archiveError);
      }
    }

    // Обновляем профиль с новой аватаркой
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        current_avatar_id: photoId,
      })
      .eq('id', profileId)
      .select('id, current_avatar_id')
      .single();

    if (profileError || !updatedProfile) {
      console.error('[SET_AVATAR] Failed to update profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to set avatar' },
        { status: 500 }
      );
    }

    const response: SetAvatarResponse = {
      success: true,
      profile: updatedProfile as any,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[SET_AVATAR] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


