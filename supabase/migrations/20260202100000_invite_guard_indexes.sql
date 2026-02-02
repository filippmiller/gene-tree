-- Migration: 0037_invite_guard_indexes.sql
-- Date: 2026-02-02
-- Purpose: Performance indexes for Smart Invite Guard feature
--
-- The Smart Invite Guard prevents duplicate invitations by checking:
-- 1. If a user already exists with matching phone number
-- 2. If a pending invitation already exists for email+status
-- 3. If a pending invitation already exists for phone+status
--
-- These indexes optimize the lookup queries that run on every invite attempt.

-- =======================
-- 1. USER PROFILES PHONE INDEX
-- =======================
-- Enables fast lookup of existing users by phone number.
-- Partial index excludes NULL phones to reduce index size.
-- Used by: Smart Invite Guard to detect "user already exists" scenarios

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
  ON public.user_profiles(phone)
  WHERE phone IS NOT NULL;

COMMENT ON INDEX idx_user_profiles_phone IS
  'Smart Invite Guard: fast lookup of existing users by phone number';

-- =======================
-- 2. PENDING RELATIVES EMAIL + STATUS INDEX
-- =======================
-- Composite index for finding pending invites by email.
-- Supports queries like: WHERE email = ? AND status = 'pending'
-- Replaces the single-column email index for invite guard queries.
--
-- Note: The existing idx_pending_relatives_email covers email-only lookups.
-- This composite index adds status for the common guard query pattern.

CREATE INDEX IF NOT EXISTS idx_pending_relatives_email_status
  ON public.pending_relatives(email, status)
  WHERE email IS NOT NULL;

COMMENT ON INDEX idx_pending_relatives_email_status IS
  'Smart Invite Guard: find pending invites by email and status';

-- =======================
-- 3. PENDING RELATIVES PHONE + STATUS INDEX
-- =======================
-- Composite index for finding pending invites by phone.
-- Supports queries like: WHERE phone = ? AND status = 'pending'
-- Replaces the single-column phone index for invite guard queries.
--
-- Note: The existing idx_pending_relatives_phone covers phone-only lookups.
-- This composite index adds status for the common guard query pattern.

CREATE INDEX IF NOT EXISTS idx_pending_relatives_phone_status
  ON public.pending_relatives(phone, status)
  WHERE phone IS NOT NULL;

COMMENT ON INDEX idx_pending_relatives_phone_status IS
  'Smart Invite Guard: find pending invites by phone and status';

-- =======================
-- MIGRATION COMPLETE
-- =======================
-- Query patterns optimized:
--   SELECT * FROM user_profiles WHERE phone = ?
--   SELECT * FROM pending_relatives WHERE email = ? AND status = 'pending'
--   SELECT * FROM pending_relatives WHERE phone = ? AND status = 'pending'
