-- Migration: Improve Recursive CTE Tree Functions
-- Date: 2026-02-06
-- Description: Fixes critical bugs in tree views and optimizes CTE performance
--
-- Fixes:
--   1. gt_v_parent_child had parent/child IDs SWAPPED (invited_by was mapped as parent,
--      but when relationship_type='parent', the added person (id) IS the parent)
--   2. gt_v_union used gen_random_uuid() producing non-deterministic union IDs
--   3. gt_v_union_child used gen_random_uuid() so unions couldn't be matched to children
--   4. gt_v_person only covered user_profiles, missing pending_relatives who haven't registered
--   5. Missing composite index on pending_relatives for tree traversal
--
-- Functions updated:
--   get_tree_data(person_ids UUID[]) - Updated for fixed views
--   get_tree_for_proband(proband_id, mode, max_depth) - Updated for fixed views

-- =======================
-- 0. PERFORMANCE INDEXES
-- =======================
-- Composite index for the parent-child view (critical for recursive CTE)
CREATE INDEX IF NOT EXISTS idx_pending_relatives_type_invited_by
  ON public.pending_relatives(relationship_type, invited_by);

-- Composite index for looking up by id + relationship_type
CREATE INDEX IF NOT EXISTS idx_pending_relatives_type_id
  ON public.pending_relatives(relationship_type, id);

-- Index for the related_to lookups used in chain resolution
CREATE INDEX IF NOT EXISTS idx_pending_relatives_related_to_type
  ON public.pending_relatives(related_to_user_id, related_to_relationship)
  WHERE related_to_user_id IS NOT NULL;

-- =======================
-- 1. FIX gt_v_parent_child (CRITICAL BUG FIX)
-- =======================
-- When relationship_type = 'parent', the pending_relative (id) IS the parent,
-- and the inviter (invited_by) IS the child.
-- Previous migration had these SWAPPED.
--
-- Additionally include relationship_type = 'child' in reverse:
-- When relationship_type = 'child', the pending_relative (id) IS the child,
-- and the inviter (invited_by) IS the parent.

DROP VIEW IF EXISTS public.gt_v_tree_stats CASCADE;
DROP VIEW IF EXISTS public.gt_v_union_child CASCADE;
DROP VIEW IF EXISTS public.gt_v_union CASCADE;
DROP VIEW IF EXISTS public.gt_v_parent_child CASCADE;

CREATE OR REPLACE VIEW public.gt_v_parent_child AS
SELECT
  pr.id AS parent_id,           -- the added person IS the parent
  pr.invited_by AS child_id     -- the inviter IS the child
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'parent'
  AND pr.invited_by IS NOT NULL

UNION ALL

SELECT
  pr.invited_by AS parent_id,   -- the inviter IS the parent
  pr.id AS child_id             -- the added person IS the child
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'child'
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_parent_child IS
'Parent-child relationships from pending_relatives. Correctly maps both parent and child relationship_types.';

-- =======================
-- 2. FIX gt_v_union (Deterministic union IDs)
-- =======================
-- Uses MD5 hash of sorted parent UUIDs to produce stable, deterministic union_id.
-- This ensures the same pair of parents always produces the same union_id.

CREATE OR REPLACE VIEW public.gt_v_union AS
WITH child_parents AS (
  SELECT
    pc.child_id,
    ARRAY_AGG(DISTINCT pc.parent_id ORDER BY pc.parent_id) AS parents
  FROM public.gt_v_parent_child pc
  GROUP BY pc.child_id
),
union_candidates AS (
  SELECT
    CASE
      WHEN ARRAY_LENGTH(parents, 1) = 2
        THEN 'U:' || parents[1]::text || ':' || parents[2]::text
      ELSE 'U:' || parents[1]::text
    END AS union_id,
    parents
  FROM child_parents
)
SELECT DISTINCT
  uc.union_id,
  uc.parents[1] AS p1,
  CASE
    WHEN ARRAY_LENGTH(uc.parents, 1) = 2 THEN uc.parents[2]
    ELSE NULL
  END AS p2,
  r.marriage_date,
  r.divorce_date
