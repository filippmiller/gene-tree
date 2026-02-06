'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';

interface LandingLanguageSwitcherProps {
  currentLocale: 'en' | 'ru';
}

export default function LandingLanguageSwitcher({ currentLocale }: LandingLanguageSwitcherProps) {
  const [switching, setSwitching] = useState(false);
  const other: 'en' | 'ru' = currentLocale === 'en' ? 'ru' : 'en';
  const label = other === 'ru' ? 'Русский' : 'English';

  const switchLocale = () => {
    setSwitching(true);
    document.cookie = `NEXT_LOCALE=${other};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
    window.location.reload();
  };

  return (
    <button
      onClick={switchLocale}
      disabled={switching}
      data-testid="landing-language-switcher"
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
    >
      <Globe className="w-4 h-4" />
      {switching ? '...' : label}
    </button>
  );
}
