-- Migration: Add preferred_locale to user_profiles
-- Date: 2025-11-10
-- Description: Store user's preferred language (ru/en)

-- Add preferred_locale column
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS preferred_locale TEXT DEFAULT 'ru' CHECK (preferred_locale IN ('ru', 'en'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_locale 
ON public.user_profiles(preferred_locale);

-- Update the create_user_profile trigger to detect browser language
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  detected_locale TEXT := 'ru';
BEGIN
  -- Try to detect locale from user metadata or accept-language header
  -- Supabase stores headers in raw_user_meta_data during signup
  IF NEW.raw_user_meta_data ? 'locale' THEN
    detected_locale := NEW.raw_user_meta_data->>'locale';
  ELSIF NEW.raw_user_meta_data ? 'accept_language' THEN
    -- Parse Accept-Language header (e.g., "en-US,en;q=0.9,ru;q=0.8")
    -- Take first language code
    detected_locale := CASE 
      WHEN NEW.raw_user_meta_data->>'accept_language' ILIKE 'en%' THEN 'en'
      WHEN NEW.raw_user_meta_data->>'accept_language' ILIKE 'ru%' THEN 'ru'
      ELSE 'ru'
    END;
  END IF;

  INSERT INTO public.user_profiles (id, first_name, last_name, preferred_locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    detected_locale
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN public.user_profiles.preferred_locale IS 'User preferred language (ru/en), auto-detected on signup from browser';
