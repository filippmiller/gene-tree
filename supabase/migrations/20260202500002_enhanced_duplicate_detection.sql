-- Enhanced Duplicate Detection for Deceased Profiles
-- Adds improved matching criteria, resolution notes, and scan history

-- Add new columns to potential_duplicates if they don't exist
DO $$
BEGIN
  -- Add resolution_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'potential_duplicates' AND column_name = 'resolution_notes'
  ) THEN
    ALTER TABLE potential_duplicates ADD COLUMN resolution_notes TEXT;
  END IF;

  -- Add kept_profile_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'potential_duplicates' AND column_name = 'kept_profile_id'
  ) THEN
    ALTER TABLE potential_duplicates ADD COLUMN kept_profile_id UUID REFERENCES user_profiles(id);
  END IF;

  -- Add is_deceased_pair flag for prioritization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'potential_duplicates' AND column_name = 'is_deceased_pair'
  ) THEN
    ALTER TABLE potential_duplicates ADD COLUMN is_deceased_pair BOOLEAN DEFAULT false;
  END IF;

  -- Add shared_relatives_count for relationship matching
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'potential_duplicates' AND column_name = 'shared_relatives_count'
  ) THEN
    ALTER TABLE potential_duplicates ADD COLUMN shared_relatives_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update status check constraint to include new statuses
ALTER TABLE potential_duplicates DROP CONSTRAINT IF EXISTS potential_duplicates_status_check;
ALTER TABLE potential_duplicates ADD CONSTRAINT potential_duplicates_status_check
  CHECK (status IN ('pending', 'confirmed_same', 'confirmed_different', 'merged', 'not_duplicate', 'dismissed'));

-- Index for deceased pairs (prioritize these in UI)
CREATE INDEX IF NOT EXISTS idx_potential_duplicates_deceased ON potential_duplicates(is_deceased_pair, status)
  WHERE is_deceased_pair = true AND status = 'pending';

-- Duplicate scan history for tracking scan runs
CREATE TABLE IF NOT EXISTS duplicate_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_by UUID REFERENCES auth.users(id),
  profiles_scanned INTEGER NOT NULL DEFAULT 0,
  duplicates_found INTEGER NOT NULL DEFAULT 0,
  duplicates_inserted INTEGER NOT NULL DEFAULT 0,
  scan_type TEXT NOT NULL DEFAULT 'full' CHECK (scan_type IN ('full', 'deceased_only', 'incremental')),
  min_confidence INTEGER NOT NULL DEFAULT 50,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duplicate_scan_history_created ON duplicate_scan_history(created_at DESC);

-- RLS for scan history
ALTER TABLE duplicate_scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scan history"
  ON duplicate_scan_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert scan history"
  ON duplicate_scan_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to check if two profiles share relatives
