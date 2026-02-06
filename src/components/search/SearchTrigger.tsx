"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import GlobalSearch from "./GlobalSearch";

interface SearchTriggerProps {
  collapsed?: boolean;
}

export default function SearchTrigger({ collapsed }: SearchTriggerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("search");

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl overflow-hidden w-full",
          "transition-all duration-300 ease-cinematic",
          "text-archive-platinum hover:text-white hover:bg-white/5",
          collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
          "transition-all duration-300",
          "text-archive-silver group-hover:text-white group-hover:bg-white/5"
        )}>
          <Search className="h-[18px] w-[18px]" />
        </div>

        <span className={cn(
          "text-sm font-medium whitespace-nowrap",
          "transition-all duration-500 ease-cinematic",
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
        )}>
          {t("placeholder")}
        </span>

        {!collapsed && (
          <kbd className="ml-auto text-[10px] font-medium text-archive-silver border border-white/10 rounded px-1.5 py-0.5">
            Ctrl+K
          </kbd>
        )}

        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-3 py-2 rounded-lg bg-archive-charcoal text-white text-sm font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-elevation-4 z-50">
            {t("placeholder")}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-archive-charcoal" />
          </div>
        )}
      </button>

      <GlobalSearch open={open} onOpenChange={setOpen} />
    </>
  );
}
