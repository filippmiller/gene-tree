-- ============================================================================
-- Migration 0027: Notifications system
-- ============================================================================

-- 1) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  primary_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  related_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Notification recipients table
CREATE TABLE IF NOT EXISTS public.notification_recipients (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  PRIMARY KEY (notification_id, profile_id)
);

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_profile
  ON public.notification_recipients(profile_id, is_read);

-- 4) RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- notifications: только админы напрямую читают/пишут; обычные пользователи работают через join
CREATE POLICY "notifications_admin_only" ON public.notifications
  FOR ALL TO authenticated
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- notification_recipients: владелец записей = profile_id
CREATE POLICY "notification_recipients_owner" ON public.notification_recipients
  FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR current_user_is_admin())
  WITH CHECK (profile_id = auth.uid() OR current_user_is_admin());

-- 5) Helper: family circle profile ids for a given user (auth user id)
--    Uses existing is_in_family_circle(profile_id, user_id)
CREATE OR REPLACE FUNCTION public.get_family_circle_profile_ids(p_user_id UUID)
RETURNS TABLE(profile_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT up.id AS profile_id
  FROM public.user_profiles up
  WHERE is_in_family_circle(up.id, p_user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- END OF MIGRATION 0027
-- ============================================================================
