-- Migration: Family Messaging System
-- Description: Internal messaging between family members
-- Created: 2026-02-02

-- ============================================================================
-- MESSAGE THREADS TABLE
-- ============================================================================
-- Conversations between two users. Uses participant ordering constraint
-- to ensure uniqueness (participant_1 < participant_2 alphabetically by UUID)

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure consistent ordering and uniqueness
  CONSTRAINT unique_thread_participants UNIQUE(participant_1, participant_2),
  CONSTRAINT ordered_participants CHECK (participant_1 < participant_2)
);

-- ============================================================================
-- FAMILY MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for finding threads by participant
CREATE INDEX IF NOT EXISTS idx_threads_participant_1 ON message_threads(participant_1);
CREATE INDEX IF NOT EXISTS idx_threads_participant_2 ON message_threads(participant_2);

-- Index for getting messages in a thread ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON family_messages(thread_id, created_at DESC);

-- Index for counting unread messages efficiently
CREATE INDEX IF NOT EXISTS idx_messages_unread ON family_messages(from_user_id, read_at) WHERE read_at IS NULL;

-- Index for getting the last message in each thread
CREATE INDEX IF NOT EXISTS idx_messages_thread_latest ON family_messages(thread_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see threads they're part of
CREATE POLICY "Users can view own threads" ON message_threads
  FOR SELECT USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- Users can create threads (with themselves as a participant)
CREATE POLICY "Users can create threads" ON message_threads
  FOR INSERT WITH CHECK (
    auth.uid() IN (participant_1, participant_2)
  );

-- Users can update threads they're part of (for updated_at)
CREATE POLICY "Users can update own threads" ON message_threads
  FOR UPDATE USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- Users can view messages in their threads
CREATE POLICY "Users can view thread messages" ON family_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = family_messages.thread_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- Users can send messages to their threads
CREATE POLICY "Users can send messages" ON family_messages
  FOR INSERT WITH CHECK (
    from_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = thread_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- Users can mark messages as read (update read_at)
CREATE POLICY "Users can mark messages read" ON family_messages
  FOR UPDATE USING (
    -- Can only mark as read messages sent TO you (not from you)
    from_user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = family_messages.thread_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  )
  WITH CHECK (
    -- Only allow updating read_at field
    from_user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = family_messages.thread_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get or create a thread between two users
CREATE OR REPLACE FUNCTION get_or_create_message_thread(
  user_a UUID,
  user_b UUID
) RETURNS UUID AS $$
DECLARE
  p1 UUID;
  p2 UUID;
  thread_id UUID;
BEGIN
  -- Ensure consistent ordering
  IF user_a < user_b THEN
    p1 := user_a;
    p2 := user_b;
  ELSE
    p1 := user_b;
    p2 := user_a;
  END IF;

  -- Try to find existing thread
  SELECT id INTO thread_id
  FROM message_threads
  WHERE participant_1 = p1 AND participant_2 = p2;

  -- If not found, create new thread
  IF thread_id IS NULL THEN
    INSERT INTO message_threads (participant_1, participant_2)
    VALUES (p1, p2)
    RETURNING id INTO thread_id;
  END IF;

  RETURN thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update thread's updated_at when a message is sent
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread timestamp on new message
DROP TRIGGER IF EXISTS trigger_update_thread_timestamp ON family_messages;
CREATE TRIGGER trigger_update_thread_timestamp
  AFTER INSERT ON family_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_timestamp();

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for messages (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE family_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_threads;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE message_threads IS 'Conversations between two family members';
COMMENT ON TABLE family_messages IS 'Individual messages within a thread';
COMMENT ON COLUMN message_threads.participant_1 IS 'First participant (UUID sorted first)';
COMMENT ON COLUMN message_threads.participant_2 IS 'Second participant (UUID sorted second)';
COMMENT ON COLUMN family_messages.read_at IS 'When the recipient read the message (null = unread)';
