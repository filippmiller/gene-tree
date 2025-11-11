-- ============================================================================
-- Migration: Fix VIEWs to read from pending_relatives table
-- ============================================================================
-- Problem: relationships table is empty, all data is in pending_relatives
-- Solution: Rewrite VIEWs to use pending_relatives as source
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS public.gt_v_tree_stats CASCADE;
DROP VIEW IF EXISTS public.gt_v_union_child CASCADE;
DROP VIEW IF EXISTS public.gt_v_union CASCADE;
DROP VIEW IF EXISTS public.gt_v_parent_child CASCADE;

-- ============================================================================
-- View: gt_v_parent_child
-- Maps parent-child relationships from pending_relatives
-- ============================================================================
CREATE OR REPLACE VIEW public.gt_v_parent_child AS
SELECT
  pr.invited_by AS parent_id,
  pr.id AS child_id
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'parent'
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_parent_child IS 
'Parent-child relationships extracted from pending_relatives table. Each row represents parent_id -> child_id direct link.';

-- ============================================================================
-- View: gt_v_union (marriages/partnerships)
-- Infer unions from spouse relationships in pending_relatives
-- ============================================================================
CREATE OR REPLACE VIEW public.gt_v_union AS
SELECT
  gen_random_uuid() AS union_id,
  pr.invited_by AS person1_id,
  pr.id AS person2_id,
  NULL::date AS marriage_date,
  NULL::date AS divorce_date
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'spouse'
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_union IS 
'Virtual union nodes representing marriages/partnerships inferred from pending_relatives spouse relationships.';

-- ============================================================================
-- View: gt_v_union_child
-- Maps children to their parent unions
-- ============================================================================
CREATE OR REPLACE VIEW public.gt_v_union_child AS
SELECT DISTINCT
  gen_random_uuid() AS union_id,
  pr.id AS child_id
FROM public.pending_relatives pr
WHERE pr.relationship_type IN ('parent', 'child')
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_union_child IS 
'Maps children to parent union nodes (simplified version reading from pending_relatives).';

-- ============================================================================
-- View: gt_v_tree_stats
-- Statistics about the family tree
-- ============================================================================
CREATE OR REPLACE VIEW public.gt_v_tree_stats AS
SELECT
  COUNT(DISTINCT invited_by) AS total_people,
  COUNT(DISTINCT CASE WHEN relationship_type = 'parent' THEN id END) AS total_parents,
  COUNT(DISTINCT CASE WHEN relationship_type = 'child' THEN id END) AS total_children,
  COUNT(DISTINCT CASE WHEN relationship_type = 'spouse' THEN id END) AS total_unions
FROM public.pending_relatives;

COMMENT ON VIEW public.gt_v_tree_stats IS 
'Summary statistics about family tree from pending_relatives table.';

-- Grant permissions
GRANT SELECT ON public.gt_v_parent_child TO authenticated, anon;
GRANT SELECT ON public.gt_v_union TO authenticated, anon;
GRANT SELECT ON public.gt_v_union_child TO authenticated, anon;
GRANT SELECT ON public.gt_v_tree_stats TO authenticated, anon;
