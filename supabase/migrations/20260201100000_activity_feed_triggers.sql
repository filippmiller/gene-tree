-- ============================================================================
-- Migration: Activity Feed Triggers
-- Automatically logs activities when photos, stories, or relationships change
-- ============================================================================

-- ============================================================================
-- 1. ENABLE REALTIME FOR ACTIVITY_EVENTS
-- ============================================================================

-- Enable realtime for the activity_events table
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;

-- ============================================================================
-- 2. TRIGGER FUNCTIONS
-- ============================================================================

-- Function to log photo activity
CREATE OR REPLACE FUNCTION log_photo_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_display_data JSONB;
  v_uploader_name TEXT;
  v_target_name TEXT;
BEGIN
  -- Only log approved photos (or when status changes to approved)
  IF NEW.status = 'approved' THEN
    -- Get uploader name
    SELECT CONCAT(first_name, ' ', last_name) INTO v_uploader_name
    FROM public.user_profiles
    WHERE id = NEW.uploaded_by;

    -- Get target profile name if available
    IF NEW.target_profile_id IS NOT NULL THEN
      SELECT CONCAT(first_name, ' ', last_name) INTO v_target_name
      FROM public.user_profiles
      WHERE id = NEW.target_profile_id;
    END IF;

    -- Build display data
    v_display_data := jsonb_build_object(
      'actor_name', v_uploader_name,
      'subject_title', COALESCE(NEW.caption, 'a photo'),
      'related_profile_name', v_target_name,
      'media_type', NEW.type::TEXT
    );

    -- Insert activity event (only on INSERT or when status changes to approved)
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'approved') THEN
      INSERT INTO public.activity_events (
        event_type,
        actor_id,
        subject_type,
        subject_id,
        display_data,
        visibility
      ) VALUES (
        'photo_added',
        NEW.uploaded_by,
        'photo',
        NEW.id,
        v_display_data,
        NEW.visibility::TEXT
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log story activity
CREATE OR REPLACE FUNCTION log_story_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_display_data JSONB;
  v_author_name TEXT;
  v_subject_name TEXT;
BEGIN
  -- Get author name
  SELECT CONCAT(first_name, ' ', last_name) INTO v_author_name
  FROM public.user_profiles
  WHERE id = NEW.author_id;

  -- Get subject name
  SELECT CONCAT(first_name, ' ', last_name) INTO v_subject_name
  FROM public.user_profiles
  WHERE id = NEW.subject_id;

  -- Build display data
  v_display_data := jsonb_build_object(
    'actor_name', v_author_name,
    'subject_title', COALESCE(NEW.title, 'a story'),
    'subject_preview', LEFT(COALESCE(NEW.content, ''), 100),
    'related_profile_name', v_subject_name,
    'media_type', NEW.media_type::TEXT
  );

  -- Log on INSERT (story created)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_events (
      event_type,
      actor_id,
      subject_type,
      subject_id,
      display_data,
      visibility
    ) VALUES (
      'story_created',
      NEW.author_id,
      'story',
      NEW.id,
      v_display_data,
      NEW.visibility::TEXT
    );
  END IF;

  -- Log when story is approved (status change)
  IF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    -- Update display data for approval event
    v_display_data := jsonb_build_object(
      'actor_name', v_author_name,
      'subject_title', COALESCE(NEW.title, 'a story'),
      'subject_preview', LEFT(COALESCE(NEW.content, ''), 100),
      'related_profile_name', v_subject_name
    );

    INSERT INTO public.activity_events (
      event_type,
      actor_id,
      subject_type,
      subject_id,
      display_data,
      visibility
    ) VALUES (
      'STORY_APPROVED',
      NEW.author_id,
      'story',
      NEW.id,
      v_display_data,
      NEW.visibility::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log relationship/relative activity
CREATE OR REPLACE FUNCTION log_relative_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_display_data JSONB;
  v_inviter_name TEXT;
  v_relative_name TEXT;
BEGIN
  -- Get inviter name
  SELECT CONCAT(first_name, ' ', last_name) INTO v_inviter_name
  FROM public.user_profiles
  WHERE id = NEW.invited_by;

  -- Build display data with relative info
  v_display_data := jsonb_build_object(
    'actor_name', v_inviter_name,
    'related_profile_name', CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')),
    'relationship_type', NEW.relationship_type
  );

  -- Log on INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_events (
      event_type,
      actor_id,
      subject_type,
      subject_id,
      display_data,
      visibility
    ) VALUES (
      'relative_added',
      NEW.invited_by,
      'profile',
      NEW.id,
      v_display_data,
      'family'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log comment activity
CREATE OR REPLACE FUNCTION log_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_display_data JSONB;
  v_author_name TEXT;
  v_story_title TEXT;
BEGIN
  -- Get comment author name
  SELECT CONCAT(first_name, ' ', last_name) INTO v_author_name
  FROM public.user_profiles
  WHERE id = NEW.author_id;

  -- Get story title
  SELECT COALESCE(title, 'a story') INTO v_story_title
  FROM public.stories
  WHERE id = NEW.story_id;

  -- Build display data
  v_display_data := jsonb_build_object(
    'actor_name', v_author_name,
    'subject_title', v_story_title,
    'comment_preview', LEFT(NEW.content, 100)
  );

  -- Log on INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_events (
      event_type,
      actor_id,
      subject_type,
      subject_id,
      display_data,
      visibility
    ) VALUES (
      'comment_added',
      NEW.author_id,
      'comment',
      NEW.id,
      v_display_data,
      'family'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log reaction activity
CREATE OR REPLACE FUNCTION log_reaction_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_display_data JSONB;
  v_reactor_name TEXT;
  v_subject_title TEXT;
BEGIN
  -- Get reactor name
  SELECT CONCAT(first_name, ' ', last_name) INTO v_reactor_name
  FROM public.user_profiles
  WHERE id = NEW.profile_id;

  -- Get subject title based on target type
  IF NEW.target_type = 'story' THEN
    SELECT COALESCE(title, 'a story') INTO v_subject_title
    FROM public.stories
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'photo' THEN
    SELECT COALESCE(caption, 'a photo') INTO v_subject_title
    FROM public.photos
    WHERE id = NEW.target_id;
  ELSE
    v_subject_title := 'a comment';
  END IF;

  -- Build display data
  v_display_data := jsonb_build_object(
    'actor_name', v_reactor_name,
    'subject_title', v_subject_title,
    'reaction_type', NEW.reaction_type::TEXT
  );

  -- Log on INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_events (
      event_type,
      actor_id,
      subject_type,
      subject_id,
      display_data,
      visibility
    ) VALUES (
      'reaction_added',
      NEW.profile_id,
      NEW.target_type,
      NEW.target_id,
      v_display_data,
      'family'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_log_photo_activity ON public.photos;
DROP TRIGGER IF EXISTS trigger_log_story_activity ON public.stories;
DROP TRIGGER IF EXISTS trigger_log_relative_activity ON public.pending_relatives;
DROP TRIGGER IF EXISTS trigger_log_comment_activity ON public.story_comments;
DROP TRIGGER IF EXISTS trigger_log_reaction_activity ON public.reactions;

-- Photo activity trigger
CREATE TRIGGER trigger_log_photo_activity
  AFTER INSERT OR UPDATE OF status ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION log_photo_activity();

-- Story activity trigger
CREATE TRIGGER trigger_log_story_activity
  AFTER INSERT OR UPDATE OF status ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION log_story_activity();

-- Relative activity trigger
CREATE TRIGGER trigger_log_relative_activity
  AFTER INSERT ON public.pending_relatives
  FOR EACH ROW
  EXECUTE FUNCTION log_relative_activity();

-- Comment activity trigger
CREATE TRIGGER trigger_log_comment_activity
  AFTER INSERT ON public.story_comments
  FOR EACH ROW
  EXECUTE FUNCTION log_comment_activity();

-- Reaction activity trigger
CREATE TRIGGER trigger_log_reaction_activity
  AFTER INSERT ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION log_reaction_activity();

-- ============================================================================
-- 4. GRANTS
-- ============================================================================

-- Grant execute on trigger functions to authenticated users (needed for RLS)
GRANT EXECUTE ON FUNCTION log_photo_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION log_story_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION log_relative_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION log_comment_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION log_reaction_activity() TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
