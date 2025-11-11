-- ============================================================================
-- Migration: Extended profile fields
-- ============================================================================
-- Add: birth_place, current_address, education, employment
-- ============================================================================

-- 1. Add new fields to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS birth_city TEXT,
ADD COLUMN IF NOT EXISTS birth_country TEXT,
ADD COLUMN IF NOT EXISTS current_address TEXT,
ADD COLUMN IF NOT EXISTS current_city TEXT,
ADD COLUMN IF NOT EXISTS current_country TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Create education table
CREATE TABLE IF NOT EXISTS public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  institution_type TEXT CHECK (institution_type IN ('school', 'college', 'university', 'other')),
  degree TEXT,  -- e.g. "High School Diploma", "Bachelor's", "Master's"
  field_of_study TEXT,
  start_year INTEGER,
  end_year INTEGER,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create employment table
CREATE TABLE IF NOT EXISTS public.employment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'freelance', 'internship', 'other')),
  location TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);
CREATE INDEX IF NOT EXISTS idx_employment_user_id ON public.employment(user_id);
CREATE INDEX IF NOT EXISTS idx_education_dates ON public.education(start_year, end_year);
CREATE INDEX IF NOT EXISTS idx_employment_dates ON public.employment(start_date, end_date);

-- 5. RLS Policies for education
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

-- Users can view their own education
CREATE POLICY "Users can view own education"
ON public.education
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own education
CREATE POLICY "Users can insert own education"
ON public.education
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own education
CREATE POLICY "Users can update own education"
ON public.education
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own education
CREATE POLICY "Users can delete own education"
ON public.education
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Note: Admin policies will be added after role column exists (migration 0017)

-- 6. RLS Policies for employment
ALTER TABLE public.employment ENABLE ROW LEVEL SECURITY;

-- Users can view their own employment
CREATE POLICY "Users can view own employment"
ON public.employment
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own employment
CREATE POLICY "Users can insert own employment"
ON public.employment
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own employment
CREATE POLICY "Users can update own employment"
ON public.employment
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own employment
CREATE POLICY "Users can delete own employment"
ON public.employment
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Note: Admin policies will be added after role column exists (migration 0017)

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employment TO authenticated;

-- 8. Comments
COMMENT ON TABLE public.education IS 'Educational history: schools, colleges, universities';
COMMENT ON TABLE public.employment IS 'Employment history: jobs, positions, companies';
COMMENT ON COLUMN public.user_profiles.birth_place IS 'Full birth place description';
COMMENT ON COLUMN public.user_profiles.current_address IS 'Current residential address';
