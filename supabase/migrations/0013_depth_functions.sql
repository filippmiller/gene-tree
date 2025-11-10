-- Migration: Depth-Based Relationship Query Functions
-- Date: 2025-11-10
-- Description: SQL functions for retrieving relatives with correct depth classification

-- =======================
-- 1. GET ANCESTORS WITH DEPTH
-- =======================
-- Миссия: Рекурсивный поиск предков с указанием глубины (сколько шагов вверх)
-- depth=1: родители, depth=2: бабушки/дедушки, depth=3: прабабушки/прадедушки

CREATE OR REPLACE FUNCTION public.get_ancestors_with_depth(
  person_id UUID,
  max_depth INT DEFAULT 4
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  gender TEXT,
  birth_date DATE,
  death_date DATE,
  photo_url TEXT,
  is_alive BOOLEAN,
  depth INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors(id, depth) AS (
    -- Базовый случай: сам человек (depth=0)
    SELECT person_id, 0
    
    UNION ALL
    
    -- Рекурсивный случай: родители текущего уровня
    SELECT 
      pc.parent_id,
      a.depth + 1
    FROM ancestors a
    JOIN public.gt_v_parent_child pc ON pc.child_id = a.id
    WHERE a.depth < max_depth
  )
  SELECT DISTINCT
    p.id,
    p.name,
    p.gender,
    p.birth_date,
    p.death_date,
    p.photo_url,
    p.is_alive,
    a.depth
  FROM ancestors a
  JOIN public.gt_v_person p ON p.id = a.id
  WHERE a.depth > 0  -- Исключаем самого человека
  ORDER BY a.depth, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_ancestors_with_depth IS 'Get ancestors with depth level (1=parents, 2=grandparents, etc.)';

-- =======================
-- 2. GET DESCENDANTS WITH DEPTH
-- =======================
-- Миссия: Рекурсивный поиск потомков с указанием глубины (сколько шагов вниз)
-- depth=1: дети, depth=2: внуки, depth=3: правнуки

CREATE OR REPLACE FUNCTION public.get_descendants_with_depth(
  person_id UUID,
  max_depth INT DEFAULT 4
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  gender TEXT,
  birth_date DATE,
  death_date DATE,
  photo_url TEXT,
  is_alive BOOLEAN,
  depth INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants(id, depth) AS (
    -- Базовый случай: сам человек (depth=0)
    SELECT person_id, 0
    
    UNION ALL
    
    -- Рекурсивный случай: дети текущего уровня
    SELECT 
      pc.child_id,
      d.depth + 1
    FROM descendants d
    JOIN public.gt_v_parent_child pc ON pc.parent_id = d.id
    WHERE d.depth < max_depth
  )
  SELECT DISTINCT
    p.id,
    p.name,
    p.gender,
    p.birth_date,
    p.death_date,
    p.photo_url,
    p.is_alive,
    d.depth
  FROM descendants d
  JOIN public.gt_v_person p ON p.id = d.id
  WHERE d.depth > 0  -- Исключаем самого человека
  ORDER BY d.depth, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_descendants_with_depth IS 'Get descendants with depth level (1=children, 2=grandchildren, etc.)';

-- =======================
-- 3. GET SIBLINGS
-- =======================
-- Миссия: Найти братьев и сестёр (людей с общими родителями)

CREATE OR REPLACE FUNCTION public.get_siblings(
  person_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  gender TEXT,
  birth_date DATE,
  death_date DATE,
  photo_url TEXT,
  is_alive BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.name,
    p.gender,
    p.birth_date,
    p.death_date,
    p.photo_url,
    p.is_alive
  FROM public.gt_v_parent_child pc_me
  JOIN public.gt_v_parent_child pc_sib ON pc_sib.parent_id = pc_me.parent_id
  JOIN public.gt_v_person p ON p.id = pc_sib.child_id
  WHERE pc_me.child_id = person_id
    AND pc_sib.child_id != person_id  -- Не включаем самого человека
  ORDER BY p.birth_date NULLS LAST, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_siblings IS 'Get siblings (people with common parents)';

-- =======================
-- 4. GET SPOUSES
-- =======================
-- Миссия: Найти супругов через relationships.spouse или через общих детей

CREATE OR REPLACE FUNCTION public.get_spouses(
  person_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  gender TEXT,
  birth_date DATE,
  death_date DATE,
  photo_url TEXT,
  is_alive BOOLEAN,
  marriage_date DATE,
  divorce_date DATE
) AS $$
BEGIN
  RETURN QUERY
  -- Вариант 1: прямая связь spouse в relationships
  SELECT DISTINCT
    p.id,
    p.name,
    p.gender,
    p.birth_date,
    p.death_date,
    p.photo_url,
    p.is_alive,
    r.marriage_date,
    r.divorce_date
  FROM public.relationships r
  JOIN public.gt_v_person p ON (
    CASE
      WHEN r.user1_id = person_id THEN p.id = r.user2_id
      WHEN r.user2_id = person_id THEN p.id = r.user1_id
      ELSE FALSE
    END
  )
  WHERE r.relationship_type = 'spouse'
    AND (r.user1_id = person_id OR r.user2_id = person_id)
  
  UNION
  
  -- Вариант 2: партнёры через общих детей (если нет записи spouse)
  SELECT DISTINCT
    p.id,
    p.name,
    p.gender,
    p.birth_date,
    p.death_date,
    p.photo_url,
    p.is_alive,
    NULL::DATE AS marriage_date,
    NULL::DATE AS divorce_date
  FROM public.gt_v_parent_child pc1
  JOIN public.gt_v_parent_child pc2 ON pc2.child_id = pc1.child_id
  JOIN public.gt_v_person p ON p.id = pc2.parent_id
  WHERE pc1.parent_id = person_id
    AND pc2.parent_id != person_id
    AND NOT EXISTS (
      -- Только если нет записи spouse
      SELECT 1
      FROM public.relationships r
      WHERE r.relationship_type = 'spouse'
        AND ((r.user1_id = person_id AND r.user2_id = pc2.parent_id)
          OR (r.user2_id = person_id AND r.user1_id = pc2.parent_id))
    )
  
  ORDER BY marriage_date NULLS LAST, name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_spouses IS 'Get spouses through relationships.spouse or common children';

-- =======================
-- USAGE EXAMPLES
-- =======================
-- SELECT * FROM public.get_ancestors_with_depth('user-uuid', 3);
-- SELECT * FROM public.get_descendants_with_depth('user-uuid', 3);
-- SELECT * FROM public.get_siblings('user-uuid');
-- SELECT * FROM public.get_spouses('user-uuid');
