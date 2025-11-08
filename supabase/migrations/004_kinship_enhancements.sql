-- Migration 004: Kinship Graph Enhancements
-- Date: 2025-11-08
-- Description: Extends existing relationships table with advanced kinship features
-- IMPORTANT: This migration ENHANCES existing schema, does not replace it

-- =======================
-- 1. RELATIONSHIP TYPES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS public.relationship_types (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('consanguine','affinal','legal','social')),
  is_directed BOOLEAN NOT NULL DEFAULT true,
  is_symmetric BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  default_inverse_code TEXT,
  default_inverse_type_id BIGINT REFERENCES public.relationship_types(id)
);

COMMENT ON TABLE public.relationship_types IS 'Типы родства: направление/симметрия/категория + инверсия';

-- =======================
-- 2. EXTEND RELATIONSHIPS TABLE
-- =======================
-- Add new columns to existing relationships table (if they don't exist)
DO $$
BEGIN
  -- Add type_id reference (will be populated later)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='type_id') THEN
    ALTER TABLE public.relationships ADD COLUMN type_id BIGINT REFERENCES public.relationship_types(id);
  END IF;

  -- Add qualifiers for more detailed relationships
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='in_law') THEN
    ALTER TABLE public.relationships ADD COLUMN in_law BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='halfness') THEN
    ALTER TABLE public.relationships ADD COLUMN halfness TEXT 
      CHECK (halfness IN ('full','half','step','adoptive','foster','unknown')) DEFAULT 'full';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='lineage') THEN
    ALTER TABLE public.relationships ADD COLUMN lineage TEXT 
      CHECK (lineage IN ('maternal','paternal','both','unknown')) DEFAULT 'unknown';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='is_ex') THEN
    ALTER TABLE public.relationships ADD COLUMN is_ex BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='cousin_degree') THEN
    ALTER TABLE public.relationships ADD COLUMN cousin_degree SMALLINT 
      CHECK (cousin_degree BETWEEN 1 AND 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='cousin_removed') THEN
    ALTER TABLE public.relationships ADD COLUMN cousin_removed SMALLINT NOT NULL DEFAULT 0 
      CHECK (cousin_removed BETWEEN 0 AND 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='notes') THEN
    ALTER TABLE public.relationships ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='source') THEN
    ALTER TABLE public.relationships ADD COLUMN source JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='qualifiers') THEN
    ALTER TABLE public.relationships ADD COLUMN qualifiers JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='relationships' AND column_name='created_by') THEN
    ALTER TABLE public.relationships ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add GIN index for qualifiers
CREATE INDEX IF NOT EXISTS idx_relationships_qualifiers_gin 
  ON public.relationships USING gin (qualifiers);

-- =======================
-- 3. KINSHIP LABELS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS public.kinship_labels (
  id BIGSERIAL PRIMARY KEY,
  type_id BIGINT NOT NULL REFERENCES public.relationship_types(id) ON DELETE CASCADE,
  lang TEXT NOT NULL, -- 'ru','en'
  direction TEXT NOT NULL CHECK (direction IN ('a_to_b','b_to_a','symmetric')),
  gender TEXT NOT NULL DEFAULT 'any' CHECK (gender IN ('male','female','nonbinary','unknown','any')),
  label TEXT NOT NULL
);

