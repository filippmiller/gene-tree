-- Migration 005: Pending Relatives Invitation System
-- Creates infrastructure for inviting relatives who don't have accounts yet

-- Create pending_relatives table
CREATE TABLE IF NOT EXISTS public.pending_relatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who invited this person
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Social media profiles (optional)
  facebook_url TEXT,
  instagram_url TEXT,
  
  -- Relationship information
  relationship_type TEXT NOT NULL, -- parent, child, sibling, spouse, aunt, uncle, cousin, etc.
  
  -- For indirect relationships: "related_to" points to the intermediate person
  -- Example: "sister of my mother" → related_to_user_id = mother's user_id, relationship_type = aunt
  related_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_to_relationship TEXT, -- What relationship the intermediate person has (e.g., "mother", "father")
  
  -- Invitation system
  invitation_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_at TIMESTAMPTZ, -- When invitation was sent
  accepted_at TIMESTAMPTZ, -- When invitation was accepted
  
  -- Constraints
  CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Create indexes
CREATE INDEX idx_pending_relatives_invited_by ON public.pending_relatives(invited_by);
CREATE INDEX idx_pending_relatives_invitation_token ON public.pending_relatives(invitation_token);
CREATE INDEX idx_pending_relatives_status ON public.pending_relatives(status);
CREATE INDEX idx_pending_relatives_email ON public.pending_relatives(email) WHERE email IS NOT NULL;
CREATE INDEX idx_pending_relatives_phone ON public.pending_relatives(phone) WHERE phone IS NOT NULL;

-- RLS Policies
ALTER TABLE public.pending_relatives ENABLE ROW LEVEL SECURITY;

-- Users can view their own invitations
CREATE POLICY "Users can view own invitations"
  ON public.pending_relatives
  FOR SELECT
  USING (invited_by = auth.uid());

-- Users can create invitations
CREATE POLICY "Users can create invitations"
  ON public.pending_relatives
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- Users can update their own invitations (e.g., resend, cancel)
CREATE POLICY "Users can update own invitations"
  ON public.pending_relatives
  FOR UPDATE
  USING (invited_by = auth.uid());

-- Users can delete their own invitations
CREATE POLICY "Users can delete own invitations"
  ON public.pending_relatives
  FOR DELETE
  USING (invited_by = auth.uid());

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pending_relatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pending_relatives_updated_at
  BEFORE UPDATE ON public.pending_relatives
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_relatives_updated_at();

-- View for easy querying of pending relatives with computed relationship labels
CREATE OR REPLACE VIEW public.v_pending_relatives_with_labels AS
SELECT
  pr.*,
  up_inviter.first_name AS inviter_first_name,
  up_inviter.last_name AS inviter_last_name,
  up_inviter.email AS inviter_email,
  up_related.first_name AS related_person_first_name,
  up_related.last_name AS related_person_last_name,
  CASE
    WHEN pr.related_to_user_id IS NULL THEN 'Direct relative'
    ELSE 'Indirect relative (' || pr.relationship_type || ' of ' || pr.related_to_relationship || ')'
  END AS relationship_description
FROM public.pending_relatives pr
LEFT JOIN public.user_profiles up_inviter ON pr.invited_by = up_inviter.id
LEFT JOIN public.user_profiles up_related ON pr.related_to_user_id = up_related.id;

COMMENT ON TABLE public.pending_relatives IS 'Stores invitations for relatives who do not have accounts yet';
COMMENT ON COLUMN public.pending_relatives.related_to_user_id IS 'For indirect relationships: the intermediate person (e.g., mother for "mothers sister")';
COMMENT ON COLUMN public.pending_relatives.relationship_type IS 'The computed relationship type to the inviter (parent, aunt, cousin, etc.)';
COMMENT ON COLUMN public.pending_relatives.related_to_relationship IS 'What the intermediate person is (mother, father, etc.)';
