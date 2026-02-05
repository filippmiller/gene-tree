-- Migration: Full-Text Search with pg_trgm
-- Date: 2026-02-05
-- Description: Enables fuzzy text search for profile names using trigram similarity
--
-- Features:
--   - pg_trgm extension for similarity matching
--   - GIN indexes for fast fuzzy searches
--   - search_profiles() function supporting partial name matching
--   - Weighted scoring based on match quality

-- =======================
-- 1. ENABLE pg_trgm EXTENSION
-- =======================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =======================
-- 2. CREATE GIN INDEXES FOR TRIGRAM SEARCH
-- =======================
-- GIN indexes dramatically speed up LIKE/ILIKE and similarity queries

-- Index on first_name for fast fuzzy matching
CREATE INDEX IF NOT EXISTS idx_user_profiles_first_name_trgm
ON public.user_profiles
USING GIN (first_name gin_trgm_ops);

-- Index on last_name for fast fuzzy matching
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_name_trgm
ON public.user_profiles
USING GIN (last_name gin_trgm_ops);

-- Index on middle_name for fast fuzzy matching
CREATE INDEX IF NOT EXISTS idx_user_profiles_middle_name_trgm
ON public.user_profiles
USING GIN (middle_name gin_trgm_ops);

-- Index on maiden_name for fast fuzzy matching
CREATE INDEX IF NOT EXISTS idx_user_profiles_maiden_name_trgm
ON public.user_profiles
USING GIN (maiden_name gin_trgm_ops);

-- =======================
-- 3. SEARCH PROFILES FUNCTION
-- =======================
-- Searches profiles using trigram similarity with weighted scoring
-- Supports partial matching on first, last, middle, and maiden names

CREATE OR REPLACE FUNCTION public.search_profiles(
  search_query TEXT,
  family_id_filter UUID DEFAULT NULL,
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
  photo_url TEXT,
  family_id UUID,
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
    p.photo_url,
    p.family_id,
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
    -- Optional family filter
    (family_id_filter IS NULL OR p.family_id = family_id_filter)
    AND (
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
    )
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.search_profiles IS 'Fuzzy search for profiles using pg_trgm trigram similarity';

-- =======================
-- 4. SEARCH PROFILES BY FULL NAME
-- =======================
-- Optimized for "John Smith" style queries that span multiple name parts

CREATE OR REPLACE FUNCTION public.search_profiles_fullname(
  search_query TEXT,
  family_id_filter UUID DEFAULT NULL,
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
  photo_url TEXT,
  family_id UUID,
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
    p.photo_url,
    p.family_id,
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
    -- Optional family filter
    (family_id_filter IS NULL OR p.family_id = family_id_filter)
    AND (
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
    )
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.search_profiles_fullname IS 'Fuzzy search for profiles using full name matching';

-- =======================
-- 5. GRANT PERMISSIONS
-- =======================

GRANT EXECUTE ON FUNCTION public.search_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_fullname TO authenticated;

-- =======================
-- VERIFICATION
-- =======================
-- Test queries to verify the functions work:
--
-- -- Test single name search
-- SELECT * FROM public.search_profiles('john');
--
-- -- Test with family filter
-- SELECT * FROM public.search_profiles('smith', 'your-family-uuid');
--
-- -- Test full name search
-- SELECT * FROM public.search_profiles_fullname('john smith');
