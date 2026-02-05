"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Home,
  Users,
  Heart,
  TreePine,
  User,
  LogOut,
  Settings,
  MessageCircle,
  Trophy,
  Search,
  BookOpen,
  Timer,
  ScrollText,
  Link2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserPlus,
  Camera,
  Bell,
  HelpCircle,
  Gift,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ collapsed, onToggle, className }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("nav");

  const [profile, setProfile] = useState<{ avatar_url?: string; first_name?: string; email?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("avatar_url, first_name")
          .eq("id", user.id)
          .single();
        setProfile({ ...data, email: user.email });
      }
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/sign-in`;
  };

  // Navigation groups
  const navGroups: NavGroup[] = [
    {
      title: locale === "ru" ? "Главное" : "Main",
      items: [
        { href: `/${locale}/app`, label: t("dashboard"), icon: Home },
        { href: `/${locale}/family-chat`, label: t("familyChat"), icon: MessageCircle },
      ],
    },
    {
      title: locale === "ru" ? "Семья" : "Family",
      items: [
        { href: `/${locale}/people`, label: t("people"), icon: Users },
        { href: `/${locale}/tree`, label: t("familyProfile"), icon: TreePine },
        { href: `/${locale}/relations`, label: t("relations"), icon: Heart },
        { href: `/${locale}/people/new`, label: locale === "ru" ? "Добавить" : "Add Person", icon: UserPlus },
      ],
    },
    {
      title: locale === "ru" ? "Воспоминания" : "Memories",
      items: [
        { href: `/${locale}/stories`, label: locale === "ru" ? "Истории" : "Stories", icon: BookOpen },
        { href: `/${locale}/photos`, label: locale === "ru" ? "Фотографии" : "Photos", icon: Camera },
        { href: `/${locale}/time-capsules`, label: locale === "ru" ? "Капсулы" : "Capsules", icon: Timer },
      ],
    },
    {
      title: locale === "ru" ? "Открытия" : "Discover",
      items: [
        { href: `/${locale}/relationship-finder`, label: locale === "ru" ? "Связи" : "Connections", icon: Link2 },
        { href: `/${locale}/elder-questions`, label: locale === "ru" ? "Вопросы" : "Questions", icon: ScrollText },
        { href: `/${locale}/find-relatives`, label: locale === "ru" ? "Поиск" : "Search", icon: Search },
        { href: `/${locale}/achievements`, label: t("achievements"), icon: Trophy },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col",
        "bg-archive-obsidian dark:bg-archive-void",
        "border-r border-white/5",
        "transition-all duration-500 ease-cinematic",
        collapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* ═══════════════════════════════════════════════════════════════════════
         HEADER - Logo & Collapse Toggle
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative flex items-center justify-between h-16 px-4 border-b border-white/5">
        <Link
          href={`/${locale}/app`}
          className="flex items-center gap-3 group overflow-hidden"
        >
          {/* Logo Icon */}
          <div className={cn(
            "relative h-10 w-10 rounded-xl overflow-hidden flex-shrink-0",
            "bg-gradient-to-br from-primary via-primary to-accent",
            "shadow-glow transition-all duration-300",
            "group-hover:shadow-glow-lg group-hover:scale-105"
          )}>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>

          {/* Wordmark */}
          <span className={cn(
            "font-display text-xl font-medium tracking-tight text-gradient-gold whitespace-nowrap",
            "transition-all duration-500 ease-cinematic",
            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          )}>
            GeneTree
          </span>
        </Link>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            "text-archive-platinum hover:text-white",
            "hover:bg-white/5 transition-all duration-300",
            collapsed && "absolute -right-3 top-1/2 -translate-y-1/2 bg-archive-obsidian border border-white/10 shadow-lg"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         NAVIGATION GROUPS
         ═══════════════════════════════════════════════════════════════════════ */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={cn("mb-6", groupIndex > 0 && "pt-2")}>
            {/* Group Title */}
            <div className={cn(
              "px-4 mb-2 transition-all duration-500",
              collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            )}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-archive-silver">
                {group.title}
              </span>
            </div>

            {/* Group Items */}
            <div className="space-y-1 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl overflow-hidden",
                      "transition-all duration-300 ease-cinematic",
                      collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5",
                      active
                        ? "bg-gradient-to-r from-primary/20 to-primary/10 text-white"
                        : "text-archive-platinum hover:text-white hover:bg-white/5"
                    )}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-primary to-accent shadow-glow" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
                      "transition-all duration-300",
                      active
                        ? "bg-primary/20 text-primary shadow-glow"
                        : "text-archive-silver group-hover:text-white group-hover:bg-white/5"
                    )}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>

                    {/* Label */}
                    <span className={cn(
                      "text-sm font-medium whitespace-nowrap",
                      "transition-all duration-500 ease-cinematic",
                      collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                    )}>
                      {item.label}
                    </span>

                    {/* Badge */}
                    {item.badge && !collapsed && (
                      <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 rounded-lg bg-archive-charcoal text-white text-sm font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-elevation-4 z-50">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-archive-charcoal" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
         FOOTER - User Profile & Actions
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative border-t border-white/5">
        {/* Quick Actions Row */}
        <div className={cn(
          "flex items-center gap-1 px-3 py-2 border-b border-white/5",
          collapsed && "justify-center"
        )}>
          <ThemeToggle />
          {!collapsed && <LanguageSwitcher />}
        </div>

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 p-3",
          collapsed && "justify-center"
        )}>
          {/* Avatar */}
          <Link
            href={`/${locale}/my-profile`}
            prefetch={false}
            className="group relative flex-shrink-0"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className={cn(
                  "rounded-xl object-cover ring-2 ring-white/10",
                  "transition-all duration-300",
                  "group-hover:ring-primary/50 group-hover:shadow-glow",
                  collapsed ? "w-10 h-10" : "w-11 h-11"
                )}
              />
            ) : (
              <div className={cn(
                "rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center",
                "ring-2 ring-white/10 transition-all duration-300",
                "group-hover:ring-primary/50 group-hover:shadow-glow",
                collapsed ? "w-10 h-10" : "w-11 h-11"
              )}>
                <span className="text-white font-display font-medium">
                  {profile?.first_name?.[0] || "?"}
                </span>
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-archive-obsidian" />
          </Link>

          {/* User Info */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.first_name || (locale === "ru" ? "Профиль" : "Profile")}
              </p>
              <p className="text-xs text-archive-silver truncate">
                {profile?.email}
              </p>
            </div>
          )}

          {/* Sign Out */}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-archive-silver hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
              title={t("signOut")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sign out button when collapsed */}
        {collapsed && (
          <div className="flex justify-center pb-3">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-archive-silver hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
              title={t("signOut")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
