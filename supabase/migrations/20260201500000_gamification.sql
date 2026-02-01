-- Migration: Research Gamification System
-- Adds streaks, challenges, points, and leaderboard functionality
-- Builds on existing badges system from 20260201000000_badges_and_prompts.sql

-- ============================================
-- USER STREAKS TABLE
-- ============================================

CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_type TEXT DEFAULT 'daily' CHECK (streak_type IN ('daily', 'weekly')),
  total_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  points_last_reset_at TIMESTAMPTZ DEFAULT now(),
  streak_frozen_until DATE, -- Optional: freeze streak for vacation
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Streak history for analytics
CREATE TABLE streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_length INTEGER NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE NOT NULL,
  streak_type TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- POINT TRANSACTIONS TABLE
-- ============================================

CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_id UUID, -- Reference to the action that earned points
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Point values configuration
CREATE TABLE point_values (
  action_type TEXT PRIMARY KEY,
  points INTEGER NOT NULL,
  description TEXT,
  description_ru TEXT,
  daily_limit INTEGER, -- Optional: limit points per day for this action
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- FAMILY CHALLENGES TABLE
-- ============================================

CREATE TABLE family_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ru TEXT,
  description TEXT,
  description_ru TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('photo_upload', 'story_write', 'invite_family', 'profile_complete', 'custom')),
  target_value INTEGER NOT NULL DEFAULT 1,
  reward_points INTEGER DEFAULT 50,
  reward_badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  family_scope TEXT DEFAULT 'all' CHECK (family_scope IN ('all', 'circle')), -- 'all' = global, 'circle' = family circle only
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User challenge participation
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES family_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- LEADERBOARD SETTINGS TABLE
-- ============================================

CREATE TABLE leaderboard_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_on_leaderboard BOOLEAN DEFAULT true,
  show_real_name BOOLEAN DEFAULT true,
  show_points BOOLEAN DEFAULT true,
  show_badges BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_user_streaks_last_activity ON user_streaks(last_activity_date DESC);
CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak DESC);
CREATE INDEX idx_user_streaks_total_points ON user_streaks(total_points DESC);
CREATE INDEX idx_user_streaks_weekly_points ON user_streaks(weekly_points DESC);

CREATE INDEX idx_streak_history_user ON streak_history(user_id);
CREATE INDEX idx_streak_history_ended ON streak_history(ended_at DESC);

CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_action ON point_transactions(action_type);

CREATE INDEX idx_family_challenges_active ON family_challenges(is_active, end_date) WHERE is_active = true;
CREATE INDEX idx_family_challenges_dates ON family_challenges(start_date, end_date);

CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_completed ON challenge_participants(completed_at) WHERE completed_at IS NOT NULL;

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_updated_at();

CREATE TRIGGER trigger_family_challenges_updated_at
  BEFORE UPDATE ON family_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_updated_at();

CREATE TRIGGER trigger_leaderboard_settings_updated_at
  BEFORE UPDATE ON leaderboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER STREAKS RLS
-- ============================================

-- Users can view their own streaks
CREATE POLICY "user_streaks_select_own" ON user_streaks
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can view family members' streaks (for leaderboard)
CREATE POLICY "user_streaks_select_family" ON user_streaks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leaderboard_settings ls
      WHERE ls.user_id = user_streaks.user_id
        AND ls.show_on_leaderboard = true
    )
    AND is_in_family_circle(user_id, auth.uid())
  );

-- Service role can manage streaks
CREATE POLICY "user_streaks_service_all" ON user_streaks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can insert their own streak record
CREATE POLICY "user_streaks_insert_own" ON user_streaks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own leaderboard preferences via update
CREATE POLICY "user_streaks_update_own" ON user_streaks
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- STREAK HISTORY RLS
-- ============================================

CREATE POLICY "streak_history_select_own" ON streak_history
  FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());

CREATE POLICY "streak_history_insert_service" ON streak_history
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- POINT TRANSACTIONS RLS
-- ============================================

CREATE POLICY "point_transactions_select_own" ON point_transactions
  FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());

CREATE POLICY "point_transactions_insert_service" ON point_transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- POINT VALUES RLS
-- ============================================

CREATE POLICY "point_values_select_all" ON point_values
  FOR SELECT
  USING (is_active = true OR current_user_is_admin());

