/**
 * Types for Memorial Tribute Pages
 */

export type TributeType = 'message' | 'flower' | 'candle';

export interface TributeGuestbookEntry {
  id: string;
  tribute_profile_id: string;
  author_id: string;
  message: string | null;
  tribute_type: TributeType;
  is_approved: boolean;
  created_at: string;
}

export interface TributeGuestbookEntryWithAuthor extends TributeGuestbookEntry {
  author: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface TributeProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  death_date: string | null;
  tribute_mode_enabled: boolean;
}

export interface TributePageData {
  profile: TributeProfile | null;
  guestbook_count: number;
  recent_tributes: TributeGuestbookEntryWithAuthor[];
}

// API Request/Response types
export interface CreateTributeEntryRequest {
  tribute_profile_id: string;
  tribute_type: TributeType;
  message?: string;
}

export interface GetTributePageResponse {
  success: boolean;
  data?: TributePageData;
  error?: string;
}

export interface GetGuestbookResponse {
  success: boolean;
  entries: TributeGuestbookEntryWithAuthor[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTributeEntryResponse {
  success: boolean;
  entry?: TributeGuestbookEntry;
  error?: string;
}

// Helper functions
export function getTributeTypeEmoji(type: TributeType): string {
  switch (type) {
    case 'flower':
      return '🌹';
    case 'candle':
      return '🕯️';
    case 'message':
    default:
      return '💬';
  }
}

export function getTributeTypeLabel(type: TributeType): string {
  switch (type) {
    case 'flower':
      return 'Virtual Flower';
    case 'candle':
      return 'Virtual Candle';
    case 'message':
    default:
      return 'Memory';
  }
}

export function formatLifespan(birthDate: string | null, deathDate: string | null): string {
  if (!birthDate && !deathDate) return '';

  const birth = birthDate ? new Date(birthDate).getFullYear() : '?';
  const death = deathDate ? new Date(deathDate).getFullYear() : 'Present';

  return `${birth} - ${death}`;
}

export function calculateAge(birthDate: string, deathDate?: string | null): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();

  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
