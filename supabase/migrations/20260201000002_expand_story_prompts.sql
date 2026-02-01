-- Migration: Expand Story Prompts Library
-- Adds 20+ new prompts to reach 52+ total for weekly rotation
-- Adds 'favorites' category and user prompt tracking

-- ============================================
-- ADD FAVORITES CATEGORY
-- ============================================

-- First, update the category check constraint to include 'favorites'
ALTER TABLE story_prompts
DROP CONSTRAINT IF EXISTS story_prompts_category_check;

ALTER TABLE story_prompts
ADD CONSTRAINT story_prompts_category_check
CHECK (category IN ('childhood', 'traditions', 'life_lessons', 'historical', 'relationships', 'career', 'personal', 'favorites'));

-- ============================================
-- USER PROMPT HISTORY
-- Track which prompts users have seen/answered
-- ============================================

CREATE TABLE IF NOT EXISTS user_prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES story_prompts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'shown' CHECK (status IN ('shown', 'skipped', 'answered')),
  week_number INTEGER NOT NULL, -- Week of year when shown (1-52)
  year INTEGER NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ,
  story_id UUID, -- Link to response story
  UNIQUE(user_id, prompt_id, year, week_number)
);

CREATE INDEX idx_user_prompt_history_user ON user_prompt_history(user_id, year DESC, week_number DESC);
CREATE INDEX idx_user_prompt_history_status ON user_prompt_history(user_id, status);
CREATE INDEX idx_user_prompt_history_prompt ON user_prompt_history(prompt_id);

-- RLS for user_prompt_history
ALTER TABLE user_prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_prompt_history_select_own" ON user_prompt_history
  FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());

CREATE POLICY "user_prompt_history_insert_own" ON user_prompt_history
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_prompt_history_update_own" ON user_prompt_history
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- GET WEEKLY PROMPT FUNCTION
-- Ensures no repetition until all prompts used
-- ============================================

CREATE OR REPLACE FUNCTION get_weekly_prompt(
  p_user_id UUID,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  prompt_id UUID,
  prompt_text TEXT,
  prompt_text_ru TEXT,
  category TEXT,
  tags TEXT[],
  is_new BOOLEAN
) AS $$
DECLARE
  v_week INTEGER;
  v_year INTEGER;
  v_prompt RECORD;
  v_existing_history UUID;