CREATE POLICY "point_values_admin_all" ON point_values
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- ============================================
-- FAMILY CHALLENGES RLS
-- ============================================

-- Everyone can view active challenges
CREATE POLICY "challenges_select_active" ON family_challenges
  FOR SELECT
  USING (
    is_active = true
    OR created_by = auth.uid()
    OR current_user_is_admin()
  );

-- Users can create challenges for their family
CREATE POLICY "challenges_insert_own" ON family_challenges
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Creators and admins can update challenges
CREATE POLICY "challenges_update_own" ON family_challenges
  FOR UPDATE
  USING (created_by = auth.uid() OR current_user_is_admin())
  WITH CHECK (created_by = auth.uid() OR current_user_is_admin());

-- ============================================
-- CHALLENGE PARTICIPANTS RLS
-- ============================================

-- Users can view their own participation
CREATE POLICY "participants_select_own" ON challenge_participants
  FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());

-- Users can view all participants in challenges they're in (for leaderboard)
CREATE POLICY "participants_select_challenge" ON challenge_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenge_participants.challenge_id
        AND cp.user_id = auth.uid()
    )
  );

-- Users can join challenges
CREATE POLICY "participants_insert_own" ON challenge_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Service role can update progress
CREATE POLICY "participants_update_service" ON challenge_participants
  FOR UPDATE
  USING (auth.role() = 'service_role' OR user_id = auth.uid())
  WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

-- ============================================
-- LEADERBOARD SETTINGS RLS
-- ============================================

CREATE POLICY "leaderboard_settings_select_own" ON leaderboard_settings
  FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());

CREATE POLICY "leaderboard_settings_insert_own" ON leaderboard_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leaderboard_settings_update_own" ON leaderboard_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- GAMIFICATION FUNCTIONS
-- ============================================

-- Record activity and update streak
CREATE OR REPLACE FUNCTION record_user_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_action_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  points_earned INTEGER,
  new_streak INTEGER,
  streak_increased BOOLEAN,
  badges_earned UUID[]
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_points INTEGER := 0;
  v_point_config RECORD;
  v_streak RECORD;
  v_daily_count INTEGER;
  v_streak_increased BOOLEAN := false;
  v_new_streak INTEGER := 0;
  v_badges_earned UUID[] := ARRAY[]::UUID[];
  v_badge_count INTEGER;
