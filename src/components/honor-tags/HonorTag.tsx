"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import {
  Medal,
  Shield,
  Award,
  Heart,
  Star,
  Briefcase,
  GraduationCap,
  BookOpen,
  Flame,
  Bird,
  Crown,
  Zap,
  Home,
  Map,
  Scale,
  Scroll,
  Music,
  HeartPulse,
  Beaker,
  Building,
  Trophy,
  Cake,
  TreeDeciduous,
  Book,
  Circle,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ProfileHonorTagWithDetails,
  VerificationLevel,
} from "@/types/honor-tags";
import { verificationLevels } from "@/types/honor-tags";

/**
 * Icon mapping for honor tags
 */
const iconMap: Record<string, LucideIcon> = {
  medal: Medal,
  shield: Shield,
  award: Award,
  heart: Heart,
  star: Star,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  candle: Flame, // Using Flame as candle alternative
  dove: Bird, // Using Bird as dove alternative
  crown: Crown,
  zap: Zap,
  home: Home,
  map: Map,
  scale: Scale,
  scroll: Scroll,
  music: Music,
  "heart-pulse": HeartPulse,
  flask: Beaker,
  building: Building,
  trophy: Trophy,
  cake: Cake,
  "tree-deciduous": TreeDeciduous,
  book: Book,
  chain: Shield, // Using Shield as chain alternative
  gavel: Scale, // Using Scale as gavel alternative
  radiation: Zap, // Using Zap as radiation alternative
};

/**
 * Verification icon mapping
 */
const verificationIconMap: Record<VerificationLevel, LucideIcon> = {
  self_declared: Circle,
  family_verified: CheckCircle,
  documented: Star,
};

export interface HonorTagProps extends React.HTMLAttributes<HTMLDivElement> {
  tag: ProfileHonorTagWithDetails;
  size?: "sm" | "md" | "lg";
  showVerification?: boolean;
  showTooltip?: boolean;
  onVerify?: () => void;
}

/**
 * HonorTag Component
 *
 * Displays a single honor tag with dignified, memorial-appropriate styling.
 * Designed to be visually distinct from gamification badges.
 */
export function HonorTag({
  tag,
  size = "md",
  showVerification = true,
  showTooltip = true,
  onVerify,
  className,
  ...props
}: HonorTagProps) {
  const locale = useLocale() as "en" | "ru";

  const name = locale === "ru" && tag.name_ru ? tag.name_ru : tag.name;
  const description =
    locale === "ru" && tag.description_ru ? tag.description_ru : tag.description;

  const Icon = iconMap[tag.icon] || Medal;
  const VerificationIcon = verificationIconMap[tag.verification_level];
  const verificationMeta = verificationLevels[tag.verification_level];

  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
    lg: "text-base px-4 py-2 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const content = (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        "border transition-all duration-200",
        "hover:shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: tag.background_color || "#F3F4F6",
        borderColor: tag.color || "#6B7280",
        color: tag.color || "#6B7280",
      }}
      {...props}
    >
      <Icon className={iconSizes[size]} />
      <span>{name}</span>
      {showVerification && (
        <VerificationIcon
          className={cn(iconSizes[size], "ml-0.5")}
          style={{ color: verificationMeta.color }}
        />
      )}
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-semibold">{name}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs">
              <VerificationIcon
                className="w-3 h-3"
                style={{ color: verificationMeta.color }}
              />
              <span style={{ color: verificationMeta.color }}>
                {locale === "ru"
                  ? verificationMeta.label_ru
                  : verificationMeta.label}
              </span>
            </div>
            {tag.verification_level === "family_verified" &&
              tag.verified_by.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {locale === "ru"
                    ? `Подтвердили: ${tag.verified_by.length} чел.`
                    : `Verified by ${tag.verified_by.length} family members`}
                </p>
              )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { iconMap as honorTagIconMap };
