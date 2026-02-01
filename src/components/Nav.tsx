"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Heart,
  TreePine,
  User,
  LogOut,
  Menu,
  X,
  Trophy,
  Leaf,
} from "lucide-react";

export default function Nav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("nav");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/sign-in`;
  };

  const navItems = [
    { href: `/${locale}/app`, label: t("dashboard"), icon: Home },
    { href: `/${locale}/people`, label: t("people"), icon: Users },
    { href: `/${locale}/relations`, label: t("relations"), icon: Heart },
    { href: `/${locale}/tree`, label: t("familyProfile"), icon: TreePine },
    { href: `/${locale}/achievements`, label: t("achievements"), icon: Trophy },
    { href: `/${locale}/my-profile`, label: t("myProfile"), icon: User },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70 shadow-sm shadow-primary/5">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand - Heritage Style */}
          <Link
            href={`/${locale}/app`}
            className="flex items-center gap-3 font-bold text-lg group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-primary to-emerald-700 bg-clip-text text-transparent font-heritage">
              GeneTree
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-sm border border-border/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} prefetch={false}>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                      active
                        ? "bg-gradient-to-r from-primary to-emerald-700 text-white shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden sm:flex gap-2 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">{t("signOut")}</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-heritage",
            mobileMenuOpen ? "max-h-[500px] pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                      active
                        ? "bg-gradient-to-r from-primary to-emerald-700 text-white shadow-lg shadow-primary/25"
                        : "text-foreground hover:bg-white/80 dark:hover:bg-gray-800/80"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            <div className="border-t border-border/50 my-2" />
            <div className="flex items-center justify-between px-4 py-2">
              <LanguageSwitcher />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">{t("signOut")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
