'use client';

import React from 'react';
import { HistoricalTimeline } from '@/components/profile/HistoricalTimeline';

interface HistoricalTimelineWrapperProps {
  profileId: string;
  firstName: string;
  birthDate: string | null;
  deathDate?: string | null;
  avatarUrl?: string | null;
  locale: 'en' | 'ru';
}

/**
 * Client-side wrapper for the Historical Timeline component.
 * This wrapper enables client-side interactivity while receiving
 * server-rendered data as props.
 */
export default function HistoricalTimelineWrapper({
  profileId,
  firstName,
  birthDate,
  deathDate,
  avatarUrl,
  locale,
}: HistoricalTimelineWrapperProps) {
  // Don't render if no birth date
  if (!birthDate) {
    return null;
  }

  return (
    <div className="mb-6">
      <HistoricalTimeline
        firstName={firstName}
        birthDate={birthDate}
        deathDate={deathDate}
        avatarUrl={avatarUrl}
        locale={locale}
        initialLimit={8}
      />
    </div>
  );
}
