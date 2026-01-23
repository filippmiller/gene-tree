-- Migration 0035: Engagement Features Phase 3
-- Memorial Tribute Pages, Ask the Elder Queue

-- ============================================
-- TRIBUTE GUESTBOOK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tribute_guestbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT,
  tribute_type TEXT NOT NULL CHECK (tribute_type IN ('message', 'flower', 'candle')),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tribute_guestbook_profile ON tribute_guestbook(tribute_profile_id);
CREATE INDEX IF NOT EXISTS idx_tribute_guestbook_author ON tribute_guestbook(author_id);
CREATE INDEX IF NOT EXISTS idx_tribute_guestbook_created ON tribute_guestbook(created_at DESC);

-- ============================================
-- ELDER QUESTIONS TABLE
-- ============================================

-- Create enum for question status
DO $$ BEGIN
  CREATE TYPE elder_question_status AS ENUM ('pending', 'answered', 'declined');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS elder_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asker_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  elder_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  status elder_question_status DEFAULT 'pending',
  visibility TEXT DEFAULT 'family' CHECK (visibility IN ('public', 'family', 'private')),
  created_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_elder_questions_elder ON elder_questions(elder_id);
CREATE INDEX IF NOT EXISTS idx_elder_questions_asker ON elder_questions(asker_id);
CREATE INDEX IF NOT EXISTS idx_elder_questions_status ON elder_questions(status);
CREATE INDEX IF NOT EXISTS idx_elder_questions_created ON elder_questions(created_at DESC);

-- ============================================
-- TRIBUTE MODE COLUMN
-- ============================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS tribute_mode_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_profiles.tribute_mode_enabled IS 'Enable memorial tribute page for deceased family members';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE tribute_guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE elder_questions ENABLE ROW LEVEL SECURITY;

