-- Migration: Fix Family Chat RLS Recursion
-- Description: Fix infinite recursion in family_chat_members RLS policy
-- Created: 2026-02-05

-- Drop the problematic policies
DROP POLICY IF EXISTS "Members can view memberships" ON family_chat_members;
DROP POLICY IF EXISTS "Members can view chat" ON family_group_chats;

-- Fixed policy for family_group_chats: users can view chats they created
-- (tree_root_user_id check avoids recursion)
CREATE POLICY "Users can view own family chat" ON family_group_chats
  FOR SELECT USING (tree_root_user_id = auth.uid());

-- Fixed policy for family_chat_members:
-- Users can see their own membership (no recursion)
CREATE POLICY "Users can view own membership" ON family_chat_members
  FOR SELECT USING (user_id = auth.uid());

-- Users can see other members if they are the tree root
CREATE POLICY "Tree root can view all members" ON family_chat_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_group_chats gc
      WHERE gc.id = family_chat_members.chat_id
      AND gc.tree_root_user_id = auth.uid()
    )
  );

-- Function to get all chat members (bypasses RLS for authorized users)
CREATE OR REPLACE FUNCTION get_family_chat_members(p_chat_id UUID)
RETURNS TABLE (
  id UUID,
  chat_id UUID,
  user_id UUID,
  role family_chat_role,
  is_muted BOOLEAN,
  muted_until TIMESTAMPTZ,
  notifications_enabled BOOLEAN,
  email_notifications BOOLEAN,
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID,
  joined_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT
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
    m.user_id,
    m.role,
    m.is_muted,
    m.muted_until,
    m.notifications_enabled,
    m.email_notifications,
    m.last_read_at,
    m.last_read_message_id,
    m.joined_at,
    p.first_name,
    p.last_name,
    p.avatar_url
  FROM family_chat_members m
  LEFT JOIN user_profiles p ON p.id = m.user_id
  WHERE m.chat_id = p_chat_id
  ORDER BY m.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_family_chat_members IS 'Get all members of a family chat with profiles (RLS-safe)';
