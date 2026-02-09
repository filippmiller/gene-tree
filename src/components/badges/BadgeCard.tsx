"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import {
  Sprout,
  TreeDeciduous,
  Trees,
  Crown,
  Camera,
  Images,
  Image,
  Mic,
  BookOpen,
  Book,
  Library,
  Send,
  Users,
  UsersRound,
  Flag,
  Heart,
  Mic2,
  Award,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Badge icon mapping
 */
const iconMap: Record<string, LucideIcon> = {
  sprout: Sprout,
  "tree-deciduous": TreeDeciduous,
  trees: Trees,
  crown: Crown,
  camera: Camera,
  images: Images,
  image: Image,
  mic: Mic,
  "mic-2": Mic2,
  "book-open": BookOpen,
  book: Book,
  library: Library,
  send: Send,
  users: Users,
  "users-round": UsersRound,
  flag: Flag,
  heart: Heart,
  award: Award,
};

/**
 * Rarity colors and gradients
 */
const rarityConfig = {
  common: {
    bg: "bg-[#8B949E]",
    shadow: "shadow-[#8B949E]/20",
    glow: "shadow-[#8B949E]/40",
    border: "border-[#8B949E]",
    label: { en: "Common", ru: "Обычный" },
  },
  rare: {
    bg: "bg-[#58A6FF]",
    shadow: "shadow-[#58A6FF]/20",
    glow: "shadow-[#58A6FF]/40",
    border: "border-[#58A6FF]",
    label: { en: "Rare", ru: "Редкий" },
  },
  legendary: {
    bg: "bg-[#D29922]",
    shadow: "shadow-[#D29922]/20",
    glow: "shadow-[#D29922]/40 animate-pulse",
    border: "border-[#D29922]",
    label: { en: "Legendary", ru: "Легендарный" },
  },
};

const badgeCardVariants = cva(
  [
    "relative flex flex-col items-center",
    "rounded-2xl p-4",
    "transition-all duration-300",
    "transform-gpu",
  ].join(" "),
  {
    variants: {
      earned: {
        true: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border shadow-lg",
        false:
          "bg-gray-100/50 dark:bg-gray-800/50 border border-dashed opacity-60",
      },
      size: {
        sm: "w-24 gap-2",
        md: "w-32 gap-3",
        lg: "w-40 gap-4",
      },
    },
    defaultVariants: {
      earned: false,
      size: "md",
    },
  }
);

export interface BadgeData {
  id: string;
  name: string;
  name_ru: string | null;
  description: string | null;
  description_ru: string | null;
  icon: string;
  category: string;
  criteria_type: string;
  criteria_target: string | null;
  criteria_value: number | null;
  rarity: "common" | "rare" | "legendary";
  earned?: boolean;
  earned_at?: string;
  progress?: number;
  is_featured?: boolean;
}

export interface BadgeCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeCardVariants> {
  badge: BadgeData;
  showProgress?: boolean;
  onFeatureToggle?: (badgeId: string, featured: boolean) => void;
}

const BadgeCard = React.forwardRef<HTMLDivElement, BadgeCardProps>(
  (
    {
      className,
      badge,
      earned = false,
      size = "md",
      showProgress = true,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onFeatureToggle,
      ...props
    },
    ref
  ) => {
    const locale = useLocale() as "en" | "ru";
    const isEarned = earned || badge.earned;
    const rarity = rarityConfig[badge.rarity] || rarityConfig.common;
    const Icon = iconMap[badge.icon] || Award;

    const name = (locale === "ru" && badge.name_ru) ? badge.name_ru : badge.name;
    const description =
      (locale === "ru" && badge.description_ru)
        ? badge.description_ru
        : badge.description;

    const iconSize = size === "sm" ? "w-8 h-8" : size === "md" ? "w-12 h-12" : "w-16 h-16";

    const progressPercent =
      badge.progress && badge.criteria_value
        ? Math.min(100, (badge.progress / badge.criteria_value) * 100)
        : 0;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              className={cn(
                badgeCardVariants({ earned: isEarned, size }),
                isEarned ? rarity.border : "",
                className
              )}
              {...props}
            >
              {/* Featured star */}
              {badge.is_featured && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D29922] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs">⭐</span>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl",
                  iconSize,
                  isEarned
                    ? cn("text-white", rarity.bg, rarity.shadow)
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                )}
              >
                {isEarned ? (
                  <Icon className={size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8"} />
                ) : (
                  <Lock className={size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"} />
                )}
              </div>

              {/* Name */}
              <span
                className={cn(
                  "text-center font-medium leading-tight",
                  size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
                  isEarned
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {name}
              </span>

              {/* Rarity badge */}
              {isEarned && badge.rarity !== "common" && (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    badge.rarity === "legendary"
                      ? "bg-[#D29922]/10 text-[#D29922] dark:bg-[#D29922]/10 dark:text-[#D29922]"
                      : "bg-[#58A6FF]/10 text-[#58A6FF] dark:bg-[#58A6FF]/10 dark:text-[#58A6FF]"
                  )}
                >
                  {rarity.label[locale]}
                </span>
              )}

              {/* Progress bar */}
              {!isEarned && showProgress && badge.criteria_type === "count" && (
                <div className="w-full space-y-1">
                  <Progress value={progressPercent} className="h-1.5" />
                  <span className="text-xs text-muted-foreground text-center block">
                    {badge.progress || 0} / {badge.criteria_value}
                  </span>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{name}</p>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              {isEarned && badge.earned_at && (
                <p className="text-xs text-muted-foreground">
                  {locale === "ru" ? "Получено:" : "Earned:"}{" "}
                  {new Date(badge.earned_at).toLocaleDateString(
                    locale === "ru" ? "ru-RU" : "en-US"
                  )}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
BadgeCard.displayName = "BadgeCard";

export { BadgeCard, badgeCardVariants, iconMap, rarityConfig };
