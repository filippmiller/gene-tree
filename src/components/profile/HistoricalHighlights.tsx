'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  getSignificantEvents,
  generateHistoricalNarrative,
} from '@/lib/history/timeline-calculator';
import { CATEGORY_META } from '@/lib/history/events';

interface HistoricalHighlightsProps {
  /** Person's first name */
  firstName: string;
  /** Birth date in ISO format */
  birthDate: string | null;
  /** Death date in ISO format (null if living) */
  deathDate?: string | null;
  /** Locale for translations */
  locale?: 'en' | 'ru';
  /** Maximum number of highlights to show */
  maxHighlights?: number;
  /** CSS class name */
  className?: string;
}

const translations = {
  en: {
    title: 'Historical Context',
    livedThrough: 'Lived through',
    wasAge: 'was',
    whenEvent: 'when',
  },
  ru: {
    title: 'Исторический контекст',
    livedThrough: 'Пережил(а)',
    wasAge: 'было',
    whenEvent: 'когда',
  },
};

/**
 * Compact historical highlights component for profile headers.
 * Shows a few key historical facts about the person's lifetime.
 */
export function HistoricalHighlights({
  firstName,
  birthDate,
  deathDate,
  locale = 'en',
  maxHighlights = 3,
  className,
}: HistoricalHighlightsProps) {
  const t = translations[locale];

  // Get significant events
  const highlights = useMemo(() => {
    if (!birthDate) return [];
    return getSignificantEvents(birthDate, deathDate, maxHighlights);
  }, [birthDate, deathDate, maxHighlights]);

  // Generate narrative sentences
  const narratives = useMemo(() => {
    if (!birthDate) return [];
    return generateHistoricalNarrative(firstName, birthDate, deathDate, locale);
  }, [firstName, birthDate, deathDate, locale]);

  if (!birthDate || highlights.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <span>&#128218;</span>
        {t.title}
      </h4>

      <div className="space-y-1.5">
        {highlights.map((event) => {
          const meta = CATEGORY_META[event.category];
          const title = locale === 'ru' ? event.title_ru : event.title;
          const ageLabel = locale === 'ru' ? event.ageLabel_ru : event.ageLabel;

          return (
            <div
              key={event.id}
              className={cn(
                'flex items-center gap-2 text-sm',
                'px-2 py-1 rounded-md',
                'bg-muted/50 dark:bg-muted/30'
              )}
            >
              <span className="text-base">{meta.icon}</span>
              <span className="text-muted-foreground">
                {event.ageAtEvent === 0 ? (
                  <>
                    {locale === 'ru' ? 'Родился(ась) в год' : 'Born in the year of'}{' '}
                    <span className="font-medium text-foreground">{title}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {ageLabel}
                    </span>{' '}
                    {t.whenEvent}{' '}
                    <span className="font-medium text-foreground">{title}</span>
                  </>
                )}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {event.year}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Single-line historical fact for inline display
 */
export function HistoricalFactBadge({
  firstName,
  birthDate,
  deathDate,
  locale = 'en',
  className,
}: Omit<HistoricalHighlightsProps, 'maxHighlights'>) {
  const highlight = useMemo(() => {
    if (!birthDate) return null;
    const events = getSignificantEvents(birthDate, deathDate, 1);
    return events[0] || null;
  }, [birthDate, deathDate]);

  if (!highlight) return null;

  const meta = CATEGORY_META[highlight.category];
  const title = locale === 'ru' ? highlight.title_ru : highlight.title;
  const ageLabel = locale === 'ru' ? highlight.ageLabel_ru : highlight.ageLabel;

  const message =
    highlight.ageAtEvent === 0
      ? locale === 'ru'
        ? `Родился(ась) в год ${title}`
        : `Born in the year of ${title}`
      : locale === 'ru'
      ? `${ageLabel} когда ${title}`
      : `${ageLabel} when ${title}`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5',
        'text-xs text-muted-foreground',
        'px-2 py-1 rounded-full',
        'bg-muted/50 dark:bg-muted/30',
        className
      )}
      title={message}
    >
      <span>{meta.icon}</span>
      <span className="truncate max-w-[200px]">{message}</span>
    </div>
  );
}

export default HistoricalHighlights;
