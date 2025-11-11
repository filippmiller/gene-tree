import { getRequestConfig } from "next-intl/server";
import { routing } from './routing';
import { createServerSupabase } from '@/lib/supabase/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Priority:
  // 1. URL locale (from request)
  // 2. User's saved preference in DB
  // 3. Default locale
  
  let locale = await requestLocale;
  
  // If no locale in URL, try to get from user profile
  if (!locale || !routing.locales.includes(locale as any)) {
    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('preferred_locale')
          .eq('id', user.id)
          .single();
        
        if (profile?.preferred_locale) {
          locale = profile.preferred_locale;
        }
      }
    } catch (error) {
      console.error('Failed to get user locale:', error);
    }
    
    // Fallback to default
    if (!locale || !routing.locales.includes(locale as any)) {
      locale = routing.defaultLocale;
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}/common.json`)).default,
  };
});

