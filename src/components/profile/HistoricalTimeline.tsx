'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  EventCategory,
  CATEGORY_META,
  HISTORICAL_EVENTS,
} from '@/lib/history/events';
import {
  calculateTimeline,
  TimelineEvent,
  TimelineResult,
} from '@/lib/history/timeline-calculator';

interface HistoricalTimelineProps {
  /** Person's first name for personalized messages */
  firstName: string;
  /** Birth date in ISO format */
  birthDate: string | null;
  /** Death date in ISO format (null if living) */
  deathDate?: string | null;
  /** Avatar URL for profile header */
  avatarUrl?: string | null;
  /** Locale for translations */
  locale?: 'en' | 'ru';
  /** Initial category filter */
  initialCategory?: EventCategory | null;
  /** Maximum number of events to show initially */
  initialLimit?: number;
  /** CSS class name */
  className?: string;
}

const translations = {
  en: {
    title: 'Historical Context',
    subtitle: 'Major world events during their lifetime',
    noEvents: 'No historical events found for this period.',
    noBirthDate: 'Birth date is required to show historical context.',
    showMore: 'Show more',
    showLess: 'Show less',
    allCategories: 'All',
    eventsFound: 'events found',
    wasAge: 'was',
    yearsOld: 'years old',
    bornInYear: 'Born in the year of',
    livedThrough: 'Lived through',
    filterByCategory: 'Filter by category',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetView: 'Reset',
    decades: 'Decades',
    eventAge: 'Age at event',
    beforeBirth: 'before birth',
    afterDeath: 'after death',
    viewAll: 'View all events',
    importance: 'Importance',
    majorEvents: 'Major Events',
    allEvents: 'All Events',
  },
  ru: {
    title: 'Исторический контекст',
    subtitle: 'Важные мировые события при жизни',
    noEvents: 'События для этого периода не найдены.',
    noBirthDate: 'Для отображения исторического контекста необходима дата рождения.',
    showMore: 'Показать ещё',
    showLess: 'Показать меньше',
    allCategories: 'Все',
    eventsFound: 'событий найдено',
    wasAge: 'было',
    yearsOld: 'лет',
    bornInYear: 'Родился(ась) в год',
    livedThrough: 'Пережил(а)',
    filterByCategory: 'Фильтр по категории',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    resetView: 'Сброс',
    decades: 'Десятилетия',
    eventAge: 'Возраст',
    beforeBirth: 'до рождения',
    afterDeath: 'после смерти',
    viewAll: 'Все события',
    importance: 'Важность',
    majorEvents: 'Важные события',
    allEvents: 'Все события',
  },
};

/**
 * Category filter button component
 */
function CategoryFilter({
  category,
  isActive,
  onClick,
  count,
  locale,
}: {
  category: EventCategory | null;
  isActive: boolean;
  onClick: () => void;
  count: number;
  locale: 'en' | 'ru';
}) {
  const meta = category ? CATEGORY_META[category] : null;
  const t = translations[locale];

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        'border hover:shadow-sm',
        isActive
          ? meta
            ? meta.color
            : 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
      )}
    >
      {meta ? (
        <>
          <span>{meta.icon}</span>
          <span>{locale === 'ru' ? meta.label_ru : meta.label}</span>
        </>
      ) : (
        <span>{t.allCategories}</span>
      )}
      <span className="ml-1 text-xs opacity-70">({count})</span>
    </button>
  );
}

/**
 * Single timeline event card
 */
