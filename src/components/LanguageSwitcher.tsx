'use client';

import {useLocale} from 'next-intl';
import {usePathname} from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale() as 'ru' | 'en';
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const other: 'ru' | 'en' = locale === 'ru' ? 'en' : 'ru';
  const langMap: Record<'ru' | 'en', string> = { ru: 'Русский', en: 'English' };

  const switchLocale = () => {
    // 1. Update cookie
    document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000; SameSite=Lax`;

    // 2. Build new path
    const segments = pathname.split('/').filter(s => s);
    
    // Replace locale prefix
    if (segments[0] === 'ru' || segments[0] === 'en') {
      segments[0] = other;
    } else {
      segments.unshift(other);
    }
    
    const newPath = '/' + segments.join('/');
    
    // 3. Save to DB (fire and forget)
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: other })
    }).catch(() => {});
    
    // 4. Full page reload to new locale
    window.location.href = newPath;
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={switchLocale}
      disabled={isLoading}
      className="min-w-[100px]"
    >
      {isLoading ? '...' : langMap[other]}
    </Button>
  );
}
