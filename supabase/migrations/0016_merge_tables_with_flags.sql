-- ============================================================================
-- Migration: Merge relationships and pending_relatives with boolean flags
-- ============================================================================
-- Goal: One unified table with is_pending, is_verified, is_temporary flags
-- ============================================================================

-- 1. Add boolean status flags to pending_relatives
ALTER TABLE public.pending_relatives 
ADD COLUMN IF NOT EXISTS is_pending BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false;

-- 2. Update existing pending_relatives records
UPDATE public.pending_relatives 
SET 
  is_pending = true,
  is_verified = false,
  is_temporary = false
WHERE is_pending IS NULL;

-- 3. Migrate data from relationships table to pending_relatives
-- Get user profiles for existing relationships to fill names
DO $$
DECLARE
  rel RECORD;
  user_profile RECORD;
BEGIN
  FOR rel IN 
    SELECT DISTINCT 
      r.user1_id,
      r.user2_id,
      r.relationship_type,
      r.created_at
    FROM public.relationships r
    WHERE NOT EXISTS (
      SELECT 1 FROM public.pending_relatives pr 
      WHERE (pr.id = r.user2_id AND pr.invited_by = r.user1_id)
         OR (pr.id = r.user1_id AND pr.invited_by = r.user2_id)
    )
  LOOP
    -- Try to get user profile for user2
    SELECT * INTO user_profile 
    FROM public.user_profiles 
    WHERE id = rel.user2_id 
    LIMIT 1;

    IF FOUND THEN
      INSERT INTO public.pending_relatives (
        id,
        invited_by,
        first_name,
        last_name,
        email,
        relationship_type,
        is_pending,
        is_verified,
        is_temporary,
        created_at,
        updated_at
      ) VALUES (
        rel.user2_id,
        rel.user1_id,
        COALESCE(user_profile.first_name, ''),
        COALESCE(user_profile.last_name, ''),
        COALESCE(user_profile.email, ''),
        rel.relationship_type,
        false,  -- not pending
        true,   -- verified
        false,  -- not temporary
        rel.created_at,
        rel.created_at
      )
      ON CONFLICT (id) DO UPDATE SET
        is_verified = true,
        is_pending = false;
    END IF;
  END LOOP;
END $$;

-- 4. Create indexes on boolean flags for performance
CREATE INDEX IF NOT EXISTS idx_pending_relatives_is_pending 
ON public.pending_relatives(is_pending) WHERE is_pending = true;

CREATE INDEX IF NOT EXISTS idx_pending_relatives_is_verified 
ON public.pending_relatives(is_verified) WHERE is_verified = true;

CREATE INDEX IF NOT EXISTS idx_pending_relatives_is_temporary 
ON public.pending_relatives(is_temporary) WHERE is_temporary = true;

-- 5. Update VIEWs to read from unified table
DROP VIEW IF EXISTS public.gt_v_tree_stats CASCADE;
DROP VIEW IF EXISTS public.gt_v_union_child CASCADE;
DROP VIEW IF EXISTS public.gt_v_union CASCADE;
DROP VIEW IF EXISTS public.gt_v_parent_child CASCADE;

-- View: gt_v_parent_child (all relationships regardless of status)
CREATE OR REPLACE VIEW public.gt_v_parent_child AS
SELECT
  pr.invited_by AS parent_id,
  pr.id AS child_id,
  pr.is_pending,
  pr.is_verified,
  pr.is_temporary
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'parent'
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_parent_child IS 
'Parent-child relationships from unified table with status flags';

-- View: gt_v_union (marriages/partnerships)
CREATE OR REPLACE VIEW public.gt_v_union AS
SELECT
  gen_random_uuid() AS union_id,
  pr.invited_by AS person1_id,
  pr.id AS person2_id,
  NULL::date AS marriage_date,
  NULL::date AS divorce_date,
  pr.is_pending,
  pr.is_verified,
  pr.is_temporary
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'spouse'
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_union IS 
'Virtual union nodes from unified table with status flags';

-- View: gt_v_union_child
CREATE OR REPLACE VIEW public.gt_v_union_child AS
SELECT DISTINCT
  gen_random_uuid() AS union_id,
  pr.id AS child_id,
  pr.is_pending,
  pr.is_verified,
  pr.is_temporary
FROM public.pending_relatives pr
WHERE pr.relationship_type IN ('parent', 'child')
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_union_child IS 
'Union-child relationships from unified table';

-- View: gt_v_tree_stats with status breakdown
CREATE OR REPLACE VIEW public.gt_v_tree_stats AS
SELECT
  COUNT(DISTINCT invited_by) AS total_people,
  COUNT(DISTINCT CASE WHEN relationship_type = 'parent' THEN id END) AS total_parents,
  COUNT(DISTINCT CASE WHEN relationship_type = 'child' THEN id END) AS total_children,
  COUNT(DISTINCT CASE WHEN relationship_type = 'spouse' THEN id END) AS total_unions,
  COUNT(DISTINCT CASE WHEN is_pending = true THEN id END) AS total_pending,
  COUNT(DISTINCT CASE WHEN is_verified = true THEN id END) AS total_verified,
  COUNT(DISTINCT CASE WHEN is_temporary = true THEN id END) AS total_temporary
FROM public.pending_relatives;

COMMENT ON VIEW public.gt_v_tree_stats IS 
'Statistics from unified table with boolean flag breakdown';

-- Grant permissions
GRANT SELECT ON public.gt_v_parent_child TO authenticated, anon;
GRANT SELECT ON public.gt_v_union TO authenticated, anon;
GRANT SELECT ON public.gt_v_union_child TO authenticated, anon;
GRANT SELECT ON public.gt_v_tree_stats TO authenticated, anon;

-- 6. Add comments explaining new structure
COMMENT ON COLUMN public.pending_relatives.is_pending IS 
'TRUE if relationship invitation is pending confirmation';

COMMENT ON COLUMN public.pending_relatives.is_verified IS 
'TRUE if relationship has been verified/confirmed by both parties';

COMMENT ON COLUMN public.pending_relatives.is_temporary IS 
'TRUE if this is a temporary relationship (e.g. for testing or draft)';

-- 7. Mark old relationships table as deprecated
COMMENT ON TABLE public.relationships IS 
'DEPRECATED: Use pending_relatives with is_pending/is_verified/is_temporary flags instead';
