"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Medal, Plus, ChevronRight } from "lucide-react";
import { HonorTag } from "./HonorTag";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import type { ProfileHonorTagWithDetails } from "@/types/honor-tags";

export interface HonorTagsSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  profileId: string;
  tags: ProfileHonorTagWithDetails[];
  isOwnProfile?: boolean;
  isDeceasedProfile?: boolean;
  canEdit?: boolean;
  maxVisible?: number;
  onAddTag?: () => void;
  onViewAll?: () => void;
  onVerifyTag?: (tagId: string) => void;
}

/**
 * HonorTagsSection Component
 *
 * Displays honor tags for a profile with options to add/verify.
 * Special treatment for deceased profiles with memorial styling.
 */
export function HonorTagsSection({
  profileId,
  tags,
  isOwnProfile = false,
  isDeceasedProfile = false,
  canEdit = false,
  maxVisible = 5,
  onAddTag,
  onViewAll,
  onVerifyTag,
  className,
  ...props
}: HonorTagsSectionProps) {
  const locale = useLocale() as "en" | "ru";

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = Math.max(0, tags.length - maxVisible);

  const title = locale === "ru" ? "Почести и отличия" : "Honors & Distinctions";
  const emptyText = isDeceasedProfile
    ? locale === "ru"
      ? "Добавьте почести и отличия для этого человека"
      : "Add honors and distinctions for this person"
    : isOwnProfile
    ? locale === "ru"
      ? "Добавьте ваши награды и отличия"
      : "Add your honors and distinctions"
    : locale === "ru"
    ? "Нет почестей и отличий"
    : "No honors or distinctions";

  // Memorial styling for deceased profiles
  const cardClass = isDeceasedProfile
    ? "border-gray-300 bg-gray-50/50 dark:bg-gray-900/50"
    : "";

  return (
    <GlassCard glass="subtle" className={cn(cardClass, className)} {...props}>
      <GlassCardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2 text-base">
            <Medal
              className={cn(
                "w-5 h-5",
                isDeceasedProfile ? "text-gray-500" : "text-amber-600"
              )}
            />
            {title}
          </GlassCardTitle>
          <div className="flex items-center gap-2">
            {tags.length > maxVisible && onViewAll && (
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                {locale === "ru" ? "Все" : "View All"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {canEdit && onAddTag && (
              <Button variant="outline" size="sm" onClick={onAddTag}>
                <Plus className="w-4 h-4 mr-1" />
                {locale === "ru" ? "Добавить" : "Add"}
              </Button>
            )}
          </div>
        </div>
      </GlassCardHeader>

      <GlassCardContent>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <HonorTag
                key={tag.id}
                tag={tag}
                size="md"
                showVerification={true}
              />
            ))}
            {remainingCount > 0 && (
              <button
                onClick={onViewAll}
                className={cn(
                  "inline-flex items-center rounded-full text-sm px-3 py-1.5",
                  "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                  "hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                )}
              >
                +{remainingCount}{" "}
                {locale === "ru" ? "ещё" : "more"}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Medal
              className={cn(
                "w-10 h-10 mx-auto mb-2",
                isDeceasedProfile
                  ? "text-gray-300 dark:text-gray-600"
                  : "text-gray-200 dark:text-gray-700"
              )}
            />
            <p className="text-sm text-muted-foreground">{emptyText}</p>
            {canEdit && onAddTag && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onAddTag}
              >
                <Plus className="w-4 h-4 mr-1" />
                {locale === "ru" ? "Добавить первую" : "Add First"}
              </Button>
            )}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
