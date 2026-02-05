-- Migration: Fix search_profiles functions schema
-- Date: 2026-02-05
-- Description: Removes family_id references (column doesn't exist in user_profiles)

-- =======================
-- 1. DROP AND RECREATE search_profiles
-- =======================

DROP FUNCTION IF EXISTS public.search_profiles(TEXT, UUID, INT, FLOAT);
DROP FUNCTION IF EXISTS public.search_profiles(TEXT, INT, FLOAT);

CREATE OR REPLACE FUNCTION public.search_profiles(
  search_query TEXT,
  limit_count INT DEFAULT 20,
  min_similarity FLOAT DEFAULT 0.1
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  maiden_name TEXT,
  birth_date DATE,
  gender TEXT,
  avatar_url TEXT,
  similarity_score FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  normalized_query TEXT;
BEGIN
  -- Normalize search query (lowercase, trim whitespace)
  normalized_query := LOWER(TRIM(search_query));

  -- Return empty if query is too short
  IF LENGTH(normalized_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.middle_name,
    p.last_name,
    p.maiden_name,
    p.birth_date,
    p.gender,
    p.avatar_url,
    -- Weighted similarity score combining all name fields
    GREATEST(
      COALESCE(similarity(LOWER(p.first_name), normalized_query), 0) * 1.2,  -- Boost first name
      COALESCE(similarity(LOWER(p.last_name), normalized_query), 0) * 1.0,
      COALESCE(similarity(LOWER(p.middle_name), normalized_query), 0) * 0.8,
      COALESCE(similarity(LOWER(p.maiden_name), normalized_query), 0) * 0.9,
      -- Also check for partial contains (ILIKE style matching)
      CASE WHEN LOWER(p.first_name) ILIKE '%' || normalized_query || '%' THEN 0.7 ELSE 0 END,
      CASE WHEN LOWER(p.last_name) ILIKE '%' || normalized_query || '%' THEN 0.6 ELSE 0 END
    )::FLOAT AS similarity_score
  FROM public.user_profiles p
  WHERE
    -- Trigram similarity matching
    similarity(LOWER(p.first_name), normalized_query) > min_similarity
    OR similarity(LOWER(p.last_name), normalized_query) > min_similarity
    OR similarity(LOWER(p.middle_name), normalized_query) > min_similarity
    OR similarity(LOWER(p.maiden_name), normalized_query) > min_similarity
    -- Also match partial strings (handles typing in progress)
    OR LOWER(p.first_name) ILIKE '%' || normalized_query || '%'
    OR LOWER(p.last_name) ILIKE '%' || normalized_query || '%'
    OR LOWER(p.middle_name) ILIKE '%' || normalized_query || '%'
    OR LOWER(p.maiden_name) ILIKE '%' || normalized_query || '%'
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.search_profiles IS 'Fuzzy search for profiles using pg_trgm trigram similarity';

-- =======================
-- 2. DROP AND RECREATE search_profiles_fullname
-- =======================

DROP FUNCTION IF EXISTS public.search_profiles_fullname(TEXT, UUID, INT);
DROP FUNCTION IF EXISTS public.search_profiles_fullname(TEXT, INT);

CREATE OR REPLACE FUNCTION public.search_profiles_fullname(
  search_query TEXT,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  maiden_name TEXT,
  birth_date DATE,
  gender TEXT,
  avatar_url TEXT,
  similarity_score FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  search_parts TEXT[];
  normalized_query TEXT;
BEGIN
  -- Normalize and split query into parts
  normalized_query := LOWER(TRIM(search_query));
  search_parts := string_to_array(normalized_query, ' ');

  -- Return empty if query is too short
  IF LENGTH(normalized_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.middle_name,
    p.last_name,
    p.maiden_name,
    p.birth_date,
    p.gender,
    p.avatar_url,
    -- Combined score for full name matching
    (
      COALESCE(similarity(
        LOWER(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)),
        normalized_query
      ), 0) +
      -- Bonus for exact word matches
      (
        SELECT COUNT(*)::FLOAT * 0.3
        FROM unnest(search_parts) AS part
        WHERE LOWER(p.first_name) = part
           OR LOWER(p.last_name) = part
           OR LOWER(p.middle_name) = part
      )
    )::FLOAT AS similarity_score
  FROM public.user_profiles p
  WHERE
    -- Match against concatenated full name
    similarity(
      LOWER(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)),
      normalized_query
    ) > 0.1
    -- Or any part matches
    OR EXISTS (
      SELECT 1 FROM unnest(search_parts) AS part
      WHERE similarity(LOWER(p.first_name), part) > 0.3
         OR similarity(LOWER(p.last_name), part) > 0.3
    )
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.search_profiles_fullname IS 'Fuzzy search for profiles using full name matching';

-- =======================
-- 3. GRANT PERMISSIONS
-- =======================

GRANT EXECUTE ON FUNCTION public.search_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_fullname TO authenticated;
