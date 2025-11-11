-- ============================================================================
-- Migration: Media Storage System (avatars + moderated media)
-- ============================================================================

-- 1) Enums для статусов, видимости, типов медиа
-- ============================================================================

CREATE TYPE public.media_status AS ENUM (
  'pending',
  'approved', 
  'rejected',
  'archived'
);

CREATE TYPE public.media_visibility AS ENUM (
  'public',
  'family',
  'private',
  'unlisted'
);

CREATE TYPE public.media_type AS ENUM (
  'avatar',
  'portrait',
  'group',
  'document',
  'event',
  'headstone',
  'certificate',
  'other'
);

-- 2) Создание storage buckets
-- ============================================================================

-- Bucket: avatars (public read, прямая загрузка с клиента)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  26214400,  -- 25 MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[];

-- Bucket: media (private, server-signed uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  false,  -- private
  26214400,  -- 25 MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[];

-- 3) Таблица: photos - реестр всех фото
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Storage location
  bucket TEXT NOT NULL CHECK (bucket IN ('avatars', 'media')),
  path TEXT NOT NULL,
  storage_object_id UUID,
  
  -- Ownership & target
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Classification
  type public.media_type NOT NULL DEFAULT 'other',
  status public.media_status NOT NULL DEFAULT 'pending',
  visibility public.media_visibility NOT NULL DEFAULT 'private',
  
  -- Metadata
  caption TEXT,
  taken_at TIMESTAMPTZ,
  exif JSONB,
  sha256 CHAR(64),  -- for deduplication
  width INTEGER,
  height INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Moderation fields
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  archived_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_bucket_path UNIQUE (bucket, path),
  CONSTRAINT check_approved_fields CHECK (
    (status = 'approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR
    (status != 'approved' AND approved_at IS NULL AND approved_by IS NULL)
  ),
  CONSTRAINT check_rejected_fields CHECK (
    (status = 'rejected' AND rejected_at IS NOT NULL AND rejected_by IS NOT NULL) OR
    (status != 'rejected' AND rejected_at IS NULL AND rejected_by IS NULL)
  )
);

-- Indexes для производительности
CREATE INDEX IF NOT EXISTS idx_photos_target_profile_status 
  ON public.photos(target_profile_id, status);
  
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by 
  ON public.photos(uploaded_by);
  
CREATE INDEX IF NOT EXISTS idx_photos_sha256 
  ON public.photos(sha256) WHERE sha256 IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_photos_status 
  ON public.photos(status);
  
CREATE INDEX IF NOT EXISTS idx_photos_bucket_path 
  ON public.photos(bucket, path);

-- 4) Таблица: photo_people - N:M связь фото ↔ профили (кто на фото)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.photo_people (
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT,  -- e.g. 'subject', 'group_member', etc.
  
  PRIMARY KEY (photo_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_people_profile 
  ON public.photo_people(profile_id);

-- 5) Таблица: photo_reviews - журнал модерации
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.photo_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  actor UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_reviews_photo 
  ON public.photo_reviews(photo_id);
  
CREATE INDEX IF NOT EXISTS idx_photo_reviews_actor 
  ON public.photo_reviews(actor);

-- 6) Таблица: media_jobs - очередь фоновых задач
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.media_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,  -- 'thumbnail', 'strip_exif', 'hash', 'move_to_approved', 'delete'
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_jobs_status 
  ON public.media_jobs(status, created_at);

-- 7) Добавляем поле current_avatar_id в user_profiles
-- ============================================================================

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_avatar_id UUID REFERENCES public.photos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar 
  ON public.user_profiles(current_avatar_id);

COMMENT ON COLUMN public.user_profiles.current_avatar_id IS 'Текущая активная аватарка пользователя';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
