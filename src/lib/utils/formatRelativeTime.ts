/**
 * Formats a date into a human-readable relative time string.
 *
 * Returns:
 * - "Just now" for < 1 minute
 * - "X minutes ago" for < 1 hour
 * - "X hours ago" for < 24 hours
 * - "Yesterday" for 24-48 hours
 * - "X days ago" for 2-7 days
 * - Formatted date for > 7 days
 */
export function formatRelativeTime(
  date: string | Date,
  locale: string = 'en'
): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Translations for relative time
  const translations: Record<string, Record<string, string | ((n: number) => string)>> = {
    en: {
      justNow: 'Just now',
      minutesAgo: (n: number) => n === 1 ? '1 minute ago' : `${n} minutes ago`,
      hoursAgo: (n: number) => n === 1 ? '1 hour ago' : `${n} hours ago`,
      yesterday: 'Yesterday',
      daysAgo: (n: number) => `${n} days ago`,
    },
    ru: {
      justNow: 'Только что',
      minutesAgo: (n: number) => {
        if (n === 1) return '1 минуту назад';
        if (n >= 2 && n <= 4) return `${n} минуты назад`;
        return `${n} минут назад`;
      },
      hoursAgo: (n: number) => {
        if (n === 1) return '1 час назад';
        if (n >= 2 && n <= 4) return `${n} часа назад`;
        return `${n} часов назад`;
      },
      yesterday: 'Вчера',
      daysAgo: (n: number) => {
        if (n === 1) return '1 день назад';
        if (n >= 2 && n <= 4) return `${n} дня назад`;
        return `${n} дней назад`;
      },
    },
  };

  const t = translations[locale] || translations.en;

  if (diffMinutes < 1) {
    return t.justNow as string;
  }

  if (diffMinutes < 60) {
    return (t.minutesAgo as (n: number) => string)(diffMinutes);
  }

  if (diffHours < 24) {
    return (t.hoursAgo as (n: number) => string)(diffHours);
  }

  if (diffDays === 1) {
    return t.yesterday as string;
  }

  if (diffDays < 7) {
    return (t.daysAgo as (n: number) => string)(diffDays);
  }

  // For dates older than a week, show the formatted date
  return then.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}
