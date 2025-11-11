-- ============================================================================
-- Fix Storage RLS Policies for avatars bucket
-- ============================================================================

-- Удаляем все старые политики на storage.objects для avatars
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;

-- Более простая и надёжная политика для INSERT
-- Разрешаем authenticated пользователям загружать в свою папку
CREATE POLICY "avatars_bucket_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Политика для UPDATE
CREATE POLICY "avatars_bucket_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Политика для DELETE
CREATE POLICY "avatars_bucket_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Политика для SELECT (public read)
CREATE POLICY "avatars_bucket_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Проверяем что bucket существует и публичный
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- Убедимся что RLS включён
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