BEGIN
  -- Get current week and year
  v_week := EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER;
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Check if user already has a prompt for this week
  SELECT uph.prompt_id INTO v_existing_history
  FROM user_prompt_history uph
  WHERE uph.user_id = p_user_id
    AND uph.year = v_year
    AND uph.week_number = v_week
  LIMIT 1;

  IF v_existing_history IS NOT NULL THEN
    -- Return existing prompt for this week
    RETURN QUERY
    SELECT
      sp.id,
      sp.prompt_text,
      sp.prompt_text_ru,
      sp.category,
      sp.tags,
      false AS is_new
    FROM story_prompts sp
    WHERE sp.id = v_existing_history;
    RETURN;
  END IF;

  -- Find a prompt not yet shown to this user
  SELECT sp.* INTO v_prompt
  FROM story_prompts sp
  WHERE sp.is_active = true
    AND (p_category IS NULL OR sp.category = p_category)
    AND sp.id NOT IN (
      SELECT uph.prompt_id
      FROM user_prompt_history uph
      WHERE uph.user_id = p_user_id
    )
  ORDER BY
    sp.usage_count ASC, -- Prefer less-used prompts
    random()
  LIMIT 1;

  -- If all prompts have been shown, pick from oldest shown
  IF v_prompt IS NULL THEN
    SELECT sp.* INTO v_prompt
    FROM story_prompts sp
    JOIN user_prompt_history uph ON uph.prompt_id = sp.id
    WHERE sp.is_active = true
      AND uph.user_id = p_user_id
      AND (p_category IS NULL OR sp.category = p_category)
    ORDER BY uph.shown_at ASC
    LIMIT 1;
  END IF;

  -- If still nothing (shouldn't happen), just get any active prompt
  IF v_prompt IS NULL THEN
    SELECT sp.* INTO v_prompt
    FROM story_prompts sp
    WHERE sp.is_active = true
      AND (p_category IS NULL OR sp.category = p_category)
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Record that this prompt was shown
  IF v_prompt IS NOT NULL THEN
    INSERT INTO user_prompt_history (user_id, prompt_id, week_number, year)
    VALUES (p_user_id, v_prompt.id, v_week, v_year)
    ON CONFLICT (user_id, prompt_id, year, week_number) DO NOTHING;

    -- Update usage count
    UPDATE story_prompts SET usage_count = usage_count + 1 WHERE id = v_prompt.id;

    RETURN QUERY
    SELECT
      v_prompt.id,
      v_prompt.prompt_text,
      v_prompt.prompt_text_ru,
      v_prompt.category,
      v_prompt.tags,
      true AS is_new;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- MARK PROMPT AS ANSWERED
-- ============================================

CREATE OR REPLACE FUNCTION mark_prompt_answered(
  p_user_id UUID,
  p_prompt_id UUID,
  p_story_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_week INTEGER;
  v_year INTEGER;
BEGIN
  v_week := EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER;
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  UPDATE user_prompt_history
  SET
    status = 'answered',
    answered_at = now(),
    story_id = p_story_id
  WHERE user_id = p_user_id
    AND prompt_id = p_prompt_id
    AND year = v_year
    AND week_number = v_week;

  IF NOT FOUND THEN
    -- Insert if not exists
    INSERT INTO user_prompt_history (user_id, prompt_id, week_number, year, status, answered_at, story_id)
    VALUES (p_user_id, p_prompt_id, v_week, v_year, 'answered', now(), p_story_id)
    ON CONFLICT (user_id, prompt_id, year, week_number)
    DO UPDATE SET status = 'answered', answered_at = now(), story_id = p_story_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- GET USER PROMPT STATS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_prompt_stats(p_user_id UUID)
RETURNS TABLE (
  total_shown BIGINT,
  total_answered BIGINT,
  total_skipped BIGINT,
  total_available BIGINT,
  current_week_answered BOOLEAN,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM user_prompt_history WHERE user_id = p_user_id)::BIGINT,
    (SELECT COUNT(*) FROM user_prompt_history WHERE user_id = p_user_id AND status = 'answered')::BIGINT,
    (SELECT COUNT(*) FROM user_prompt_history WHERE user_id = p_user_id AND status = 'skipped')::BIGINT,
    (SELECT COUNT(*) FROM story_prompts WHERE is_active = true)::BIGINT,
    EXISTS(
      SELECT 1 FROM user_prompt_history
      WHERE user_id = p_user_id
        AND status = 'answered'
        AND year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND week_number = EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER
    ),
    (
      SELECT jsonb_object_agg(
        category,
        jsonb_build_object(
          'answered', COALESCE(answered, 0),
          'total', total
        )
      )
      FROM (
        SELECT
          sp.category,
          COUNT(sp.id) as total,
          COUNT(CASE WHEN uph.status = 'answered' THEN 1 END) as answered
        FROM story_prompts sp
        LEFT JOIN user_prompt_history uph ON uph.prompt_id = sp.id AND uph.user_id = p_user_id
        WHERE sp.is_active = true
        GROUP BY sp.category
      ) cat_stats
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_weekly_prompt(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_prompt_answered(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_prompt_stats(UUID) TO authenticated;

-- ============================================
-- SEED ADDITIONAL PROMPTS (17+ more to reach 52+)
-- ============================================

INSERT INTO story_prompts (category, prompt_text, prompt_text_ru, min_age, max_age, tags, sort_order) VALUES
-- Additional Childhood (reach 8+)
('childhood', 'What is your earliest memory?', 'Какое ваше самое раннее воспоминание?', NULL, NULL, ARRAY['memories', 'early'], 7),
('childhood', 'What was your favorite toy?', 'Какая была ваша любимая игрушка?', NULL, NULL, ARRAY['toys', 'memories'], 8),

-- Additional Traditions (reach 8+)
('traditions', 'What family sayings or expressions do you remember?', 'Какие семейные поговорки или выражения вы помните?', NULL, NULL, ARRAY['language', 'culture'], 15),
('traditions', 'How did your family handle difficult times together?', 'Как ваша семья справлялась с трудными временами вместе?', NULL, NULL, ARRAY['resilience', 'family'], 16),
('traditions', 'What religious or cultural practices were important to your family?', 'Какие религиозные или культурные практики были важны для вашей семьи?', NULL, NULL, ARRAY['religion', 'culture'], 17),

-- Additional Life Lessons (reach 8+)
('life_lessons', 'What mistake taught you the most important lesson?', 'Какая ошибка научила вас самому важному уроку?', NULL, NULL, ARRAY['mistakes', 'growth'], 26),
('life_lessons', 'What do you believe is the key to a happy life?', 'Что, по-вашему, является ключом к счастливой жизни?', NULL, NULL, ARRAY['happiness', 'philosophy'], 27),

-- Additional Historical (reach 8+)
('historical', 'What was your neighborhood like when you were growing up?', 'Каким был ваш район, когда вы росли?', NULL, NULL, ARRAY['neighborhood', 'memories'], 35),
('historical', 'What historical event had the biggest impact on your life?', 'Какое историческое событие оказало наибольшее влияние на вашу жизнь?', NULL, NULL, ARRAY['history', 'impact'], 36),
('historical', 'How did you get news and information before the internet?', 'Как вы получали новости и информацию до интернета?', 40, NULL, ARRAY['technology', 'media'], 37),

-- Additional Relationships (reach 8+)
('relationships', 'What is the best relationship advice you would give?', 'Какой лучший совет по отношениям вы бы дали?', NULL, NULL, ARRAY['advice', 'relationships'], 45),
('relationships', 'How did your family show love and affection?', 'Как ваша семья проявляла любовь и привязанность?', NULL, NULL, ARRAY['love', 'family'], 46),
('relationships', 'What friend from your past do you think about often?', 'О каком друге из прошлого вы часто думаете?', NULL, NULL, ARRAY['friends', 'memories'], 47),

-- Additional Career (reach 8+)
('career', 'What was the hardest job you ever had?', 'Какая работа была самой тяжёлой для вас?', NULL, NULL, ARRAY['career', 'challenges'], 53),
('career', 'If you could have any career, what would it be?', 'Если бы вы могли выбрать любую карьеру, какую бы вы выбрали?', NULL, NULL, ARRAY['dreams', 'career'], 54),
('career', 'What did you learn about leadership?', 'Чему вы научились о лидерстве?', NULL, NULL, ARRAY['leadership', 'growth'], 55),
('career', 'How did work-life balance change over your career?', 'Как менялся баланс работы и личной жизни на протяжении вашей карьеры?', 40, NULL, ARRAY['balance', 'career'], 56),
('career', 'What skills do you wish you had developed earlier?', 'Какие навыки вы хотели бы развить раньше?', NULL, NULL, ARRAY['skills', 'reflection'], 57),

-- NEW FAVORITES Category (8 prompts)
('favorites', 'What is your favorite book and why?', 'Какая ваша любимая книга и почему?', NULL, NULL, ARRAY['books', 'reading'], 70),
('favorites', 'What is your favorite movie or TV show?', 'Какой ваш любимый фильм или телешоу?', NULL, NULL, ARRAY['movies', 'entertainment'], 71),
('favorites', 'What is your favorite place you have ever visited?', 'Какое ваше любимое место, которое вы когда-либо посещали?', NULL, NULL, ARRAY['travel', 'places'], 72),
('favorites', 'What is your favorite season and why?', 'Какое ваше любимое время года и почему?', NULL, NULL, ARRAY['seasons', 'nature'], 73),
('favorites', 'What is your favorite family recipe to cook?', 'Какой ваш любимый семейный рецепт для приготовления?', NULL, NULL, ARRAY['cooking', 'recipes'], 74),
('favorites', 'What is your favorite song or type of music?', 'Какая ваша любимая песня или тип музыки?', NULL, NULL, ARRAY['music', 'entertainment'], 75),
('favorites', 'What is your favorite way to spend a day off?', 'Как вам нравится проводить выходной день?', NULL, NULL, ARRAY['leisure', 'hobbies'], 76),
('favorites', 'What is your favorite memory with your children or grandchildren?', 'Какое ваше любимое воспоминание с детьми или внуками?', 40, NULL, ARRAY['family', 'memories'], 77);

-- ============================================
-- UPDATE COMMENTS
-- ============================================
COMMENT ON TABLE user_prompt_history IS 'Tracks which prompts each user has been shown and answered';
COMMENT ON TABLE story_prompts IS 'Library of 52+ prompts across 8 categories for weekly rotation';
COMMENT ON FUNCTION get_weekly_prompt IS 'Returns the current weekly prompt for a user, ensuring no repetition';
COMMENT ON FUNCTION mark_prompt_answered IS 'Marks a prompt as answered by a user';
COMMENT ON FUNCTION get_user_prompt_stats IS 'Returns statistics about a users prompt history';
