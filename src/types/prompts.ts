/**
 * Memory Prompts Types
 * Types for the memory prompts system that encourages story sharing
 */

/**
 * Category of memory prompt
 */
export type PromptCategory =
  | 'childhood'
  | 'family'
  | 'traditions'
  | 'seasonal'
  | 'relationship';

/**
 * Placeholder type for dynamic prompts
 */
export type PlaceholderType = 'person_name' | 'relationship' | 'event' | null;

/**
 * Season for seasonal prompts
 */
export type Season = 'winter' | 'spring' | 'summer' | 'fall' | null;

/**
 * Memory prompt from database
 */
export interface MemoryPrompt {
  id: string;
  category: PromptCategory;
  prompt_en: string;
  prompt_ru: string;
  placeholder_type: PlaceholderType;
  is_seasonal: boolean;
  season: Season;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Daily prompt response from get_daily_memory_prompt function
 */
export interface DailyPromptResponse {
  prompt_id: string;
  prompt_en: string;
  prompt_ru: string;
  category: PromptCategory;
  placeholder_type: PlaceholderType;
  is_seasonal: boolean;
  season: Season;
  is_new: boolean;
}

/**
 * Prompt with user response status
 */
export interface PromptWithStatus {
  prompt_id: string;
  prompt_en: string;
  prompt_ru: string;
  category: PromptCategory;
  placeholder_type: PlaceholderType;
  is_seasonal: boolean;
  season: Season;
  is_answered: boolean;
  is_skipped: boolean;
  story_id: string | null;
  responded_at: string | null;
}

/**
 * User response to a prompt
 */
export interface UserPromptResponse {
  id: string;
  user_id: string;
  prompt_id: string;
  story_id: string | null;
  skipped: boolean;
  remind_later: boolean;
  remind_after: string | null;
  context_profile_id: string | null;
  responded_at: string;
}

/**
 * Category statistics
 */
export interface CategoryStats {
  total: number;
  answered: number;
  skipped: number;
}

/**
 * Prompt statistics for a user
 */
export interface PromptStats {
  total_prompts: number;
  answered_count: number;
  skipped_count: number;
  pending_count: number;
  by_category: Record<PromptCategory, CategoryStats>;
}

/**
 * API response for daily prompt endpoint
 */
export interface DailyPromptAPIResponse {
  prompt: DailyPromptResponse | null;
  error?: string;
}

/**
 * API response for prompts list endpoint
 */
export interface PromptsListAPIResponse {
  prompts: PromptWithStatus[];
  total: number;
  error?: string;
}

/**
 * API response for prompt stats endpoint
 */
export interface PromptStatsAPIResponse {
  stats: PromptStats | null;
  error?: string;
}

/**
 * Request body for skip endpoint
 */
export interface SkipPromptRequest {
  promptId: string;
}

/**
 * Request body for respond endpoint
 */
export interface RespondToPromptRequest {
  promptId: string;
  storyId: string;
  contextProfileId?: string;
}

/**
 * Request body for remind later endpoint
 */
export interface RemindLaterRequest {
  promptId: string;
  days?: number;
}

/**
 * Localized prompt for display
 * After applying locale and placeholder substitution
 */
export interface LocalizedPrompt {
  id: string;
  category: PromptCategory;
  text: string;
  originalText: {
    en: string;
    ru: string;
  };
  placeholderType: PlaceholderType;
  isSeasonal: boolean;
  season: Season;
  isNew?: boolean;
  isAnswered?: boolean;
  isSkipped?: boolean;
  storyId?: string | null;
}

/**
 * Get localized prompt text based on locale
 */
export function getLocalizedPromptText(
  prompt: { prompt_en: string; prompt_ru: string },
  locale: string
): string {
  return locale === 'ru' ? prompt.prompt_ru : prompt.prompt_en;
}

/**
 * Replace placeholders in prompt text
 */
export function substitutePromptPlaceholders(
  text: string,
  placeholders: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Category display names (for UI)
 */
export const CATEGORY_LABELS: Record<PromptCategory, { en: string; ru: string }> = {
  childhood: { en: 'Childhood', ru: 'Детство' },
  family: { en: 'Family', ru: 'Семья' },
  traditions: { en: 'Traditions', ru: 'Традиции' },
  seasonal: { en: 'Seasonal', ru: 'Сезонные' },
  relationship: { en: 'Relationships', ru: 'Отношения' },
};

/**
 * Category icons (lucide-react icon names)
 */
export const CATEGORY_ICONS: Record<PromptCategory, string> = {
  childhood: 'Baby',
  family: 'Users',
  traditions: 'Gift',
  seasonal: 'Calendar',
  relationship: 'Heart',
};

/**
 * Season display names
 */
export const SEASON_LABELS: Record<NonNullable<Season>, { en: string; ru: string }> = {
  winter: { en: 'Winter', ru: 'Зима' },
  spring: { en: 'Spring', ru: 'Весна' },
  summer: { en: 'Summer', ru: 'Лето' },
  fall: { en: 'Fall', ru: 'Осень' },
};
