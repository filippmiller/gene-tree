-- Migration: Invitation-Based Family Tree
-- Date: 2025-11-08
-- Description: Creates tables for user profiles, invitations, and relationships

-- =======================
-- 1. USER PROFILES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
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
  occupation TEXT,
  phone TEXT,
  
  -- Privacy Settings (JSONB for flexibility)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_name ON public.user_profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_birth_date ON public.user_profiles(birth_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_living ON public.user_profiles(is_living);

-- =======================
-- 2. INVITATIONS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who is inviting
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Who is being invited
  invitee_email TEXT NOT NULL,
  invitee_phone TEXT,
  
  -- Relationship type (relative to inviter)
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN (
      'parent',
      'child',
      'spouse',
      'sibling',
      'grandparent',
      'grandchild',
      'uncle_aunt',
      'nephew_niece',
      'cousin'
    )
  ),
  
  -- Token and status
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'rejected')),
  
  -- Personal message
  message TEXT,
  
  -- Who accepted (filled when accepted)
  accepted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  accepted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_inviter ON public.invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_accepted_user ON public.invitations(accepted_user_id);

-- =======================
-- 3. RELATIONSHIPS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Relationship type
  -- For directional: parent means user1 is parent of user2
  -- For symmetric: spouse/sibling works both ways
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN (
      'parent',
      'spouse',
      'sibling',
      'grandparent',
      'uncle_aunt',
      'cousin'
    )
  ),
  
  -- Additional info (mainly for spouse)
  marriage_date DATE,
  marriage_place TEXT,
  divorce_date DATE,
  
  -- Link to invitation that created this
  created_from_invitation_id UUID REFERENCES public.invitations(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_relationship UNIQUE (user1_id, user2_id, relationship_type),
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_relationships_user1 ON public.relationships(user1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user2 ON public.relationships(user2_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON public.relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_invitation ON public.relationships(created_from_invitation_id);

-- =======================
-- 4. TRIGGERS
-- =======================

-- Auto-create user profile on auth.users insert
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS relationships_updated_at ON public.relationships;
CREATE TRIGGER relationships_updated_at
  BEFORE UPDATE ON public.relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =======================
-- 5. ROW LEVEL SECURITY
-- =======================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view family profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.relationships r
      WHERE (r.user1_id = auth.uid() AND r.user2_id = user_profiles.id)
         OR (r.user2_id = auth.uid() AND r.user1_id = user_profiles.id)
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Invitations Policies
CREATE POLICY "Users can view their sent invitations"
  ON public.invitations FOR SELECT
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can view invitations to their email"
  ON public.invitations FOR SELECT
  USING (
    auth.jwt()->>'email' = invitee_email
    OR auth.uid() = accepted_user_id
  );

CREATE POLICY "Anyone can view invitation by token"
  ON public.invitations FOR SELECT
  USING (true);

CREATE POLICY "Users can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update their own invitations"
  ON public.invitations FOR UPDATE
  USING (auth.uid() = inviter_id OR auth.jwt()->>'email' = invitee_email);

-- Relationships Policies
CREATE POLICY "Users can view their relationships"
  ON public.relationships FOR SELECT
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "Users can insert relationships they're part of"
  ON public.relationships FOR INSERT
  WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "Users can update their relationships"
  ON public.relationships FOR UPDATE
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "Users can delete their relationships"
  ON public.relationships FOR DELETE
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- =======================
-- 6. HELPER FUNCTIONS
-- =======================

-- Function to get reverse relationship type
CREATE OR REPLACE FUNCTION public.get_reverse_relationship_type(rel_type TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE rel_type
    WHEN 'parent' THEN 'child'
    WHEN 'child' THEN 'parent'
    WHEN 'grandparent' THEN 'grandchild'
    WHEN 'grandchild' THEN 'grandparent'
    WHEN 'uncle_aunt' THEN 'nephew_niece'
    WHEN 'nephew_niece' THEN 'uncle_aunt'
    -- Symmetric relationships return themselves
    WHEN 'spouse' THEN 'spouse'
    WHEN 'sibling' THEN 'sibling'
    WHEN 'cousin' THEN 'cousin'
    ELSE rel_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =======================
-- DONE
-- =======================
