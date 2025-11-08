-- Migration: Add Residences and Deceased Relatives
-- Date: 2025-11-08
-- Description: Tables for tracking life history and deceased family members

-- =======================
-- 1. RESIDENCES TABLE
-- =======================
-- Track where people lived, studied, worked throughout their life
CREATE TABLE IF NOT EXISTS public.residences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who this residence belongs to
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type of residence
  type TEXT NOT NULL CHECK (type IN ('residence', 'education', 'work')),
  
  -- Location
  country TEXT,
  city TEXT,
  address TEXT,
  
  -- Time period
  start_date DATE,
  end_date DATE, -- NULL means current
  is_current BOOLEAN DEFAULT false,
  
  -- Additional details
  institution_name TEXT, -- School/University/Company name
  position_title TEXT,   -- Job title or degree
  description TEXT,      -- Any additional notes
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_residences_user ON public.residences(user_id);
CREATE INDEX IF NOT EXISTS idx_residences_type ON public.residences(type);
CREATE INDEX IF NOT EXISTS idx_residences_dates ON public.residences(start_date, end_date);

-- =======================
-- 2. DECEASED RELATIVES TABLE
-- =======================
-- Store information about family members who don't have accounts
-- (deceased, elderly who won't register, or young children)
CREATE TABLE IF NOT EXISTS public.deceased_relatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who added this relative
  added_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  maiden_name TEXT,
  nickname TEXT,
  
  -- Gender
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  
  -- Life dates
  birth_date DATE,
  birth_place TEXT,
  death_date DATE,
  death_place TEXT,
  is_living BOOLEAN DEFAULT false, -- For elderly/children who aren't registered yet
  
  -- Additional Info
  bio TEXT,
  occupation TEXT,
  
  -- Photos (multiple photos stored as JSON array of URLs)
  photos JSONB DEFAULT '[]'::jsonb,
  
  -- Relationship to the person who added them
  relationship_to_adder TEXT NOT NULL CHECK (
    relationship_to_adder IN (
      'parent',
      'child',
      'spouse',
      'sibling',
      'grandparent',
      'grandchild',
      'uncle_aunt',
      'nephew_niece',
      'cousin',
      'other'
    )
  ),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deceased_relatives_added_by ON public.deceased_relatives(added_by_user_id);
CREATE INDEX IF NOT EXISTS idx_deceased_relatives_relationship ON public.deceased_relatives(relationship_to_adder);
CREATE INDEX IF NOT EXISTS idx_deceased_relatives_living ON public.deceased_relatives(is_living);

-- =======================
-- 3. TRIGGERS
-- =======================

-- Update updated_at for residences
DROP TRIGGER IF EXISTS residences_updated_at ON public.residences;
CREATE TRIGGER residences_updated_at
  BEFORE UPDATE ON public.residences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Update updated_at for deceased_relatives
DROP TRIGGER IF EXISTS deceased_relatives_updated_at ON public.deceased_relatives;
CREATE TRIGGER deceased_relatives_updated_at
  BEFORE UPDATE ON public.deceased_relatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =======================
-- 4. ROW LEVEL SECURITY
-- =======================

-- Enable RLS
ALTER TABLE public.residences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deceased_relatives ENABLE ROW LEVEL SECURITY;

-- Residences Policies
CREATE POLICY "Users can view their own residences"
  ON public.residences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view family residences"
  ON public.residences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.relationships r
      WHERE (r.user1_id = auth.uid() AND r.user2_id = residences.user_id)
         OR (r.user2_id = auth.uid() AND r.user1_id = residences.user_id)
    )
  );

CREATE POLICY "Users can insert their own residences"
  ON public.residences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own residences"
  ON public.residences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own residences"
  ON public.residences FOR DELETE
  USING (auth.uid() = user_id);

-- Deceased Relatives Policies
CREATE POLICY "Users can view deceased relatives they added"
  ON public.deceased_relatives FOR SELECT
  USING (auth.uid() = added_by_user_id);

CREATE POLICY "Users can view deceased relatives added by family"
  ON public.deceased_relatives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.relationships r
      WHERE (r.user1_id = auth.uid() AND r.user2_id = deceased_relatives.added_by_user_id)
         OR (r.user2_id = auth.uid() AND r.user1_id = deceased_relatives.added_by_user_id)
    )
  );

CREATE POLICY "Users can insert deceased relatives"
  ON public.deceased_relatives FOR INSERT
  WITH CHECK (auth.uid() = added_by_user_id);

CREATE POLICY "Users can update deceased relatives they added"
  ON public.deceased_relatives FOR UPDATE
  USING (auth.uid() = added_by_user_id)
  WITH CHECK (auth.uid() = added_by_user_id);

CREATE POLICY "Users can delete deceased relatives they added"
  ON public.deceased_relatives FOR DELETE
  USING (auth.uid() = added_by_user_id);
