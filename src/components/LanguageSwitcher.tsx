'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const other = locale === 'ru' ? 'en' : 'ru';
  const langMap = { ru: 'RU', en: 'EN' };

  const switchLocale = async () => {
    setIsLoading(true);
    
    try {
      // 1. Save to database
      await fetch('/api/user/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: other })
      });

      // 2. Update cookie
      document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000`;

      // 3. Navigate to new locale path
      const segments = pathname.split('/');
      if (segments[1] === locale || segments[1] === 'ru' || segments[1] === 'en') {
        segments[1] = other;
      } else {
        segments.splice(1, 0, other);
      }
      const newPath = segments.join('/');
      
      router.push(newPath);
      router.refresh();
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
    >
      {langMap[other]}
    </Button>
  );
}
