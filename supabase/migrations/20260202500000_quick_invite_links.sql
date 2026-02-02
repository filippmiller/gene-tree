-- Migration: Quick Invite Links
-- Purpose: Enable users to create shareable invite links with QR codes for family events
-- Related to: pending_relatives, viral growth system

-- ============================================================================
-- TABLES
-- ============================================================================

-- Quick invite links table
CREATE TABLE IF NOT EXISTS public.quick_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link properties
  code TEXT UNIQUE NOT NULL, -- Short code like "ABC123"

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,

  -- Usage limits
  max_uses INTEGER DEFAULT 50,
  current_uses INTEGER DEFAULT 0,

  -- Optional event name
  event_name TEXT, -- "Smith Family Reunion 2026"

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- People who signed up via quick link (pending approval)
CREATE TABLE IF NOT EXISTS public.quick_link_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.quick_invite_links(id) ON DELETE CASCADE,

  -- Signup info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  claimed_relationship TEXT, -- "I'm John's cousin"

  -- Approval status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- If approved, link to created profile
  created_profile_id UUID REFERENCES public.user_profiles(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate signups for same link
  CONSTRAINT unique_email_per_link UNIQUE (link_id, email)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quick_invite_links_created_by ON public.quick_invite_links(created_by);
CREATE INDEX IF NOT EXISTS idx_quick_invite_links_code ON public.quick_invite_links(code);
CREATE INDEX IF NOT EXISTS idx_quick_invite_links_expires_at ON public.quick_invite_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_quick_invite_links_is_active ON public.quick_invite_links(is_active);

CREATE INDEX IF NOT EXISTS idx_quick_link_signups_link_id ON public.quick_link_signups(link_id);
CREATE INDEX IF NOT EXISTS idx_quick_link_signups_status ON public.quick_link_signups(status);
CREATE INDEX IF NOT EXISTS idx_quick_link_signups_email ON public.quick_link_signups(email);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.quick_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_link_signups ENABLE ROW LEVEL SECURITY;

-- Quick Invite Links policies
CREATE POLICY "Users can view their own links"
  ON public.quick_invite_links
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Anyone can view active link by code"
  ON public.quick_invite_links
  FOR SELECT
  USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Users can create links"
  ON public.quick_invite_links
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own links"
  ON public.quick_invite_links
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own links"
  ON public.quick_invite_links
  FOR DELETE
  USING (created_by = auth.uid());

-- Quick Link Signups policies
CREATE POLICY "Link creators can view signups"
  ON public.quick_link_signups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quick_invite_links
      WHERE id = quick_link_signups.link_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can create signup for active link"
  ON public.quick_link_signups
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quick_invite_links
      WHERE id = quick_link_signups.link_id
      AND is_active = true
      AND expires_at > NOW()
      AND current_uses < max_uses
    )
  );

CREATE POLICY "Link creators can update signups"
  ON public.quick_link_signups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quick_invite_links
      WHERE id = quick_link_signups.link_id
      AND created_by = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate a random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars (0, O, 1, I)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_quick_link_usage(link_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  link_record RECORD;
BEGIN
  SELECT * INTO link_record
  FROM public.quick_invite_links
  WHERE code = link_code
  AND is_active = true
  AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF link_record.current_uses >= link_record.max_uses THEN
    RETURN FALSE;
  END IF;

  UPDATE public.quick_invite_links
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE code = link_code;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_quick_invite_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quick_invite_links_updated_at
  BEFORE UPDATE ON public.quick_invite_links
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_invite_updated_at();

CREATE TRIGGER quick_link_signups_updated_at
  BEFORE UPDATE ON public.quick_link_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_invite_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.quick_invite_links IS 'Quick invite links with QR codes for family events and reunions';
COMMENT ON TABLE public.quick_link_signups IS 'People who signed up via quick invite links, pending approval';
COMMENT ON COLUMN public.quick_invite_links.code IS 'Short alphanumeric code for easy sharing (e.g., ABC123)';
COMMENT ON COLUMN public.quick_invite_links.event_name IS 'Optional event name like "Smith Family Reunion 2026"';
COMMENT ON COLUMN public.quick_link_signups.claimed_relationship IS 'Self-described relationship to the family (e.g., "I am Johns cousin")';