BEGIN
  -- Get point value for action
  SELECT * INTO v_point_config
  FROM point_values
  WHERE action_type = p_action_type AND is_active = true;

  IF FOUND THEN
    -- Check daily limit if set
    IF v_point_config.daily_limit IS NOT NULL THEN
      SELECT COUNT(*) INTO v_daily_count
      FROM point_transactions
      WHERE user_id = p_user_id
        AND action_type = p_action_type
        AND created_at::DATE = v_today;

      IF v_daily_count >= v_point_config.daily_limit THEN
        v_points := 0; -- Daily limit reached
      ELSE
        v_points := v_point_config.points;
      END IF;
    ELSE
      v_points := v_point_config.points;
    END IF;
  END IF;

  -- Record point transaction if points earned
  IF v_points > 0 THEN
    INSERT INTO point_transactions (user_id, points, action_type, action_id, description)
    VALUES (p_user_id, v_points, p_action_type, p_action_id, p_description);
  END IF;

  -- Get or create streak record
  SELECT * INTO v_streak
  FROM user_streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_points)
    VALUES (p_user_id, 1, 1, v_today, v_points)
    RETURNING * INTO v_streak;
    v_streak_increased := true;
    v_new_streak := 1;
  ELSE
    -- Update existing streak
    IF v_streak.last_activity_date IS NULL THEN
      -- First activity ever
      v_new_streak := 1;
      v_streak_increased := true;
    ELSIF v_streak.last_activity_date = v_today THEN
      -- Already active today, just add points
      v_new_streak := v_streak.current_streak;
    ELSIF v_streak.last_activity_date = v_today - INTERVAL '1 day' THEN
      -- Consecutive day!
      v_new_streak := v_streak.current_streak + 1;
      v_streak_increased := true;
    ELSIF v_streak.streak_frozen_until IS NOT NULL AND v_streak.streak_frozen_until >= v_today THEN
      -- Streak is frozen, maintain current
      v_new_streak := v_streak.current_streak;
    ELSE
      -- Streak broken, record history and start new
      IF v_streak.current_streak > 1 THEN
        INSERT INTO streak_history (user_id, streak_length, started_at, ended_at)
        VALUES (
          p_user_id,
          v_streak.current_streak,
          v_streak.last_activity_date - (v_streak.current_streak - 1) * INTERVAL '1 day',
          v_streak.last_activity_date
        );
      END IF;
      v_new_streak := 1;
      v_streak_increased := true;
    END IF;

    -- Update streak record
    UPDATE user_streaks
    SET
      current_streak = v_new_streak,
      longest_streak = GREATEST(longest_streak, v_new_streak),
      last_activity_date = v_today,
      total_points = total_points + v_points,
      weekly_points = CASE
        WHEN points_last_reset_at < date_trunc('week', now())
        THEN v_points
        ELSE weekly_points + v_points
      END,
      monthly_points = CASE
        WHEN points_last_reset_at < date_trunc('month', now())
        THEN v_points
        ELSE monthly_points + v_points
      END,
      points_last_reset_at = CASE
        WHEN points_last_reset_at < date_trunc('week', now())
        THEN now()
        ELSE points_last_reset_at
      END
    WHERE user_id = p_user_id;
  END IF;

  -- Check for streak-based badges
  IF v_new_streak = 7 THEN
    -- Award "Dedicated" badge for 7-day streak
    SELECT check_all_badges_for_user(p_user_id) INTO v_badge_count;
  ELSIF v_new_streak = 30 THEN
    -- Award "Committed" badge for 30-day streak
    SELECT check_all_badges_for_user(p_user_id) INTO v_badge_count;
  END IF;

  -- Update challenge progress
  UPDATE challenge_participants cp
  SET current_progress = current_progress + 1
  FROM family_challenges fc
  WHERE cp.user_id = p_user_id
    AND cp.challenge_id = fc.id
    AND fc.is_active = true
    AND fc.start_date <= now()
    AND fc.end_date >= now()
    AND fc.challenge_type = p_action_type
    AND cp.completed_at IS NULL;

  -- Mark completed challenges
  UPDATE challenge_participants cp
  SET completed_at = now()
  FROM family_challenges fc
  WHERE cp.user_id = p_user_id
    AND cp.challenge_id = fc.id
    AND cp.current_progress >= fc.target_value
    AND cp.completed_at IS NULL;

  RETURN QUERY SELECT v_points, v_new_streak, v_streak_increased, v_badges_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get family leaderboard
