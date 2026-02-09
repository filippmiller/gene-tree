"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";
import InboxButton from "@/components/messaging/InboxButton";
import { Menu, Sparkles } from "lucide-react";

interface MobileNavProps {
  onMenuClick: () => void;
}

export default function MobileNav({ onMenuClick }: MobileNavProps) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-30 lg:hidden",
        "h-14 px-4",
        "bg-background/80 backdrop-blur-xl",
        "border-b border-border/50"
      )}
    >
      <div className="flex items-center justify-between h-full">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted transition-all duration-300"
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link
          href={`/${locale}/app`}
          className="flex items-center gap-2 group"
        >
          <div className={cn(
            "relative h-8 w-8 rounded-lg overflow-hidden",
            "bg-[#161B22] border border-[#30363D]",
            "transition-all duration-300",
            "group-hover:border-[#58A6FF]/50"
          )}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#58A6FF]" />
            </div>
          </div>
          <span className="font-display text-lg font-medium tracking-tight text-[#E6EDF3]">
            GeneTree
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <InboxButton />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