-- Tribute guestbook policies
-- Anyone can view approved entries for deceased profiles
DROP POLICY IF EXISTS "Anyone can view approved tribute entries" ON tribute_guestbook;
CREATE POLICY "Anyone can view approved tribute entries"
  ON tribute_guestbook FOR SELECT
  USING (
    is_approved = true
    OR author_id = auth.uid()
    OR tribute_profile_id IN (
      SELECT id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Authenticated users can create entries
DROP POLICY IF EXISTS "Authenticated users can create tribute entries" ON tribute_guestbook;
CREATE POLICY "Authenticated users can create tribute entries"
  ON tribute_guestbook FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own entries
DROP POLICY IF EXISTS "Authors can update their tribute entries" ON tribute_guestbook;
CREATE POLICY "Authors can update their tribute entries"
  ON tribute_guestbook FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors or family admins can delete entries
DROP POLICY IF EXISTS "Authors can delete their tribute entries" ON tribute_guestbook;
CREATE POLICY "Authors can delete their tribute entries"
  ON tribute_guestbook FOR DELETE
  USING (auth.uid() = author_id);

-- Elder questions policies
-- Askers can see their own questions, elders can see questions to them
DROP POLICY IF EXISTS "Users can view relevant elder questions" ON elder_questions;
CREATE POLICY "Users can view relevant elder questions"
  ON elder_questions FOR SELECT
  USING (
    asker_id = auth.uid()
    OR elder_id = auth.uid()
    OR (status = 'answered' AND visibility IN ('public', 'family'))
  );

-- Authenticated users can ask questions
DROP POLICY IF EXISTS "Authenticated users can ask questions" ON elder_questions;
CREATE POLICY "Authenticated users can ask questions"
  ON elder_questions FOR INSERT
  WITH CHECK (auth.uid() = asker_id);

-- Elders can update (answer) their questions
DROP POLICY IF EXISTS "Elders can answer their questions" ON elder_questions;
CREATE POLICY "Elders can answer their questions"
  ON elder_questions FOR UPDATE
  USING (auth.uid() = elder_id);

-- Askers can delete their own questions
DROP POLICY IF EXISTS "Askers can delete their questions" ON elder_questions;
CREATE POLICY "Askers can delete their questions"
  ON elder_questions FOR DELETE
  USING (auth.uid() = asker_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get tribute page data for a profile
CREATE OR REPLACE FUNCTION get_tribute_page(profile_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (
      SELECT json_build_object(
        'id', up.id,
        'first_name', up.first_name,
        'last_name', up.last_name,
        'avatar_url', up.avatar_url,
        'birth_date', up.birth_date,
        'death_date', up.death_date,
        'tribute_mode_enabled', up.tribute_mode_enabled
      )
      FROM user_profiles up
      WHERE up.id = profile_uuid
    ),
    'guestbook_count', (
      SELECT COUNT(*)
      FROM tribute_guestbook
      WHERE tribute_profile_id = profile_uuid AND is_approved = true
    ),
    'recent_tributes', (
      SELECT COALESCE(json_agg(t), '[]'::json)
      FROM (
        SELECT
          tg.id,
          tg.tribute_type,
          tg.message,
          tg.created_at,
          json_build_object(
            'id', up.id,
            'first_name', up.first_name,
            'last_name', up.last_name,
            'avatar_url', up.avatar_url
          ) as author
        FROM tribute_guestbook tg
        JOIN user_profiles up ON up.id = tg.author_id
        WHERE tg.tribute_profile_id = profile_uuid
          AND tg.is_approved = true
        ORDER BY tg.created_at DESC
        LIMIT 5
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find relationship path between two people
-- This uses BFS to find the shortest path
CREATE OR REPLACE FUNCTION find_relationship_path(person1_id UUID, person2_id UUID, max_depth INT DEFAULT 10)
RETURNS JSON AS $$
DECLARE
  result JSON;
  path_found BOOLEAN := false;
  current_depth INT := 0;
BEGIN
  -- Create temporary tables for BFS
  CREATE TEMP TABLE IF NOT EXISTS visited_nodes (
    profile_id UUID PRIMARY KEY,
    depth INT,
    prev_id UUID,
    relationship_type TEXT
  ) ON COMMIT DROP;

  CREATE TEMP TABLE IF NOT EXISTS frontier (
    profile_id UUID,
    depth INT,
    prev_id UUID,
    relationship_type TEXT
  ) ON COMMIT DROP;

  -- Initialize with person1
  DELETE FROM visited_nodes;
  DELETE FROM frontier;
  INSERT INTO visited_nodes VALUES (person1_id, 0, NULL, NULL);
  INSERT INTO frontier VALUES (person1_id, 0, NULL, NULL);

  -- BFS loop
  WHILE current_depth < max_depth AND NOT path_found LOOP
    current_depth := current_depth + 1;

    -- Clear and populate new frontier
    DELETE FROM frontier WHERE depth < current_depth;

    -- Add neighbors from relationships table
    INSERT INTO frontier (profile_id, depth, prev_id, relationship_type)
    SELECT
      CASE
        WHEN r.profile_id_1 = f.profile_id THEN r.profile_id_2
        ELSE r.profile_id_1
      END,
      current_depth,
      f.profile_id,
      r.relationship_type::TEXT
    FROM frontier f
    JOIN relationships r ON (r.profile_id_1 = f.profile_id OR r.profile_id_2 = f.profile_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM visited_nodes v
      WHERE v.profile_id = CASE
        WHEN r.profile_id_1 = f.profile_id THEN r.profile_id_2
        ELSE r.profile_id_1
      END
    );

    -- Add to visited
    INSERT INTO visited_nodes
    SELECT DISTINCT ON (profile_id) * FROM frontier
    WHERE depth = current_depth
    ON CONFLICT (profile_id) DO NOTHING;

    -- Check if we found person2
    IF EXISTS (SELECT 1 FROM visited_nodes WHERE profile_id = person2_id) THEN
      path_found := true;
    END IF;

    -- Exit if no new nodes
    IF NOT EXISTS (SELECT 1 FROM frontier WHERE depth = current_depth) THEN
      EXIT;
    END IF;
  END LOOP;

  -- Build path if found
  IF path_found THEN
    WITH RECURSIVE path AS (
      SELECT
        profile_id,
        prev_id,
        relationship_type,
        depth,
        ARRAY[profile_id] as path_ids
      FROM visited_nodes
      WHERE profile_id = person2_id

      UNION ALL

      SELECT
        v.profile_id,
        v.prev_id,
        v.relationship_type,
        v.depth,
        p.path_ids || v.profile_id
      FROM visited_nodes v
      JOIN path p ON v.profile_id = p.prev_id
      WHERE v.prev_id IS NOT NULL OR v.profile_id = person1_id
    ),
    full_path AS (
      SELECT * FROM path WHERE profile_id = person1_id
    )
    SELECT json_build_object(
      'found', true,
      'path_length', (SELECT depth FROM visited_nodes WHERE profile_id = person2_id),
      'path', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'profile_id', v.profile_id,
            'first_name', up.first_name,
            'last_name', up.last_name,
            'avatar_url', up.avatar_url,
            'relationship_to_next', v.relationship_type
          )
          ORDER BY v.depth
        ), '[]'::json)
        FROM visited_nodes v
        JOIN user_profiles up ON up.id = v.profile_id
        WHERE v.profile_id = ANY((SELECT path_ids FROM full_path LIMIT 1))
      )
    ) INTO result;
  ELSE
    result := json_build_object('found', false, 'path_length', null, 'path', '[]'::json);
  END IF;

  DROP TABLE IF EXISTS visited_nodes;
  DROP TABLE IF EXISTS frontier;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
