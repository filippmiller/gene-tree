/**
 * Timeline Calculator
 *
 * Calculates which historical events occurred during a person's lifetime
 * and their age at each event.
 */

import {
  HistoricalEvent,
  EventCategory,
  HISTORICAL_EVENTS,
  getEventsInRange,
} from './events';

export interface TimelineEvent extends HistoricalEvent {
  /** Person's age when the event occurred */
  ageAtEvent: number;
  /** Formatted age string (e.g., "25 years old", "newborn") */
  ageLabel: string;
  /** Formatted age string in Russian */
  ageLabel_ru: string;
  /** Whether person was born before this event */
  wasAlive: boolean;
  /** Whether event occurred before person's death (if applicable) */
  wasBeforeDeath: boolean;
}

export interface TimelineResult {
  /** Events that occurred during the person's lifetime */
  events: TimelineEvent[];
  /** Person's birth year */
  birthYear: number;
  /** Person's death year (if applicable) */
  deathYear: number | null;
  /** Current age or age at death */
  currentAge: number;
  /** Whether the person is still living */
  isLiving: boolean;
  /** Total number of events in their lifetime */
  totalEvents: number;
  /** Events by category count */
  categoryBreakdown: Record<EventCategory, number>;
}

/**
 * Parse a date string and extract year, month, day
 */
function parseDate(dateStr: string | null | undefined): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1, // 1-12
      day: date.getDate(),
    };
  } catch {
    return null;
  }
}

/**
 * Calculate age at a specific date
 */
function calculateAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  eventYear: number,
  eventMonth?: number,
  eventDay?: number
): number {
  let age = eventYear - birthYear;

  // Adjust for month/day if available
  if (eventMonth !== undefined) {
    if (eventMonth < birthMonth) {
      age--;
    } else if (eventMonth === birthMonth && eventDay !== undefined && eventDay < birthDay) {
      age--;
    }
  }

  return Math.max(0, age);
}

/**
 * Format age as a human-readable string
 */
function formatAge(age: number, locale: 'en' | 'ru' = 'en'): string {
  if (locale === 'ru') {
    if (age === 0) return 'младенец';
    if (age === 1) return '1 год';
    if (age >= 2 && age <= 4) return `${age} года`;
    if (age >= 5 && age <= 20) return `${age} лет`;
    if (age % 10 === 1 && age !== 11) return `${age} год`;
    if (age % 10 >= 2 && age % 10 <= 4 && (age < 12 || age > 14)) return `${age} года`;
    return `${age} лет`;
  }

  if (age === 0) return 'newborn';
  if (age === 1) return '1 year old';
  return `${age} years old`;
}

/**
 * Calculate historical timeline for a person
 */
export function calculateTimeline(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined,
  options: {
    /** Filter by event categories */
    categories?: EventCategory[];
    /** Minimum importance level (1-5) */
    minImportance?: number;
    /** Include events before birth */
    includePreBirth?: boolean;
    /** Number of years before birth to include */
    preBirthYears?: number;
    /** Filter by region codes */
    regions?: string[];
  } = {}
): TimelineResult | null {
  const birth = parseDate(birthDate);
  if (!birth) return null;

  const death = parseDate(deathDate);
  const currentYear = new Date().getFullYear();

  const endYear = death?.year ?? currentYear;
  const isLiving = !death;
  const currentAge = endYear - birth.year;

  // Determine event range
  const startYear = options.includePreBirth
    ? birth.year - (options.preBirthYears ?? 10)
    : birth.year;

  // Get events in range
  let events = getEventsInRange(startYear, endYear);

  // Apply filters
  if (options.categories && options.categories.length > 0) {
    events = events.filter(e => options.categories!.includes(e.category));
  }

  if (options.minImportance) {
    events = events.filter(e => e.importance >= options.minImportance!);
  }

  if (options.regions && options.regions.length > 0) {
    events = events.filter(
      e => !e.regions || e.regions.some(r => options.regions!.includes(r))
    );
  }

  // Calculate age at each event
  const timelineEvents: TimelineEvent[] = events.map(event => {
    const age = calculateAge(
      birth.year,
      birth.month,
      birth.day,
      event.year,
      event.month,
      event.day
    );

    const wasAlive = event.year >= birth.year;
    const wasBeforeDeath = !death || event.year <= death.year;

    return {
      ...event,
      ageAtEvent: wasAlive ? age : -(birth.year - event.year),
      ageLabel: wasAlive ? formatAge(age, 'en') : `${birth.year - event.year} years before birth`,
      ageLabel_ru: wasAlive ? formatAge(age, 'ru') : `за ${birth.year - event.year} лет до рождения`,
      wasAlive,
      wasBeforeDeath,
    };
  });

  // Sort by year
  timelineEvents.sort((a, b) => a.year - b.year);

  // Calculate category breakdown
  const categoryBreakdown = timelineEvents.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  }, {} as Record<EventCategory, number>);

  return {
    events: timelineEvents,
    birthYear: birth.year,
    deathYear: death?.year ?? null,
    currentAge,
    isLiving,
    totalEvents: timelineEvents.length,
    categoryBreakdown,
  };
}

