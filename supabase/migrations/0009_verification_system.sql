-- 009_verification_system.sql
-- Verification system for relationships

-- Add verified_by array to relationships table
-- This tracks which users have verified this relationship
ALTER TABLE public.relationships
ADD COLUMN IF NOT EXISTS verified_by UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Create relationship_verifications table for detailed verification tracking
CREATE TABLE IF NOT EXISTS public.relationship_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID REFERENCES public.relationships(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('direct', 'indirect', 'deceased')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(relationship_id, verified_by) -- One verification per user per relationship
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rel_verifications_relationship 
ON public.relationship_verifications(relationship_id);

CREATE INDEX IF NOT EXISTS idx_rel_verifications_verified_by 
ON public.relationship_verifications(verified_by);

-- RLS policies for relationship_verifications
ALTER TABLE public.relationship_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view verifications for relationships they're part of
CREATE POLICY "Users can view verifications for their relationships"
ON public.relationship_verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = relationship_verifications.relationship_id
    AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())
  )
);

-- Users can add verifications if they're related to one of the people in the relationship
CREATE POLICY "Related users can add verifications"
ON public.relationship_verifications FOR INSERT
WITH CHECK (
  verified_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = relationship_verifications.relationship_id
    AND (
      -- User is directly in this relationship
      r.user1_id = auth.uid() OR r.user2_id = auth.uid() OR
      -- User is related to someone in this relationship
      EXISTS (
        SELECT 1 FROM public.relationships r2
        WHERE (r2.user1_id = auth.uid() AND r2.user2_id IN (r.user1_id, r.user2_id))
           OR (r2.user2_id = auth.uid() AND r2.user1_id IN (r.user1_id, r.user2_id))
      )
    )
  )
);

-- Function to auto-update verification_status when 3+ verifications exist
CREATE OR REPLACE FUNCTION public.update_relationship_verification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Count verifications for this relationship
  UPDATE public.relationships
  SET 
    verification_status = CASE
      WHEN (
        SELECT COUNT(DISTINCT verified_by)
        FROM public.relationship_verifications
        WHERE relationship_id = NEW.relationship_id
      ) >= 3 THEN 'verified'
      ELSE 'pending'
    END,
    verified_by = ARRAY(
      SELECT DISTINCT verified_by
      FROM public.relationship_verifications
      WHERE relationship_id = NEW.relationship_id
    )
  WHERE id = NEW.relationship_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update verification status after insert
CREATE TRIGGER trigger_update_verification_status
AFTER INSERT ON public.relationship_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_relationship_verification_status();

-- Comments
COMMENT ON COLUMN public.relationships.verified_by IS 'Array of user IDs who have verified this relationship';
COMMENT ON COLUMN public.relationships.verification_status IS 'Status: pending (< 3 verifications), verified (>= 3), rejected';
COMMENT ON TABLE public.relationship_verifications IS 'Detailed tracking of who verified each relationship and when';
