"use client";

import * as React from "react";
import { ProgressRing, CompactProgressRing } from "@/components/ui/progress-ring";
import {
  calculateProfileCompleteness,
  tierLabels,
  type ProfileCompletenessResult,
} from "@/lib/profile-completeness";
import { Database } from "@/lib/types/supabase";
import { cn } from "@/lib/utils";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

interface ProfileCompletenessRingProps {
  /** User profile data */
  profile: UserProfile;
  /** Whether the profile has a photo */
  hasPhoto?: boolean;
  /** Whether the profile has at least one story */
  hasStory?: boolean;
  /** Whether the profile has confirmed relationships */
  hasRelationships?: boolean;
  /** Whether the profile has residence history */
  hasResidenceHistory?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show label below ring */
  showLabel?: boolean;
  /** Show tier badge */
  showTier?: boolean;
  /** Locale for translations */
  locale?: "en" | "ru";
  /** Use compact variant */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Profile Completeness Ring Component
 *
 * A self-contained component that calculates and displays
 * profile completeness with visual feedback.
 */
export function ProfileCompletenessRing({
  profile,
  hasPhoto = false,
  hasStory = false,
  hasRelationships = false,
  hasResidenceHistory = false,
  size = "md",
  showLabel = false,
  showTier = false,
  locale = "en",
  compact = false,
  className,
}: ProfileCompletenessRingProps) {
  const completeness = React.useMemo<ProfileCompletenessResult>(() => {
    return calculateProfileCompleteness({
      profile,
      hasPhoto,
      hasStory,
      hasRelationships,
      hasResidenceHistory,
    });
  }, [profile, hasPhoto, hasStory, hasRelationships, hasResidenceHistory]);

  const tierLabel = tierLabels[completeness.tier];

  if (compact) {
    return (
      <CompactProgressRing
        value={completeness.percentage}
        className={className}
      />
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <ProgressRing
        value={completeness.percentage}
        size={size}
        showValue
        showLabel={showLabel}
        label={locale === "ru" ? "Заполнено" : "Complete"}
        missingItems={completeness.missingItems}
        locale={locale}
      />

      {showTier && (
        <div className="mt-2 text-center">
          <span
            className={cn(
              "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
              completeness.tier === "complete" &&
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              completeness.tier === "established" &&
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              completeness.tier === "growing" &&
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              completeness.tier === "starter" &&
                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {locale === "ru" ? tierLabel.ru : tierLabel.en}
          </span>
          <p className="mt-1 text-xs text-muted-foreground max-w-32">
            {locale === "ru" ? tierLabel.descriptionRu : tierLabel.description}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Server-side data fetching helper
 *
 * Use this in server components to fetch the completeness data
 * then pass to ProfileCompletenessRing
 */
export interface ProfileCompletenessData {
  hasPhoto: boolean;
  hasStory: boolean;
  hasRelationships: boolean;
  hasResidenceHistory: boolean;
}

/**
 * Hook to fetch profile completeness data client-side
 */
export function useProfileCompleteness(profileId: string) {
  const [data, setData] = React.useState<ProfileCompletenessData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Fetch completeness data from API
        const response = await fetch(`/api/profile/complete?profileId=${profileId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch profile completeness:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profileId]);

  return { data, loading };
}

export type { ProfileCompletenessRingProps };
