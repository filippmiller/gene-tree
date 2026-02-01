-- Migration: Relative Matching / Cousin Finder System
-- Purpose: Enable users to find potential relatives who share ancestors
-- without DNA testing, with privacy controls and connection requests

-- ============================================
-- 1. MATCHING PREFERENCES TABLE
-- ============================================
-- Allows users to opt in/out of relative matching

CREATE TABLE IF NOT EXISTS matching_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_matching BOOLEAN DEFAULT true,
  notify_on_match BOOLEAN DEFAULT true,
  min_ancestor_depth INTEGER DEFAULT 2 CHECK (min_ancestor_depth >= 1 AND min_ancestor_depth <= 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE matching_preferences IS 'User preferences for relative matching and discovery';
COMMENT ON COLUMN matching_preferences.allow_matching IS 'Whether this user can appear in match results for others';
COMMENT ON COLUMN matching_preferences.notify_on_match IS 'Whether to notify user when potential relatives are found';
COMMENT ON COLUMN matching_preferences.min_ancestor_depth IS 'Minimum ancestor depth required for matches (filters out close relatives)';

-- ============================================
-- 2. CONNECTION REQUESTS TABLE
-- ============================================
-- Stores requests to connect with potential relatives

CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_ancestor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  relationship_description TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT no_self_connection CHECK (from_user_id != to_user_id),
  CONSTRAINT unique_pending_request UNIQUE (from_user_id, to_user_id, status)
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_connection_requests_from_user ON connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_to_user ON connection_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_pending ON connection_requests(to_user_id) WHERE status = 'pending';

COMMENT ON TABLE connection_requests IS 'Connection requests between users who may share ancestors';
COMMENT ON COLUMN connection_requests.shared_ancestor_id IS 'The common ancestor that triggered this match';
COMMENT ON COLUMN connection_requests.relationship_description IS 'Calculated relationship like "You both descend from Sarah Miller (1890-1965)"';

-- ============================================
-- 3. ANCESTOR CACHE TABLE
-- ============================================
-- Caches ancestor lists for performance (optional, can be computed on-the-fly)

CREATE TABLE IF NOT EXISTS ancestor_cache (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ancestor_id UUID NOT NULL,
  depth INTEGER NOT NULL CHECK (depth > 0),
  path UUID[] NOT NULL,
  last_computed TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, ancestor_id)
);

CREATE INDEX IF NOT EXISTS idx_ancestor_cache_ancestor ON ancestor_cache(ancestor_id);
CREATE INDEX IF NOT EXISTS idx_ancestor_cache_depth ON ancestor_cache(depth);

COMMENT ON TABLE ancestor_cache IS 'Cached ancestor paths for efficient matching queries';

-- ============================================
-- 4. RLS POLICIES
-- ============================================

ALTER TABLE matching_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ancestor_cache ENABLE ROW LEVEL SECURITY;

-- Matching Preferences: Users can only view/modify their own
CREATE POLICY "Users can view own matching preferences"
  ON matching_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matching preferences"
  ON matching_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matching preferences"
  ON matching_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Connection Requests: Users can see requests they sent or received
CREATE POLICY "Users can view their connection requests"
  ON connection_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create connection requests"
  ON connection_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Senders can cancel, recipients can respond"
  ON connection_requests FOR UPDATE
  USING (
    (auth.uid() = from_user_id AND status = 'pending') -- Sender can cancel pending
    OR
    (auth.uid() = to_user_id AND status = 'pending') -- Recipient can accept/decline pending
  );

-- Ancestor Cache: Users can only manage their own cache
CREATE POLICY "Users can view own ancestor cache"
  ON ancestor_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ancestor cache"
  ON ancestor_cache FOR ALL
  USING (auth.uid() = user_id);

