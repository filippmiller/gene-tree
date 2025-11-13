'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale() as 'ru' | 'en';
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const other: 'ru' | 'en' = locale === 'ru' ? 'en' : 'ru';
  const langMap: Record<'ru' | 'en', string> = { ru: 'Русский', en: 'English' };

  const switchLocale = async () => {
    setIsLoading(true);
    
    try {
      // 1. Save to database first
      await fetch('/api/user/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: other })
      });

      // 2. Update cookie
      document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000`;

      // 3. Navigate to new locale path
      const segments = pathname.split('/').filter(s => s);
      
      // Remove current locale if present
      if (segments[0] === 'ru' || segments[0] === 'en') {
        segments[0] = other;
      } else {
        segments.unshift(other);
      }
      
      const newPath = '/' + segments.join('/');
      
      // Navigate (will trigger full reload)
      window.location.href = newPath;
    } catch (error) {
      console.error('Failed to switch locale:', error);
      setIsLoading(false);
    }
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
