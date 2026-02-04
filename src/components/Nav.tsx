"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "@/components/notifications/NotificationBell";
import InboxButton from "@/components/messaging/InboxButton";
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
  Sparkles,
} from "lucide-react";

/**
 * Living Archive Navigation
 *
 * Premium, cinematic navigation with golden accents
 * Features:
 * - Floating glass design
 * - Golden active state indicators
 * - Smooth animations
 * - Responsive mobile menu
 */
export default function Nav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("nav");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for floating nav effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "py-2"
          : "py-3"
      )}
    >
      {/* Background with blur */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-500",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5"
            : "bg-transparent"
        )}
      />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - Elegant serif with golden accent */}
          <Link
            href={`/${locale}/app`}
            className="flex items-center gap-3 group"
          >
            {/* Icon mark */}
            <div className={cn(
              "relative h-10 w-10 rounded-xl overflow-hidden",
              "bg-gradient-to-br from-primary via-primary to-accent",
              "shadow-glow transition-all duration-300",
              "group-hover:shadow-glow-lg group-hover:scale-105"
            )}>
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>

            {/* Wordmark */}
            <div className="hidden sm:block">
              <span className="font-display text-xl font-medium tracking-tight text-gradient-gold">
                GeneTree
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className={cn(
              "flex items-center gap-1 p-1.5 rounded-2xl",
              "bg-muted/50 backdrop-blur-sm",
              "border border-border/30"
            )}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} prefetch={false}>
                    <button
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2.5 rounded-xl",
                        "text-sm font-medium transition-all duration-300",
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      {/* Active background */}
                      {active && (
                        <div className={cn(
                          "absolute inset-0 rounded-xl",
                          "bg-gradient-to-r from-primary via-primary to-accent",
                          "shadow-glow-primary"
                        )} />
                      )}
                      {/* Content */}
                      <Icon className={cn("h-4 w-4 relative z-10", active && "drop-shadow-sm")} />
                      <span className={cn("hidden lg:inline relative z-10", active && "drop-shadow-sm")}>
                        {item.label}
                      </span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <InboxButton />
            <NotificationBell />

            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-border/30 ml-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className={cn(
                "hidden sm:flex gap-2 ml-2",
                "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              )}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">{t("signOut")}</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "md:hidden relative",
                mobileMenuOpen && "bg-muted"
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5">
                <Menu
                  className={cn(
                    "absolute inset-0 h-5 w-5 transition-all duration-300",
                    mobileMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
                  )}
                />
                <X
                  className={cn(
                    "absolute inset-0 h-5 w-5 transition-all duration-300",
                    mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
                  )}
                />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-500 ease-cinematic",
            mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className={cn(
            "mt-3 p-3 rounded-2xl",
            "bg-card/95 backdrop-blur-xl",
            "border border-border/50",
            "shadow-elevation-4"
          )}>
            <div className="flex flex-col gap-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={cn(
                      mobileMenuOpen && "animate-fade-in-up"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl",
                        "transition-all duration-300",
                        active
                          ? "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground shadow-glow-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="divider-gold my-3" />

            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <button
                onClick={handleSignOut}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl",
                  "text-destructive",
                  "hover:bg-destructive/10",
                  "transition-all duration-300"
                )}
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
