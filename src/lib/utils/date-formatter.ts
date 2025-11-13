/**
 * Date Formatting Utilities
 * 
 * Handles formatting of dates with different precision levels:
 * - day: "September 1, 2015"
 * - month: "September 2015"
 * - year: "2015"
 * - unknown: "Unknown"
 * 
 * Also handles certainty levels:
 * - certain: exact dates
 * - approximate: prefixed with ~
 * - unknown: "Around..."
 */

interface DateEntry {
  start_date?: string;
  start_precision: string;
  end_date?: string;
  end_precision: string;
  is_current: boolean;
  certainty: string;
}

/**
 * Format a single date based on precision
 */
export function formatDate(date: string | undefined, precision: string): string {
  if (!date) return 'Unknown';

  const d = new Date(date);

  switch (precision) {
    case 'day':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'month':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });

    case 'year':
      return d.getFullYear().toString();

    case 'unknown':
    default:
      return 'Unknown';
  }
}

/**
 * Format education date range
 */
export function formatEducationDates(entry: DateEntry): string {
  const prefix = entry.certainty === 'approximate' ? '~' : '';
  const start = formatDate(entry.start_date, entry.start_precision);
  const end = entry.is_current ? 'Present' : formatDate(entry.end_date, entry.end_precision);

  return `${prefix}${start} — ${end}`;
}

/**
 * Format residence date range
 */
export function formatResidenceDates(entry: DateEntry): string {
  return formatEducationDates(entry); // Same logic
}
