-- Migration: Fix Family Circle Helper Functions
-- Problem: can_upload_to_profile and is_in_family_circle only check pending_relatives,
-- but the system also uses the relationships table for confirmed family connections.
-- Solution: Update both functions to check both tables.

-- ============================================
-- FIX: is_in_family_circle
-- ============================================
-- This function determines if a user is part of a profile's family circle.
-- It should check both pending_relatives (for pending invitations) and
-- relationships (for confirmed connections).

CREATE OR REPLACE FUNCTION public.is_in_family_circle(profile_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Self check: user owns the profile
  IF is_profile_owner(profile_id, user_id) THEN
    RETURN TRUE;
  END IF;

  -- Admin check
  IF current_user_is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check pending_relatives (legacy/invitation-based connections)
  IF EXISTS (
    SELECT 1 FROM public.pending_relatives
    WHERE ((user_id_1 = user_id AND user_id_2 = profile_id)
       OR (user_id_2 = user_id AND user_id_1 = profile_id))
      AND is_verified = true
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check relationships table (confirmed family connections)
  IF EXISTS (
    SELECT 1 FROM public.relationships
    WHERE (user1_id = user_id AND user2_id = profile_id)
       OR (user2_id = user_id AND user1_id = profile_id)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- FIX: can_upload_to_profile
-- ============================================
-- This function determines if a user can upload media (photos, voice stories)
-- to another user's profile. Should check both pending_relatives and relationships.

CREATE OR REPLACE FUNCTION public.can_upload_to_profile(profile_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Profile owner can always upload
  IF is_profile_owner(profile_id, user_id) THEN
    RETURN TRUE;
  END IF;

  -- Admin can always upload
  IF current_user_is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check pending_relatives (legacy/invitation-based connections)
  IF EXISTS (
    SELECT 1 FROM public.pending_relatives
    WHERE (user_id_1 = user_id AND user_id_2 = profile_id)
       OR (user_id_2 = user_id AND user_id_1 = profile_id)
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check relationships table (confirmed family connections)
  IF EXISTS (
    SELECT 1 FROM public.relationships
    WHERE (user1_id = user_id AND user2_id = profile_id)
       OR (user2_id = user_id AND user1_id = profile_id)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- Add storage RLS policies for audio bucket
-- ============================================
-- The audio bucket is private. Uploads use signed URLs from server.
-- Reading also uses signed URLs. We need to allow the service role
-- and authenticated users to access their family's audio.

-- Allow service role full access to audio bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'audio_service_role_all'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "audio_service_role_all"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'audio')
    WITH CHECK (bucket_id = 'audio');
  END IF;
END $$;

-- Allow authenticated users to read audio they have access to
-- (via voice_stories RLS which handles the permission logic)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'audio_select_via_story'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "audio_select_via_story"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'audio'
      AND EXISTS (
        SELECT 1 FROM public.voice_stories vs
        WHERE vs.bucket = 'audio'
          AND vs.path = storage.objects.name
          AND (
            vs.narrator_profile_id = auth.uid()
            OR is_profile_owner(vs.target_profile_id, auth.uid())
            OR (
              vs.status = 'approved'
              AND (
                vs.visibility IN ('public', 'unlisted')
                OR (vs.visibility = 'family' AND is_in_family_circle(vs.target_profile_id, auth.uid()))
              )
            )
          )
      )
    );
  END IF;
END $$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION public.is_in_family_circle(UUID, UUID) IS
  'Checks if user_id is in profile_id''s family circle (via pending_relatives or relationships)';

COMMENT ON FUNCTION public.can_upload_to_profile(UUID, UUID) IS
  'Checks if user_id can upload media to profile_id (owner, admin, or family member)';
