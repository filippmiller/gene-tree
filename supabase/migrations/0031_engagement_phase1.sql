-- Migration 0031: Engagement Phase 1
-- Reactions, Comments, and Activity Events

-- ============================================
-- ENUM TYPES
-- ============================================

-- Reaction types (emoji-based)
CREATE TYPE reaction_type AS ENUM ('heart', 'sad', 'hug', 'laugh', 'pray');

-- ============================================
-- REACTIONS TABLE
-- ============================================

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('story', 'photo', 'comment')),
  target_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(target_type, target_id, profile_id)
);

-- Indexes for reactions
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_profile ON reactions(profile_id);
CREATE INDEX idx_reactions_created ON reactions(created_at DESC);

-- ============================================
-- STORY COMMENTS TABLE
-- ============================================

CREATE TABLE story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  mentioned_profile_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for comments
CREATE INDEX idx_story_comments_story ON story_comments(story_id);
CREATE INDEX idx_story_comments_author ON story_comments(author_id);
CREATE INDEX idx_story_comments_parent ON story_comments(parent_id);
CREATE INDEX idx_story_comments_created ON story_comments(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_story_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_story_comments_updated_at
  BEFORE UPDATE ON story_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_story_comments_updated_at();

-- ============================================
-- ACTIVITY EVENTS TABLE
-- ============================================

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  display_data JSONB DEFAULT '{}',
  visibility TEXT DEFAULT 'family' CHECK (visibility IN ('public', 'family', 'private', 'unlisted')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for activity events
CREATE INDEX idx_activity_events_actor ON activity_events(actor_id);
CREATE INDEX idx_activity_events_created ON activity_events(created_at DESC);
CREATE INDEX idx_activity_events_subject ON activity_events(subject_type, subject_id);
CREATE INDEX idx_activity_events_visibility ON activity_events(visibility);

-- ============================================
-- ACCESS HELPER FUNCTIONS
-- ============================================

-- Check if a user can view a story (mirrors stories RLS)
CREATE OR REPLACE FUNCTION can_view_story(
  p_story_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.stories s
    WHERE s.id = p_story_id
      AND (
        current_user_is_admin()
        OR s.author_id = p_user_id
        OR s.subject_id = p_user_id
        OR (
          s.status = 'approved'
          AND (
            s.visibility IN ('public', 'unlisted')
            OR (s.visibility = 'family' AND is_in_family_circle(s.subject_id, p_user_id))
          )
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Check if a user can view a photo (mirrors photos RLS)
CREATE OR REPLACE FUNCTION can_view_photo(
  p_photo_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = p_photo_id
      AND (
        current_user_is_admin()
        OR p.uploaded_by = p_user_id
        OR is_profile_owner(p.target_profile_id, p_user_id)
        OR (p.status = 'approved' AND p.visibility = 'public')
        OR (p.status = 'approved' AND p.visibility = 'family' AND is_in_family_circle(p.target_profile_id, p_user_id))
        OR (p.status = 'approved' AND p.visibility = 'unlisted')
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Check if a user can view a story comment (via its story)
CREATE OR REPLACE FUNCTION can_view_story_comment(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.story_comments sc
    WHERE sc.id = p_comment_id
      AND can_view_story(sc.story_id, p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REACTIONS RLS POLICIES
-- ============================================

-- Users can view reactions on content they can see
CREATE POLICY "reactions_select_accessible" ON reactions
  FOR SELECT
  USING (
    (target_type = 'story' AND can_view_story(target_id, auth.uid()))
    OR (target_type = 'photo' AND can_view_photo(target_id, auth.uid()))
    OR (target_type = 'comment' AND can_view_story_comment(target_id, auth.uid()))
  );

-- Users can insert their own reactions
CREATE POLICY "reactions_insert_own" ON reactions
  FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND (
      (target_type = 'story' AND can_view_story(target_id, auth.uid()))
      OR (target_type = 'photo' AND can_view_photo(target_id, auth.uid()))
      OR (target_type = 'comment' AND can_view_story_comment(target_id, auth.uid()))
    )
  );

-- Users can update their own reactions
CREATE POLICY "reactions_update_own" ON reactions
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    AND (
      (target_type = 'story' AND can_view_story(target_id, auth.uid()))
      OR (target_type = 'photo' AND can_view_photo(target_id, auth.uid()))
      OR (target_type = 'comment' AND can_view_story_comment(target_id, auth.uid()))
    )
  )
  WITH CHECK (
    profile_id = auth.uid()
    AND (
      (target_type = 'story' AND can_view_story(target_id, auth.uid()))
      OR (target_type = 'photo' AND can_view_photo(target_id, auth.uid()))
      OR (target_type = 'comment' AND can_view_story_comment(target_id, auth.uid()))
    )
  );

-- Users can delete their own reactions
CREATE POLICY "reactions_delete_own" ON reactions
  FOR DELETE
  USING (
    profile_id = auth.uid()
    AND (
      (target_type = 'story' AND can_view_story(target_id, auth.uid()))
      OR (target_type = 'photo' AND can_view_photo(target_id, auth.uid()))
      OR (target_type = 'comment' AND can_view_story_comment(target_id, auth.uid()))
    )
  );

-- ============================================
-- STORY COMMENTS RLS POLICIES
-- ============================================

-- Users can view comments on stories they can view
CREATE POLICY "story_comments_select_story_access" ON story_comments
  FOR SELECT
  USING (can_view_story(story_id, auth.uid()));

-- Users can insert their own comments
CREATE POLICY "story_comments_insert_own" ON story_comments
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND can_view_story(story_id, auth.uid())
  );

-- Users can update their own comments
CREATE POLICY "story_comments_update_own" ON story_comments
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND can_view_story(story_id, auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid()
    AND can_view_story(story_id, auth.uid())
  );

-- Users can delete their own comments
CREATE POLICY "story_comments_delete_own" ON story_comments
  FOR DELETE
  USING (
    author_id = auth.uid()
    AND can_view_story(story_id, auth.uid())
  );

-- ============================================
-- ACTIVITY EVENTS RLS POLICIES
-- ============================================

-- Users can view activity from their family circle
CREATE POLICY "activity_events_select_family" ON activity_events
  FOR SELECT
  USING (
    visibility = 'public'
    OR actor_id = auth.uid()
    OR (
      visibility IN ('family', 'unlisted')
      AND actor_id IN (
        SELECT profile_id FROM get_family_circle_profile_ids(auth.uid())
      )
    )
  );

-- Only server/service role inserts activity events (via API)
CREATE POLICY "activity_events_insert_service" ON activity_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get reaction counts for a target
CREATE OR REPLACE FUNCTION get_reaction_counts(
  p_target_type TEXT,
  p_target_id UUID
)
RETURNS TABLE (
  reaction_type reaction_type,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.reaction_type, COUNT(*)::BIGINT
  FROM reactions r
  WHERE r.target_type = p_target_type
    AND r.target_id = p_target_id
  GROUP BY r.reaction_type;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Function to check if user has reacted
CREATE OR REPLACE FUNCTION get_user_reaction(
  p_target_type TEXT,
  p_target_id UUID,
  p_profile_id UUID
)
RETURNS reaction_type AS $$
DECLARE
  v_reaction reaction_type;
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF auth.role() IS DISTINCT FROM 'service_role' AND p_profile_id <> auth.uid() THEN
    RETURN NULL;
  END IF;

  SELECT r.reaction_type INTO v_reaction
  FROM reactions r
  WHERE r.target_type = p_target_type
    AND r.target_id = p_target_id
    AND r.profile_id = p_profile_id;
  RETURN v_reaction;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Function to record activity event
CREATE OR REPLACE FUNCTION record_activity_event(
  p_event_type TEXT,
  p_actor_id UUID,
  p_subject_type TEXT,
  p_subject_id UUID,
  p_display_data JSONB DEFAULT '{}',
  p_visibility TEXT DEFAULT 'family'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.activity_events (event_type, actor_id, subject_type, subject_id, display_data, visibility)
  VALUES (p_event_type, p_actor_id, p_subject_type, p_subject_id, p_display_data, p_visibility)
  RETURNING id INTO v_event_id;
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION record_activity_event(
  TEXT,
  UUID,
  TEXT,
  UUID,
  JSONB,
  TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION record_activity_event(
  TEXT,
  UUID,
  TEXT,
  UUID,
  JSONB,
  TEXT
) TO service_role;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE reactions IS 'User reactions (emoji) on stories, photos, and comments';
COMMENT ON TABLE story_comments IS 'Threaded comments on stories with @mention support';
COMMENT ON TABLE activity_events IS 'Activity feed events for family engagement tracking';
