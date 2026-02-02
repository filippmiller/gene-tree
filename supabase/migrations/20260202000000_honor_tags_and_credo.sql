-- Migration: Honor Tags and Personal Credo System
-- Created: 2026-02-02
-- Description: Adds honor tags for commemorating special statuses (veterans, survivors, etc.)
--              and personal credo/life motto fields for profiles

-- ============================================
-- HONOR TAGS SYSTEM
-- ============================================

-- Honor tags definitions
CREATE TABLE IF NOT EXISTS honor_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'military_wwii',     -- WWII veterans, blockade survivors
    'military_other',    -- Other conflicts (Afghan, Chechnya, etc.)
    'civil_honors',      -- Government honors, professional distinctions
    'labor',             -- Labor veterans, heroes of labor
    'family',            -- Family-specific honors (founding ancestor, etc.)
    'persecution',       -- Holocaust, Gulag, political prisoners
    'academic',          -- Academic achievements
    'custom'             -- User-defined family honors
  )),
  icon TEXT DEFAULT 'medal',
  color TEXT DEFAULT '#6B7280',
  background_color TEXT DEFAULT '#F3F4F6',
  is_official BOOLEAN DEFAULT true,
  requires_verification BOOLEAN DEFAULT false,
  country_code TEXT,  -- 'RU', 'US', 'IL', 'DE', etc.
  applicable_to_deceased BOOLEAN DEFAULT true,
  applicable_to_living BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profile honor tags (junction table)
CREATE TABLE IF NOT EXISTS profile_honor_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  honor_tag_id UUID NOT NULL REFERENCES honor_tags(id) ON DELETE CASCADE,
  verification_level TEXT DEFAULT 'self_declared' CHECK (
    verification_level IN ('self_declared', 'family_verified', 'documented')
  ),
  verified_by UUID[] DEFAULT '{}',
  document_url TEXT,
  notes TEXT,
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,  -- Show prominently
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, honor_tag_id)
);

-- Honor tag verification requests
CREATE TABLE IF NOT EXISTS honor_tag_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_honor_tag_id UUID NOT NULL REFERENCES profile_honor_tags(id) ON DELETE CASCADE,
  verifier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_honor_tag_id, verifier_id)
);

-- ============================================
-- PERSONAL CREDO / LIFE MOTTO FIELDS
-- ============================================

-- Add life motto and personal statement to profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS life_motto VARCHAR(150),
  ADD COLUMN IF NOT EXISTS life_motto_privacy TEXT DEFAULT 'family' CHECK (life_motto_privacy IN ('public', 'family', 'private')),
  ADD COLUMN IF NOT EXISTS personal_statement VARCHAR(500),
  ADD COLUMN IF NOT EXISTS personal_statement_privacy TEXT DEFAULT 'family' CHECK (personal_statement_privacy IN ('public', 'family', 'private'));

-- For deceased profiles: memorial quote added by family
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS memorial_quote TEXT,
  ADD COLUMN IF NOT EXISTS memorial_quote_author UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS memorial_quote_added_at TIMESTAMPTZ;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_honor_tags_category ON honor_tags(category);
CREATE INDEX IF NOT EXISTS idx_honor_tags_country ON honor_tags(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_honor_tags_active ON honor_tags(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_honor_tags_sort ON honor_tags(sort_order, category);

CREATE INDEX IF NOT EXISTS idx_profile_honor_tags_profile ON profile_honor_tags(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_honor_tags_tag ON profile_honor_tags(honor_tag_id);
CREATE INDEX IF NOT EXISTS idx_profile_honor_tags_featured ON profile_honor_tags(profile_id, is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_honor_verifications_tag ON honor_tag_verifications(profile_honor_tag_id);
CREATE INDEX IF NOT EXISTS idx_honor_verifications_verifier ON honor_tag_verifications(verifier_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_honor_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_honor_tags_updated_at
  BEFORE UPDATE ON honor_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_honor_tags_updated_at();

CREATE TRIGGER trigger_profile_honor_tags_updated_at
  BEFORE UPDATE ON profile_honor_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_honor_tags_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE honor_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_honor_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE honor_tag_verifications ENABLE ROW LEVEL SECURITY;

-- Honor Tags RLS (public read for active tags)
CREATE POLICY "honor_tags_select_active" ON honor_tags
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "honor_tags_admin_all" ON honor_tags
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Profile Honor Tags RLS
CREATE POLICY "profile_honor_tags_select" ON profile_honor_tags
  FOR SELECT
  USING (
    -- Can see own profile's tags
    profile_id = auth.uid()
    -- Or family member's tags (using existing family circle)
    OR is_in_family_circle(profile_id, auth.uid())
    -- Or admin
    OR current_user_is_admin()
  );

CREATE POLICY "profile_honor_tags_insert" ON profile_honor_tags
  FOR INSERT
  WITH CHECK (
    -- Can add to own profile
    profile_id = auth.uid()
    -- Or to deceased family member's profile
    OR (
      is_in_family_circle(profile_id, auth.uid())
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = profile_id AND is_living = false
      )
    )
    -- Or admin
    OR current_user_is_admin()
  );

CREATE POLICY "profile_honor_tags_update" ON profile_honor_tags
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR current_user_is_admin()
    -- Or family member for deceased
    OR (
      is_in_family_circle(profile_id, auth.uid())
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = profile_id AND is_living = false
      )
    )
  )
  WITH CHECK (
    profile_id = auth.uid()
    OR current_user_is_admin()
    OR (
      is_in_family_circle(profile_id, auth.uid())
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = profile_id AND is_living = false
      )
    )
  );

CREATE POLICY "profile_honor_tags_delete" ON profile_honor_tags
  FOR DELETE
  USING (
    added_by = auth.uid()
    OR profile_id = auth.uid()
    OR current_user_is_admin()
  );

-- Honor Tag Verifications RLS
CREATE POLICY "honor_verifications_select" ON honor_tag_verifications
  FOR SELECT
  USING (
    verifier_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profile_honor_tags pht
      WHERE pht.id = profile_honor_tag_id
      AND (pht.profile_id = auth.uid() OR is_in_family_circle(pht.profile_id, auth.uid()))
    )
    OR current_user_is_admin()
  );

