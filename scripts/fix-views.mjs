import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://mbntpsfllwhlnzuzspvp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U',
  { db: { schema: 'public' } }
);

const sql = `
-- Drop existing views
DROP VIEW IF EXISTS public.gt_v_tree_stats CASCADE;
DROP VIEW IF EXISTS public.gt_v_union_child CASCADE;
DROP VIEW IF EXISTS public.gt_v_union CASCADE;
DROP VIEW IF EXISTS public.gt_v_parent_child CASCADE;

-- View: gt_v_parent_child
CREATE OR REPLACE VIEW public.gt_v_parent_child AS
SELECT
  pr.invited_by AS parent_id,
  pr.id AS child_id
FROM public.pending_relatives pr
WHERE pr.relationship_type = 'parent'
  AND pr.invited_by IS NOT NULL;

-- View: gt_v_union
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

-- View: gt_v_union_child
CREATE OR REPLACE VIEW public.gt_v_union_child AS
SELECT DISTINCT
  gen_random_uuid() AS union_id,
  pr.id AS child_id
FROM public.pending_relatives pr
WHERE pr.relationship_type IN ('parent', 'child')
  AND pr.invited_by IS NOT NULL;

-- View: gt_v_tree_stats
CREATE OR REPLACE VIEW public.gt_v_tree_stats AS
SELECT
  COUNT(DISTINCT invited_by) AS total_people,
  COUNT(DISTINCT CASE WHEN relationship_type = 'parent' THEN id END) AS total_parents,
  COUNT(DISTINCT CASE WHEN relationship_type = 'child' THEN id END) AS total_children,
  COUNT(DISTINCT CASE WHEN relationship_type = 'spouse' THEN id END) AS total_unions
FROM public.pending_relatives;
`;

console.log('Applying VIEW fix migration...');

// Execute via REST API using pg_stat_statements workaround
const { data, error } = await supabase.rpc('exec_sql', { query: sql });

if (error) {
  console.error('Error:', error);
  process.exit(1);
} else {
  console.log('✓ Migration applied successfully!');
}
