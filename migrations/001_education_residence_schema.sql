-- ============================================================================
-- MIGRATION: Education & Residence Schema
-- Based on VK/Facebook patterns + архитектурный план от друга
-- ============================================================================

-- ENUMS for type safety
CREATE TYPE education_type AS ENUM ('school', 'college', 'university', 'vocational', 'graduate');
CREATE TYPE education_status AS ENUM ('attended', 'graduated', 'current', 'dropped_out');
CREATE TYPE date_precision AS ENUM ('day', 'month', 'year', 'unknown');
CREATE TYPE certainty_level AS ENUM ('certain', 'approximate', 'unknown');
CREATE TYPE visibility_level AS ENUM ('public', 'family', 'private');

-- ============================================================================
-- REFERENCE TABLES (справочники)
-- ============================================================================

-- institution_ref: Каталог учебных заведений (школы, универы)
CREATE TABLE IF NOT EXISTS institution_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'ror' | 'openalex' | 'scorecard' | 'custom'
  external_id TEXT, -- ID from external source
  name TEXT NOT NULL,
  name_alt TEXT[], -- Alternative names / aliases
  country_code TEXT, -- ISO country code
  city TEXT,
  region TEXT, -- State/Oblast/etc
  geo_point POINT, -- Coordinates (lat, lng)
  website TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_institution_name ON institution_ref USING gin(to_tsvector('simple', name));
CREATE INDEX idx_institution_external ON institution_ref(source, external_id);

-- place_ref: Справочник мест (города, адреса)
CREATE TABLE IF NOT EXISTS place_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'nominatim' | 'geonames' | 'custom'
  external_id TEXT,
  name TEXT NOT NULL,
  admin1 TEXT, -- State/Oblast
  admin2 TEXT, -- County/Raion
  country_code TEXT NOT NULL,
  geo_point POINT NOT NULL,
  address_full TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_place_name ON place_ref USING gin(to_tsvector('simple', name));
CREATE INDEX idx_place_geo ON place_ref USING gist(geo_point);

-- ============================================================================
-- USER DATA TABLES
-- ============================================================================

-- person_education: Образование пользователя
CREATE TABLE IF NOT EXISTS person_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Institution (либо из справочника, либо custom)
  institution_ref_id UUID REFERENCES institution_ref(id),
  institution_text TEXT, -- Custom name if not in ref
  
  -- Type & Status
  type education_type NOT NULL,
  status education_status DEFAULT 'attended',
  
  -- Details
  faculty TEXT, -- Факультет
  major TEXT, -- Специальность
  degree TEXT, -- Степень (Bachelor, Master, PhD)
  grade_level TEXT, -- Для школ: "10th grade", etc.
  
  -- Dates with precision
  start_date DATE,
  start_precision date_precision DEFAULT 'year',
  end_date DATE,
  end_precision date_precision DEFAULT 'year',
  is_current BOOLEAN DEFAULT FALSE,
  
  -- Certainty & Privacy
  certainty certainty_level DEFAULT 'certain',
  visibility visibility_level DEFAULT 'public',
  
  -- Metadata
  notes TEXT,
  source JSONB DEFAULT '{}', -- Who added this, verification status
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_person_education_person ON person_education(person_id);
CREATE INDEX idx_person_education_institution ON person_education(institution_ref_id);

-- person_residence: История мест проживания
CREATE TABLE IF NOT EXISTS person_residence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Place (либо из справочника, либо custom)
  place_ref_id UUID REFERENCES place_ref(id),
  place_text TEXT, -- Custom address if not in ref
  
  -- Address breakdown
  country TEXT,
  region TEXT, -- State/Oblast
  city TEXT,
  district TEXT, -- Район
  street TEXT,
  building TEXT,
  apartment TEXT,
  postal_code TEXT,
  
  -- Coordinates (override if manual pin)
  geo_point POINT,
  
  -- Dates with precision
  start_date DATE,
  start_precision date_precision DEFAULT 'year',
  end_date DATE,
  end_precision date_precision DEFAULT 'year',
  is_current BOOLEAN DEFAULT FALSE,
  
  -- Certainty & Privacy
  certainty certainty_level DEFAULT 'certain',
  visibility visibility_level DEFAULT 'family', -- More private by default
  
  -- Metadata
  notes TEXT,
  source JSONB DEFAULT '{}',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_person_residence_person ON person_residence(person_id);
CREATE INDEX idx_person_residence_place ON person_residence(place_ref_id);
CREATE INDEX idx_person_residence_geo ON person_residence USING gist(geo_point) WHERE geo_point IS NOT NULL;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE person_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_residence ENABLE ROW LEVEL SECURITY;

-- Education policies
CREATE POLICY "Users can view own education"
  ON person_education FOR SELECT
  TO authenticated
  USING (person_id = auth.uid());

CREATE POLICY "Users can view public education"
  ON person_education FOR SELECT
  TO authenticated
  USING (visibility = 'public');

CREATE POLICY "Users can view family education"
  ON person_education FOR SELECT
  TO authenticated
  USING (
    visibility = 'family' AND
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE (r.user1_id = auth.uid() AND r.user2_id = person_id)
         OR (r.user2_id = auth.uid() AND r.user1_id = person_id)
    )
  );

CREATE POLICY "Users can insert own education"
  ON person_education FOR INSERT
  TO authenticated
  WITH CHECK (person_id = auth.uid());

CREATE POLICY "Users can update own education"
  ON person_education FOR UPDATE
  TO authenticated
  USING (person_id = auth.uid());

CREATE POLICY "Users can delete own education"
  ON person_education FOR DELETE
  TO authenticated
  USING (person_id = auth.uid());

-- Residence policies (same pattern)
CREATE POLICY "Users can view own residences"
  ON person_residence FOR SELECT
  TO authenticated
  USING (person_id = auth.uid());

CREATE POLICY "Users can view public residences"
  ON person_residence FOR SELECT
  TO authenticated
  USING (visibility = 'public');

CREATE POLICY "Users can view family residences"
  ON person_residence FOR SELECT
  TO authenticated
  USING (
    visibility = 'family' AND
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE (r.user1_id = auth.uid() AND r.user2_id = person_id)
         OR (r.user2_id = auth.uid() AND r.user1_id = person_id)
    )
  );

CREATE POLICY "Users can insert own residences"
  ON person_residence FOR INSERT
  TO authenticated
  WITH CHECK (person_id = auth.uid());

CREATE POLICY "Users can update own residences"
  ON person_residence FOR UPDATE
  TO authenticated
  USING (person_id = auth.uid());

CREATE POLICY "Users can delete own residences"
  ON person_residence FOR DELETE
  TO authenticated
  USING (person_id = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER person_education_updated_at
  BEFORE UPDATE ON person_education
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER person_residence_updated_at
  BEFORE UPDATE ON person_residence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