-- =======================
-- 4. SEED RELATIONSHIP TYPES
-- =======================
INSERT INTO public.relationship_types (code, category, is_directed, is_symmetric, description, default_inverse_code)
VALUES
  -- Consanguine (blood relations)
  ('parent', 'consanguine', true, false, 'Родитель → Ребёнок', 'child'),
  ('child', 'consanguine', true, false, 'Ребёнок → Родитель', 'parent'),
  ('sibling', 'consanguine', false, true, 'Брат/Сестра (симметрично)', null),
  ('grandparent', 'consanguine', true, false, 'Бабушка/Дедушка → Внук/Внучка', 'grandchild'),
  ('grandchild', 'consanguine', true, false, 'Внук/Внучка → Бабушка/Дедушка', 'grandparent'),
  ('aunt_uncle', 'consanguine', true, false, 'Тётя/Дядя → Племянник/Племянница', 'nephew_niece'),
  ('nephew_niece', 'consanguine', true, false, 'Племянник/Племянница → Тётя/Дядя', 'aunt_uncle'),
  ('cousin', 'consanguine', false, true, 'Кузены: degree/removed в полях', null),

  -- Affinal (by marriage)
  ('spouse', 'affinal', false, true, 'Супруг(а) (симметрично)', null),
  ('partner', 'affinal', false, true, 'Партнёр(ка) (симметрично)', null),
  ('ex_spouse', 'affinal', false, true, 'Бывшие супруги (симметрично)', null),
  ('ex_partner', 'affinal', false, true, 'Бывшие партнёры (симметрично)', null),
  ('parent_in_law', 'affinal', true, false, 'Родитель супруга/супруги → Зять/Невестка', 'child_in_law'),
  ('child_in_law', 'affinal', true, false, 'Зять/Невестка → Родитель супруга/супруги', 'parent_in_law'),
  ('sibling_in_law', 'affinal', false, true, 'Брат/Сестра супруга/супруги (симметрично)', null),

  -- Legal
  ('guardian', 'legal', true, false, 'Опекун → Подопечный', 'ward'),
  ('ward', 'legal', true, false, 'Подопечный → Опекун', 'guardian'),

  -- Social
  ('godparent', 'social', true, false, 'Крёстный/Крёстная → Крестник/Крестница', 'godchild'),
  ('godchild', 'social', true, false, 'Крестник/Крестница → Крёстный/Крёстная', 'godparent'),
  ('household_member', 'social', false, true, 'Член одного домохозяйства (симметрично)', null),
  ('co_parent', 'social', false, true, 'Совместный родитель без брака (симметрично)', null)
ON CONFLICT (code) DO NOTHING;

-- Update inverse type IDs
UPDATE public.relationship_types t
SET default_inverse_type_id = t2.id
FROM public.relationship_types t2
WHERE t.default_inverse_code = t2.code
  AND (t.default_inverse_type_id IS DISTINCT FROM t2.id);

-- =======================
-- 5. SEED LABELS (RU/EN)
-- =======================
INSERT INTO public.kinship_labels (type_id, lang, direction, gender, label)
SELECT id, 'ru', 'a_to_b', 'any',
  CASE code
    WHEN 'parent' THEN 'родитель'
    WHEN 'child' THEN 'ребёнок'
    WHEN 'sibling' THEN 'брат/сестра'
    WHEN 'grandparent' THEN 'бабушка/дедушка'
    WHEN 'grandchild' THEN 'внук/внучка'
    WHEN 'aunt_uncle' THEN 'тётя/дядя'
    WHEN 'nephew_niece' THEN 'племянник/племянница'
    WHEN 'cousin' THEN 'кузен(ка)'
    WHEN 'spouse' THEN 'супруг(а)'
    WHEN 'partner' THEN 'партнёр(ка)'
    WHEN 'ex_spouse' THEN 'бывший(ая) супруг(а)'
    WHEN 'ex_partner' THEN 'бывший(ая) партнёр(ка)'
    WHEN 'parent_in_law' THEN 'родитель супруга/супруги'
    WHEN 'child_in_law' THEN 'зять/невестка'
    WHEN 'sibling_in_law' THEN 'брат/сестра супруга/супруги'
    WHEN 'guardian' THEN 'опекун/попечитель'
    WHEN 'ward' THEN 'подопечный(ая)'
    WHEN 'godparent' THEN 'крёстный/крёстная'
    WHEN 'godchild' THEN 'крестник/крестница'
    WHEN 'household_member' THEN 'член домохозяйства'
    WHEN 'co_parent' THEN 'совместный родитель'
    ELSE code
  END
