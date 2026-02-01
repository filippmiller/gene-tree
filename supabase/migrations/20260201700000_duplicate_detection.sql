-- Duplicate Detection System
-- Provides smart merge suggestions when the same person is added twice

-- Potential duplicates queue
CREATE TABLE IF NOT EXISTS potential_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_a_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  profile_b_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  match_reasons JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'not_duplicate', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure A < B to prevent duplicate pairs
  CONSTRAINT different_profiles CHECK (profile_a_id != profile_b_id),
  CONSTRAINT ordered_pair CHECK (profile_a_id < profile_b_id),
  CONSTRAINT unique_pair UNIQUE (profile_a_id, profile_b_id)
);

-- Merge history for audit trail
CREATE TABLE IF NOT EXISTS merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kept_profile_id UUID NOT NULL,
  merged_profile_id UUID NOT NULL,
  merged_by UUID NOT NULL REFERENCES auth.users(id),
  duplicate_record_id UUID REFERENCES potential_duplicates(id),
  merge_data JSONB NOT NULL DEFAULT '{}',
  relationships_transferred INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_potential_duplicates_status ON potential_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_potential_duplicates_confidence ON potential_duplicates(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_potential_duplicates_profile_a ON potential_duplicates(profile_a_id);
CREATE INDEX IF NOT EXISTS idx_potential_duplicates_profile_b ON potential_duplicates(profile_b_id);
CREATE INDEX IF NOT EXISTS idx_potential_duplicates_created ON potential_duplicates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_merge_history_kept ON merge_history(kept_profile_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_merged ON merge_history(merged_profile_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_by ON merge_history(merged_by);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_potential_duplicates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_potential_duplicates_updated_at ON potential_duplicates;
CREATE TRIGGER tr_potential_duplicates_updated_at
  BEFORE UPDATE ON potential_duplicates
  FOR EACH ROW
  EXECUTE FUNCTION update_potential_duplicates_updated_at();

-- RLS Policies
ALTER TABLE potential_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE merge_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify potential duplicates
CREATE POLICY "Admins can view potential duplicates"
  ON potential_duplicates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert potential duplicates"
  ON potential_duplicates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update potential duplicates"
  ON potential_duplicates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Merge history readable by admins
CREATE POLICY "Admins can view merge history"
  ON merge_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert merge history"
  ON merge_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to find potential duplicates by comparing profiles
CREATE OR REPLACE FUNCTION fn_find_potential_duplicates(
  p_min_confidence INTEGER DEFAULT 50
)
RETURNS TABLE (
  profile_a_id UUID,
  profile_b_id UUID,
  confidence_score INTEGER,
  match_reasons JSONB
) AS $$
DECLARE
  v_profile RECORD;
  v_other RECORD;
  v_score INTEGER;
  v_reasons JSONB;
  v_name_score INTEGER;
  v_date_score INTEGER;
  v_place_score INTEGER;
BEGIN
  -- Compare all profiles pairwise (excluding already detected pairs)
  FOR v_profile IN
    SELECT id, first_name, last_name, maiden_name, nickname, birth_date, birth_place, birth_city, birth_country
    FROM user_profiles
    WHERE first_name IS NOT NULL AND last_name IS NOT NULL
  LOOP
    FOR v_other IN
      SELECT id, first_name, last_name, maiden_name, nickname, birth_date, birth_place, birth_city, birth_country
      FROM user_profiles
      WHERE id > v_profile.id  -- Only compare each pair once
        AND first_name IS NOT NULL
        AND last_name IS NOT NULL
        -- Skip if already in potential_duplicates
        AND NOT EXISTS (
          SELECT 1 FROM potential_duplicates pd
          WHERE (pd.profile_a_id = v_profile.id AND pd.profile_b_id = id)
             OR (pd.profile_a_id = id AND pd.profile_b_id = v_profile.id)
        )
    LOOP
      v_score := 0;
      v_reasons := '{}';
      v_name_score := 0;
      v_date_score := 0;
      v_place_score := 0;

      -- Name matching (max 50 points)
      IF LOWER(v_profile.first_name) = LOWER(v_other.first_name) AND
         LOWER(v_profile.last_name) = LOWER(v_other.last_name) THEN
        v_name_score := 50;
        v_reasons := v_reasons || jsonb_build_object('exact_name_match', true);
      ELSIF LOWER(v_profile.first_name) = LOWER(v_other.first_name) THEN
        v_name_score := 25;
        v_reasons := v_reasons || jsonb_build_object('first_name_match', true);
      ELSIF LOWER(v_profile.last_name) = LOWER(v_other.last_name) THEN
        v_name_score := 15;
        v_reasons := v_reasons || jsonb_build_object('last_name_match', true);
      END IF;

      -- Check maiden name matches
      IF v_profile.maiden_name IS NOT NULL AND v_other.maiden_name IS NOT NULL AND
         LOWER(v_profile.maiden_name) = LOWER(v_other.maiden_name) THEN
        v_name_score := v_name_score + 10;
        v_reasons := v_reasons || jsonb_build_object('maiden_name_match', true);
      END IF;

      -- Check nickname matches
      IF v_profile.nickname IS NOT NULL AND v_other.nickname IS NOT NULL AND
         LOWER(v_profile.nickname) = LOWER(v_other.nickname) THEN
        v_name_score := v_name_score + 5;
        v_reasons := v_reasons || jsonb_build_object('nickname_match', true);
      END IF;

      v_score := v_score + LEAST(v_name_score, 50);

      -- Birth date matching (max 30 points)
      IF v_profile.birth_date IS NOT NULL AND v_other.birth_date IS NOT NULL THEN
        IF v_profile.birth_date = v_other.birth_date THEN
          v_date_score := 30;
          v_reasons := v_reasons || jsonb_build_object('exact_birth_date_match', true);
        ELSIF EXTRACT(YEAR FROM v_profile.birth_date::date) = EXTRACT(YEAR FROM v_other.birth_date::date) THEN
          v_date_score := 15;
          v_reasons := v_reasons || jsonb_build_object('birth_year_match', true);
        END IF;
      END IF;

      v_score := v_score + v_date_score;

      -- Birth place matching (max 20 points)
      IF v_profile.birth_city IS NOT NULL AND v_other.birth_city IS NOT NULL AND
         LOWER(v_profile.birth_city) = LOWER(v_other.birth_city) THEN
        v_place_score := 15;
        v_reasons := v_reasons || jsonb_build_object('birth_city_match', true);
      END IF;

      IF v_profile.birth_country IS NOT NULL AND v_other.birth_country IS NOT NULL AND
         LOWER(v_profile.birth_country) = LOWER(v_other.birth_country) THEN
        v_place_score := v_place_score + 5;
        v_reasons := v_reasons || jsonb_build_object('birth_country_match', true);
      END IF;

      v_score := v_score + LEAST(v_place_score, 20);

      -- Only return if score meets threshold
      IF v_score >= p_min_confidence THEN
        profile_a_id := LEAST(v_profile.id, v_other.id);
        profile_b_id := GREATEST(v_profile.id, v_other.id);
        confidence_score := v_score;
        match_reasons := v_reasons;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (RLS will handle access control)
GRANT EXECUTE ON FUNCTION fn_find_potential_duplicates TO authenticated;

COMMENT ON TABLE potential_duplicates IS 'Queue of potential duplicate profiles detected by the system';
COMMENT ON TABLE merge_history IS 'Audit trail of profile merges for data integrity tracking';
COMMENT ON FUNCTION fn_find_potential_duplicates IS 'Scans all profiles to find potential duplicates based on name, birth date, and location';
