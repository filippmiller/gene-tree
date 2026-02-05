import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * i18n Routing Configuration
 *
 * URL is the single source of truth for locale.
 * The localeCookie persists user preference across sessions.
 */
export const routing = defineRouting({
  locales: ['ru', 'en'],
  defaultLocale: 'ru',
  localePrefix: 'always',

  // Cookie configuration for persisting user locale preference
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
});

// Typed navigation helpers that respect locale
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
