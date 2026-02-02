-- ============================================================================
-- Migration: Family Bridge Requests
-- Purpose: Enable users to discover and connect with potential relatives
-- ============================================================================

-- 1) Bridge requests table
DO $$
BEGIN
  -- Create table if not exists (without constraint to avoid duplication error)
  CREATE TABLE IF NOT EXISTS public.bridge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claimed_relationship TEXT NOT NULL,
    common_ancestor_hint TEXT,
    supporting_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN (
      'pending', 'accepted', 'rejected', 'expired', 'withdrawn'
    )),
    responded_at TIMESTAMPTZ,
    response_message TEXT,
    established_relationship_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
  );

  -- Add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_pending_request'
  ) THEN
    ALTER TABLE public.bridge_requests
    ADD CONSTRAINT unique_pending_request UNIQUE (requester_id, target_user_id, status);
  END IF;
END $$;

-- 2) Potential bridges cache (for discovery performance)
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.bridge_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2) DEFAULT 0.0,
    match_reasons JSONB DEFAULT '[]'::jsonb,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_candidate'
  ) THEN
    ALTER TABLE public.bridge_candidates
    ADD CONSTRAINT unique_candidate UNIQUE (user_id, candidate_user_id);
  END IF;
END $$;

-- 3) Blocked users for bridge requests
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.bridge_blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_block'
  ) THEN
    ALTER TABLE public.bridge_blocked_users
    ADD CONSTRAINT unique_block UNIQUE (user_id, blocked_user_id);
  END IF;
END $$;

-- 4) Indexes for bridge_requests
CREATE INDEX IF NOT EXISTS idx_bridge_requests_requester
  ON public.bridge_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_bridge_requests_target
  ON public.bridge_requests(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_bridge_requests_status
  ON public.bridge_requests(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_bridge_requests_created
  ON public.bridge_requests(created_at DESC);

-- 5) Indexes for bridge_candidates
CREATE INDEX IF NOT EXISTS idx_bridge_candidates_user
  ON public.bridge_candidates(user_id, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_bridge_candidates_score
  ON public.bridge_candidates(user_id, match_score DESC);

-- 6) Indexes for blocked users
CREATE INDEX IF NOT EXISTS idx_bridge_blocked_users
  ON public.bridge_blocked_users(user_id);

-- 7) Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bridge_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bridge_requests_updated_at ON public.bridge_requests;
CREATE TRIGGER bridge_requests_updated_at
  BEFORE UPDATE ON public.bridge_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_bridge_requests_updated_at();

DROP TRIGGER IF EXISTS bridge_candidates_updated_at ON public.bridge_candidates;
CREATE TRIGGER bridge_candidates_updated_at
  BEFORE UPDATE ON public.bridge_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_bridge_requests_updated_at();

-- 8) RLS Policies
ALTER TABLE public.bridge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_blocked_users ENABLE ROW LEVEL SECURITY;

-- Bridge requests policies
DROP POLICY IF EXISTS "Users can view own bridge requests" ON public.bridge_requests;
CREATE POLICY "Users can view own bridge requests"
  ON public.bridge_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR target_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create bridge requests" ON public.bridge_requests;
CREATE POLICY "Users can create bridge requests"
  ON public.bridge_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Users can update bridge requests" ON public.bridge_requests;
CREATE POLICY "Users can update bridge requests"
  ON public.bridge_requests FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR target_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own bridge requests" ON public.bridge_requests;
CREATE POLICY "Users can delete own bridge requests"
  ON public.bridge_requests FOR DELETE TO authenticated
  USING (requester_id = auth.uid());

-- Bridge candidates policies
DROP POLICY IF EXISTS "Users can view own candidates" ON public.bridge_candidates;
CREATE POLICY "Users can view own candidates"
  ON public.bridge_candidates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage candidates" ON public.bridge_candidates;
CREATE POLICY "Service role can manage candidates"
  ON public.bridge_candidates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own candidates" ON public.bridge_candidates;
CREATE POLICY "Users can update own candidates"
  ON public.bridge_candidates FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Blocked users policies
DROP POLICY IF EXISTS "Users can view own blocks" ON public.bridge_blocked_users;
CREATE POLICY "Users can view own blocks"
  ON public.bridge_blocked_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create blocks" ON public.bridge_blocked_users;
CREATE POLICY "Users can create blocks"
  ON public.bridge_blocked_users FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own blocks" ON public.bridge_blocked_users;
CREATE POLICY "Users can delete own blocks"
  ON public.bridge_blocked_users FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 9) Function to find potential bridge candidates
-- This analyzes user profiles to find people who might be related
CREATE OR REPLACE FUNCTION public.find_bridge_candidates(p_user_id UUID)
RETURNS TABLE (
  candidate_id UUID,
  match_score DECIMAL(5,2),
  match_reasons JSONB
) AS $$
DECLARE
  v_user_profile RECORD;
