"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BadgeData, rarityConfig, iconMap } from "./BadgeCard";

export interface BadgeUnlockCelebrationProps {
  badge: BadgeData;
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
}

/**
 * Full-screen celebration overlay when a user earns a badge
 */
export function BadgeUnlockCelebration({
  badge,
  isOpen,
  onClose,
  onShare,
}: BadgeUnlockCelebrationProps) {
  const locale = useLocale() as "en" | "ru";
  const rarity = rarityConfig[badge.rarity] || rarityConfig.common;
  const Icon = iconMap[badge.icon];

  const name = (locale === "ru" && badge.name_ru) ? badge.name_ru : badge.name;
  const description =
    (locale === "ru" && badge.description_ru)
      ? badge.description_ru
      : badge.description;

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-black/60 backdrop-blur-sm",
        "animate-in fade-in duration-300"
      )}
      onClick={onClose}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              backgroundColor: ["#58A6FF", "#F778BA", "#D29922", "#3FB950"][
                Math.floor(Math.random() * 4)
              ],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Content */}
      <div
        className={cn(
          "relative",
          "flex flex-col items-center",
          "p-8 rounded-3xl",
          "bg-white/95 dark:bg-gray-900/95",
          "backdrop-blur-xl",
          "shadow-2xl",
          "max-w-md w-full mx-4",
          "animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div
          className={cn(
            "absolute -inset-1 rounded-3xl opacity-50 blur-xl",
            rarity.bg
          )}
        />

        {/* Badge icon with glow */}
        <div className="relative mb-6">
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-lg",
              rarity.bg,
              badge.rarity === "legendary" ? "animate-pulse" : ""
            )}
          />
          <div
            className={cn(
              "relative flex items-center justify-center",
              "w-24 h-24 rounded-full",
              rarity.bg,
              "shadow-lg",
              "animate-bounce-subtle"
            )}
          >
            {Icon && <Icon className="w-12 h-12 text-white" />}
          </div>
        </div>

        {/* Title */}
        <h2 className="relative text-2xl font-bold text-center mb-2">
          {locale === "ru" ? "Значок получен!" : "Badge Unlocked!"}
        </h2>

        {/* Badge name */}
        <h3
          className={cn(
            "relative text-xl font-semibold text-center mb-2",
            badge.rarity === "legendary" ? "text-[#D29922]" :
            badge.rarity === "rare" ? "text-[#58A6FF]" :
            "text-[#8B949E]"
          )}
        >
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="relative text-muted-foreground text-center mb-6 max-w-xs">
            {description}
          </p>
        )}

        {/* Rarity badge */}
        {badge.rarity !== "common" && (
          <span
            className={cn(
              "relative px-4 py-1 rounded-full text-sm font-medium mb-6",
              badge.rarity === "legendary"
                ? "bg-[#D29922]/10 text-[#D29922] dark:bg-[#D29922]/10 dark:text-[#D29922]"
                : "bg-[#58A6FF]/10 text-[#58A6FF] dark:bg-[#58A6FF]/10 dark:text-[#58A6FF]"
            )}
          >
            {rarity.label[locale]}
          </span>
        )}

        {/* Actions */}
        <div className="relative flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {locale === "ru" ? "Закрыть" : "Close"}
          </Button>
          {onShare && (
            <Button
              className={cn(
                "flex-1",
                rarity.bg,
                "text-white hover:opacity-90"
              )}
              onClick={onShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {locale === "ru" ? "Поделиться" : "Share"}
            </Button>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes bounce-subtle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
