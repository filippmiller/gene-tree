/**
 * Highlight Cards Module
 *
 * Shareable social media cards for family moments.
 * Features Instagram-ready cards for birthdays, anniversaries, memories, and more.
 */

// Main components
export { CardPreview } from './CardPreview';
export { ShareButton } from './ShareButton';
export { HighlightCardGenerator } from './HighlightCardGenerator';
export { EventCardShare } from './EventCardShare';

// Templates (for API route usage)
export {
  BirthdayTemplate,
  AnniversaryTemplate,
  MemoryTemplate,
  MilestoneTemplate,
  FamilyStatsTemplate,
} from './templates';

// Re-export types
export type {
  HighlightCardData,
  HighlightCardType,
  CardTheme,
  BirthdayCardData,
  AnniversaryCardData,
  MemoryCardData,
  MilestoneCardData,
  FamilyStatsCardData,
} from '@/types/highlight-cards';
