/**
 * Profile Completeness Calculation
 *
 * Calculates a completeness score based on different aspects of a user profile.
 * Each category contributes 20% to the total score.
 */

import { Database } from '@/lib/types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export interface ProfileCompletenessCategory {
  id: string;
  label: string;
  labelRu: string;
  weight: number;
  isComplete: boolean;
  description: string;
  descriptionRu: string;
}

export interface ProfileCompletenessResult {
  percentage: number;
  categories: ProfileCompletenessCategory[];
  missingItems: ProfileCompletenessCategory[];
  completedItems: ProfileCompletenessCategory[];
  tier: 'starter' | 'growing' | 'established' | 'complete';
}

/**
 * Get the color variant based on percentage
 */
export function getCompletenessColor(percentage: number): 'error' | 'warning' | 'success' {
  if (percentage < 40) return 'error';
  if (percentage < 70) return 'warning';
  return 'success';
}

/**
 * Get the tier label for the completeness level
 */
export function getCompleteTier(percentage: number): ProfileCompletenessResult['tier'] {
  if (percentage < 30) return 'starter';
  if (percentage < 60) return 'growing';
  if (percentage < 90) return 'established';
  return 'complete';
}

/**
 * Tier labels for display
 */
export const tierLabels: Record<
  ProfileCompletenessResult['tier'],
  { en: string; ru: string; description: string; descriptionRu: string }
> = {
  starter: {
    en: 'Getting Started',
    ru: 'Начало',
    description: 'Add more details to complete your profile',
    descriptionRu: 'Добавьте больше информации для заполнения профиля',
  },
  growing: {
    en: 'Growing',
    ru: 'Развитие',
    description: "You're making great progress!",
    descriptionRu: 'Вы делаете отличные успехи!',
  },
  established: {
    en: 'Established',
    ru: 'Почти готово',
    description: 'Almost there, just a few more details',
    descriptionRu: 'Почти готово, осталось немного',
  },
  complete: {
    en: 'Complete',
    ru: 'Завершено',
    description: 'Your profile is complete!',
    descriptionRu: 'Ваш профиль заполнен!',
  },
};

interface ProfileData {
  profile: UserProfile;
  hasPhoto: boolean;
  hasStory: boolean;
  hasRelationships: boolean;
  hasResidenceHistory: boolean;
}

/**
 * Calculate profile completeness based on various factors
 *
 * Categories (each worth 20%):
 * 1. Basic Info: name (required) + birth_date
 * 2. Photo: avatar_url or current_avatar_id present
 * 3. Story: at least one story or voice_story exists
 * 4. Relationships: at least one confirmed relationship
 * 5. Location History: at least one residence record
 */
export function calculateProfileCompleteness(data: ProfileData): ProfileCompletenessResult {
  const { profile, hasPhoto, hasStory, hasRelationships, hasResidenceHistory } = data;

  const categories: ProfileCompletenessCategory[] = [
    {
      id: 'basic-info',
      label: 'Basic Information',
      labelRu: 'Основная информация',
      weight: 20,
      isComplete: Boolean(
        profile.first_name &&
          profile.last_name &&
          profile.birth_date
      ),
      description: 'Add your name and birth date',
      descriptionRu: 'Добавьте имя и дату рождения',
    },
    {
      id: 'photo',
      label: 'Profile Photo',
      labelRu: 'Фото профиля',
      weight: 20,
      isComplete: hasPhoto || Boolean(profile.avatar_url || profile.current_avatar_id),
      description: 'Upload a profile photo',
      descriptionRu: 'Загрузите фото профиля',
    },
    {
      id: 'story',
      label: 'Life Story',
      labelRu: 'История жизни',
      weight: 20,
      isComplete: hasStory || Boolean(profile.bio && profile.bio.length > 20),
      description: 'Share a story or write your bio',
      descriptionRu: 'Поделитесь историей или напишите биографию',
    },
    {
      id: 'relationships',
      label: 'Family Connections',
      labelRu: 'Семейные связи',
      weight: 20,
      isComplete: hasRelationships,
      description: 'Connect with family members',
      descriptionRu: 'Добавьте родственников',
    },
    {
      id: 'locations',
      label: 'Location History',
      labelRu: 'История мест',
      weight: 20,
      isComplete:
        hasResidenceHistory ||
        Boolean(profile.current_city || profile.birth_city || profile.birth_place),
      description: 'Add where you lived',
      descriptionRu: 'Добавьте места проживания',
    },
  ];

  const completedItems = categories.filter((c) => c.isComplete);
  const missingItems = categories.filter((c) => !c.isComplete);
  const percentage = completedItems.reduce((sum, c) => sum + c.weight, 0);
  const tier = getCompleteTier(percentage);

  return {
    percentage,
    categories,
    completedItems,
    missingItems,
    tier,
  };
}

/**
 * Simple completeness check for server-side calculations
 * Returns just the percentage without full category breakdown
 */
export function quickCompletenessCheck(profile: UserProfile): number {
  let score = 0;

  // Basic info (20%)
  if (profile.first_name && profile.last_name && profile.birth_date) {
    score += 20;
  }

  // Photo (20%)
  if (profile.avatar_url || profile.current_avatar_id) {
    score += 20;
  }

  // Bio as story proxy (20%)
  if (profile.bio && profile.bio.length > 20) {
    score += 20;
  }

  // Location (20%) - simplified check
  if (profile.current_city || profile.birth_city || profile.birth_place) {
    score += 20;
  }

  // Note: Relationships require additional query, so this quick check
  // may undercount. Use calculateProfileCompleteness for accurate results.

  return score;
}
