-- Migration: Memory Prompts System
-- Enhances story prompts with seasonal rotation, relationship-specific prompts,
-- and improved tracking to encourage family story sharing.

-- ============================================
-- MEMORY PROMPTS TABLE
-- A refined prompt system with categories, seasonal rotation, and placeholders
-- ============================================

CREATE TABLE IF NOT EXISTS memory_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category for organization
  category TEXT NOT NULL CHECK (category IN (
    'childhood', 'family', 'traditions', 'seasonal', 'relationship'
  )),

  -- Bilingual prompt text
  prompt_en TEXT NOT NULL,
  prompt_ru TEXT NOT NULL,

  -- Placeholder support for dynamic prompts
  -- e.g., "What's your first memory of {person_name}?"
  placeholder_type TEXT CHECK (placeholder_type IN (
    'person_name', 'relationship', 'event', NULL
  )),

  -- Seasonal prompts (for holidays, seasons)
  is_seasonal BOOLEAN DEFAULT false,
  season TEXT CHECK (season IN ('winter', 'spring', 'summer', 'fall', NULL)),

  -- Active flag for soft deletes
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PROMPT RESPONSES TABLE
-- Track which prompts users have answered or skipped
-- ============================================

CREATE TABLE IF NOT EXISTS user_prompt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who saw the prompt
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The prompt they responded to
  prompt_id UUID NOT NULL REFERENCES memory_prompts(id) ON DELETE CASCADE,

  -- Link to created story (if answered)
  -- Note: stories table may not exist yet, so no FK constraint
  story_id UUID,

  -- If they chose to skip this prompt
  skipped BOOLEAN DEFAULT false,

  -- Remind me later flag (soft dismiss, can show again)
  remind_later BOOLEAN DEFAULT false,
  remind_after TIMESTAMPTZ,

  -- Context: what profile was being viewed when prompt was shown
  context_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Timestamps
  responded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure uniqueness: one response per user per prompt
  UNIQUE(user_id, prompt_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_memory_prompts_category ON memory_prompts(category);
CREATE INDEX idx_memory_prompts_seasonal ON memory_prompts(is_seasonal, season) WHERE is_seasonal = true;
CREATE INDEX idx_memory_prompts_active ON memory_prompts(is_active) WHERE is_active = true;
CREATE INDEX idx_memory_prompts_placeholder ON memory_prompts(placeholder_type) WHERE placeholder_type IS NOT NULL;

CREATE INDEX idx_user_prompt_responses_user ON user_prompt_responses(user_id);
CREATE INDEX idx_user_prompt_responses_prompt ON user_prompt_responses(prompt_id);
CREATE INDEX idx_user_prompt_responses_user_skipped ON user_prompt_responses(user_id, skipped) WHERE skipped = false;
CREATE INDEX idx_user_prompt_responses_remind ON user_prompt_responses(user_id, remind_later, remind_after)
  WHERE remind_later = true;

-- ============================================
-- UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_memory_prompts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_memory_prompts_updated
  BEFORE UPDATE ON memory_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_prompts_timestamp();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE memory_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_responses ENABLE ROW LEVEL SECURITY;

-- Memory Prompts: Everyone can view active prompts
CREATE POLICY "memory_prompts_select_active" ON memory_prompts
  FOR SELECT
  USING (is_active = true OR current_user_is_admin());

-- Memory Prompts: Only admins can modify
CREATE POLICY "memory_prompts_admin_all" ON memory_prompts
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- User Prompt Responses: Users can view their own responses
CREATE POLICY "user_prompt_responses_select_own" ON user_prompt_responses
  FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());

-- User Prompt Responses: Users can insert their own responses
CREATE POLICY "user_prompt_responses_insert_own" ON user_prompt_responses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Prompt Responses: Users can update their own responses
CREATE POLICY "user_prompt_responses_update_own" ON user_prompt_responses
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get the current season based on date
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS TEXT AS $$
DECLARE
  v_month INTEGER;
BEGIN
  v_month := EXTRACT(MONTH FROM CURRENT_DATE);

  -- Northern hemisphere seasons
  IF v_month IN (12, 1, 2) THEN
    RETURN 'winter';
  ELSIF v_month IN (3, 4, 5) THEN
    RETURN 'spring';
  ELSIF v_month IN (6, 7, 8) THEN
    RETURN 'summer';
  ELSE
    RETURN 'fall';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get daily featured prompt for a user
