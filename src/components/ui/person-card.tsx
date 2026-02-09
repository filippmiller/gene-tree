"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

/**
 * PersonCard - Modern glassmorphism person card
 *
 * Features:
 * - Avatar with ring and status indicator
 * - Name and relationship display
 * - Lifespan information
 * - Hover actions
 * - Memorial indicator for deceased
 */

const personCardVariants = cva(
  // Base styles
  [
    "group relative flex items-center gap-4 p-4",
    "rounded-2xl transition-all duration-300 ease-out",
    "transform-gpu cursor-pointer",
  ].join(" "),
  {
    variants: {
      variant: {
        // Glass - Default transparent style
        glass: [
          "bg-white/60 dark:bg-gray-800/60",
          "backdrop-blur-md",
          "border border-white/40 dark:border-white/10",
          "shadow-glass",
          "hover:-translate-y-1 hover:shadow-glass-hover",
          "hover:border-[#58A6FF]/20",
        ].join(" "),

        // Solid - Opaque background
        solid: [
          "bg-card",
          "border border-border",
          "shadow-elevation-2",
          "hover:-translate-y-1 hover:shadow-elevation-3",
          "hover:border-[#58A6FF]/20",
        ].join(" "),

        // Minimal - Very subtle
        minimal: [
          "bg-white/30 dark:bg-gray-800/30",
          "border border-transparent",
          "hover:bg-white/60 dark:hover:bg-gray-800/60",
          "hover:border-white/40 dark:hover:border-white/10",
        ].join(" "),

        // Highlighted - Featured person
        highlighted: [
          "bg-[#58A6FF]/10",
          "backdrop-blur-md",
          "border border-[#58A6FF]/20",
          "shadow-glass",
          "hover:-translate-y-1 hover:shadow-glow",
        ].join(" "),
      },
      size: {
        sm: "p-3 gap-3",
        md: "p-4 gap-4",
        lg: "p-5 gap-5",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: "md",
    },
  }
);

// Avatar ring colors for different relationship types (Midnight Glass palette)
const avatarRingColors = {
  parents: "ring-[#58A6FF]",
  grandparents: "ring-[#3FB9A0]",
  children: "ring-[#56D4DD]",
  grandchildren: "ring-[#8B8FFF]",
  siblings: "ring-[#3FB950]",
  spouses: "ring-[#F778BA]",
  default: "ring-[#58A6FF]",
};

// Avatar flat fallback colors (Midnight Glass palette)
const avatarFallbackColors = {
  parents: "bg-[#58A6FF]",
  grandparents: "bg-[#3FB9A0]",
  children: "bg-[#56D4DD]",
  grandchildren: "bg-[#8B8FFF]",
  siblings: "bg-[#3FB950]",
  spouses: "bg-[#F778BA]",
  default: "bg-[#58A6FF]",
};

export interface PersonCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof personCardVariants> {
  person: {
    id: string;
    name: string;
    photoUrl?: string | null;
    birthDate?: string | null;
    deathDate?: string | null;
    isAlive?: boolean;
  };
  relationshipType?:
    | "parents"
    | "grandparents"
    | "children"
    | "grandchildren"
    | "siblings"
    | "spouses"
    | "default";
  relationshipLabel?: string;
  locale?: string;
  showActions?: boolean;
  href?: string;
}

const PersonCard = React.forwardRef<HTMLDivElement, PersonCardProps>(
  (
    {
      className,
      variant,
      size,
      person,
      relationshipType = "default",
      relationshipLabel,
      locale = "en",
      showActions = true,
      href,
      ...props
    },
    ref
  ) => {
    // Get initials from name
    const getInitials = (name: string): string => {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    // Format lifespan
    const formatLifespan = (): string => {
      const birthYear = person.birthDate
        ? new Date(person.birthDate).getFullYear()
        : null;
      const deathYear = person.deathDate
        ? new Date(person.deathDate).getFullYear()
        : null;

      if (birthYear && deathYear) {
        return `${birthYear} – ${deathYear}`;
      } else if (birthYear && person.isAlive === false) {
        return `${birthYear} – ...`;
      } else if (birthYear) {
        return locale === "ru" ? `род. ${birthYear}` : `b. ${birthYear}`;
      }
      return "";
    };

    const ringColor = avatarRingColors[relationshipType];
    const fallbackColor = avatarFallbackColors[relationshipType];
    const lifespan = formatLifespan();

    const cardContent = (
      <div
        ref={ref}
        className={cn(personCardVariants({ variant, size, className }))}
        {...props}
      >
        {/* Avatar with ring */}
        <div className="relative flex-shrink-0">
          <Avatar
            className={cn(
              "ring-2 ring-offset-2 ring-offset-background shadow-md transition-transform duration-300 group-hover:scale-105",
              ringColor,
              size === "sm" ? "w-10 h-10" : size === "lg" ? "w-16 h-16" : "w-14 h-14"
            )}
          >
            {person.photoUrl ? (
              <AvatarImage src={person.photoUrl} alt={person.name} />
            ) : null}
            <AvatarFallback
              className={cn(
                "text-white font-semibold",
                fallbackColor,
                size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm"
              )}
            >
              {getInitials(person.name)}
            </AvatarFallback>
          </Avatar>

          {/* Deceased indicator */}
          {person.isAlive === false && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-400 ring-2 ring-background flex items-center justify-center"
              title={locale === "ru" ? "Усопший" : "Deceased"}
            >
              <span className="text-[8px] text-white">✝</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-semibold text-foreground truncate transition-colors group-hover:text-[#58A6FF]",
              size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"
            )}
          >
            {person.name}
          </h3>

          {relationshipLabel && (
            <p className="text-sm text-muted-foreground truncate">
              {relationshipLabel}
            </p>
          )}

          {lifespan && (
            <p className="text-xs text-muted-foreground mt-0.5">{lifespan}</p>
          )}
        </div>

        {/* Actions or chevron */}
        {showActions ? (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        ) : null}
      </div>
    );

    // Wrap in Link if href provided
    if (href) {
      return (
        <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-[#58A6FF] focus:ring-offset-2 rounded-2xl">
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  }
);
PersonCard.displayName = "PersonCard";

/**
 * SpouseCard - Special variant for spouse with marriage info
 */
export interface SpouseCardProps extends Omit<PersonCardProps, "relationshipType"> {
  marriageDate?: string | null;
  divorceDate?: string | null;
}

const SpouseCard = React.forwardRef<HTMLDivElement, SpouseCardProps>(
  ({ marriageDate, divorceDate, ...props }, ref) => {
    const formatMarriage = () => {
      if (!marriageDate) return null;
      const year = new Date(marriageDate).getFullYear();
      if (divorceDate) {
        const divorceYear = new Date(divorceDate).getFullYear();
        return `${year} – ${divorceYear}`;
      }
      return `${props.locale === "ru" ? "с" : "since"} ${year}`;
    };

    const marriageInfo = formatMarriage();

    return (
      <PersonCard
        ref={ref}
        relationshipType="spouses"
        relationshipLabel={
          marriageInfo
            ? `${props.locale === "ru" ? "Брак" : "Marriage"}: ${marriageInfo}`
            : undefined
        }
        {...props}
      />
    );
  }
);
SpouseCard.displayName = "SpouseCard";

export { PersonCard, SpouseCard, personCardVariants };
