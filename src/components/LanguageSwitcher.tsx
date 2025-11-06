'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const other = locale === 'ru' ? 'en' : 'ru';

  const switchLocale = () => {
    const segments = pathname.split('/');
    segments[1] = other;
    const newPath = segments.join('/');
    document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000`;
    router.push(newPath);
  };

  return (
    <div className="mb-4">
      <button onClick={switchLocale} className="underline">
        {other.toUpperCase()}
      </button>
    </div>
  );
}
