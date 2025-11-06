"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const locales = [
  { code: "ru", label: "Рус" },
  { code: "en", label: "Eng" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Сохраняем выбор в cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    
    // Заменяем локаль в пути
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="flex gap-1">
      {locales.map((loc) => (
        <Button
          key={loc.code}
          variant={locale === loc.code ? "default" : "ghost"}
          size="sm"
          onClick={() => switchLocale(loc.code)}
        >
          {loc.label}
        </Button>
      ))}
    </div>
  );
}

