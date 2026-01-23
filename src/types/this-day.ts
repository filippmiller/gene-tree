// This Day in Your Family Types
// Type definitions for the daily events feature

/**
 * Event types for "This Day" feature
 */
export type ThisDayEventType = 'birthday' | 'anniversary' | 'death_commemoration';

/**
 * This Day event from database
 */
export interface ThisDayEvent {
  id: string;
  profile_id: string;
  event_type: ThisDayEventType;
  event_month: number;
  event_day: number;
  display_title: string;
  related_profile_id: string | null;
  years_ago: number | null;
  profile_first_name: string;
  profile_last_name: string;
  profile_avatar_url: string | null;
}

/**
 * Grouped events for display
 */
export interface ThisDayEventGroup {
  type: ThisDayEventType;
  label: string;
  events: ThisDayEvent[];
}

/**
 * Response from GET /api/this-day
 */
export interface GetThisDayResponse {
  date: string;
  events: ThisDayEvent[];
  groups: ThisDayEventGroup[];
  total: number;
}

/**
 * Request to send a greeting
 */
export interface SendGreetingRequest {
  event_id: string;
  message?: string;
  greeting_type: 'birthday' | 'anniversary' | 'memorial';
}

/**
 * Response from POST /api/this-day/send-greeting
 */
export interface SendGreetingResponse {
  success: boolean;
  notification_id?: string;
}

/**
 * Event type display configuration
 */
export const EVENT_TYPE_CONFIG: Record<ThisDayEventType, {
  label: string;
  emoji: string;
  color: string;
  greeting: string;
}> = {
  birthday: {
    label: 'Birthdays',
    emoji: '🎂',
    color: 'pink',
    greeting: 'Happy Birthday!',
  },
  anniversary: {
    label: 'Anniversaries',
    emoji: '💍',
    color: 'purple',
    greeting: 'Happy Anniversary!',
  },
  death_commemoration: {
    label: 'In Memory',
    emoji: '🕯️',
    color: 'gray',
    greeting: 'Thinking of you today',
  },
};

/**
 * Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Helper to format years display
 */
export function formatYearsAgo(yearsAgo: number | null, eventType: ThisDayEventType): string {
  if (yearsAgo === null || yearsAgo <= 0) return '';

  if (eventType === 'birthday') {
    return `Turning ${yearsAgo}`;
  }
  if (eventType === 'anniversary') {
    return `${getOrdinalSuffix(yearsAgo)} anniversary`;
  }
  if (eventType === 'death_commemoration') {
    return yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`;
  }
  return '';
}

/**
 * Helper to group events by type
 */
export function groupEventsByType(events: ThisDayEvent[]): ThisDayEventGroup[] {
  const groups: ThisDayEventGroup[] = [];
  const typeOrder: ThisDayEventType[] = ['birthday', 'anniversary', 'death_commemoration'];

  for (const type of typeOrder) {
    const typeEvents = events.filter(e => e.event_type === type);
    if (typeEvents.length > 0) {
      groups.push({
        type,
        label: EVENT_TYPE_CONFIG[type].label,
        events: typeEvents,
      });
    }
  }

  return groups;
}
