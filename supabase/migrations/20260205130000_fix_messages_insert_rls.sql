-- Migration: Fix Family Chat Messages INSERT RLS
-- Description: Allow members to insert messages
-- Created: 2026-02-05

-- Drop the overly restrictive INSERT policy
DROP POLICY IF EXISTS "Tree root can send messages" ON family_chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON family_chat_messages;

-- Create a proper INSERT policy that allows any chat member to send messages
-- Use SECURITY DEFINER function to check membership without RLS recursion
CREATE OR REPLACE FUNCTION can_send_family_chat_message(p_chat_id UUID, p_sender_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is a member of the chat and not muted
  RETURN EXISTS (
    SELECT 1 FROM family_chat_members
    WHERE chat_id = p_chat_id
    AND user_id = p_sender_id
    AND (is_muted = false OR muted_until < NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy using the helper function
CREATE POLICY "Members can send messages" ON family_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND can_send_family_chat_message(chat_id, sender_id)
  );

-- Also ensure members can update their own messages (for edit within 15 min)
DROP POLICY IF EXISTS "Users can edit own messages" ON family_chat_messages;
CREATE POLICY "Users can edit own messages" ON family_chat_messages
  FOR UPDATE USING (
    sender_id = auth.uid()
    AND created_at > NOW() - INTERVAL '15 minutes'
    AND is_deleted = false
  );
