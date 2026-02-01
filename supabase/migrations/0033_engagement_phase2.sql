-- Migration 0033: Engagement Phase 2
-- This Day Events, Photo Tags, Email Preferences

-- ============================================
-- DAILY EVENTS CACHE TABLE
-- ============================================

-- Stores pre-computed "this day" events for quick lookup
CREATE TABLE daily_events_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'anniversary', 'death_commemoration')),
  event_month INTEGER NOT NULL CHECK (event_month BETWEEN 1 AND 12),
  event_day INTEGER NOT NULL CHECK (event_day BETWEEN 1 AND 31),
  display_title TEXT NOT NULL,
  related_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  years_ago INTEGER, -- How many years since the event (null for recurring without year)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, event_type, related_profile_id)
);

-- Indexes for efficient date lookups
CREATE INDEX idx_daily_events_date ON daily_events_cache(event_month, event_day);
CREATE INDEX idx_daily_events_profile ON daily_events_cache(profile_id);
CREATE INDEX idx_daily_events_related ON daily_events_cache(related_profile_id);

-- ============================================
-- PHOTO TAGS TABLE
-- ============================================

-- Face/person tags on photos
CREATE TABLE photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tagged_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  x_percent NUMERIC(5,2) NOT NULL CHECK (x_percent BETWEEN 0 AND 100),
  y_percent NUMERIC(5,2) NOT NULL CHECK (y_percent BETWEEN 0 AND 100),
  width_percent NUMERIC(5,2) DEFAULT 10 CHECK (width_percent BETWEEN 1 AND 100),
  height_percent NUMERIC(5,2) DEFAULT 10 CHECK (height_percent BETWEEN 1 AND 100),
  tagged_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(photo_id, tagged_profile_id)
);

-- Indexes for photo tags
CREATE INDEX idx_photo_tags_photo ON photo_tags(photo_id);
CREATE INDEX idx_photo_tags_tagged ON photo_tags(tagged_profile_id);
CREATE INDEX idx_photo_tags_tagger ON photo_tags(tagged_by);
CREATE INDEX idx_photo_tags_confirmed ON photo_tags(is_confirmed);

-- ============================================
-- EMAIL PREFERENCES COLUMN
-- ============================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "weekly_digest": false,
  "birthday_reminders": true,
  "anniversary_reminders": true,
  "death_commemorations": false,
  "photo_tag_notifications": true,
  "digest_day": "sunday"
}'::jsonb;

-- ============================================
-- TRIGGER FOR DAILY EVENTS CACHE
-- ============================================

-- Function to refresh daily events cache for a profile
CREATE OR REPLACE FUNCTION refresh_daily_events_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing events for this profile
  DELETE FROM daily_events_cache WHERE profile_id = COALESCE(NEW.id, OLD.id);

  -- If profile still exists, insert new events
  IF NEW IS NOT NULL THEN
    -- Birthday event
    IF NEW.birth_date IS NOT NULL THEN
      INSERT INTO daily_events_cache (
        profile_id, event_type, event_month, event_day, display_title, years_ago
      ) VALUES (
        NEW.id,
        'birthday',
        EXTRACT(MONTH FROM NEW.birth_date)::INTEGER,
        EXTRACT(DAY FROM NEW.birth_date)::INTEGER,
        COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || '''s Birthday',
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - EXTRACT(YEAR FROM NEW.birth_date)::INTEGER
      );
    END IF;

    -- Death commemoration event (for deceased profiles)
    IF NEW.death_date IS NOT NULL AND NEW.is_living = false THEN
      INSERT INTO daily_events_cache (
        profile_id, event_type, event_month, event_day, display_title, years_ago
      ) VALUES (
        NEW.id,
        'death_commemoration',
        EXTRACT(MONTH FROM NEW.death_date)::INTEGER,
        EXTRACT(DAY FROM NEW.death_date)::INTEGER,
        'Remembering ' || COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - EXTRACT(YEAR FROM NEW.death_date)::INTEGER
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_profiles changes
DROP TRIGGER IF EXISTS trigger_refresh_daily_events ON user_profiles;
CREATE TRIGGER trigger_refresh_daily_events
  AFTER INSERT OR UPDATE OF birth_date, death_date, is_living, first_name, last_name OR DELETE
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION refresh_daily_events_cache();

-- ============================================
-- ANNIVERSARY EVENTS FROM RELATIONSHIPS
-- ============================================

-- Function to refresh anniversary events when spouse relationships change
CREATE OR REPLACE FUNCTION refresh_anniversary_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process spouse relationships with marriage dates
  IF (NEW IS NOT NULL AND NEW.relationship_type = 'spouse' AND NEW.marriage_date IS NOT NULL)
     OR (OLD IS NOT NULL AND OLD.relationship_type = 'spouse') THEN

    -- Delete existing anniversary events for these profiles
    DELETE FROM daily_events_cache
    WHERE event_type = 'anniversary'
      AND (profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
           OR profile_id = COALESCE(NEW.related_profile_id, OLD.related_profile_id));

    -- Insert new anniversary event if relationship exists
    IF NEW IS NOT NULL AND NEW.relationship_type = 'spouse' AND NEW.marriage_date IS NOT NULL THEN
      -- Get names for the anniversary title
      INSERT INTO daily_events_cache (
        profile_id, event_type, event_month, event_day, display_title, related_profile_id, years_ago
      )
      SELECT
        NEW.profile_id,
        'anniversary',
        EXTRACT(MONTH FROM NEW.marriage_date)::INTEGER,
        EXTRACT(DAY FROM NEW.marriage_date)::INTEGER,
        p1.first_name || ' & ' || p2.first_name || '''s Anniversary',
        NEW.related_profile_id,
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - EXTRACT(YEAR FROM NEW.marriage_date)::INTEGER
      FROM user_profiles p1, user_profiles p2
      WHERE p1.id = NEW.profile_id AND p2.id = NEW.related_profile_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on relationships changes (for spouse anniversaries)
DROP TRIGGER IF EXISTS trigger_refresh_anniversary ON relationships;
CREATE TRIGGER trigger_refresh_anniversary
  AFTER INSERT OR UPDATE OF relationship_type, marriage_date OR DELETE
  ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION refresh_anniversary_events();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE daily_events_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DAILY EVENTS CACHE RLS POLICIES
-- ============================================

-- Users can view events for profiles in their family circle
CREATE POLICY "daily_events_select_family" ON daily_events_cache
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR is_in_family_circle(profile_id, auth.uid())
  );

