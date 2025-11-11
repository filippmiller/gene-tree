-- Apply locale migration directly
-- Run this in Supabase SQL Editor

-- Add preferred_locale column
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS preferred_locale TEXT DEFAULT 'ru' CHECK (preferred_locale IN ('ru', 'en'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_locale 
ON public.user_profiles(preferred_locale);

-- Update existing users to 'ru' if NULL
UPDATE public.user_profiles
SET preferred_locale = 'ru'
WHERE preferred_locale IS NULL;

-- Update the create_user_profile trigger
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  detected_locale TEXT := 'ru';
BEGIN
  -- Try to detect locale from user metadata
  IF NEW.raw_user_meta_data ? 'locale' THEN
    detected_locale := NEW.raw_user_meta_data->>'locale';
  ELSIF NEW.raw_user_meta_data ? 'accept_language' THEN
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

SELECT 'Migration applied successfully!' as result;