CREATE POLICY "honor_verifications_insert" ON honor_tag_verifications
  FOR INSERT
  WITH CHECK (
    verifier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profile_honor_tags pht
      WHERE pht.id = profile_honor_tag_id
      AND is_in_family_circle(pht.profile_id, auth.uid())
      AND pht.profile_id != auth.uid()  -- Can't verify own profile's tags
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if honor tag should be upgraded to family_verified
CREATE OR REPLACE FUNCTION check_honor_tag_verification(p_profile_honor_tag_id UUID)
RETURNS void AS $$
DECLARE
  v_positive_count INT;
BEGIN
  -- Count positive verifications
  SELECT COUNT(*) INTO v_positive_count
  FROM honor_tag_verifications
  WHERE profile_honor_tag_id = p_profile_honor_tag_id
  AND verified = true;

  -- If 3+ positive verifications, upgrade to family_verified
  IF v_positive_count >= 3 THEN
    UPDATE profile_honor_tags
    SET
      verification_level = 'family_verified',
      verified_by = (
        SELECT array_agg(verifier_id)
        FROM honor_tag_verifications
        WHERE profile_honor_tag_id = p_profile_honor_tag_id
        AND verified = true
      ),
      updated_at = now()
    WHERE id = p_profile_honor_tag_id
    AND verification_level = 'self_declared';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to check verification after insert
CREATE OR REPLACE FUNCTION trigger_check_honor_verification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_honor_tag_verification(NEW.profile_honor_tag_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_honor_verification_insert
  AFTER INSERT ON honor_tag_verifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_honor_verification();

-- Get profile honor tags with full details
CREATE OR REPLACE FUNCTION get_profile_honor_tags(p_profile_id UUID)
RETURNS TABLE (
  id UUID,
  honor_tag_id UUID,
  code TEXT,
  name TEXT,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  category TEXT,
  icon TEXT,
  color TEXT,
  background_color TEXT,
  verification_level TEXT,
  verified_by UUID[],
  is_featured BOOLEAN,
  display_order INT,
  added_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pht.id,
    ht.id as honor_tag_id,
    ht.code,
    ht.name,
    ht.name_ru,
    ht.description,
    ht.description_ru,
    ht.category,
    ht.icon,
    ht.color,
    ht.background_color,
    pht.verification_level,
    pht.verified_by,
    pht.is_featured,
    pht.display_order,
    pht.added_at
  FROM profile_honor_tags pht
  JOIN honor_tags ht ON ht.id = pht.honor_tag_id
  WHERE pht.profile_id = p_profile_id
  AND ht.is_active = true
  ORDER BY pht.display_order, pht.added_at;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE honor_tags IS 'Definitions of honor tags for commemorating special statuses (veterans, survivors, awards)';
COMMENT ON TABLE profile_honor_tags IS 'Honor tags assigned to profiles with verification status';
COMMENT ON TABLE honor_tag_verifications IS 'Family member verifications for honor tags';
COMMENT ON COLUMN user_profiles.life_motto IS 'Short personal motto or quote (max 150 chars)';
COMMENT ON COLUMN user_profiles.personal_statement IS 'Extended personal bio (max 500 chars)';
COMMENT ON COLUMN user_profiles.memorial_quote IS 'Quote added by family for deceased profiles';