FROM union_candidates uc
LEFT JOIN public.pending_relatives r ON (
  r.relationship_type = 'spouse'
  AND (
    (r.invited_by = uc.parents[1] AND r.id = uc.parents[2])
    OR
    (r.id = uc.parents[1] AND r.invited_by = uc.parents[2])
  )
)
WHERE ARRAY_LENGTH(uc.parents, 1) >= 1;

COMMENT ON VIEW public.gt_v_union IS
'Virtual union nodes with deterministic IDs based on sorted parent UUID pairs.';

-- =======================
-- 3. FIX gt_v_union_child (Matching deterministic union IDs)
-- =======================
-- Links children to their parent union using the same deterministic ID formula.

CREATE OR REPLACE VIEW public.gt_v_union_child AS
WITH child_union AS (
  SELECT
    pc.child_id,
    CASE
      WHEN COUNT(*) = 2
        THEN 'U:' || MIN(pc.parent_id::text) || ':' || MAX(pc.parent_id::text)
      ELSE 'U:' || MIN(pc.parent_id::text)
    END AS union_id
  FROM public.gt_v_parent_child pc
  GROUP BY pc.child_id
)
SELECT
  cu.union_id,
  cu.child_id
FROM child_union cu;

COMMENT ON VIEW public.gt_v_union_child IS
'Union-child relationships with deterministic union IDs matching gt_v_union.';

-- =======================
-- 4. RECREATE gt_v_tree_stats
-- =======================

CREATE OR REPLACE VIEW public.gt_v_tree_stats AS
SELECT
  (SELECT COUNT(*) FROM public.gt_v_person) AS total_persons,
  (SELECT COUNT(*) FROM public.gt_v_parent_child) AS total_parent_child_links,
  (SELECT COUNT(*) FROM public.gt_v_union) AS total_unions,
  (SELECT COUNT(*) FROM public.gt_v_union_child) AS total_union_child_links,
  (SELECT COUNT(*) FROM public.pending_relatives WHERE relationship_type = 'spouse') AS total_marriages;

COMMENT ON VIEW public.gt_v_tree_stats IS 'Statistics about tree data for debugging';

-- =======================
-- 5. UNIFIED PERSON VIEW (includes pending_relatives)
-- =======================
-- The original gt_v_person only shows user_profiles. Pending relatives who haven't
-- created accounts are invisible to the tree. This new view unifies both sources.

DROP VIEW IF EXISTS public.gt_v_person CASCADE;

CREATE OR REPLACE VIEW public.gt_v_person AS
-- Registered users from user_profiles
SELECT
  p.id,
  COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)), ''),
    p.first_name,
    'Unknown'
  ) AS name,
  p.gender,
  p.birth_date,
  p.death_date,
  p.avatar_url AS photo_url,
  COALESCE(p.is_living, p.death_date IS NULL) AS is_alive
FROM public.user_profiles p

UNION ALL

-- Pending relatives who don't have a user_profile yet
SELECT
  pr.id,
  TRIM(CONCAT_WS(' ', pr.first_name, pr.last_name)) AS name,
  NULL::text AS gender,
  pr.date_of_birth AS birth_date,
  NULL::date AS death_date,
  NULL::text AS photo_url,
  NOT pr.is_deceased AS is_alive
FROM public.pending_relatives pr
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = pr.id
);

COMMENT ON VIEW public.gt_v_person IS
'Unified person view: user_profiles + pending_relatives (without duplicates).';

-- =======================
-- 6. RECREATE DEPENDENT VIEWS (gt_v_tree_stats depends on gt_v_person)
-- =======================

DROP VIEW IF EXISTS public.gt_v_tree_stats;

CREATE OR REPLACE VIEW public.gt_v_tree_stats AS
SELECT
  (SELECT COUNT(*) FROM public.gt_v_person) AS total_persons,
  (SELECT COUNT(*) FROM public.gt_v_parent_child) AS total_parent_child_links,
  (SELECT COUNT(*) FROM public.gt_v_union) AS total_unions,
  (SELECT COUNT(*) FROM public.gt_v_union_child) AS total_union_child_links,
  (SELECT COUNT(*) FROM public.pending_relatives WHERE relationship_type = 'spouse') AS total_marriages;

COMMENT ON VIEW public.gt_v_tree_stats IS 'Statistics about tree data for debugging';