CREATE OR REPLACE FUNCTION fn_count_shared_relatives(
  p_profile_a_id UUID,
  p_profile_b_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count relatives that both profiles share
  SELECT COUNT(DISTINCT shared_relative_id) INTO v_count
  FROM (
    -- Relatives of profile A
    SELECT
      CASE WHEN user1_id = p_profile_a_id THEN user2_id ELSE user1_id END AS shared_relative_id
    FROM relationships
    WHERE user1_id = p_profile_a_id OR user2_id = p_profile_a_id

    INTERSECT

    -- Relatives of profile B
    SELECT
      CASE WHEN user1_id = p_profile_b_id THEN user2_id ELSE user1_id END AS shared_relative_id
    FROM relationships
    WHERE user1_id = p_profile_b_id OR user2_id = p_profile_b_id
  ) AS shared;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find duplicates specifically among deceased profiles
CREATE OR REPLACE FUNCTION fn_find_deceased_duplicates(
  p_min_confidence INTEGER DEFAULT 50
)
RETURNS TABLE (
  profile_a_id UUID,
  profile_b_id UUID,
  confidence_score INTEGER,
  match_reasons JSONB,
  shared_relatives INTEGER
) AS $$
DECLARE
  v_profile RECORD;
  v_other RECORD;
  v_score INTEGER;
  v_reasons JSONB;
  v_name_score INTEGER;
  v_date_score INTEGER;
  v_place_score INTEGER;
  v_shared INTEGER;
BEGIN
  -- Compare deceased profiles pairwise
  FOR v_profile IN
    SELECT id, first_name, last_name, maiden_name, nickname,
           birth_date, birth_place, birth_city, birth_country,
           death_date, death_place
    FROM user_profiles
    WHERE is_living = false
      AND first_name IS NOT NULL
      AND last_name IS NOT NULL
  LOOP
    FOR v_other IN
      SELECT id, first_name, last_name, maiden_name, nickname,
             birth_date, birth_place, birth_city, birth_country,
             death_date, death_place
      FROM user_profiles
      WHERE is_living = false
        AND id > v_profile.id
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

      -- Maiden name matching
      IF v_profile.maiden_name IS NOT NULL AND v_other.maiden_name IS NOT NULL AND
         LOWER(v_profile.maiden_name) = LOWER(v_other.maiden_name) THEN
        v_name_score := v_name_score + 10;
        v_reasons := v_reasons || jsonb_build_object('maiden_name_match', true);
      END IF;

      v_score := LEAST(v_name_score, 50);

      -- Birth date matching (max 30 points)
      IF v_profile.birth_date IS NOT NULL AND v_other.birth_date IS NOT NULL THEN
        IF v_profile.birth_date = v_other.birth_date THEN
          v_date_score := 25;
          v_reasons := v_reasons || jsonb_build_object('exact_birth_date_match', true);
        ELSIF ABS(EXTRACT(YEAR FROM v_profile.birth_date::date) - EXTRACT(YEAR FROM v_other.birth_date::date)) <= 2 THEN
          v_date_score := 12;
          v_reasons := v_reasons || jsonb_build_object('birth_year_close', true);
        END IF;
      END IF;

      -- Death date matching (extra weight for deceased)
      IF v_profile.death_date IS NOT NULL AND v_other.death_date IS NOT NULL THEN
        IF v_profile.death_date = v_other.death_date THEN
          v_date_score := v_date_score + 10;
          v_reasons := v_reasons || jsonb_build_object('exact_death_date_match', true);
        ELSIF ABS(EXTRACT(YEAR FROM v_profile.death_date::date) - EXTRACT(YEAR FROM v_other.death_date::date)) <= 2 THEN
          v_date_score := v_date_score + 5;
          v_reasons := v_reasons || jsonb_build_object('death_year_close', true);
        END IF;
      END IF;

      v_score := v_score + LEAST(v_date_score, 35);

      -- Birth place matching (max 15 points)
      IF v_profile.birth_city IS NOT NULL AND v_other.birth_city IS NOT NULL AND
         LOWER(v_profile.birth_city) = LOWER(v_other.birth_city) THEN
        v_place_score := 12;
        v_reasons := v_reasons || jsonb_build_object('birth_city_match', true);
      END IF;

      IF v_profile.birth_country IS NOT NULL AND v_other.birth_country IS NOT NULL AND
         LOWER(v_profile.birth_country) = LOWER(v_other.birth_country) THEN
        v_place_score := v_place_score + 3;
        v_reasons := v_reasons || jsonb_build_object('birth_country_match', true);
      END IF;

      v_score := v_score + LEAST(v_place_score, 15);

      -- Check for shared relatives
      v_shared := fn_count_shared_relatives(v_profile.id, v_other.id);
      IF v_shared > 0 THEN
        v_score := v_score + LEAST(v_shared * 5, 15);
        v_reasons := v_reasons || jsonb_build_object('shared_relatives', v_shared);
      END IF;

      -- Only return if score meets threshold
      IF v_score >= p_min_confidence THEN
        profile_a_id := LEAST(v_profile.id, v_other.id);
        profile_b_id := GREATEST(v_profile.id, v_other.id);
        confidence_score := LEAST(v_score, 100);
        match_reasons := v_reasons;
        shared_relatives := v_shared;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fn_find_deceased_duplicates TO authenticated;
GRANT EXECUTE ON FUNCTION fn_count_shared_relatives TO authenticated;

COMMENT ON TABLE duplicate_scan_history IS 'History of duplicate detection scans for auditing';
COMMENT ON FUNCTION fn_find_deceased_duplicates IS 'Find potential duplicates specifically among deceased profiles';
COMMENT ON FUNCTION fn_count_shared_relatives IS 'Count shared relatives between two profiles for duplicate matching';
