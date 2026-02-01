/**
 * Biography Types
 *
 * Type definitions for the AI Ancestor Biography generation system.
 */

import { Database } from '@/lib/types/supabase';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Education = Database['public']['Tables']['education']['Row'];
export type Employment = Database['public']['Tables']['employment']['Row'];
export type Residence = Database['public']['Tables']['person_residence']['Row'];
export type Relationship = Database['public']['Tables']['relationships']['Row'];

export type Locale = 'en' | 'ru';

/**
 * Biography section identifiers
 */
export type BiographySectionId =
  | 'introduction'
  | 'early_life'
  | 'education'
  | 'career'
  | 'family'
  | 'places'
  | 'legacy';

/**
 * Individual biography section
 */
export interface BiographySection {
  id: BiographySectionId;
  title: string;
  content: string;
  isEmpty: boolean;
}

/**
 * Missing field information for prompts
 */
export interface MissingField {
  field: string;
  label: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  editPath?: string;
}

/**
 * Profile data enriched with related data for biography generation
 */
export interface EnrichedProfileData {
  profile: UserProfile;
  education: Education[];
  employment: Employment[];
  residences: Residence[];
  relationships: Relationship[];
  relatedProfiles: Map<string, { first_name: string; last_name: string; gender?: string | null }>;
  voiceStoriesCount: number;
  photosCount: number;
}

/**
 * Generated biography result
 */
export interface GeneratedBiography {
  profileId: string;
  fullName: string;
  sections: BiographySection[];
  missingFields: MissingField[];
  completenessScore: number;
  generatedAt: string;
  locale: Locale;
}

/**
 * API response for biography generation
 */
export interface BiographyApiResponse {
  success: boolean;
  data?: GeneratedBiography;
  error?: string;
}