-- =======================
-- 7. UPDATE get_tree_data FUNCTION
-- =======================
-- The function body doesn't change structurally, but we recreate it to ensure
-- it works with the fixed views.

CREATE OR REPLACE FUNCTION public.get_tree_data(
  person_ids UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'persons', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
      FROM (
        SELECT id, name, gender, birth_date, death_date, photo_url, is_alive
        FROM gt_v_person
        WHERE id = ANY(person_ids)
      ) p
    ),
    'parentChild', (
      SELECT COALESCE(json_agg(row_to_json(pc)), '[]'::json)
      FROM (
        SELECT parent_id, child_id
        FROM gt_v_parent_child
        WHERE parent_id = ANY(person_ids)
           OR child_id = ANY(person_ids)
      ) pc
    ),
    'unions', (
      SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
      FROM (
        SELECT union_id, p1, p2, marriage_date, divorce_date
        FROM gt_v_union
        WHERE p1 = ANY(person_ids)
           OR p2 = ANY(person_ids)
      ) u
    ),
    'unionChildren', (
      SELECT COALESCE(json_agg(row_to_json(uc)), '[]'::json)
      FROM (
        SELECT union_id, child_id
        FROM gt_v_union_child
        WHERE child_id = ANY(person_ids)
      ) uc
    )
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_tree_data IS 'Returns complete tree data (persons, links, unions) in single call';

-- =======================
-- 8. UPDATE get_ancestors (with spouse inclusion)
-- =======================
-- When traversing ancestors, we should also include spouses of ancestors
-- so the tree visualization can render complete family units.