/**
 * Get significant events for a person (high importance only)
 */
export function getSignificantEvents(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined,
  limit: number = 10
): TimelineEvent[] {
  const result = calculateTimeline(birthDate, deathDate, {
    minImportance: 4,
  });

  if (!result) return [];

  // Sort by importance first, then by closeness to birth year
  const sorted = [...result.events]
    .filter(e => e.wasAlive && e.wasBeforeDeath)
    .sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return a.ageAtEvent - b.ageAtEvent;
    });

  return sorted.slice(0, limit);
}

/**
 * Generate a narrative about the person's historical context
 */
export function generateHistoricalNarrative(
  firstName: string,
  birthDate: string | null | undefined,
  deathDate: string | null | undefined,
  locale: 'en' | 'ru' = 'en'
): string[] {
  const result = calculateTimeline(birthDate, deathDate, {
    minImportance: 4,
  });

  if (!result) return [];

  const narratives: string[] = [];
  const events = result.events.filter(e => e.wasAlive && e.wasBeforeDeath);

  for (const event of events.slice(0, 5)) {
    if (locale === 'ru') {
      if (event.ageAtEvent === 0) {
        narratives.push(`${firstName} родился(ась) в год ${event.title_ru}.`);
      } else {
        narratives.push(
          `Когда ${firstName} было ${event.ageLabel_ru}, произошло: ${event.title_ru}.`
        );
      }
    } else {
      if (event.ageAtEvent === 0) {
        narratives.push(`${firstName} was born in the year of ${event.title}.`);
      } else {
        narratives.push(
          `${firstName} was ${event.ageLabel} when ${event.title} happened.`
        );
      }
    }
  }

  return narratives;
}

/**
 * Get events grouped by decade
 */
export function getEventsByDecade(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined
): Map<number, TimelineEvent[]> {
  const result = calculateTimeline(birthDate, deathDate);
  if (!result) return new Map();

  const decades = new Map<number, TimelineEvent[]>();

  for (const event of result.events) {
    if (!event.wasAlive || !event.wasBeforeDeath) continue;

    const decade = Math.floor(event.year / 10) * 10;
    if (!decades.has(decade)) {
      decades.set(decade, []);
    }
    decades.get(decade)!.push(event);
  }

  return decades;
}

/**
 * Find events where person was a specific age
 */
export function getEventsAtAge(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined,
  age: number
): TimelineEvent[] {
  const result = calculateTimeline(birthDate, deathDate);
  if (!result) return [];

  return result.events.filter(
    e => e.wasAlive && e.wasBeforeDeath && e.ageAtEvent === age
  );
}

/**
 * Get milestone ages with events
 */
export function getMilestoneEvents(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined
): Array<{ age: number; events: TimelineEvent[] }> {
  const milestoneAges = [0, 5, 10, 15, 18, 21, 25, 30, 40, 50, 60, 70, 80, 90, 100];
  const result = calculateTimeline(birthDate, deathDate);

  if (!result) return [];

  return milestoneAges
    .filter(age => age <= result.currentAge)
    .map(age => ({
      age,
      events: result.events.filter(
        e => e.wasAlive && e.wasBeforeDeath && e.ageAtEvent === age
      ),
    }))
    .filter(m => m.events.length > 0);
}
