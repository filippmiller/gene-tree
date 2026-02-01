-- Migration 0037: Achievement Badges and Story Prompts
-- Gamification and memory capture features

-- ============================================
-- BADGE TABLES
-- ============================================

-- Badge definitions
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  icon TEXT NOT NULL DEFAULT 'award',
  category TEXT NOT NULL CHECK (category IN ('tree_builder', 'memory_keeper', 'storyteller', 'connector', 'special')),
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('count', 'exists', 'manual')),
  criteria_target TEXT, -- 'relatives', 'photos', 'stories', 'invites', etc.
  criteria_value INTEGER DEFAULT 1,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'legendary')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User earned badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(user_id, badge_id)
);

-- Badge progress tracking
CREATE TABLE badge_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- Indexes for badges
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_active ON badges(is_active) WHERE is_active = true;
CREATE INDEX idx_badges_sort ON badges(sort_order, category);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_featured ON user_badges(user_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_badge_progress_user ON badge_progress(user_id);

-- ============================================
-- STORY PROMPTS TABLES
-- ============================================

-- Story prompts library
CREATE TABLE story_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('childhood', 'traditions', 'life_lessons', 'historical', 'relationships', 'career', 'personal')),
  prompt_text TEXT NOT NULL,
  prompt_text_ru TEXT,
  min_age INTEGER,
  max_age INTEGER,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assigned prompts (user asks another user to answer)
CREATE TABLE assigned_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES story_prompts(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'declined')),
  response_story_id UUID, -- Link to story response (no FK to avoid dependency issues)
  message TEXT, -- Optional personal message from assigner
  created_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ
);

-- Indexes for prompts
CREATE INDEX idx_prompts_category ON story_prompts(category);
CREATE INDEX idx_prompts_active ON story_prompts(is_active) WHERE is_active = true;
CREATE INDEX idx_prompts_tags ON story_prompts USING GIN(tags);
CREATE INDEX idx_assigned_prompts_to ON assigned_prompts(to_user_id, status);
CREATE INDEX idx_assigned_prompts_from ON assigned_prompts(from_user_id);
CREATE INDEX idx_assigned_prompts_prompt ON assigned_prompts(prompt_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_badges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW
  EXECUTE FUNCTION update_badges_updated_at();

CREATE TRIGGER trigger_prompts_updated_at
  BEFORE UPDATE ON story_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_badges_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_prompts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BADGES RLS POLICIES
-- ============================================

-- Everyone can view active badges
CREATE POLICY "badges_select_active" ON badges
  FOR SELECT
  USING (is_active = true OR current_user_is_admin());

-- Only admins can modify badges
CREATE POLICY "badges_admin_all" ON badges
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- ============================================
-- USER BADGES RLS POLICIES
-- ============================================

-- Users can view their own and others' earned badges
CREATE POLICY "user_badges_select_all" ON user_badges
  FOR SELECT
  USING (true);

-- Service role can insert badges (awarded by system)
CREATE POLICY "user_badges_insert_service" ON user_badges
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR current_user_is_admin());

-- Users can update their own badges (featuring)
CREATE POLICY "user_badges_update_own" ON user_badges
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- BADGE PROGRESS RLS POLICIES
-- ============================================

-- Users can view their own progress
CREATE POLICY "badge_progress_select_own" ON badge_progress
  FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());

-- Service role can insert/update progress
CREATE POLICY "badge_progress_insert_service" ON badge_progress
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR current_user_is_admin());

CREATE POLICY "badge_progress_update_service" ON badge_progress
  FOR UPDATE
  USING (auth.role() = 'service_role' OR current_user_is_admin())
  WITH CHECK (auth.role() = 'service_role' OR current_user_is_admin());

-- ============================================
-- STORY PROMPTS RLS POLICIES
-- ============================================

-- Everyone can view active prompts
CREATE POLICY "prompts_select_active" ON story_prompts
  FOR SELECT
  USING (is_active = true OR current_user_is_admin());

-- Only admins can modify prompts
CREATE POLICY "prompts_admin_all" ON story_prompts
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- ============================================
-- ASSIGNED PROMPTS RLS POLICIES
-- ============================================

-- Users can view prompts assigned to them or by them
CREATE POLICY "assigned_prompts_select_own" ON assigned_prompts
  FOR SELECT
  USING (
    from_user_id = auth.uid()
    OR to_user_id = auth.uid()
    OR current_user_is_admin()
  );

-- Users can assign prompts to family members
CREATE POLICY "assigned_prompts_insert_family" ON assigned_prompts
  FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid()
    AND is_in_family_circle(to_user_id, auth.uid())
  );

-- Recipients can update status (answered/declined)
CREATE POLICY "assigned_prompts_update_recipient" ON assigned_prompts
  FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Senders can delete their assignments
CREATE POLICY "assigned_prompts_delete_sender" ON assigned_prompts
  FOR DELETE
  USING (from_user_id = auth.uid() AND status = 'pending');

-- ============================================
-- BADGE HELPER FUNCTIONS
-- ============================================

