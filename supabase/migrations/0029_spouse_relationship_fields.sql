-- ============================================================================
-- Migration 0029: Add spouse relationship fields
-- ============================================================================
-- Adds role labels and marriage dates to pending_relatives for spouse tracking
-- ============================================================================

-- 1. Add role columns for relationship labeling
ALTER TABLE public.pending_relatives 
ADD COLUMN IF NOT EXISTS role_for_a TEXT,
ADD COLUMN IF NOT EXISTS role_for_b TEXT;

-- 2. Add date columns for marriage tracking
ALTER TABLE public.pending_relatives 
ADD COLUMN IF NOT EXISTS marriage_date DATE,
ADD COLUMN IF NOT EXISTS divorce_date DATE;

-- 3. Add comments explaining the new columns
COMMENT ON COLUMN public.pending_relatives.role_for_a IS 
'Role label for person A (invited_by) in the relationship, e.g., "husband", "wife", "partner", "father", "mother"';

COMMENT ON COLUMN public.pending_relatives.role_for_b IS 
'Role label for person B (id) in the relationship, e.g., "husband", "wife", "partner", "son", "daughter"';

COMMENT ON COLUMN public.pending_relatives.marriage_date IS 
'Date of marriage for spouse relationships (NULL for non-spouse relationships)';

COMMENT ON COLUMN public.pending_relatives.divorce_date IS 
'Date of divorce for spouse relationships (NULL if still married or non-spouse relationship)';

-- 4. Create index on marriage_date for performance
CREATE INDEX IF NOT EXISTS idx_pending_relatives_marriage_date 
ON public.pending_relatives(marriage_date) 
WHERE marriage_date IS NOT NULL;

-- 5. Update gt_v_union view to include new fields
DROP VIEW IF EXISTS public.gt_v_union CASCADE;

CREATE OR REPLACE VIEW public.gt_v_union AS
SELECT
  gen_random_uuid() AS union_id,
  pr.invited_by AS person1_id,
  pr.id AS person2_id,
  pr.role_for_a AS role_p1,
  pr.role_for_b AS role_p2,
  pr.marriage_date,
  pr.divorce_date,
  pr.is_pending,
  pr.is_verified,
  pr.is_temporary
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'spouse'
  AND pr.invited_by IS NOT NULL;

COMMENT ON VIEW public.gt_v_union IS 
'Virtual union nodes from unified table with role labels and dates';

-- Grant permissions
GRANT SELECT ON public.gt_v_union TO authenticated, anon;

-- ============================================================================
-- END OF MIGRATION 0029
-- ============================================================================