function TimelineEventCard({
  event,
  firstName,
  locale,
  isExpanded,
}: {
  event: TimelineEvent;
  firstName: string;
  locale: 'en' | 'ru';
  isExpanded: boolean;
}) {
  const meta = CATEGORY_META[event.category];
  const t = translations[locale];

  const title = locale === 'ru' ? event.title_ru : event.title;
  const description = locale === 'ru' ? event.description_ru : event.description;
  const ageLabel = locale === 'ru' ? event.ageLabel_ru : event.ageLabel;

  // Generate personalized message
  const personalMessage = useMemo(() => {
    if (!event.wasAlive) {
      return locale === 'ru'
        ? `${Math.abs(event.ageAtEvent)} лет до рождения ${firstName}`
        : `${Math.abs(event.ageAtEvent)} years before ${firstName} was born`;
    }

    if (event.ageAtEvent === 0) {
      return locale === 'ru'
        ? `${firstName} родился(ась) в этом году`
        : `${firstName} was born this year`;
    }

    return locale === 'ru'
      ? `${firstName} было ${ageLabel}`
      : `${firstName} was ${ageLabel}`;
  }, [event, firstName, ageLabel, locale]);

  return (
    <div
      className={cn(
        'relative pl-8 pb-8 last:pb-0',
        'before:absolute before:left-[11px] before:top-[28px] before:bottom-0 before:w-[2px]',
        'before:bg-gradient-to-b before:from-border before:to-transparent',
        'last:before:hidden'
      )}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-1 w-6 h-6 rounded-full',
          'flex items-center justify-center text-xs',
          'border-2 border-background shadow-sm',
          meta.color.split(' ')[0]
        )}
      >
        {meta.icon}
      </div>

      {/* Event card */}
      <div
        className={cn(
          'bg-card border rounded-lg overflow-hidden',
          'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5'
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-foreground">
                  {event.year}
                </span>
                {event.month && (
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.year, event.month - 1).toLocaleDateString(
                      locale === 'ru' ? 'ru-RU' : 'en-US',
                      { month: 'short' }
                    )}
                  </span>
                )}
                <Badge
                  variant="outline"
                  size="sm"
                  className={cn('shrink-0', meta.color)}
                >
                  {locale === 'ru' ? meta.label_ru : meta.label}
                </Badge>
              </div>
              <h4 className="font-semibold text-foreground mt-1 leading-snug">
                {title}
              </h4>
            </div>

            {/* Importance indicator */}
            <div className="flex gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-4 rounded-full',
                    i < event.importance
                      ? 'bg-amber-400 dark:bg-amber-500'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          {/* Personal context */}
          <div
            className={cn(
              'text-sm font-medium mb-2 px-2 py-1 rounded-md inline-block',
              event.wasAlive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {personalMessage}
          </div>

          {/* Description */}
          {isExpanded && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              {description}
            </p>
          )}

          {/* Region tags */}
          {event.regions && event.regions.length > 0 && isExpanded && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {event.regions.map((region) => (
                <span
                  key={region}
                  className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                >
                  {region}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Decade navigation component
 */
function DecadeNav({
  decades,
  activeDecade,
  onSelect,
}: {
  decades: number[];
  activeDecade: number | null;
  onSelect: (decade: number | null) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'px-2 py-1 text-xs rounded font-medium transition-colors',
          activeDecade === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
        )}
      >
        All
      </button>
      {decades.map((decade) => (
        <button
          key={decade}
          onClick={() => onSelect(decade)}
          className={cn(
            'px-2 py-1 text-xs rounded font-medium transition-colors',
            activeDecade === decade
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          )}
        >
          {decade}s
        </button>
      ))}
    </div>
  );
}

/**
 * Main Historical Timeline Component
 */
export function HistoricalTimeline({
  firstName,
  birthDate,
  deathDate,
  avatarUrl,
  locale = 'en',
  initialCategory = null,
  initialLimit = 10,
  className,
}: HistoricalTimelineProps) {
  const t = translations[locale];

  // State
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(
    initialCategory
  );
  const [showMajorOnly, setShowMajorOnly] = useState(true);
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null);
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate timeline
  const timelineResult = useMemo<TimelineResult | null>(() => {
    if (!birthDate) return null;

    return calculateTimeline(birthDate, deathDate, {
      categories: selectedCategory ? [selectedCategory] : undefined,
      minImportance: showMajorOnly ? 4 : 1,
    });
  }, [birthDate, deathDate, selectedCategory, showMajorOnly]);

  // Filter events by decade
  const filteredEvents = useMemo(() => {
    if (!timelineResult) return [];

    let events = timelineResult.events.filter(
      (e) => e.wasAlive && e.wasBeforeDeath
    );

    if (selectedDecade !== null) {
      events = events.filter(
        (e) => Math.floor(e.year / 10) * 10 === selectedDecade
      );
    }

    return events;
  }, [timelineResult, selectedDecade]);

  // Get unique decades
  const decades = useMemo(() => {
    if (!timelineResult) return [];

    const decadeSet = new Set<number>();
    timelineResult.events
      .filter((e) => e.wasAlive && e.wasBeforeDeath)
      .forEach((e) => {
        decadeSet.add(Math.floor(e.year / 10) * 10);
      });

    return Array.from(decadeSet).sort((a, b) => a - b);
  }, [timelineResult]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!timelineResult) return {};

    const counts: Record<string, number> = { all: 0 };
    timelineResult.events
      .filter((e) => e.wasAlive && e.wasBeforeDeath)
      .forEach((e) => {
        counts[e.category] = (counts[e.category] || 0) + 1;
        counts.all++;
      });

    return counts;
  }, [timelineResult]);

  // Displayed events with limit
  const displayedEvents = filteredEvents.slice(0, displayLimit);
  const hasMore = filteredEvents.length > displayLimit;

  // Handle show more
  const handleShowMore = () => {
    setDisplayLimit((prev) => prev + 10);
  };

  const handleShowLess = () => {
    setDisplayLimit(initialLimit);
  };

  // If no birth date, show placeholder
  if (!birthDate) {
    return (
      <Card className={cn('bg-muted/30', className)}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{t.noBirthDate}</p>
        </CardContent>
      </Card>
    );
  }

  // If no events found
  if (!timelineResult || timelineResult.events.length === 0) {
    return (
      <Card className={cn('bg-muted/30', className)}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{t.noEvents}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-4 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">&#128218;</span>
            {t.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {filteredEvents.length}
            </span>
            <span className="text-muted-foreground">{t.eventsFound}</span>
          </div>
          {timelineResult.isLiving ? (
            <Badge variant="success" size="sm">
              {locale === 'ru' ? 'Жив(а)' : 'Living'}
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              {timelineResult.birthYear} - {timelineResult.deathYear}
            </Badge>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Importance toggle */}
          <div className="flex gap-2">
            <Button
              variant={showMajorOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMajorOnly(true)}
            >
              {t.majorEvents}
            </Button>
            <Button
              variant={!showMajorOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMajorOnly(false)}
            >
              {t.allEvents}
            </Button>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            <CategoryFilter
              category={null}
              isActive={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
              count={categoryCounts.all || 0}
              locale={locale}
            />
            {Object.keys(CATEGORY_META).map((cat) => {
              const category = cat as EventCategory;
              const count = categoryCounts[category] || 0;
              if (count === 0) return null;

              return (
                <CategoryFilter
                  key={category}
                  category={category}
                  isActive={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                  count={count}
                  locale={locale}
                />
              );
            })}
          </div>

          {/* Decade navigation */}
          {decades.length > 1 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">
                {t.decades}:
              </p>
              <DecadeNav
                decades={decades}
                activeDecade={selectedDecade}
                onSelect={setSelectedDecade}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Expand/collapse toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded
              ? locale === 'ru'
                ? 'Скрыть описания'
                : 'Hide descriptions'
              : locale === 'ru'
              ? 'Показать описания'
              : 'Show descriptions'}
          </Button>
        </div>

        {/* Timeline */}
        <div className="relative">
          {displayedEvents.map((event) => (
            <TimelineEventCard
              key={event.id}
              event={event}
              firstName={firstName}
              locale={locale}
              isExpanded={isExpanded}
            />
          ))}
        </div>

        {/* Show more/less buttons */}
        {(hasMore || displayLimit > initialLimit) && (
          <div className="flex gap-2 justify-center mt-6 pt-4 border-t">
            {hasMore && (
              <Button variant="outline" size="sm" onClick={handleShowMore}>
                {t.showMore} ({filteredEvents.length - displayLimit} more)
              </Button>
            )}
            {displayLimit > initialLimit && (
              <Button variant="ghost" size="sm" onClick={handleShowLess}>
                {t.showLess}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HistoricalTimeline;