FROM public.relationship_types
ON CONFLICT DO NOTHING;

INSERT INTO public.kinship_labels (type_id, lang, direction, gender, label)
SELECT id, 'en', CASE WHEN is_symmetric THEN 'symmetric' ELSE 'a_to_b' END, 'any',
  CASE code
    WHEN 'parent' THEN 'parent'
    WHEN 'child' THEN 'child'
    WHEN 'sibling' THEN 'sibling'
    WHEN 'grandparent' THEN 'grandparent'
    WHEN 'grandchild' THEN 'grandchild'
    WHEN 'aunt_uncle' THEN 'aunt/uncle'
    WHEN 'nephew_niece' THEN 'niece/nephew'
    WHEN 'cousin' THEN 'cousin'
    WHEN 'spouse' THEN 'spouse'
    WHEN 'partner' THEN 'partner'
    WHEN 'ex_spouse' THEN 'ex-spouse'
    WHEN 'ex_partner' THEN 'ex-partner'
    WHEN 'parent_in_law' THEN 'parent-in-law'
    WHEN 'child_in_law' THEN 'child-in-law'
    WHEN 'sibling_in_law' THEN 'sibling-in-law'
    WHEN 'guardian' THEN 'guardian'
    WHEN 'ward' THEN 'ward'
    WHEN 'godparent' THEN 'godparent'
    WHEN 'godchild' THEN 'godchild'
    WHEN 'household_member' THEN 'household member'
    WHEN 'co_parent' THEN 'co-parent'
    ELSE code
  END
FROM public.relationship_types
ON CONFLICT DO NOTHING;

-- =======================
-- 6. MIGRATE EXISTING DATA
-- =======================
-- Populate type_id for existing relationships based on relationship_type string
UPDATE public.relationships r
SET type_id = rt.id
FROM public.relationship_types rt
WHERE r.relationship_type = rt.code
  AND r.type_id IS NULL;

-- =======================
-- 7. FUNCTIONS FOR TREE TRAVERSAL
-- =======================

-- Get ancestors (going up the tree via parent relationships)
CREATE OR REPLACE FUNCTION public.fn_get_ancestors(p_person UUID, p_max_depth INT DEFAULT 10)
RETURNS TABLE(ancestor_id UUID, depth INT, path UUID[])
LANGUAGE SQL AS $$
WITH RECURSIVE ancestors AS (
  SELECT r.user1_id AS ancestor_id, 1 AS depth, ARRAY[p_person, r.user1_id] AS path
  FROM public.relationships r
  WHERE r.user2_id = p_person 
    AND r.relationship_type = 'parent'
  UNION ALL
  SELECT r.user1_id, a.depth+1, a.path || r.user1_id
  FROM ancestors a
  JOIN public.relationships r ON r.user2_id = a.ancestor_id
  WHERE r.relationship_type = 'parent' 
    AND a.depth < p_max_depth
    AND NOT r.user1_id = ANY(a.path) -- prevent cycles
)
SELECT ancestor_id, depth, path FROM ancestors;
$$;

-- Get descendants (going down the tree via parent relationships)
CREATE OR REPLACE FUNCTION public.fn_get_descendants(p_person UUID, p_max_depth INT DEFAULT 10)
RETURNS TABLE(descendant_id UUID, depth INT, path UUID[])
LANGUAGE SQL AS $$
WITH RECURSIVE descendants AS (
  SELECT r.user2_id AS descendant_id, 1 AS depth, ARRAY[p_person, r.user2_id] AS path
  FROM public.relationships r
  WHERE r.user1_id = p_person 
    AND r.relationship_type = 'parent'
  UNION ALL
  SELECT r.user2_id, d.depth+1, d.path || r.user2_id
  FROM descendants d
  JOIN public.relationships r ON r.user1_id = d.descendant_id
  WHERE r.relationship_type = 'parent' 
    AND d.depth < p_max_depth
    AND NOT r.user2_id = ANY(d.path) -- prevent cycles
)
SELECT descendant_id, depth, path FROM descendants;
$$;