-- Service role can manage cache (for background jobs)
CREATE POLICY "daily_events_service_all" ON daily_events_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- PHOTO TAGS RLS POLICIES
-- ============================================

-- Users can view tags on photos they can see
CREATE POLICY "photo_tags_select_photo_access" ON photo_tags
  FOR SELECT
  USING (can_view_photo(photo_id, auth.uid()));

-- Users can tag in photos they can see
CREATE POLICY "photo_tags_insert_photo_access" ON photo_tags
  FOR INSERT
  WITH CHECK (
    tagged_by = auth.uid()
    AND can_view_photo(photo_id, auth.uid())
  );

-- Tagged person can confirm their own tag
CREATE POLICY "photo_tags_update_confirm" ON photo_tags
  FOR UPDATE
  USING (tagged_profile_id = auth.uid())
  WITH CHECK (tagged_profile_id = auth.uid());

-- Tagger can delete their tags, or tagged person can remove themselves
CREATE POLICY "photo_tags_delete_own" ON photo_tags
  FOR DELETE
  USING (
    tagged_by = auth.uid()
    OR tagged_profile_id = auth.uid()
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get today's events for a user's family circle
CREATE OR REPLACE FUNCTION get_this_day_events(
  p_user_id UUID,
  p_month INTEGER DEFAULT NULL,
  p_day INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  event_type TEXT,
  event_month INTEGER,
  event_day INTEGER,
  display_title TEXT,
  related_profile_id UUID,
  years_ago INTEGER,
  profile_first_name TEXT,
  profile_last_name TEXT,
  profile_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dec.id,
    dec.profile_id,
    dec.event_type,
    dec.event_month,
    dec.event_day,
    dec.display_title,
    dec.related_profile_id,
    dec.years_ago,
    up.first_name,
    up.last_name,
    up.avatar_url
  FROM daily_events_cache dec
  JOIN user_profiles up ON dec.profile_id = up.id
  WHERE dec.event_month = COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER)
    AND dec.event_day = COALESCE(p_day, EXTRACT(DAY FROM CURRENT_DATE)::INTEGER)
    AND (dec.profile_id = p_user_id OR is_in_family_circle(dec.profile_id, p_user_id))
  ORDER BY
    CASE dec.event_type
      WHEN 'birthday' THEN 1
      WHEN 'anniversary' THEN 2
      WHEN 'death_commemoration' THEN 3
    END,
    dec.display_title;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- ============================================
-- BACKFILL DAILY EVENTS CACHE
-- ============================================

-- Populate cache for existing profiles (birthdays and death commemorations)
INSERT INTO daily_events_cache (profile_id, event_type, event_month, event_day, display_title, years_ago)
SELECT
  id,
  'birthday',
  EXTRACT(MONTH FROM birth_date)::INTEGER,
  EXTRACT(DAY FROM birth_date)::INTEGER,
  first_name || ' ' || last_name || '''s Birthday',
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - EXTRACT(YEAR FROM birth_date)::INTEGER
FROM user_profiles
WHERE birth_date IS NOT NULL
ON CONFLICT (profile_id, event_type, related_profile_id) DO NOTHING;

INSERT INTO daily_events_cache (profile_id, event_type, event_month, event_day, display_title, years_ago)
SELECT
  id,
  'death_commemoration',
  EXTRACT(MONTH FROM death_date)::INTEGER,
  EXTRACT(DAY FROM death_date)::INTEGER,
  'Remembering ' || first_name || ' ' || last_name,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - EXTRACT(YEAR FROM death_date)::INTEGER
FROM user_profiles
WHERE death_date IS NOT NULL AND is_living = false
ON CONFLICT (profile_id, event_type, related_profile_id) DO NOTHING;

-- Populate anniversary events from existing spouse relationships
INSERT INTO daily_events_cache (profile_id, event_type, event_month, event_day, display_title, related_profile_id, years_ago)
SELECT
  r.user1_id,
  'anniversary',
  EXTRACT(MONTH FROM r.marriage_date)::INTEGER,
  EXTRACT(DAY FROM r.marriage_date)::INTEGER,
  p1.first_name || ' & ' || p2.first_name || '''s Anniversary',
  r.user2_id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - EXTRACT(YEAR FROM r.marriage_date)::INTEGER
FROM relationships r
JOIN user_profiles p1 ON r.user1_id = p1.id
JOIN user_profiles p2 ON r.user2_id = p2.id
WHERE r.relationship_type = 'spouse' AND r.marriage_date IS NOT NULL
ON CONFLICT (profile_id, event_type, related_profile_id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE daily_events_cache IS 'Pre-computed daily events (birthdays, anniversaries, commemorations) for This Day feature';
COMMENT ON TABLE photo_tags IS 'Face/person tags on photos with coordinates';
COMMENT ON COLUMN user_profiles.email_preferences IS 'User email notification preferences for digests and reminders';
