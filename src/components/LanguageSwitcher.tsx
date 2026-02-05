'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

/**
 * Language Switcher Component
 *
 * Uses next-intl's navigation utilities for proper locale switching:
 * - Uses router.replace() for SPA navigation (no full page reload)
 * - Middleware automatically sets the NEXT_LOCALE cookie
 * - Also syncs preference to database for persistence
 */
export default function LanguageSwitcher() {
  const locale = useLocale() as 'ru' | 'en';
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const other: 'ru' | 'en' = locale === 'ru' ? 'en' : 'ru';
  const langMap: Record<'ru' | 'en', string> = { ru: 'Русский', en: 'English' };

  const switchLocale = () => {
    startTransition(() => {
      // Use next-intl router for proper locale switching
      // This handles URL update and cookie setting automatically
      router.replace(pathname, { locale: other });

      // Also save to DB for cross-device persistence (fire and forget)
      fetch('/api/user/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: other }),
      }).catch(() => {});
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      disabled={isPending}
      className="min-w-[100px] gap-2"
    >
      <Globe className="h-4 w-4" />
      {isPending ? '...' : langMap[other]}
    </Button>
  );
}
