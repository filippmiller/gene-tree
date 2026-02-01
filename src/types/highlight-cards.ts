// Highlight Cards Types
// Type definitions for shareable family moment cards

/**
 * Card template types
 */
export type HighlightCardType =
  | 'birthday'
  | 'anniversary'
  | 'memory'
  | 'milestone'
  | 'family-stats';

/**
 * Card theme variants
 */
export type CardTheme =
  | 'warm-sunset'      // Orange/pink gradient
  | 'ocean-breeze'     // Blue/teal gradient
  | 'forest-dawn'      // Green/gold gradient
  | 'royal-violet'     // Violet/purple gradient (brand)
  | 'classic-elegant'; // Black/gold elegant

/**
 * Base card data structure
 */
export interface HighlightCardBase {
  type: HighlightCardType;
  theme?: CardTheme;
  photoUrl?: string | null;
  personName: string;
}

/**
 * Birthday card data
 */
export interface BirthdayCardData extends HighlightCardBase {
  type: 'birthday';
  age: number;
  birthDate: string; // ISO date
  message?: string;
}

/**
 * Anniversary card data
 */
export interface AnniversaryCardData extends HighlightCardBase {
  type: 'anniversary';
  years: number;
  partnerName: string;
  partnerPhotoUrl?: string | null;
  anniversaryDate: string; // ISO date
  message?: string;
}

/**
 * Memory/On This Day card data
 */
export interface MemoryCardData extends HighlightCardBase {
  type: 'memory';
  year: number;
  description: string;
  eventType: 'birth' | 'wedding' | 'graduation' | 'achievement' | 'other';
}

/**
 * Milestone card data (generic achievements)
 */
export interface MilestoneCardData extends HighlightCardBase {
  type: 'milestone';
  title: string;
  subtitle?: string;
  icon?: 'tree' | 'heart' | 'star' | 'trophy' | 'cake' | 'ring';
  stats?: Array<{ label: string; value: string | number }>;
}

/**
 * Family tree stats card
 */
export interface FamilyStatsCardData extends HighlightCardBase {
  type: 'family-stats';
  totalMembers: number;
  generations: number;
  oldestMember?: { name: string; age: number };
  newestMember?: { name: string; joinedDaysAgo: number };
  countriesRepresented?: number;
}

/**
 * Union type for all card data
 */
export type HighlightCardData =
  | BirthdayCardData
  | AnniversaryCardData
  | MemoryCardData
  | MilestoneCardData
  | FamilyStatsCardData;

/**
 * Card generation request (sent to API)
 */
export interface GenerateCardRequest {
  cardData: HighlightCardData;
  format?: 'png' | 'jpeg';
  size?: 'instagram' | 'twitter' | 'facebook' | 'standard';
}

/**
 * Card dimensions by platform
 */
export const CARD_DIMENSIONS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },   // Square
  twitter: { width: 1200, height: 675 },       // 16:9
  facebook: { width: 1200, height: 630 },      // OG standard
  standard: { width: 1200, height: 630 },      // Default OG
};

/**
 * Theme configurations
 */
export const THEME_CONFIG: Record<CardTheme, {
  background: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
}> = {
  'warm-sunset': {
    background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
    textColor: '#1a1a2e',
    accentColor: '#FF6B6B',
    secondaryColor: '#FFE66D',
  },
  'ocean-breeze': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    accentColor: '#667eea',
    secondaryColor: '#764ba2',
  },
  'forest-dawn': {
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    textColor: '#ffffff',
    accentColor: '#11998e',
    secondaryColor: '#38ef7d',
  },
  'royal-violet': {
    background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)',
    textColor: '#ffffff',
    accentColor: '#8B5CF6',
    secondaryColor: '#EC4899',
  },
  'classic-elegant': {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    textColor: '#f0e68c',
    accentColor: '#d4af37',
    secondaryColor: '#f0e68c',
  },
};

/**
 * Helper to get ordinal suffix
 */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Helper to format birthday message
 */
export function formatBirthdayMessage(name: string, age: number): string {
  return `Happy ${getOrdinal(age)} Birthday, ${name}!`;
}

/**
 * Helper to format anniversary message
 */
export function formatAnniversaryMessage(years: number, name1: string, name2: string): string {
  if (years === 1) {
    return `${name1} & ${name2}: 1 Year of Love`;
  }
  return `${name1} & ${name2}: ${years} Years of Love`;
}