CREATE OR REPLACE FUNCTION get_family_leaderboard(
  p_user_id UUID,
  p_period TEXT DEFAULT 'all', -- 'all', 'weekly', 'monthly'
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  points INTEGER,
  current_streak INTEGER,
  badge_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH family_members AS (
    SELECT profile_id as member_id
    FROM get_family_circle_profile_ids(p_user_id)
  ),
  leaderboard_data AS (
    SELECT
      us.user_id,
      COALESCE(
        CASE WHEN ls.show_real_name THEN up.first_name || ' ' || COALESCE(up.last_name, '') END,
        'Anonymous'
      ) as display_name,
      up.avatar_url,
      CASE p_period
        WHEN 'weekly' THEN us.weekly_points
        WHEN 'monthly' THEN us.monthly_points
        ELSE us.total_points
      END as points,
      us.current_streak,
      (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = us.user_id) as badge_count
    FROM user_streaks us
    INNER JOIN family_members fm ON fm.member_id = us.user_id
    INNER JOIN user_profiles up ON up.id = us.user_id
    LEFT JOIN leaderboard_settings ls ON ls.user_id = us.user_id
    WHERE COALESCE(ls.show_on_leaderboard, true) = true
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY ld.points DESC, ld.current_streak DESC) as rank,
    ld.user_id,
    ld.display_name,
    ld.avatar_url,
    ld.points,
    ld.current_streak,
    ld.badge_count
  FROM leaderboard_data ld
  ORDER BY ld.points DESC, ld.current_streak DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Get user gamification stats
CREATE OR REPLACE FUNCTION get_user_gamification_stats(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  total_points INTEGER,
  weekly_points INTEGER,
  monthly_points INTEGER,
  rank_in_family BIGINT,
  total_family_members BIGINT,
  badges_earned BIGINT,
  challenges_completed BIGINT,
  active_challenges BIGINT
) AS $$
DECLARE
  v_streak RECORD;
  v_rank BIGINT;
  v_family_count BIGINT;
BEGIN
  -- Get streak data
  SELECT * INTO v_streak
  FROM user_streaks
  WHERE user_id = p_user_id;

  -- Get family rank
  WITH ranked AS (
    SELECT
      us.user_id,
      ROW_NUMBER() OVER (ORDER BY us.total_points DESC) as rn
    FROM user_streaks us
    WHERE us.user_id IN (
      SELECT profile_id FROM get_family_circle_profile_ids(p_user_id)
    )
  )
  SELECT rn INTO v_rank FROM ranked WHERE user_id = p_user_id;

  -- Get family count
  SELECT COUNT(*) INTO v_family_count
  FROM get_family_circle_profile_ids(p_user_id);

  RETURN QUERY
  SELECT
    COALESCE(v_streak.current_streak, 0),
    COALESCE(v_streak.longest_streak, 0),
    COALESCE(v_streak.total_points, 0),
    COALESCE(v_streak.weekly_points, 0),
    COALESCE(v_streak.monthly_points, 0),
    COALESCE(v_rank, 0),
    COALESCE(v_family_count, 0),
    (SELECT COUNT(*) FROM user_badges WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM challenge_participants WHERE user_id = p_user_id AND completed_at IS NOT NULL),
    (
      SELECT COUNT(*)
      FROM challenge_participants cp
      JOIN family_challenges fc ON fc.id = cp.challenge_id
      WHERE cp.user_id = p_user_id
        AND cp.completed_at IS NULL
        AND fc.is_active = true
        AND fc.end_date >= now()
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Get active challenges for user
CREATE OR REPLACE FUNCTION get_active_challenges(p_user_id UUID)
RETURNS TABLE (
  challenge_id UUID,
  title TEXT,
  title_ru TEXT,
  description TEXT,
  description_ru TEXT,
  challenge_type TEXT,
  target_value INTEGER,
  current_progress INTEGER,
  reward_points INTEGER,
  reward_badge_id UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  days_remaining INTEGER,
  is_joined BOOLEAN,
  is_completed BOOLEAN,
  participant_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id as challenge_id,
    fc.title,
    fc.title_ru,
    fc.description,
    fc.description_ru,
    fc.challenge_type,
    fc.target_value,
    COALESCE(cp.current_progress, 0) as current_progress,
    fc.reward_points,
    fc.reward_badge_id,
    fc.start_date,
    fc.end_date,
    EXTRACT(DAY FROM fc.end_date - now())::INTEGER as days_remaining,
    cp.user_id IS NOT NULL as is_joined,
    cp.completed_at IS NOT NULL as is_completed,
    (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = fc.id) as participant_count
  FROM family_challenges fc
  LEFT JOIN challenge_participants cp ON cp.challenge_id = fc.id AND cp.user_id = p_user_id
  WHERE fc.is_active = true
    AND fc.start_date <= now()
    AND fc.end_date >= now()
  ORDER BY fc.end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

REVOKE EXECUTE ON FUNCTION record_user_activity(UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_user_activity(UUID, TEXT, UUID, TEXT) TO service_role;

-- Public functions
GRANT EXECUTE ON FUNCTION get_family_leaderboard(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_gamification_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_challenges(UUID) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_streaks IS 'Tracks user activity streaks and total points for gamification';
COMMENT ON TABLE streak_history IS 'Historical record of completed streaks';
COMMENT ON TABLE point_transactions IS 'Log of all point-earning activities';
COMMENT ON TABLE point_values IS 'Configuration for points awarded per action type';
COMMENT ON TABLE family_challenges IS 'Family-wide challenges and goals';
COMMENT ON TABLE challenge_participants IS 'User participation in family challenges';
COMMENT ON TABLE leaderboard_settings IS 'Privacy settings for leaderboard visibility';

COMMENT ON FUNCTION record_user_activity IS 'Records user activity, updates streaks, awards points, and checks badges';
COMMENT ON FUNCTION get_family_leaderboard IS 'Returns ranked leaderboard of family members by points';
COMMENT ON FUNCTION get_user_gamification_stats IS 'Returns comprehensive gamification stats for a user';
COMMENT ON FUNCTION get_active_challenges IS 'Returns list of active challenges with user progress';
