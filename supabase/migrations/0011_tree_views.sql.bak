-- Migration 0011: Tree Visualization Views
-- Date: 2025-11-10
-- Description: Creates VIEW adapters for family tree visualization
-- These views adapt our existing schema to a format suitable for tree rendering

-- =======================
-- 1. NORMALIZED PEOPLE VIEW
-- =======================
-- Combines data from user_profiles into a standardized person view
CREATE OR REPLACE VIEW public.gt_v_person AS
SELECT
  up.id,
  COALESCE(
    NULLIF(TRIM(up.first_name || ' ' || COALESCE(up.middle_name, '') || ' ' || up.last_name), '  '),
    up.first_name || ' ' || up.last_name,
    up.first_name,
    'Unknown'
  ) AS name,
  up.gender,
  up.birth_date,
  up.death_date,
  up.avatar_url AS photo_url,
  up.is_living AS is_alive,
  up.first_name,
  up.last_name,
  up.middle_name,
  up.maiden_name
FROM public.user_profiles up;

COMMENT ON VIEW public.gt_v_person IS 'Normalized view of people for tree visualization';

-- =======================
-- 2. PARENT→CHILD VIEW
-- =======================
-- Extracts parent-child relationships from the relationships table
CREATE OR REPLACE VIEW public.gt_v_parent_child AS
SELECT
  r.user1_id AS parent_id,
  r.user2_id AS child_id
FROM public.relationships r
WHERE r.relationship_type = 'parent';

COMMENT ON VIEW public.gt_v_parent_child IS 'Parent→Child directed relationships';

-- =======================
-- 3. UNIONS (MARRIAGES/PARTNERSHIPS) VIEW
-- =======================
-- Creates virtual "union" nodes representing marriages/partnerships
-- A union connects parents who have children together
CREATE OR REPLACE VIEW public.gt_v_union AS
WITH spouse_pairs AS (
  -- Get all spouse relationships
  SELECT
    LEAST(r.user1_id, r.user2_id) AS person1_id,
    GREATEST(r.user1_id, r.user2_id) AS person2_id,
    r.marriage_date,
    r.divorce_date
  FROM public.relationships r
  WHERE r.relationship_type = 'spouse'
),
parent_pairs AS (
  -- Find pairs of parents who have children together
  SELECT DISTINCT
    LEAST(p1.parent_id, p2.parent_id) AS person1_id,
    GREATEST(p1.parent_id, p2.parent_id) AS person2_id
  FROM public.gt_v_parent_child p1
  INNER JOIN public.gt_v_parent_child p2
    ON p1.child_id = p2.child_id
    AND p1.parent_id < p2.parent_id
),
all_pairs AS (
  -- Combine spouses and co-parents
  SELECT person1_id, person2_id, marriage_date, divorce_date FROM spouse_pairs
  UNION
  SELECT person1_id, person2_id, NULL AS marriage_date, NULL AS divorce_date
  FROM parent_pairs
  WHERE NOT EXISTS (
    SELECT 1 FROM spouse_pairs sp
    WHERE sp.person1_id = parent_pairs.person1_id
      AND sp.person2_id = parent_pairs.person2_id
  )
)
SELECT
  'U:' || person1_id::text || ':' || person2_id::text AS union_id,
  person1_id AS p1,
  person2_id AS p2,
  marriage_date,
  divorce_date
FROM all_pairs;

COMMENT ON VIEW public.gt_v_union IS 'Virtual union nodes representing marriages and co-parenting relationships';

-- =======================
-- 4. UNION→CHILD VIEW
-- =======================
-- Maps which children belong to which union
CREATE OR REPLACE VIEW public.gt_v_union_child AS
WITH parent_pairs AS (
  SELECT
    p1.child_id,
    LEAST(p1.parent_id, p2.parent_id) AS parent1_id,
    GREATEST(p1.parent_id, p2.parent_id) AS parent2_id
  FROM public.gt_v_parent_child p1
  INNER JOIN public.gt_v_parent_child p2
    ON p1.child_id = p2.child_id
    AND p1.parent_id < p2.parent_id
),
single_parents AS (
  SELECT
    pc.child_id,
    pc.parent_id AS parent1_id,
    NULL::uuid AS parent2_id
  FROM public.gt_v_parent_child pc
  WHERE NOT EXISTS (
    SELECT 1 FROM parent_pairs pp
    WHERE pp.child_id = pc.child_id
  )
)
SELECT
  'U:' || parent1_id::text || COALESCE(':' || parent2_id::text, '') AS union_id,
  child_id
FROM (
  SELECT child_id, parent1_id, parent2_id FROM parent_pairs
  UNION ALL
  SELECT child_id, parent1_id, parent2_id FROM single_parents
) combined;

COMMENT ON VIEW public.gt_v_union_child IS 'Maps children to their parent unions';

-- =======================
-- 5. TREE STATISTICS VIEW (HELPER)
-- =======================
-- Provides quick statistics for tree visualization
CREATE OR REPLACE VIEW public.gt_v_tree_stats AS
SELECT
  (SELECT COUNT(*) FROM public.gt_v_person) AS total_people,
  (SELECT COUNT(*) FROM public.gt_v_parent_child) AS total_parent_child_links,
  (SELECT COUNT(*) FROM public.gt_v_union) AS total_unions,
  (SELECT COUNT(*) FROM public.gt_v_union_child) AS total_union_children;

COMMENT ON VIEW public.gt_v_tree_stats IS 'Statistics for tree data';

-- =======================
-- DONE
-- =======================
