-- ============================================================================
-- Ensure user_profiles table exists (minimal version)
-- Created: 2025-11-12
-- Purpose: Create table if it doesn't exist for RLS fix to work
-- ============================================================================

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  first_name TEXT NOT NULL DEFAULT '',
  middle_name TEXT,
  last_name TEXT NOT NULL DEFAULT '',
  maiden_name TEXT,
  nickname TEXT,
  
  -- Dates
  birth_date DATE,
  birth_place TEXT,
  death_date DATE,
  death_place TEXT,
  is_living BOOLEAN DEFAULT true,
  
  -- Gender
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  
  -- Additional Info
  bio TEXT,
  avatar_url TEXT,
  current_avatar_id UUID,
  occupation TEXT,
  phone TEXT,
  
  -- Admin role (for current_user_is_admin function)
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  
  -- Privacy Settings
  privacy_settings JSONB DEFAULT '{
    "birth_date": "family",
    "birth_place": "family", 
    "death_date": "family",
    "death_place": "family",
    "phone": "private",
    "occupation": "public",
    "bio": "public",
    "avatar_url": "public",
    "maiden_name": "family"
  }'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_name ON public.user_profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_birth_date ON public.user_profiles(birth_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_living ON public.user_profiles(is_living);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be refined by next migration)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());
  END IF;
END $$;
