'use client';

import {useLocale} from 'next-intl';
import {usePathname} from 'next/navigation';
import Link from 'next-intl/link';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const other = locale === 'ru' ? 'en' : 'ru';

  return (
    <div className="mb-4">
      <Link href={pathname} locale={other} className="underline">
        {other.toUpperCase()}
      </Link>
    </div>
  );
}
