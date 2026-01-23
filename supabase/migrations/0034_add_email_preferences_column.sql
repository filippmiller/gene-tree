-- Migration 0034: Add email_preferences column to user_profiles
-- This is a focused migration that only adds the missing column

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email_preferences JSONB
DEFAULT '{"weekly_digest": false, "birthday_reminders": true, "anniversary_reminders": true, "death_commemorations": false, "photo_tag_notifications": true, "digest_day": "sunday"}'::jsonb;

COMMENT ON COLUMN user_profiles.email_preferences IS 'User email notification preferences for digests and reminders';
