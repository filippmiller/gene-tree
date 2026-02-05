import { getRequestConfig } from "next-intl/server";
import { routing } from './routing';

/**
 * Server-side i18n Request Configuration
 *
 * IMPORTANT: URL is the SINGLE SOURCE OF TRUTH for locale.
 *
 * The middleware handles all locale detection and redirection:
 * - Authenticated users → redirect to their preferred locale (from DB)
 * - Anonymous users → redirect based on Accept-Language header
 * - All rendering uses URL locale only
 *
 * This eliminates mixed language bugs caused by multiple locale sources.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // URL locale is authoritative - set by middleware
  let locale = await requestLocale;

  // Validate locale, fallback to default if invalid
  if (!locale || !routing.locales.includes(locale as 'ru' | 'en')) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}/common.json`)).default,
  };
});

