"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Nav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("nav");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = `/${locale}/sign-in`;
  };

  const navItems = [
    { href: `/${locale}/app`, label: t("dashboard") },
    { href: `/${locale}/people`, label: t("people") },
    { href: `/${locale}/relations`, label: t("relations") },
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            {t("signOut")}
          </Button>
        </div>
      </div>
    </nav>
  );
}
