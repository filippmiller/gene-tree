// Email Preferences Types
// Type definitions for email notification settings

/**
 * Days of the week for digest delivery
 */
export type DigestDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Email preferences structure
 */
export interface EmailPreferences {
  weekly_digest: boolean;
  birthday_reminders: boolean;
  anniversary_reminders: boolean;
  death_commemorations: boolean;
  photo_tag_notifications: boolean;
  digest_day: DigestDay;
}

/**
 * Default email preferences
 */
export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  weekly_digest: false,
  birthday_reminders: true,
  anniversary_reminders: true,
  death_commemorations: false,
  photo_tag_notifications: true,
  digest_day: 'sunday',
};

/**
 * Request to update email preferences
 */
export interface UpdateEmailPreferencesRequest {
  weekly_digest?: boolean;
  birthday_reminders?: boolean;
  anniversary_reminders?: boolean;
  death_commemorations?: boolean;
  photo_tag_notifications?: boolean;
  digest_day?: DigestDay;
}

/**
 * Response for email preferences operations
 */
export interface EmailPreferencesResponse {
  success: boolean;
  preferences: EmailPreferences;
  error?: string;
}

/**
 * Digest day options for UI
 */
export const DIGEST_DAY_OPTIONS: { value: DigestDay; label: string }[] = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
];

/**
 * Preference field metadata for UI
 */
export const EMAIL_PREFERENCE_FIELDS: {
  key: keyof Omit<EmailPreferences, 'digest_day'>;
  label: string;
  description: string;
}[] = [
  {
    key: 'weekly_digest',
    label: 'Weekly Family Digest',
    description: 'Receive a summary of family activity every week',
  },
  {
    key: 'birthday_reminders',
    label: 'Birthday Reminders',
    description: 'Get notified about upcoming family birthdays',
  },
  {
    key: 'anniversary_reminders',
    label: 'Anniversary Reminders',
    description: 'Get notified about upcoming family anniversaries',
  },
  {
    key: 'death_commemorations',
    label: 'Memorial Reminders',
    description: 'Receive reminders for memorial dates',
  },
  {
    key: 'photo_tag_notifications',
    label: 'Photo Tag Notifications',
    description: 'Get notified when you\'re tagged in a photo',
  },
];

/**
 * Validate email preferences object
 */
export function validateEmailPreferences(prefs: unknown): prefs is EmailPreferences {
  if (typeof prefs !== 'object' || prefs === null) return false;

  const p = prefs as Record<string, unknown>;

  return (
    typeof p.weekly_digest === 'boolean' &&
    typeof p.birthday_reminders === 'boolean' &&
    typeof p.anniversary_reminders === 'boolean' &&
    typeof p.death_commemorations === 'boolean' &&
    typeof p.photo_tag_notifications === 'boolean' &&
    DIGEST_DAY_OPTIONS.some(d => d.value === p.digest_day)
  );
}

/**
 * Merge partial preferences with defaults
 */
export function mergeWithDefaults(partial: Partial<EmailPreferences>): EmailPreferences {
  return {
    ...DEFAULT_EMAIL_PREFERENCES,
    ...partial,
  };
}
