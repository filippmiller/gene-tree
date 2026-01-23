"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, TreePine, BookOpen, User } from "lucide-react";

/**
 * MobileBottomNav - Fixed bottom navigation for mobile devices
 *
 * Features:
 * - Thumb-friendly positioning
 * - Active state with gradient
 * - Safe area padding for notched devices
 * - Glassmorphism background
 */

export default function MobileBottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const navItems = [
    { href: `/${locale}/app`, label: "Home", icon: Home },
    { href: `/${locale}/people`, label: "Family", icon: Users },
    { href: `/${locale}/tree`, label: "Tree", icon: TreePine },
    { href: `/${locale}/stories`, label: "Stories", icon: BookOpen },
    { href: `/${locale}/my-profile`, label: "Profile", icon: User },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glassmorphism background */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-white/50 dark:border-white/10 shadow-lg shadow-violet-500/5">
        {/* Safe area padding for notched devices */}
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200",
                  active
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                    active
                      ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 scale-110"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform",
                      active && "scale-110"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium mt-1 transition-colors",
                    active
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