-- Rotates prompts daily, prioritizes unanswered, considers seasons
CREATE OR REPLACE FUNCTION get_daily_memory_prompt(
  p_user_id UUID,
  p_context_profile_id UUID DEFAULT NULL
)
RETURNS TABLE (
  prompt_id UUID,
  prompt_en TEXT,
  prompt_ru TEXT,
  category TEXT,
  placeholder_type TEXT,
  is_seasonal BOOLEAN,
  season TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  v_day_of_year INTEGER;
  v_current_season TEXT;
  v_prompt RECORD;
BEGIN
  v_day_of_year := EXTRACT(DOY FROM CURRENT_DATE)::INTEGER;
  v_current_season := get_current_season();

  -- First, try to get a seasonal prompt if applicable
  IF v_current_season IN ('winter', 'summer') THEN
    SELECT mp.* INTO v_prompt
    FROM memory_prompts mp
    WHERE mp.is_active = true
      AND mp.is_seasonal = true
      AND mp.season = v_current_season
      AND mp.id NOT IN (
        SELECT upr.prompt_id FROM user_prompt_responses upr
        WHERE upr.user_id = p_user_id AND upr.skipped = false
      )
    ORDER BY random()
    LIMIT 1;

    IF v_prompt IS NOT NULL THEN
      RETURN QUERY SELECT
        v_prompt.id,
        v_prompt.prompt_en,
        v_prompt.prompt_ru,
        v_prompt.category,
        v_prompt.placeholder_type,
        v_prompt.is_seasonal,
        v_prompt.season,
        true AS is_new;
      RETURN;
    END IF;
  END IF;

  -- If viewing a profile, try relationship-specific prompts
  IF p_context_profile_id IS NOT NULL THEN
    SELECT mp.* INTO v_prompt
    FROM memory_prompts mp
    WHERE mp.is_active = true
      AND mp.category = 'relationship'
      AND mp.id NOT IN (
        SELECT upr.prompt_id FROM user_prompt_responses upr
        WHERE upr.user_id = p_user_id
          AND (upr.skipped = true OR upr.story_id IS NOT NULL)
      )
    ORDER BY random()
    LIMIT 1;

    IF v_prompt IS NOT NULL THEN
      RETURN QUERY SELECT
        v_prompt.id,
        v_prompt.prompt_en,
        v_prompt.prompt_ru,
        v_prompt.category,
        v_prompt.placeholder_type,
        v_prompt.is_seasonal,
        v_prompt.season,
        true AS is_new;
      RETURN;
    END IF;
  END IF;

  -- Default: Get an unanswered prompt, rotating by day
  SELECT mp.* INTO v_prompt
  FROM memory_prompts mp
  WHERE mp.is_active = true
    AND mp.id NOT IN (
      SELECT upr.prompt_id FROM user_prompt_responses upr
      WHERE upr.user_id = p_user_id
        AND (upr.skipped = true OR upr.story_id IS NOT NULL)
    )
    -- Exclude prompts with remind_later that haven't expired
    AND mp.id NOT IN (
      SELECT upr.prompt_id FROM user_prompt_responses upr
      WHERE upr.user_id = p_user_id
        AND upr.remind_later = true
        AND upr.remind_after > NOW()
    )
  ORDER BY
    -- Deterministic daily rotation based on prompt order
    (mp.id::text || v_day_of_year::text)::uuid
  LIMIT 1;

  IF v_prompt IS NOT NULL THEN
    RETURN QUERY SELECT
      v_prompt.id,
      v_prompt.prompt_en,
      v_prompt.prompt_ru,
      v_prompt.category,
      v_prompt.placeholder_type,
      v_prompt.is_seasonal,
      v_prompt.season,
      true AS is_new;
    RETURN;
  END IF;

  -- If all prompts have been seen, get the oldest skipped one
  SELECT mp.* INTO v_prompt
  FROM memory_prompts mp
  JOIN user_prompt_responses upr ON upr.prompt_id = mp.id
  WHERE mp.is_active = true
    AND upr.user_id = p_user_id
    AND upr.skipped = true
  ORDER BY upr.responded_at ASC
  LIMIT 1;

  IF v_prompt IS NOT NULL THEN
    RETURN QUERY SELECT
      v_prompt.id,
      v_prompt.prompt_en,
      v_prompt.prompt_ru,
      v_prompt.category,
      v_prompt.placeholder_type,
      v_prompt.is_seasonal,
      v_prompt.season,
      false AS is_new;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get multiple unanswered prompts for the list view
CREATE OR REPLACE FUNCTION get_memory_prompts_for_user(
  p_user_id UUID,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_include_answered BOOLEAN DEFAULT false
)
RETURNS TABLE (
  prompt_id UUID,
  prompt_en TEXT,
  prompt_ru TEXT,
  category TEXT,
  placeholder_type TEXT,
  is_seasonal BOOLEAN,
  season TEXT,
  is_answered BOOLEAN,
  is_skipped BOOLEAN,
  story_id UUID,
  responded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.id AS prompt_id,
    mp.prompt_en,
    mp.prompt_ru,
    mp.category,
    mp.placeholder_type,
    mp.is_seasonal,
    mp.season,
    COALESCE(upr.story_id IS NOT NULL, false) AS is_answered,
    COALESCE(upr.skipped, false) AS is_skipped,
    upr.story_id,
    upr.responded_at
  FROM memory_prompts mp
  LEFT JOIN user_prompt_responses upr ON upr.prompt_id = mp.id AND upr.user_id = p_user_id
  WHERE mp.is_active = true
    AND (p_category IS NULL OR mp.category = p_category)
    AND (p_include_answered = true OR upr.story_id IS NULL)
  ORDER BY
    -- Unanswered first
    CASE WHEN upr.story_id IS NULL THEN 0 ELSE 1 END,
    -- Then by category
    mp.category,
    -- Then random within category
    random()
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get user's prompt statistics
CREATE OR REPLACE FUNCTION get_memory_prompt_stats(p_user_id UUID)
RETURNS TABLE (
  total_prompts BIGINT,
  answered_count BIGINT,
  skipped_count BIGINT,
  pending_count BIGINT,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM memory_prompts WHERE is_active = true)::BIGINT AS total_prompts,
    (SELECT COUNT(*) FROM user_prompt_responses
     WHERE user_id = p_user_id AND story_id IS NOT NULL)::BIGINT AS answered_count,
    (SELECT COUNT(*) FROM user_prompt_responses
     WHERE user_id = p_user_id AND skipped = true AND story_id IS NULL)::BIGINT AS skipped_count,
    (SELECT COUNT(*) FROM memory_prompts mp
     WHERE mp.is_active = true
       AND mp.id NOT IN (
         SELECT prompt_id FROM user_prompt_responses
         WHERE user_id = p_user_id
       ))::BIGINT AS pending_count,
    (
      SELECT jsonb_object_agg(
        category,
        jsonb_build_object(
          'total', total,
          'answered', answered,
          'skipped', skipped
        )
      )
      FROM (
        SELECT
          mp.category,
          COUNT(mp.id) AS total,
          COUNT(CASE WHEN upr.story_id IS NOT NULL THEN 1 END) AS answered,
          COUNT(CASE WHEN upr.skipped = true AND upr.story_id IS NULL THEN 1 END) AS skipped
        FROM memory_prompts mp
        LEFT JOIN user_prompt_responses upr ON upr.prompt_id = mp.id AND upr.user_id = p_user_id
        WHERE mp.is_active = true
        GROUP BY mp.category
      ) stats
    ) AS by_category;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Mark a prompt as answered (link to story)
CREATE OR REPLACE FUNCTION respond_to_memory_prompt(
  p_user_id UUID,
  p_prompt_id UUID,
  p_story_id UUID,
  p_context_profile_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_prompt_responses (user_id, prompt_id, story_id, context_profile_id)
  VALUES (p_user_id, p_prompt_id, p_story_id, p_context_profile_id)
  ON CONFLICT (user_id, prompt_id)
  DO UPDATE SET
    story_id = p_story_id,
    skipped = false,
    remind_later = false,
    context_profile_id = COALESCE(p_context_profile_id, user_prompt_responses.context_profile_id),
    responded_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Skip a prompt
CREATE OR REPLACE FUNCTION skip_memory_prompt(
  p_user_id UUID,
  p_prompt_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_prompt_responses (user_id, prompt_id, skipped)
  VALUES (p_user_id, p_prompt_id, true)
  ON CONFLICT (user_id, prompt_id)
  DO UPDATE SET
    skipped = true,
    responded_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remind me later (dismiss temporarily)
CREATE OR REPLACE FUNCTION remind_later_memory_prompt(
  p_user_id UUID,
  p_prompt_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_prompt_responses (user_id, prompt_id, remind_later, remind_after)
  VALUES (p_user_id, p_prompt_id, true, NOW() + (p_days || ' days')::INTERVAL)
  ON CONFLICT (user_id, prompt_id)
  DO UPDATE SET
    remind_later = true,
    remind_after = NOW() + (p_days || ' days')::INTERVAL,
    responded_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_current_season() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_memory_prompt(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_memory_prompts_for_user(UUID, TEXT, INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_memory_prompt_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_memory_prompt(UUID, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION skip_memory_prompt(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remind_later_memory_prompt(UUID, UUID, INTEGER) TO authenticated;

-- ============================================
-- SEED PROMPTS (25 prompts across 5 categories)
-- ============================================

INSERT INTO memory_prompts (category, prompt_en, prompt_ru, placeholder_type, is_seasonal, season) VALUES
-- Childhood (5)
('childhood', 'What is your earliest memory?', 'Какое ваше самое раннее воспоминание?', NULL, false, NULL),
('childhood', 'What games did you play as a child?', 'В какие игры вы играли в детстве?', NULL, false, NULL),
('childhood', 'Describe your childhood home.', 'Опишите дом вашего детства.', NULL, false, NULL),
('childhood', 'What was your favorite toy?', 'Какая была ваша любимая игрушка?', NULL, false, NULL),
('childhood', 'What did you want to be when you grew up?', 'Кем вы хотели стать, когда вырастете?', NULL, false, NULL),

-- Family (5)
('family', 'What did grandma always cook?', 'Что всегда готовила бабушка?', NULL, false, NULL),
('family', 'What is a family saying everyone knows?', 'Какую семейную поговорку все знают?', NULL, false, NULL),
('family', 'What is the funniest family story?', 'Какая самая смешная семейная история?', NULL, false, NULL),
('family', 'What lesson did your parents teach you?', 'Какому уроку вас научили родители?', NULL, false, NULL),
('family', 'What makes your family unique?', 'Что делает вашу семью особенной?', NULL, false, NULL),

-- Traditions (5)
('traditions', 'How did your family celebrate birthdays?', 'Как ваша семья отмечала дни рождения?', NULL, false, NULL),
('traditions', 'What traditions do you want to pass on?', 'Какие традиции вы хотите передать?', NULL, false, NULL),
('traditions', 'What family recipes have been passed down?', 'Какие семейные рецепты передавались из поколения в поколение?', NULL, false, NULL),
('traditions', 'What songs did your family sing together?', 'Какие песни пела ваша семья вместе?', NULL, false, NULL),
('traditions', 'How did your family spend Sunday mornings?', 'Как ваша семья проводила воскресные утра?', NULL, false, NULL),

-- Relationship-specific (5 with placeholders)
('relationship', 'What is your first memory of {person}?', 'Какое ваше первое воспоминание о {person}?', 'person_name', false, NULL),
('relationship', 'What makes {person} special to you?', 'Что делает {person} особенным для вас?', 'person_name', false, NULL),
('relationship', 'What is the best advice {person} gave you?', 'Какой лучший совет дал вам {person}?', 'person_name', false, NULL),
('relationship', 'What is a favorite memory with your {relationship}?', 'Какое любимое воспоминание с вашим {relationship}?', 'relationship', false, NULL),
('relationship', 'What would you tell {person} if you could?', 'Что бы вы сказали {person}, если бы могли?', 'person_name', false, NULL),

-- Seasonal (5)
('seasonal', 'How did your family celebrate New Year?', 'Как ваша семья отмечала Новый год?', NULL, true, 'winter'),
('seasonal', 'What is your favorite winter memory?', 'Какое ваше любимое зимнее воспоминание?', NULL, true, 'winter'),
('seasonal', 'What is your favorite summer memory?', 'Какое ваше любимое летнее воспоминание?', NULL, true, 'summer'),
('seasonal', 'Where did your family vacation in summer?', 'Куда ваша семья ездила отдыхать летом?', NULL, true, 'summer'),
('seasonal', 'What did you do during school breaks?', 'Чем вы занимались на школьных каникулах?', NULL, true, 'summer');

-- ============================================
-- UPDATE DASHBOARD PREFERENCES TYPE
-- Add memory_prompts as a new widget option
-- ============================================

-- Note: Dashboard preferences are stored as JSONB in user_profiles.dashboard_preferences
-- The frontend will handle the new widget type

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE memory_prompts IS 'Library of prompts to encourage family story sharing, with seasonal and relationship-specific options';
COMMENT ON TABLE user_prompt_responses IS 'Tracks user interactions with memory prompts - answered, skipped, or remind later';
COMMENT ON FUNCTION get_daily_memory_prompt IS 'Returns a single daily prompt for the user, considering seasons and context';
COMMENT ON FUNCTION get_memory_prompts_for_user IS 'Returns a paginated list of prompts with user response status';
COMMENT ON FUNCTION get_memory_prompt_stats IS 'Returns aggregate statistics about user prompt responses';
