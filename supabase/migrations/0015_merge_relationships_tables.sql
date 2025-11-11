-- ============================================================================
-- Migration: Merge relationships and pending_relatives into single table
-- ============================================================================
-- Goal: Simplify schema - one table with status field instead of two tables
-- ============================================================================

-- 1. Add status column to pending_relatives
ALTER TABLE public.pending_relatives 
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'pending';

-- 2. Update existing pending records
UPDATE public.pending_relatives 
SET relationship_status = 'pending' 
WHERE relationship_status IS NULL;

-- 3. Migrate data from relationships table to pending_relatives (if any exists)
INSERT INTO public.pending_relatives (
  id,
  invited_by,
  first_name,
  last_name,
  email,
  relationship_type,
  related_to_user_id,
  related_to_relationship,
  relationship_status,
  created_at,
  updated_at
)
SELECT 
  user2_id as id,
  user1_id as invited_by,
  '' as first_name,
  '' as last_name,
  '' as email,
  relationship_type,
  NULL as related_to_user_id,
  NULL as related_to_relationship,
  'verified' as relationship_status,
  created_at,
  created_at as updated_at
FROM public.relationships
WHERE NOT EXISTS (
  SELECT 1 FROM public.pending_relatives pr 
  WHERE pr.id = relationships.user2_id 
  AND pr.invited_by = relationships.user1_id
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create index on status for performance
CREATE INDEX IF NOT EXISTS idx_pending_relatives_status 
ON public.pending_relatives(relationship_status);

-- 5. Update VIEWs to use unified table with both statuses
DROP VIEW IF EXISTS public.gt_v_tree_stats CASCADE;
DROP VIEW IF EXISTS public.gt_v_union_child CASCADE;
DROP VIEW IF EXISTS public.gt_v_union CASCADE;
DROP VIEW IF EXISTS public.gt_v_parent_child CASCADE;

-- View: gt_v_parent_child (reads from unified table, all statuses)
CREATE OR REPLACE VIEW public.gt_v_parent_child AS
SELECT
  pr.invited_by AS parent_id,
  pr.id AS child_id,
  pr.relationship_status
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'parent'
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_parent_child IS 
'Parent-child relationships from unified pending_relatives table (all statuses: pending + verified)';

-- View: gt_v_union (marriages/partnerships)
CREATE OR REPLACE VIEW public.gt_v_union AS
SELECT
  gen_random_uuid() AS union_id,
  pr.invited_by AS person1_id,
  pr.id AS person2_id,
  NULL::date AS marriage_date,
  NULL::date AS divorce_date,
  pr.relationship_status
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'spouse'
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_union IS 
'Virtual union nodes from unified table (all statuses)';

-- View: gt_v_union_child
CREATE OR REPLACE VIEW public.gt_v_union_child AS
SELECT DISTINCT
  gen_random_uuid() AS union_id,
  pr.id AS child_id,
  pr.relationship_status
FROM public.pending_relatives pr
WHERE pr.relationship_type IN ('parent', 'child')
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_union_child IS 
'Union-child relationships from unified table';

-- View: gt_v_tree_stats
CREATE OR REPLACE VIEW public.gt_v_tree_stats AS
SELECT
  COUNT(DISTINCT invited_by) AS total_people,
  COUNT(DISTINCT CASE WHEN relationship_type = 'parent' THEN id END) AS total_parents,
  COUNT(DISTINCT CASE WHEN relationship_type = 'child' THEN id END) AS total_children,
  COUNT(DISTINCT CASE WHEN relationship_type = 'spouse' THEN id END) AS total_unions,
  COUNT(DISTINCT CASE WHEN relationship_status = 'pending' THEN id END) AS total_pending,
  COUNT(DISTINCT CASE WHEN relationship_status = 'verified' THEN id END) AS total_verified
FROM public.pending_relatives;

COMMENT ON VIEW public.gt_v_tree_stats IS 
'Statistics from unified table with status breakdown';

-- Grant permissions
GRANT SELECT ON public.gt_v_parent_child TO authenticated, anon;
GRANT SELECT ON public.gt_v_union TO authenticated, anon;
GRANT SELECT ON public.gt_v_union_child TO authenticated, anon;
GRANT SELECT ON public.gt_v_tree_stats TO authenticated, anon;

-- 6. Add comment explaining new structure
COMMENT ON COLUMN public.pending_relatives.relationship_status IS 
'Status of relationship: pending (invited, not confirmed) or verified (confirmed by both parties)';

-- 7. Optional: Mark relationships table as deprecated (don't drop yet for safety)
COMMENT ON TABLE public.relationships IS 
'DEPRECATED: Use pending_relatives with relationship_status instead. Will be removed in future migration.';