-- Service role can access all for matching algorithm
CREATE POLICY "Service role full access to matching_preferences"
  ON matching_preferences FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to connection_requests"
  ON connection_requests FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to ancestor_cache"
  ON ancestor_cache FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 5. TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_matching_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_matching_preferences_updated_at ON matching_preferences;
CREATE TRIGGER trigger_matching_preferences_updated_at
  BEFORE UPDATE ON matching_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_matching_preferences_updated_at();

-- ============================================
-- 6. FUNCTION: Find Shared Ancestors Between Two Users
-- ============================================

CREATE OR REPLACE FUNCTION fn_find_shared_ancestors(
  p_user1 UUID,
  p_user2 UUID,
  p_max_depth INTEGER DEFAULT 8
)
RETURNS TABLE (
  ancestor_id UUID,
  user1_depth INTEGER,
  user2_depth INTEGER,
  ancestor_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user1_ancestors AS (
    SELECT
      a.ancestor_id,
      a.depth
    FROM fn_get_ancestors(p_user1, p_max_depth) a
  ),
  user2_ancestors AS (
    SELECT
      a.ancestor_id,
      a.depth
    FROM fn_get_ancestors(p_user2, p_max_depth) a
  )
  SELECT
    u1.ancestor_id,
    u1.depth AS user1_depth,
    u2.depth AS user2_depth,
    COALESCE(up.first_name || ' ' || up.last_name, 'Unknown') AS ancestor_name
  FROM user1_ancestors u1
  INNER JOIN user2_ancestors u2 ON u1.ancestor_id = u2.ancestor_id
  LEFT JOIN user_profiles up ON up.id = u1.ancestor_id
  ORDER BY (u1.depth + u2.depth) ASC;
END;
$$;

COMMENT ON FUNCTION fn_find_shared_ancestors IS 'Find common ancestors between two users with their respective depths';

-- ============================================
-- 7. FUNCTION: Get Potential Relative Matches
-- ============================================

CREATE OR REPLACE FUNCTION fn_get_potential_relatives(
  p_user_id UUID,
  p_max_depth INTEGER DEFAULT 6,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  relative_user_id UUID,
  relative_name TEXT,
  relative_avatar_url TEXT,
  shared_ancestor_id UUID,
  shared_ancestor_name TEXT,
  user_depth INTEGER,
  relative_depth INTEGER,
  relationship_closeness INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH my_ancestors AS (
    SELECT
      a.ancestor_id,
      a.depth
    FROM fn_get_ancestors(p_user_id, p_max_depth) a
  ),
  -- Find all users who share ancestors with me
  potential_matches AS (
    SELECT DISTINCT
      ac.user_id AS other_user_id,
      ac.ancestor_id,
      ma.depth AS my_depth,
      ac.depth AS their_depth
    FROM ancestor_cache ac
    INNER JOIN my_ancestors ma ON ma.ancestor_id = ac.ancestor_id
    WHERE ac.user_id != p_user_id
  ),
  -- Filter by matching preferences
  allowed_matches AS (
    SELECT pm.*
    FROM potential_matches pm
    INNER JOIN matching_preferences mp ON mp.user_id = pm.other_user_id
    WHERE mp.allow_matching = true
  ),
  -- Exclude already connected users
  unconnected_matches AS (
    SELECT am.*
    FROM allowed_matches am
    WHERE NOT EXISTS (
      SELECT 1 FROM relationships r
      WHERE (r.user1_id = p_user_id AND r.user2_id = am.other_user_id)
         OR (r.user1_id = am.other_user_id AND r.user2_id = p_user_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM connection_requests cr
      WHERE ((cr.from_user_id = p_user_id AND cr.to_user_id = am.other_user_id)
         OR (cr.from_user_id = am.other_user_id AND cr.to_user_id = p_user_id))
        AND cr.status IN ('pending', 'accepted')
    )
  ),
  -- Rank by relationship closeness
  ranked_matches AS (
    SELECT
      um.other_user_id,
      um.ancestor_id,
      um.my_depth,
      um.their_depth,
      (um.my_depth + um.their_depth) AS closeness,
      ROW_NUMBER() OVER (PARTITION BY um.other_user_id ORDER BY (um.my_depth + um.their_depth) ASC) AS rn
    FROM unconnected_matches um
  )
  SELECT
    rm.other_user_id AS relative_user_id,
    COALESCE(up.first_name || ' ' || up.last_name, 'Unknown User') AS relative_name,
    up.avatar_url AS relative_avatar_url,
    rm.ancestor_id AS shared_ancestor_id,
    COALESCE(ancestor.first_name || ' ' || ancestor.last_name, 'Unknown') AS shared_ancestor_name,
    rm.my_depth AS user_depth,
    rm.their_depth AS relative_depth,
    rm.closeness AS relationship_closeness
  FROM ranked_matches rm
  LEFT JOIN user_profiles up ON up.id = rm.other_user_id
  LEFT JOIN user_profiles ancestor ON ancestor.id = rm.ancestor_id
  WHERE rm.rn = 1
  ORDER BY rm.closeness ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION fn_get_potential_relatives IS 'Find potential relatives who share ancestors with the given user';

-- ============================================
-- 8. FUNCTION: Refresh Ancestor Cache for User
-- ============================================

CREATE OR REPLACE FUNCTION fn_refresh_ancestor_cache(p_user_id UUID, p_max_depth INTEGER DEFAULT 8)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Delete existing cache
  DELETE FROM ancestor_cache WHERE user_id = p_user_id;

  -- Insert fresh ancestor data
  INSERT INTO ancestor_cache (user_id, ancestor_id, depth, path)
  SELECT
    p_user_id,
    a.ancestor_id,
    a.depth,
    a.path
  FROM fn_get_ancestors(p_user_id, p_max_depth) a;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION fn_refresh_ancestor_cache IS 'Refresh the ancestor cache for a specific user';

-- ============================================
-- 9. NOTIFICATION TRIGGER FOR CONNECTION REQUESTS
-- ============================================

CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER AS $$
DECLARE
  v_from_user_name TEXT;
  v_shared_ancestor_name TEXT;
BEGIN
  -- Get sender name
  SELECT first_name || ' ' || last_name INTO v_from_user_name
  FROM user_profiles WHERE id = NEW.from_user_id;

  -- Get ancestor name if available
  IF NEW.shared_ancestor_id IS NOT NULL THEN
    SELECT first_name || ' ' || last_name INTO v_shared_ancestor_name
    FROM user_profiles WHERE id = NEW.shared_ancestor_id;
  END IF;

  -- Create notification for recipient
  INSERT INTO notifications (
    event_type,
    actor_profile_id,
    primary_profile_id,
    related_profile_id,
    payload
  ) VALUES (
    'connection_request_received',
    NEW.from_user_id,
    NEW.to_user_id,
    NEW.shared_ancestor_id,
    jsonb_build_object(
      'from_user_name', v_from_user_name,
      'shared_ancestor_name', v_shared_ancestor_name,
      'message', NEW.message,
      'request_id', NEW.id
    )
  );

  -- Create recipient record
  INSERT INTO notification_recipients (notification_id, profile_id)
  SELECT currval(pg_get_serial_sequence('notifications', 'id')), NEW.to_user_id
  WHERE EXISTS (SELECT 1 FROM notifications WHERE id = currval(pg_get_serial_sequence('notifications', 'id')));

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the insert if notification fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_connection_request_notification ON connection_requests;
CREATE TRIGGER trigger_connection_request_notification
  AFTER INSERT ON connection_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_connection_request();

-- ============================================
-- 10. DEFAULT MATCHING PREFERENCES FOR EXISTING USERS
-- ============================================

INSERT INTO matching_preferences (user_id, allow_matching, notify_on_match)
SELECT id, true, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM matching_preferences)
ON CONFLICT (user_id) DO NOTHING;
