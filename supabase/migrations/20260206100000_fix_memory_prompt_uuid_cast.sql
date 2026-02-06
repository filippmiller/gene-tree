-- Fix: get_daily_memory_prompt crashes with "invalid input syntax for type uuid"
-- Root cause: (mp.id::text || v_day_of_year::text)::uuid produces an invalid UUID
-- when concatenating a 36-char UUID with a day number (37+ chars is not a valid UUID)
-- Fix: use md5() for deterministic ordering instead of casting to uuid

CREATE OR REPLACE FUNCTION get_daily_memory_prompt(
  p_user_id UUID,
  p_context_profile_id UUID DEFAULT NULL
)
RETURNS TABLE (
  prompt_id UUID,
  prompt_en TEXT,
  prompt_ru TEXT,
  category TEXT,
  placeholder_type TEXT,
  is_seasonal BOOLEAN,
  season TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  v_day_of_year INTEGER;
  v_current_season TEXT;
  v_prompt RECORD;
BEGIN
  v_day_of_year := EXTRACT(DOY FROM CURRENT_DATE)::INTEGER;
  v_current_season := get_current_season();

  -- First, try to get a seasonal prompt if applicable
  IF v_current_season IN ('winter', 'summer') THEN
    SELECT mp.* INTO v_prompt
    FROM memory_prompts mp
    WHERE mp.is_active = true
      AND mp.is_seasonal = true
      AND mp.season = v_current_season
      AND mp.id NOT IN (
        SELECT upr.prompt_id FROM user_prompt_responses upr
        WHERE upr.user_id = p_user_id AND upr.skipped = false
      )
    ORDER BY random()
    LIMIT 1;

    IF v_prompt IS NOT NULL THEN
      RETURN QUERY SELECT
        v_prompt.id,
        v_prompt.prompt_en,
        v_prompt.prompt_ru,
        v_prompt.category,
        v_prompt.placeholder_type,
        v_prompt.is_seasonal,
        v_prompt.season,
        true AS is_new;
      RETURN;
    END IF;
  END IF;

  -- If viewing a profile, try relationship-specific prompts
  IF p_context_profile_id IS NOT NULL THEN
    SELECT mp.* INTO v_prompt
    FROM memory_prompts mp
    WHERE mp.is_active = true
      AND mp.category = 'relationship'
      AND mp.id NOT IN (
        SELECT upr.prompt_id FROM user_prompt_responses upr
        WHERE upr.user_id = p_user_id
          AND (upr.skipped = true OR upr.story_id IS NOT NULL)
      )
    ORDER BY random()
    LIMIT 1;

    IF v_prompt IS NOT NULL THEN
      RETURN QUERY SELECT
        v_prompt.id,
        v_prompt.prompt_en,
        v_prompt.prompt_ru,
        v_prompt.category,
        v_prompt.placeholder_type,
        v_prompt.is_seasonal,
        v_prompt.season,
        true AS is_new;
      RETURN;
    END IF;
  END IF;

  -- Default: Get an unanswered prompt, rotating by day
  SELECT mp.* INTO v_prompt
  FROM memory_prompts mp
  WHERE mp.is_active = true
    AND mp.id NOT IN (
      SELECT upr.prompt_id FROM user_prompt_responses upr
      WHERE upr.user_id = p_user_id
        AND (upr.skipped = true OR upr.story_id IS NOT NULL)
    )
    -- Exclude prompts with remind_later that haven't expired
    AND mp.id NOT IN (
      SELECT upr.prompt_id FROM user_prompt_responses upr
      WHERE upr.user_id = p_user_id
        AND upr.remind_later = true
        AND upr.remind_after > NOW()
    )
  ORDER BY
    -- Deterministic daily rotation: md5 produces a valid 32-char hex for sorting
    md5(mp.id::text || v_day_of_year::text)
  LIMIT 1;

  IF v_prompt IS NOT NULL THEN
    RETURN QUERY SELECT
      v_prompt.id,
      v_prompt.prompt_en,
      v_prompt.prompt_ru,
      v_prompt.category,
      v_prompt.placeholder_type,
      v_prompt.is_seasonal,
      v_prompt.season,
      true AS is_new;
    RETURN;
  END IF;

  -- If all prompts have been seen, get the oldest skipped one
  SELECT mp.* INTO v_prompt
  FROM memory_prompts mp
  JOIN user_prompt_responses upr ON upr.prompt_id = mp.id
  WHERE mp.is_active = true
    AND upr.user_id = p_user_id
    AND upr.skipped = true
  ORDER BY upr.responded_at ASC
  LIMIT 1;

  IF v_prompt IS NOT NULL THEN
    RETURN QUERY SELECT
      v_prompt.id,
      v_prompt.prompt_en,
      v_prompt.prompt_ru,
      v_prompt.category,
      v_prompt.placeholder_type,
      v_prompt.is_seasonal,
      v_prompt.season,
      false AS is_new;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