-- Compute layers for tree rendering (root=0, ancestors<0, descendants>0)
CREATE OR REPLACE FUNCTION public.fn_compute_layers(p_root UUID, p_up INT DEFAULT 6, p_down INT DEFAULT 6)
RETURNS TABLE(person_id UUID, layer INT)
LANGUAGE SQL AS $$
WITH
anc AS (SELECT ancestor_id AS id, -depth AS layer FROM public.fn_get_ancestors(p_root, p_up)),
descs AS (SELECT descendant_id AS id, depth AS layer FROM public.fn_get_descendants(p_root, p_down)),
root AS (SELECT p_root::UUID AS id, 0 AS layer)
SELECT * FROM root
UNION SELECT id, layer FROM anc
UNION SELECT id, layer FROM descs;
$$;

-- =======================
-- 8. VIEWS
-- =======================

-- Immediate family view
CREATE OR REPLACE VIEW public.v_immediate_family AS
SELECT 
  r.id,
  r.user1_id AS person_id,
  r.user2_id AS relative_id,
  r.relationship_type AS rel_code,
  r.in_law,
  r.halfness,
  r.lineage,
  r.is_ex,
  r.cousin_degree,
  r.cousin_removed,
  COALESCE(l.label, r.relationship_type) AS label
FROM public.relationships r
LEFT JOIN public.relationship_types rt ON rt.code = r.relationship_type
LEFT JOIN public.kinship_labels l
  ON l.type_id = rt.id
  AND l.lang = 'ru'
  AND (CASE WHEN rt.is_symmetric THEN l.direction='symmetric' ELSE l.direction='a_to_b' END);

-- Graph edges view for visualization
CREATE OR REPLACE VIEW public.v_graph_edges AS
SELECT
  r.id,
  r.user1_id AS source,
  r.user2_id AS target,
  r.relationship_type AS type_code,
  rt.is_symmetric,
  r.in_law,
  r.halfness,
  r.lineage,
  r.is_ex,
  r.cousin_degree,
  r.cousin_removed
FROM public.relationships r
LEFT JOIN public.relationship_types rt ON rt.code = r.relationship_type;

-- =======================
-- 9. HELPER FUNCTION FOR ADDING RELATIONSHIPS
-- =======================

CREATE OR REPLACE FUNCTION public.fn_add_relationship_by_code(
  p_user1 UUID,
  p_user2 UUID,
  p_code TEXT,
  p_qualifiers JSONB DEFAULT '{}'::jsonb,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE PLPGSQL AS $$
DECLARE
  new_id UUID;
  t_id BIGINT;
BEGIN
  -- Get type_id
  SELECT id INTO t_id FROM public.relationship_types WHERE code = p_code;
  
  IF t_id IS NULL THEN
    RAISE EXCEPTION 'Unknown relationship code: %', p_code;
  END IF;

  -- Insert relationship
  INSERT INTO public.relationships(
    user1_id, user2_id, relationship_type, type_id, created_by,
    in_law, halfness, lineage, is_ex,
    cousin_degree, cousin_removed, qualifiers
  )
  VALUES(
    p_user1, p_user2, p_code, t_id, p_created_by,
    COALESCE((p_qualifiers->>'in_law')::BOOLEAN, false),
    COALESCE(p_qualifiers->>'halfness', 'full'),
    COALESCE(p_qualifiers->>'lineage', 'unknown'),
    COALESCE((p_qualifiers->>'is_ex')::BOOLEAN, false),
    NULLIF((p_qualifiers->>'cousin_degree')::SMALLINT, 0),
    COALESCE((p_qualifiers->>'cousin_removed')::SMALLINT, 0),
    p_qualifiers
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END $$;

-- =======================
-- DONE
-- =======================
-- Migration 004: Kinship enhancements
-- Adds relationship_types table, qualifiers, tree traversal functions, and localized labels
