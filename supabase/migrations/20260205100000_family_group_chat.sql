-- Migration: Family Group Chat
-- Description: Group chat for entire family trees with system messages and memories
-- Created: 2026-02-05

-- ============================================================================
-- FAMILY GROUP CHATS TABLE
-- ============================================================================
-- One chat per family tree (identified by the root user who started the tree)
-- Auto-created when first family member is added

CREATE TABLE IF NOT EXISTS family_group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The family tree root (creator of the tree)
  tree_root_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Chat metadata
  name TEXT DEFAULT 'Family Chat',
  description TEXT,
  avatar_url TEXT,

  -- Settings
  is_active BOOLEAN DEFAULT true,
  member_limit INT DEFAULT 500,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One chat per family tree
  CONSTRAINT unique_tree_chat UNIQUE(tree_root_user_id)
);

-- ============================================================================
-- FAMILY CHAT MEMBERS TABLE
-- ============================================================================
-- Tracks membership, roles, and preferences per user

CREATE TYPE family_chat_role AS ENUM ('admin', 'member');

CREATE TABLE IF NOT EXISTS family_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES family_group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role and status
  role family_chat_role DEFAULT 'member',
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,

  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,

  -- Read tracking
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_message_id UUID,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_chat_member UNIQUE(chat_id, user_id)
);

-- ============================================================================
-- FAMILY CHAT MESSAGES TABLE
-- ============================================================================
-- All messages including user messages and system messages

CREATE TYPE chat_message_type AS ENUM (
  'user',           -- Regular user message
  'system',         -- System announcements
  'birthday',       -- Birthday reminder
  'anniversary',    -- Wedding anniversary
  'memorial',       -- Death memorial
  'welcome',        -- New member joined
  'milestone',      -- Family milestones
  'memory'          -- "On This Day" memories
);

CREATE TABLE IF NOT EXISTS family_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES family_group_chats(id) ON DELETE CASCADE,

  -- Sender (NULL for system messages)
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Message content
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  message_type chat_message_type DEFAULT 'user',

  -- For system messages - metadata about the event
  metadata JSONB DEFAULT '{}',

  -- For "On This Day" - reference to original message
  memory_source_id UUID REFERENCES family_chat_messages(id) ON DELETE SET NULL,

  -- Soft delete (for admin moderation)
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Chat lookups
CREATE INDEX IF NOT EXISTS idx_group_chats_tree_root ON family_group_chats(tree_root_user_id);

-- Member lookups
CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON family_chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON family_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_role ON family_chat_members(chat_id, role) WHERE role = 'admin';

-- Message queries (most recent first, excluding deleted)
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_time
  ON family_chat_messages(chat_id, created_at DESC)
  WHERE is_deleted = false;

-- Note: "On This Day" queries use the get_on_this_day_messages function
-- which filters by month/day at runtime (EXTRACT is not immutable for indexes)

-- Unread count optimization
CREATE INDEX IF NOT EXISTS idx_chat_messages_after
  ON family_chat_messages(chat_id, created_at)
  WHERE is_deleted = false;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE family_group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view chats they're members of
CREATE POLICY "Members can view chat" ON family_group_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_chat_members
      WHERE chat_id = family_group_chats.id
      AND user_id = auth.uid()
    )
  );

-- Only admins can update chat settings
CREATE POLICY "Admins can update chat" ON family_group_chats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_chat_members
      WHERE chat_id = family_group_chats.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Members can view their own membership
CREATE POLICY "Members can view memberships" ON family_chat_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_chat_members m
      WHERE m.chat_id = family_chat_members.chat_id
      AND m.user_id = auth.uid()
    )
  );

-- Members can update their own preferences
CREATE POLICY "Members can update own preferences" ON family_chat_members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update any member (for role changes, muting)
CREATE POLICY "Admins can update members" ON family_chat_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_chat_members m
      WHERE m.chat_id = family_chat_members.chat_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- Members can view messages in their chats
CREATE POLICY "Members can view messages" ON family_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_chat_members
      WHERE chat_id = family_chat_messages.chat_id
      AND user_id = auth.uid()
    )
  );

-- Members can send messages (not muted)
CREATE POLICY "Members can send messages" ON family_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM family_chat_members
      WHERE chat_id = family_chat_messages.chat_id
      AND user_id = auth.uid()
      AND (is_muted = false OR muted_until < NOW())
    )
  );

-- Users can edit their own messages (within 15 minutes)
CREATE POLICY "Users can edit own messages" ON family_chat_messages
  FOR UPDATE USING (
    sender_id = auth.uid()
    AND created_at > NOW() - INTERVAL '15 minutes'
    AND is_deleted = false
  )
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Admins can soft-delete any message
CREATE POLICY "Admins can delete messages" ON family_chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_chat_members
      WHERE chat_id = family_chat_messages.chat_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get or create family chat for a user's family tree