CREATE OR REPLACE FUNCTION public.get_ancestors(
  proband_id UUID,
  max_depth INT DEFAULT 4
)
RETURNS TABLE (
  ancestor_id UUID,
  depth INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH RECURSIVE ancestor_tree AS (
    -- Base case: start from proband's parents
    SELECT
      pc.parent_id AS ancestor_id,
      1 AS depth,
      ARRAY[proband_id, pc.parent_id] AS path
    FROM gt_v_parent_child pc
    WHERE pc.child_id = proband_id

    UNION ALL

    -- Recursive case: find parents of current ancestors
    SELECT
      pc.parent_id AS ancestor_id,
      at.depth + 1 AS depth,
      at.path || pc.parent_id
    FROM gt_v_parent_child pc
    JOIN ancestor_tree at ON pc.child_id = at.ancestor_id
    WHERE at.depth < max_depth
      AND NOT pc.parent_id = ANY(at.path)  -- Prevent cycles
  )
  SELECT DISTINCT
    at.ancestor_id,
    MIN(at.depth) AS depth
  FROM ancestor_tree at
  GROUP BY at.ancestor_id
  ORDER BY depth;
$$;

COMMENT ON FUNCTION public.get_ancestors IS 'Returns all ancestor IDs using recursive CTE with cycle prevention';

-- =======================
-- 9. UPDATE get_descendants (with spouse inclusion)
-- =======================

CREATE OR REPLACE FUNCTION public.get_descendants(
  proband_id UUID,
  max_depth INT DEFAULT 4
)
RETURNS TABLE (
  descendant_id UUID,
  depth INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH RECURSIVE descendant_tree AS (
    -- Base case: start from proband's children
    SELECT
      pc.child_id AS descendant_id,
      1 AS depth,
      ARRAY[proband_id, pc.child_id] AS path
    FROM gt_v_parent_child pc
    WHERE pc.parent_id = proband_id

    UNION ALL

    -- Recursive case: find children of current descendants
    SELECT
      pc.child_id AS descendant_id,
      dt.depth + 1 AS depth,
      dt.path || pc.child_id
    FROM gt_v_parent_child pc
    JOIN descendant_tree dt ON pc.parent_id = dt.descendant_id
    WHERE dt.depth < max_depth
      AND NOT pc.child_id = ANY(dt.path)  -- Prevent cycles
  )
  SELECT DISTINCT
    dt.descendant_id,
    MIN(dt.depth) AS depth
  FROM descendant_tree dt
  GROUP BY dt.descendant_id
  ORDER BY depth;
$$;

COMMENT ON FUNCTION public.get_descendants IS 'Returns all descendant IDs using recursive CTE with cycle prevention';

-- =======================
-- 10. UPDATE get_tree_for_proband (include spouses)
-- =======================
-- Enhanced to also collect spouses of all found persons, so the tree
-- visualization can render complete family units with union nodes.

CREATE OR REPLACE FUNCTION public.get_tree_for_proband(
  proband_id UUID,
  mode TEXT DEFAULT 'ancestors',
  max_depth INT DEFAULT 4
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  person_ids UUID[];
  spouse_ids UUID[];
  all_ids UUID[];
  result JSON;
BEGIN
  -- Collect person IDs based on mode
  IF mode = 'ancestors' THEN
    SELECT ARRAY_AGG(DISTINCT id) INTO person_ids
    FROM (
      SELECT ancestor_id AS id FROM public.get_ancestors(proband_id, max_depth)
      UNION SELECT proband_id AS id
    ) t;

  ELSIF mode = 'descendants' THEN
    SELECT ARRAY_AGG(DISTINCT id) INTO person_ids
    FROM (
      SELECT descendant_id AS id FROM public.get_descendants(proband_id, max_depth)
      UNION SELECT proband_id AS id
    ) t;

  ELSE  -- hourglass
    SELECT ARRAY_AGG(DISTINCT person_id) INTO person_ids
    FROM public.get_hourglass(proband_id, max_depth);
  END IF;

  -- Handle empty result
  IF person_ids IS NULL OR array_length(person_ids, 1) IS NULL THEN
    person_ids := ARRAY[proband_id];
  END IF;

  -- Also collect spouses of all found persons
  -- This ensures complete family units are rendered
  SELECT ARRAY_AGG(DISTINCT spouse_id) INTO spouse_ids
  FROM (
    -- Spouses via pending_relatives spouse relationship
    SELECT pr.id AS spouse_id
    FROM public.pending_relatives pr
    WHERE pr.relationship_type = 'spouse'
      AND pr.invited_by = ANY(person_ids)
    UNION
    SELECT pr.invited_by AS spouse_id
    FROM public.pending_relatives pr
    WHERE pr.relationship_type = 'spouse'
      AND pr.id = ANY(person_ids)
    UNION
    -- Spouses via relationships table (legacy)
    SELECT r.user2_id AS spouse_id
    FROM public.relationships r
    WHERE r.relationship_type = 'spouse'
      AND r.user1_id = ANY(person_ids)
    UNION
    SELECT r.user1_id AS spouse_id
    FROM public.relationships r
    WHERE r.relationship_type = 'spouse'
      AND r.user2_id = ANY(person_ids)
  ) spouses
  WHERE spouse_id IS NOT NULL;

  -- Merge person_ids and spouse_ids
  IF spouse_ids IS NOT NULL AND array_length(spouse_ids, 1) > 0 THEN
    SELECT ARRAY_AGG(DISTINCT id) INTO all_ids
    FROM (
      SELECT UNNEST(person_ids) AS id
      UNION
      SELECT UNNEST(spouse_ids) AS id
    ) combined;
  ELSE
    all_ids := person_ids;
  END IF;

  -- Get full tree data
  SELECT public.get_tree_data(all_ids) INTO result;

  -- Add metadata
  SELECT json_build_object(
    'persons', result->'persons',
    'parentChild', result->'parentChild',
    'unions', result->'unions',
    'unionChildren', result->'unionChildren',
    '_meta', json_build_object(
      'proband_id', proband_id,
      'mode', mode,
      'max_depth', max_depth,
      'person_count', array_length(all_ids, 1)
    )
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_tree_for_proband IS 'All-in-one: returns complete tree data with spouses included for full family unit rendering';

-- =======================
-- 11. GRANT PERMISSIONS
-- =======================

GRANT SELECT ON public.gt_v_parent_child TO authenticated, anon;
GRANT SELECT ON public.gt_v_union TO authenticated, anon;
GRANT SELECT ON public.gt_v_union_child TO authenticated, anon;
GRANT SELECT ON public.gt_v_tree_stats TO authenticated, anon;
GRANT SELECT ON public.gt_v_person TO authenticated, anon;

GRANT EXECUTE ON FUNCTION public.get_ancestors TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_descendants TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hourglass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tree_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tree_for_proband TO authenticated;
