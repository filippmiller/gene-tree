-- Migration: Fix Family Chat Messages RLS
-- Description: Fix RLS policies for family_chat_messages to avoid recursion
-- Created: 2026-02-05

-- Drop problematic policies
DROP POLICY IF EXISTS "Members can view messages" ON family_chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON family_chat_messages;

-- Simple policy: Users can view messages in chats they own (as tree root)
CREATE POLICY "Tree root can view messages" ON family_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_group_chats gc
      WHERE gc.id = family_chat_messages.chat_id
      AND gc.tree_root_user_id = auth.uid()
    )
  );

-- Simple policy: Users can send messages to their own chats
CREATE POLICY "Tree root can send messages" ON family_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM family_group_chats gc
      WHERE gc.id = family_chat_messages.chat_id
      AND gc.tree_root_user_id = auth.uid()
    )
  );

-- Function to get messages (bypasses RLS for authorized members)
CREATE OR REPLACE FUNCTION get_family_chat_messages(
  p_chat_id UUID,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  chat_id UUID,
  sender_id UUID,
  content TEXT,
  message_type chat_message_type,
  metadata JSONB,
  memory_source_id UUID,
  is_deleted BOOLEAN,
  created_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  sender_first_name TEXT,
  sender_last_name TEXT,
  sender_avatar_url TEXT
) AS $$
BEGIN
  -- Verify caller is a member of this chat
  IF NOT EXISTS (
    SELECT 1 FROM family_chat_members
    WHERE family_chat_members.chat_id = p_chat_id
    AND family_chat_members.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.chat_id,
    m.sender_id,
    m.content,
    m.message_type,
    m.metadata,
    m.memory_source_id,
    m.is_deleted,
    m.created_at,
    m.edited_at,
    p.first_name AS sender_first_name,
    p.last_name AS sender_last_name,
    p.avatar_url AS sender_avatar_url
  FROM family_chat_messages m
  LEFT JOIN user_profiles p ON p.id = m.sender_id
  WHERE m.chat_id = p_chat_id
    AND m.is_deleted = false
    AND (p_cursor IS NULL OR m.created_at < p_cursor)
  ORDER BY m.created_at DESC
  LIMIT p_limit + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_family_chat_messages IS 'Get paginated messages for a family chat (RLS-safe)';