CREATE OR REPLACE FUNCTION get_or_create_family_chat(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
  v_tree_root UUID;
BEGIN
  -- Find the tree root for this user
  -- For now, use the user themselves as tree root
  -- In future, could traverse relationships to find actual root
  v_tree_root := p_user_id;

  -- Check if chat exists for this tree
  SELECT id INTO v_chat_id
  FROM family_group_chats
  WHERE tree_root_user_id = v_tree_root;

  -- Create if not exists
  IF v_chat_id IS NULL THEN
    INSERT INTO family_group_chats (tree_root_user_id)
    VALUES (v_tree_root)
    RETURNING id INTO v_chat_id;

    -- Add creator as admin
    INSERT INTO family_chat_members (chat_id, user_id, role)
    VALUES (v_chat_id, p_user_id, 'admin');
  END IF;

  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync family members to chat (call periodically or on relationship changes)
CREATE OR REPLACE FUNCTION sync_family_chat_members(p_chat_id UUID)
RETURNS INT AS $$
DECLARE
  v_tree_root UUID;
  v_added INT := 0;
BEGIN
  -- Get the tree root
  SELECT tree_root_user_id INTO v_tree_root
  FROM family_group_chats
  WHERE id = p_chat_id;

  IF v_tree_root IS NULL THEN
    RETURN 0;
  END IF;

  -- Add all family circle members who aren't already in the chat
  INSERT INTO family_chat_members (chat_id, user_id, role)
  SELECT p_chat_id, fc.profile_id, 'member'
  FROM get_family_circle_profile_ids(v_tree_root) fc
  WHERE NOT EXISTS (
    SELECT 1 FROM family_chat_members
    WHERE chat_id = p_chat_id AND user_id = fc.profile_id
  )
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_added = ROW_COUNT;
  RETURN v_added;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread count for a user in a chat
CREATE OR REPLACE FUNCTION get_chat_unread_count(p_chat_id UUID, p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_last_read TIMESTAMPTZ;
  v_count INT;
BEGIN
  SELECT last_read_at INTO v_last_read
  FROM family_chat_members
  WHERE chat_id = p_chat_id AND user_id = p_user_id;

  IF v_last_read IS NULL THEN
    v_last_read := '1970-01-01'::TIMESTAMPTZ;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM family_chat_messages
  WHERE chat_id = p_chat_id
    AND created_at > v_last_read
    AND is_deleted = false
    AND sender_id != p_user_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find "On This Day" messages from previous years
CREATE OR REPLACE FUNCTION get_on_this_day_messages(
  p_chat_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE,
  p_min_years_ago INT DEFAULT 1
)
RETURNS TABLE (
  message_id UUID,
  content TEXT,
  sender_id UUID,
  sender_name TEXT,
  created_at TIMESTAMPTZ,
  years_ago INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.sender_id,
    CONCAT(p.first_name, ' ', p.last_name) AS sender_name,
    m.created_at,
    EXTRACT(YEAR FROM p_target_date)::INT - EXTRACT(YEAR FROM m.created_at)::INT AS years_ago
  FROM family_chat_messages m
  LEFT JOIN user_profiles p ON p.id = m.sender_id
  WHERE m.chat_id = p_chat_id
    AND m.message_type = 'user'
    AND m.is_deleted = false
    AND EXTRACT(MONTH FROM m.created_at) = EXTRACT(MONTH FROM p_target_date)
    AND EXTRACT(DAY FROM m.created_at) = EXTRACT(DAY FROM p_target_date)
    AND EXTRACT(YEAR FROM m.created_at) < EXTRACT(YEAR FROM p_target_date) - p_min_years_ago + 1
  ORDER BY m.created_at DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update chat's updated_at when new message is sent
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE family_group_chats
  SET updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_timestamp
  AFTER INSERT ON family_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- Auto-add new family members to chat when relationships are created
CREATE OR REPLACE FUNCTION auto_add_to_family_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  -- Find chat for the family
  SELECT id INTO v_chat_id
  FROM family_group_chats
  WHERE tree_root_user_id IN (NEW.user1_id, NEW.user2_id)
  LIMIT 1;

  IF v_chat_id IS NOT NULL THEN
    -- Add both users if not already members
    INSERT INTO family_chat_members (chat_id, user_id, role)
    VALUES (v_chat_id, NEW.user1_id, 'member')
    ON CONFLICT (chat_id, user_id) DO NOTHING;

    INSERT INTO family_chat_members (chat_id, user_id, role)
    VALUES (v_chat_id, NEW.user2_id, 'member')
    ON CONFLICT (chat_id, user_id) DO NOTHING;

    -- Post welcome message for the new member
    INSERT INTO family_chat_messages (chat_id, message_type, content, metadata)
    SELECT
      v_chat_id,
      'welcome',
      CONCAT('Welcome to the family, ', p.first_name, '!'),
      jsonb_build_object('user_id', NEW.user2_id, 'relationship_type', NEW.relationship_type)
    FROM user_profiles p
    WHERE p.id = NEW.user2_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new relationships
CREATE TRIGGER trigger_auto_add_to_family_chat
  AFTER INSERT ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_to_family_chat();

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE family_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE family_chat_members;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE family_group_chats IS 'Group chat rooms for family trees';
COMMENT ON TABLE family_chat_members IS 'Membership and preferences for family chats';
COMMENT ON TABLE family_chat_messages IS 'Messages in family group chats including system messages';
COMMENT ON COLUMN family_chat_messages.message_type IS 'Type of message: user, system, birthday, anniversary, memorial, welcome, milestone, memory';
COMMENT ON COLUMN family_chat_messages.metadata IS 'Additional data for system messages (e.g., birthday person details)';
COMMENT ON COLUMN family_chat_messages.memory_source_id IS 'For "On This Day" memories, references the original message';
