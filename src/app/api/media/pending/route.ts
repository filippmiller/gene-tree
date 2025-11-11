// ============================================================================
// GET /api/media/pending?profileId=xxx
// Получение списка pending фото для модерации владельцем профиля
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Получаем profileId из query params
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'Missing profileId parameter' },
        { status: 400 }
      );
    }

    // Проверяем права на профиль
    const { data: isOwner } = await supabase
      .rpc('is_profile_owner', {
        profile_id: profileId,
        user_id: user.id,
      });

    const { data: isAdmin } = await supabase
      .rpc('current_user_is_admin');

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only profile owner or admin can view pending photos' },
        { status: 403 }
      );
    }

    // Получаем pending фото для профиля
    const { data: pendingPhotos, error: photosError } = await supabase
      .from('photos')
      .select(`
        *,
        uploader:uploaded_by (
          id,
          email
        )
      `)
      .eq('target_profile_id', profileId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (photosError) {
      console.error('[PENDING] Failed to fetch pending photos:', photosError);
      return NextResponse.json(
        { error: 'Failed to fetch pending photos' },
        { status: 500 }
      );
    }

    // Генерируем signed URLs для просмотра (если media bucket)
    const photosWithUrls = await Promise.all(
      (pendingPhotos || []).map(async (photo) => {
        let url = null;

        if (photo.bucket === 'avatars') {
          // Avatars - публичные
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(photo.path);
          url = urlData.publicUrl;
        } else if (photo.bucket === 'media') {
          // Media - через signed URL
          const { data: signedData } = await supabase.storage
            .from('media')
            .createSignedUrl(photo.path, 3600); // 1 час
          url = signedData?.signedUrl || null;
        }

        return {
          ...photo,
          url,
        };
      })
    );

    return NextResponse.json({
      photos: photosWithUrls,
      count: photosWithUrls.length,
    });

  } catch (error) {
    console.error('[PENDING] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

