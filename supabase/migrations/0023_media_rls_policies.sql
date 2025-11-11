-- ============================================================================
-- RLS Policies for Media Storage System
-- ============================================================================

-- Включаем RLS на всех таблицах
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Проверка: является ли пользователь владельцем профиля
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = profile_id AND owner_user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Проверка: может ли пользователь загружать фото в профиль
-- (автор = владелец профиля OR семейный член OR модератор)
CREATE OR REPLACE FUNCTION public.can_upload_to_profile(profile_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Владелец профиля может загружать
  IF is_profile_owner(profile_id, user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Модератор может загружать
  IF current_user_is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Семейные члены могут предлагать (status=pending)
  -- Проверяем наличие связи в pending_relatives
  RETURN EXISTS (
    SELECT 1 FROM public.pending_relatives
    WHERE (user_id_1 = user_id AND user_id_2 = profile_id)
       OR (user_id_2 = user_id AND user_id_1 = profile_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Проверка: входит ли пользователь в семейный круг профиля
CREATE OR REPLACE FUNCTION public.is_in_family_circle(profile_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Сам владелец профиля
  IF is_profile_owner(profile_id, user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Проверяем родственные связи
  RETURN EXISTS (
    SELECT 1 FROM public.pending_relatives
    WHERE ((user_id_1 = user_id AND user_id_2 = profile_id)
       OR (user_id_2 = user_id AND user_id_1 = profile_id))
      AND is_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- RLS Policies: photos
-- ============================================================================

-- SELECT: владелец профиля, автор загрузки, семья (для approved), модератор
CREATE POLICY "photos_select_policy"
ON public.photos
FOR SELECT
TO authenticated
USING (
  -- Модератор видит всё
  current_user_is_admin()
  OR
  -- Автор видит свои загрузки
  uploaded_by = auth.uid()
  OR
  -- Владелец профиля видит все фото своего профиля
  is_profile_owner(target_profile_id, auth.uid())
  OR
  -- Approved + public видят все
  (status = 'approved' AND visibility = 'public')
  OR
  -- Approved + family видит семейный круг
  (status = 'approved' AND visibility = 'family' AND is_in_family_circle(target_profile_id, auth.uid()))
  OR
  -- Approved + unlisted (можно по прямой ссылке)
  (status = 'approved' AND visibility = 'unlisted')
);

-- INSERT: authenticated может создавать pending фото, если can_upload_to_profile
CREATE POLICY "photos_insert_policy"
ON public.photos
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND
  can_upload_to_profile(target_profile_id, auth.uid())
  AND
  status = 'pending'  -- новые фото всегда pending
);

-- UPDATE: автор может править pending, владелец/модератор - всё
CREATE POLICY "photos_update_policy"
ON public.photos
FOR UPDATE
TO authenticated
USING (
  current_user_is_admin()
  OR
  -- Автор может править свои pending
  (uploaded_by = auth.uid() AND status = 'pending')
  OR
  -- Владелец профиля может менять свои фото
  is_profile_owner(target_profile_id, auth.uid())
)
WITH CHECK (
  current_user_is_admin()
  OR
  (uploaded_by = auth.uid() AND status = 'pending')
  OR
  is_profile_owner(target_profile_id, auth.uid())
);

-- DELETE: автор может удалять pending, владелец/модератор - всё
CREATE POLICY "photos_delete_policy"
ON public.photos
FOR DELETE
TO authenticated
USING (
  current_user_is_admin()
  OR
  (uploaded_by = auth.uid() AND status = 'pending')
  OR
  is_profile_owner(target_profile_id, auth.uid())
);

-- ============================================================================
-- RLS Policies: photo_people
-- ============================================================================

-- SELECT: все кто видят фото
CREATE POLICY "photo_people_select_policy"
ON public.photo_people
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.photos
    WHERE photos.id = photo_people.photo_id
  )
  -- Если видят фото (через photos RLS) - видят и тэги
);

-- INSERT/UPDATE/DELETE: владелец профиля или модератор
CREATE POLICY "photo_people_modify_policy"
ON public.photo_people
FOR ALL
TO authenticated
USING (
  current_user_is_admin()
  OR
  EXISTS (
    SELECT 1 FROM public.photos
    WHERE photos.id = photo_people.photo_id
      AND is_profile_owner(photos.target_profile_id, auth.uid())
  )
);

-- ============================================================================
-- RLS Policies: photo_reviews
-- ============================================================================

-- SELECT: владелец профиля, модератор
CREATE POLICY "photo_reviews_select_policy"
ON public.photo_reviews
FOR SELECT
TO authenticated
USING (
  current_user_is_admin()
  OR
  EXISTS (
    SELECT 1 FROM public.photos
    WHERE photos.id = photo_reviews.photo_id
      AND is_profile_owner(photos.target_profile_id, auth.uid())
  )
);

-- INSERT: владелец профиля, модератор (создаётся через API)
CREATE POLICY "photo_reviews_insert_policy"
ON public.photo_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  actor = auth.uid()
  AND
  (
    current_user_is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.id = photo_reviews.photo_id
        AND is_profile_owner(photos.target_profile_id, auth.uid())
    )
  )
);

-- ============================================================================
-- RLS Policies: media_jobs
-- ============================================================================

-- Только модераторы видят/управляют jobs
CREATE POLICY "media_jobs_admin_only"
ON public.media_jobs
FOR ALL
TO authenticated
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());

-- ============================================================================
-- RLS Policies: storage.objects
-- ============================================================================

-- Удаляем старые политики (если были)
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: full access for authenticated users" ON storage.objects;

-- AVATARS: прямой upload/delete с клиента
-- Путь должен быть: <auth.uid()>/<filename>
CREATE POLICY "avatars_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- AVATARS: public read (для CDN/браузера)
CREATE POLICY "avatars_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- MEDIA: запретить прямой INSERT с клиента
-- Загрузка только через server-signed URLs (createSignedUploadUrl)
-- SELECT - через signed URLs или API

CREATE POLICY "media_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND
  (
    current_user_is_admin()
    OR
    -- Можем проверить через photos таблицу
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.bucket = 'media'
        AND photos.path = storage.objects.name
        AND (
          photos.uploaded_by = auth.uid()
          OR
          is_profile_owner(photos.target_profile_id, auth.uid())
          OR
          (photos.status = 'approved' AND photos.visibility IN ('public', 'family', 'unlisted'))
        )
    )
  )
);

-- MEDIA: DELETE разрешён владельцу профиля или модератору
CREATE POLICY "media_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND
  (
    current_user_is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.bucket = 'media'
        AND photos.path = storage.objects.name
        AND is_profile_owner(photos.target_profile_id, auth.uid())
    )
  )
);

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
