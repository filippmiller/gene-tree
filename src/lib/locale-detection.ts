/**
 * Detect user's preferred locale from browser Accept-Language header
 */
export function detectLocaleFromHeader(acceptLanguage: string | null): 'ru' | 'en' {
  if (!acceptLanguage) {
    return 'ru'; // Default
  }

  // Parse Accept-Language header
  // Example: "en-US,en;q=0.9,ru;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';q=');
      const quality = qValue ? parseFloat(qValue) : 1.0;
      const langCode = code.split('-')[0].toLowerCase();
      return { code: langCode, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported language (ru or en)
  for (const lang of languages) {
    if (lang.code === 'ru') return 'ru';
    if (lang.code === 'en') return 'en';
  }

  // Default to Russian
  return 'ru';
}

/**
 * Get locale from browser's navigator.language (client-side only)
 */
export function detectLocaleFromNavigator(): 'ru' | 'en' {
  if (typeof navigator === 'undefined') {
    return 'ru';
  }

  const language = navigator.language?.split('-')[0].toLowerCase();
  
  if (language === 'ru') return 'ru';
  if (language === 'en') return 'en';
  
  return 'ru';
}

/**
 * Detect locale from various sources with priority
 * 1. User profile (from DB)
 * 2. Cookie
 * 3. Accept-Language header
 * 4. Default (ru)
 */
export function detectUserLocale(options: {
  userProfileLocale?: string | null;
  cookieLocale?: string | null;
  acceptLanguageHeader?: string | null;
}): 'ru' | 'en' {
  const { userProfileLocale, cookieLocale, acceptLanguageHeader } = options;

  // Priority 1: User profile
  if (userProfileLocale === 'ru' || userProfileLocale === 'en') {
    return userProfileLocale;
  }

  // Priority 2: Cookie
  if (cookieLocale === 'ru' || cookieLocale === 'en') {
    return cookieLocale;
  }

  // Priority 3: Accept-Language header
  if (acceptLanguageHeader) {
    return detectLocaleFromHeader(acceptLanguageHeader);
  }

  // Default
  return 'ru';
}