BEGIN
  -- Get the requesting user's profile
  SELECT
    id,
    first_name,
    last_name,
    maiden_name,
    birth_place,
    death_place
  INTO v_user_profile
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_user_profile IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH scored_candidates AS (
    SELECT
      up.id AS candidate_id,
      -- Calculate match score based on various factors
      (
        -- Same last name (20 points)
        CASE WHEN up.last_name IS NOT NULL
          AND LOWER(up.last_name) = LOWER(v_user_profile.last_name)
          THEN 20.0 ELSE 0.0 END
        +
        -- Same maiden name (25 points)
        CASE WHEN up.maiden_name IS NOT NULL
          AND v_user_profile.maiden_name IS NOT NULL
          AND LOWER(up.maiden_name) = LOWER(v_user_profile.maiden_name)
          THEN 25.0 ELSE 0.0 END
        +
        -- Same birth place (15 points)
        CASE WHEN up.birth_place IS NOT NULL
          AND v_user_profile.birth_place IS NOT NULL
          AND LOWER(up.birth_place) = LOWER(v_user_profile.birth_place)
          THEN 15.0 ELSE 0.0 END
        +
        -- Check for matching ancestor names in pending_relatives (up to 40 points)
        COALESCE((
          SELECT COUNT(*) * 10.0
          FROM public.pending_relatives pr1
          JOIN public.pending_relatives pr2 ON LOWER(pr1.last_name) = LOWER(pr2.last_name)
          WHERE pr1.invited_by = p_user_id
            AND pr2.invited_by = up.id
            AND pr1.is_deceased = true
            AND pr2.is_deceased = true
          LIMIT 4
        ), 0.0)
      )::DECIMAL(5,2) AS match_score,
      -- Build match reasons array
      jsonb_build_array()
        || CASE WHEN up.last_name IS NOT NULL
            AND LOWER(up.last_name) = LOWER(v_user_profile.last_name)
            THEN jsonb_build_object('type', 'same_last_name', 'value', up.last_name)
            ELSE NULL END
        || CASE WHEN up.maiden_name IS NOT NULL
            AND v_user_profile.maiden_name IS NOT NULL
            AND LOWER(up.maiden_name) = LOWER(v_user_profile.maiden_name)
            THEN jsonb_build_object('type', 'same_maiden_name', 'value', up.maiden_name)
            ELSE NULL END
        || CASE WHEN up.birth_place IS NOT NULL
            AND v_user_profile.birth_place IS NOT NULL
            AND LOWER(up.birth_place) = LOWER(v_user_profile.birth_place)
            THEN jsonb_build_object('type', 'same_birth_place', 'value', up.birth_place)
            ELSE NULL END
      AS match_reasons
    FROM public.user_profiles up
    WHERE up.id != p_user_id
      -- Exclude already connected users
      AND up.id NOT IN (
        SELECT CASE
          WHEN r.user1_id = p_user_id THEN r.user2_id
          ELSE r.user1_id
        END
        FROM public.relationships r
        WHERE r.user1_id = p_user_id OR r.user2_id = p_user_id
      )
      -- Exclude blocked users
      AND up.id NOT IN (
        SELECT blocked_user_id FROM public.bridge_blocked_users WHERE user_id = p_user_id
      )
      AND p_user_id NOT IN (
        SELECT blocked_user_id FROM public.bridge_blocked_users WHERE user_id = up.id
      )
      -- Exclude users with pending/rejected requests
      AND up.id NOT IN (
        SELECT target_user_id FROM public.bridge_requests
        WHERE requester_id = p_user_id AND status IN ('pending', 'rejected')
      )
      AND up.id NOT IN (
        SELECT requester_id FROM public.bridge_requests
        WHERE target_user_id = p_user_id AND status IN ('pending', 'rejected')
      )
      -- Only include profiles that allow relative matching (if preferences exist)
      AND (
        NOT EXISTS (
          SELECT 1 FROM public.relative_matching_preferences rmp
          WHERE rmp.user_id = up.id
        )
        OR EXISTS (
          SELECT 1 FROM public.relative_matching_preferences rmp
          WHERE rmp.user_id = up.id AND rmp.allow_matching = true
        )
      )
  )
  SELECT
    sc.candidate_id,
    sc.match_score,
    -- Remove nulls from match_reasons array
    (SELECT jsonb_agg(elem) FROM jsonb_array_elements(sc.match_reasons) elem WHERE elem IS NOT NULL)
  FROM scored_candidates sc
  WHERE sc.match_score >= 15.0  -- Minimum threshold
  ORDER BY sc.match_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10) Function to accept a bridge request and create relationships
CREATE OR REPLACE FUNCTION public.accept_bridge_request(
  p_request_id UUID,
  p_relationship_type TEXT,
  p_response_message TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
  v_result JSONB;
BEGIN
  -- Get the request
  SELECT * INTO v_request
  FROM public.bridge_requests
  WHERE id = p_request_id
    AND target_user_id = auth.uid()
    AND status = 'pending';

  IF v_request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Update the request status
  UPDATE public.bridge_requests
  SET
    status = 'accepted',
    responded_at = NOW(),
    response_message = p_response_message,
    established_relationship_type = p_relationship_type
  WHERE id = p_request_id;

  -- Create the relationship (if relationships table exists with this schema)
  INSERT INTO public.relationships (user1_id, user2_id, relationship_type, verification_status)
  VALUES (v_request.requester_id, v_request.target_user_id, p_relationship_type, 'verified')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'relationship_type', p_relationship_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11) Function to get bridge request counts for dashboard widget
CREATE OR REPLACE FUNCTION public.get_bridge_request_counts(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'pending_received', (
      SELECT COUNT(*) FROM public.bridge_requests
      WHERE target_user_id = p_user_id AND status = 'pending'
    ),
    'pending_sent', (
      SELECT COUNT(*) FROM public.bridge_requests
      WHERE requester_id = p_user_id AND status = 'pending'
    ),
    'potential_matches', (
      SELECT COUNT(*) FROM public.bridge_candidates
      WHERE user_id = p_user_id AND is_dismissed = false
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 12) Grant execute permissions
GRANT EXECUTE ON FUNCTION public.find_bridge_candidates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_bridge_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bridge_request_counts(UUID) TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
