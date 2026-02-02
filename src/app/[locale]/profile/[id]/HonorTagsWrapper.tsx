"use client";

import { useState } from "react";
import { HonorTagsSection } from "@/components/honor-tags/HonorTagsSection";
import { HonorTagSelector } from "@/components/honor-tags/HonorTagSelector";
import { useHonorTags } from "@/hooks/useHonorTags";
import type { ProfileHonorTagWithDetails } from "@/types/honor-tags";

interface HonorTagsWrapperProps {
  profileId: string;
  isOwnProfile: boolean;
  isDeceasedProfile: boolean;
  locale: "en" | "ru";
}

/**
 * Client-side wrapper for honor tags functionality
 */
export default function HonorTagsWrapper({
  profileId,
  isOwnProfile,
  isDeceasedProfile,
  locale,
}: HonorTagsWrapperProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { tags, loading, addTag, removeTag } = useHonorTags({ profileId });

  const canEdit = isOwnProfile || isDeceasedProfile;

  const handleAddTag = async (honorTagId: string) => {
    const success = await addTag(honorTagId);
    if (success) {
      // Optionally close selector after adding
      // setSelectorOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-32" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
        </div>
      </div>
    );
  }

  // Don't show section if no tags and can't edit
  if (tags.length === 0 && !canEdit) {
    return null;
  }

  return (
    <>
      <HonorTagsSection
        profileId={profileId}
        tags={tags as ProfileHonorTagWithDetails[]}
        isOwnProfile={isOwnProfile}
        isDeceasedProfile={isDeceasedProfile}
        canEdit={canEdit}
        maxVisible={5}
        onAddTag={() => setSelectorOpen(true)}
        onViewAll={() => {
          // TODO: Open full honor tags modal
          console.log("View all tags");
        }}
      />

      <HonorTagSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleAddTag}
        existingTagIds={tags.map((t) => t.honor_tag_id)}
        profileId={profileId}
      />
    </>
  );
}
