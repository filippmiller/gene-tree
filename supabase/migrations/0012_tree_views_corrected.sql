-- Migration: Corrected Tree Views with Proper Depth Classification
-- Date: 2025-11-10
-- Description: Creates VIEW adapters for family tree visualization with correct parent-child relationships

-- =======================
-- DROP EXISTING VIEWS (if any)
-- =======================
DROP VIEW IF EXISTS public.gt_v_tree_stats CASCADE;
DROP VIEW IF EXISTS public.gt_v_union_child CASCADE;
DROP VIEW IF EXISTS public.gt_v_union CASCADE;
DROP VIEW IF EXISTS public.gt_v_parent_child CASCADE;
DROP VIEW IF EXISTS public.gt_v_person CASCADE;

-- =======================
-- 1. NORMALIZED PERSON VIEW
-- =======================
-- Миссия: Единое представление людей из user_profiles
-- Используется: во всех запросах дерева и relationships

CREATE VIEW public.gt_v_person AS
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
FROM public.user_profiles p;

COMMENT ON VIEW public.gt_v_person IS 'Normalized view of people from user_profiles';

-- =======================
-- 2. PARENT→CHILD VIEW
-- =======================
-- Миссия: Извлечение ТОЛЬКО parent→child связей из relationships
-- ВАЖНО: relationship_type='parent' означает user1 является родителем user2

CREATE OR REPLACE VIEW public.gt_v_parent_child AS
SELECT
  r.user1_id AS parent_id,
  r.user2_id AS child_id
FROM public.relationships r
WHERE r.relationship_type = 'parent';

COMMENT ON VIEW public.gt_v_parent_child IS 'Parent→child relationships (user1 is parent of user2)';

-- =======================
-- 3. UNION NODES (MARRIAGES/PARTNERSHIPS)
-- =======================
-- Миссия: Создание виртуальных узлов "союз" для пар родителей
-- Логика:
--   - Если у ребёнка 2 родителя → создаём union из двух
--   - Если 1 родитель → union из одного (single parent)
-- Формат ID: 'U:parent1_id' или 'U:parent1_id:parent2_id'

CREATE OR REPLACE VIEW public.gt_v_union AS
WITH child_parents AS (
  -- Группируем родителей по ребёнку
  SELECT 
    pc.child_id,
    ARRAY_AGG(DISTINCT pc.parent_id ORDER BY pc.parent_id) AS parents
  FROM public.gt_v_parent_child pc
  GROUP BY pc.child_id
),
union_candidates AS (
  -- Формируем union_id в зависимости от количества родителей
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
  -- Дополнительно: даты брака из relationships (если есть spouse связь)
  r.marriage_date,
  r.divorce_date
FROM union_candidates uc
LEFT JOIN public.relationships r ON (
  r.relationship_type = 'spouse'
  AND (
    (r.user1_id = uc.parents[1] AND r.user2_id = uc.parents[2])
    OR
    (r.user2_id = uc.parents[1] AND r.user1_id = uc.parents[2])
  )
)
WHERE ARRAY_LENGTH(uc.parents, 1) >= 1;

COMMENT ON VIEW public.gt_v_union IS 'Virtual union nodes representing parent pairs (marriages/partnerships)';

-- =======================
-- 4. UNION→CHILD VIEW
-- =======================
-- Миссия: Связь между union узлом и детьми
-- Каждый ребёнок "висит" под своим union узлом

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

COMMENT ON VIEW public.gt_v_union_child IS 'Union→child relationships for tree visualization';

-- =======================
-- 5. TREE STATISTICS VIEW
-- =======================
-- Миссия: Быстрая статистика для отладки и мониторинга

CREATE OR REPLACE VIEW public.gt_v_tree_stats AS
SELECT
  (SELECT COUNT(*) FROM public.gt_v_person) AS total_persons,
  (SELECT COUNT(*) FROM public.gt_v_parent_child) AS total_parent_child_links,
  (SELECT COUNT(*) FROM public.gt_v_union) AS total_unions,
  (SELECT COUNT(*) FROM public.gt_v_union_child) AS total_union_child_links,
  (SELECT COUNT(*) FROM public.relationships WHERE relationship_type = 'spouse') AS total_marriages;

COMMENT ON VIEW public.gt_v_tree_stats IS 'Statistics about tree data for debugging';

-- =======================
-- VERIFICATION QUERIES
-- =======================
-- Проверка: должны вернуть числа > 0 если есть данные
-- SELECT * FROM public.gt_v_tree_stats;
-- SELECT COUNT(*) FROM public.gt_v_person;
-- SELECT COUNT(*) FROM public.gt_v_parent_child;
-- SELECT COUNT(*) FROM public.gt_v_union;
-- SELECT COUNT(*) FROM public.gt_v_union_child;
