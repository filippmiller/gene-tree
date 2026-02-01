-- Migration 006: Fix related_to_user_id to support pending relatives
-- Change related_to_user_id to reference pending_relatives table instead of auth.users

-- Drop existing foreign key constraint
ALTER TABLE public.pending_relatives
DROP CONSTRAINT IF EXISTS pending_relatives_related_to_user_id_fkey;

-- Change related_to_user_id to allow references to pending_relatives OR auth.users
-- For simplicity, remove FK constraint and handle validation in app logic
-- This allows related_to_user_id to point to either:
--   1) A pending_relatives.id (for relatives of pending relatives)
--   2) An auth.users.id (for relatives of confirmed users)

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pending_relatives_related_to ON public.pending_relatives(related_to_user_id) WHERE related_to_user_id IS NOT NULL;

COMMENT ON COLUMN public.pending_relatives.related_to_user_id IS 'For indirect relationships: UUID of either pending_relatives.id or auth.users.id';