-- Check and award badge if criteria met
CREATE OR REPLACE FUNCTION check_and_award_badge(
  p_user_id UUID,
  p_badge_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_badge RECORD;
  v_count INTEGER;
  v_awarded BOOLEAN := false;
BEGIN
  -- Get badge details
  SELECT * INTO v_badge FROM badges WHERE id = p_badge_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if already earned
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN false;
  END IF;

  -- Check criteria based on type
  IF v_badge.criteria_type = 'manual' THEN
    -- Manual badges awarded directly, not checked here
    RETURN false;
  END IF;

  -- Get current count based on target
  CASE v_badge.criteria_target
    WHEN 'relatives' THEN
      SELECT COUNT(*) INTO v_count
      FROM pending_relatives
      WHERE invited_by = p_user_id AND status = 'accepted';
    WHEN 'photos' THEN
      SELECT COUNT(*) INTO v_count
      FROM photos
      WHERE uploaded_by = p_user_id AND status = 'approved';
    WHEN 'stories' THEN
      SELECT COUNT(*) INTO v_count
      FROM stories
      WHERE author_id = p_user_id AND status = 'approved';
    WHEN 'invites_sent' THEN
      SELECT COUNT(*) INTO v_count
      FROM pending_relatives
      WHERE invited_by = p_user_id;
    WHEN 'invites_accepted' THEN
      SELECT COUNT(*) INTO v_count
      FROM pending_relatives
      WHERE invited_by = p_user_id AND status = 'accepted';
    WHEN 'generations' THEN
      -- Complex calculation - simplified for now
      v_count := 0;
    ELSE
      v_count := 0;
  END CASE;

  -- Update progress
  INSERT INTO badge_progress (user_id, badge_id, current_value)
  VALUES (p_user_id, p_badge_id, v_count)
  ON CONFLICT (user_id, badge_id)
  DO UPDATE SET current_value = v_count, last_updated = now();

  -- Check if criteria met
  IF v_badge.criteria_type = 'count' AND v_count >= v_badge.criteria_value THEN
    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, p_badge_id)
    ON CONFLICT DO NOTHING;

    v_awarded := true;
  ELSIF v_badge.criteria_type = 'exists' AND v_count > 0 THEN
    -- Award for existence
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, p_badge_id)
    ON CONFLICT DO NOTHING;

    v_awarded := true;
  END IF;

  RETURN v_awarded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Award badge manually (admin or service)
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_badge_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT DO NOTHING
  RETURNING true INTO STRICT p_user_id;
  RETURN true;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get user's badge stats
CREATE OR REPLACE FUNCTION get_user_badge_stats(p_user_id UUID)
RETURNS TABLE (
  total_earned BIGINT,
  total_available BIGINT,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM user_badges WHERE user_id = p_user_id)::BIGINT,
    (SELECT COUNT(*) FROM badges WHERE is_active = true)::BIGINT,
    (
      SELECT jsonb_object_agg(
        category,
        jsonb_build_object(
          'earned', COALESCE(earned, 0),
          'total', total
        )
      )
      FROM (
        SELECT
          b.category,
          COUNT(b.id) as total,
          COUNT(ub.id) as earned
        FROM badges b
        LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = p_user_id
        WHERE b.is_active = true
        GROUP BY b.category
      ) cat_stats
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Check all badges for a user (call after major actions)
CREATE OR REPLACE FUNCTION check_all_badges_for_user(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_badge RECORD;
  v_awarded_count INTEGER := 0;
  v_awarded BOOLEAN;
BEGIN
  FOR v_badge IN SELECT id FROM badges WHERE is_active = true AND criteria_type != 'manual' LOOP
    SELECT check_and_award_badge(p_user_id, v_badge.id) INTO v_awarded;
    IF v_awarded THEN
      v_awarded_count := v_awarded_count + 1;
    END IF;
  END LOOP;

  RETURN v_awarded_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- PROMPT HELPER FUNCTIONS
-- ============================================

-- Increment prompt usage count
CREATE OR REPLACE FUNCTION increment_prompt_usage(p_prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE story_prompts
  SET usage_count = usage_count + 1
  WHERE id = p_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get prompts for a specific age (if known)
CREATE OR REPLACE FUNCTION get_prompts_for_age(p_age INTEGER, p_category TEXT DEFAULT NULL)
RETURNS SETOF story_prompts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM story_prompts
  WHERE is_active = true
    AND (p_category IS NULL OR category = p_category)
    AND (min_age IS NULL OR p_age >= min_age)
    AND (max_age IS NULL OR p_age <= max_age)
  ORDER BY sort_order, random();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

REVOKE EXECUTE ON FUNCTION check_and_award_badge(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_award_badge(UUID, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION award_badge(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION award_badge(UUID, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION check_all_badges_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_all_badges_for_user(UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION increment_prompt_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_prompt_usage(UUID) TO service_role;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE badges IS 'Badge definitions for gamification system';
COMMENT ON TABLE user_badges IS 'Badges earned by users';
COMMENT ON TABLE badge_progress IS 'Progress tracking for count-based badges';
COMMENT ON TABLE story_prompts IS 'Library of prompts to help capture family memories';
COMMENT ON TABLE assigned_prompts IS 'Prompts assigned between family members';
