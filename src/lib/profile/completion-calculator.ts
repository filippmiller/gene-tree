/**
 * Profile Completion Calculator
 *
 * Calculates profile completion percentage based on weighted fields.
 * Designed to encourage users to complete their profiles and build family trees.
 *
 * Field Weights (total = 100%):
 * - Profile photo: 20%
 * - Birth date: 15%
 * - Birth place: 10%
 * - Bio/about: 15%
 * - At least 1 parent added: 20%
 * - At least 1 story shared: 20%
 */

import { Database } from '@/lib/types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export interface CompletionField {
  id: string;
  label: string;
  labelRu: string;
  weight: number;
  isComplete: boolean;
  description: string;
  descriptionRu: string;
  linkTo?: string; // Navigation link to complete this field
  icon?: string; // Icon name from lucide-react
}

export interface CompletionResult {
  percentage: number;
  fields: CompletionField[];
  missingFields: CompletionField[];
  completedFields: CompletionField[];
  message: string;
  messageRu: string;
  celebrateComplete: boolean;
}

export interface CompletionData {
  profile: UserProfile;
  hasPhoto: boolean;
  hasParent: boolean;
  hasStory: boolean;
}

/**
 * Get encouraging message based on completion percentage
 */
export function getCompletionMessage(
  percentage: number,
  locale: 'en' | 'ru' = 'en'
): string {
  const messages = {
    en: {
      '0-25': "Let's get started! Add a photo to help family recognize you.",
      '26-50': 'Good progress! Your tree is coming together.',
      '51-75': 'Almost there! A few more details will complete your profile.',
      '76-99': 'So close! Just one more thing...',
      '100': '🎉 Your profile is complete!',
    },
    ru: {
      '0-25': 'Давайте начнем! Добавьте фото, чтобы семья могла узнать вас.',
      '26-50': 'Хороший прогресс! Ваше дерево растет.',
      '51-75': 'Почти готово! Еще немного деталей завершат ваш профиль.',
      '76-99': 'Совсем близко! Осталась еще одна вещь...',
      '100': '🎉 Ваш профиль заполнен!',
    },
  };

  const msgs = messages[locale];

  if (percentage === 100) return msgs['100'];
  if (percentage >= 76) return msgs['76-99'];
  if (percentage >= 51) return msgs['51-75'];
  if (percentage >= 26) return msgs['26-50'];
  return msgs['0-25'];
}

/**
 * Calculate profile completion percentage
 */
export function calculateCompletion(data: CompletionData, locale: string = 'en'): CompletionResult {
  const { profile, hasPhoto, hasParent, hasStory } = data;

  const fields: CompletionField[] = [
    {
      id: 'photo',
      label: 'Profile Photo',
      labelRu: 'Фото профиля',
      weight: 20,
      isComplete: hasPhoto || Boolean(profile.avatar_url),
      description: 'Upload a photo to help family recognize you',
      descriptionRu: 'Загрузите фото, чтобы семья могла узнать вас',
      linkTo: `/${locale}/my-profile`,
      icon: 'Camera',
    },
    {
      id: 'birth-date',
      label: 'Birth Date',
      labelRu: 'Дата рождения',
      weight: 15,
      isComplete: Boolean(profile.birth_date),
      description: 'Add your birth date',
      descriptionRu: 'Добавьте дату рождения',
      linkTo: `/${locale}/my-profile`,
      icon: 'Calendar',
    },
    {
      id: 'birth-place',
      label: 'Birth Place',
      labelRu: 'Место рождения',
      weight: 10,
      isComplete: Boolean(profile.birth_place),
      description: 'Add where you were born',
      descriptionRu: 'Добавьте место рождения',
      linkTo: `/${locale}/my-profile`,
      icon: 'MapPin',
    },
    {
      id: 'bio',
      label: 'About Me',
      labelRu: 'О себе',
      weight: 15,
      isComplete: Boolean(profile.bio && profile.bio.length >= 20),
      description: 'Write a few words about yourself',
      descriptionRu: 'Напишите немного о себе',
      linkTo: `/${locale}/my-profile`,
      icon: 'FileText',
    },
    {
      id: 'parent',
      label: 'Add a Parent',
      labelRu: 'Добавить родителя',
      weight: 20,
      isComplete: hasParent,
      description: 'Connect with at least one parent to build your tree',
      descriptionRu: 'Добавьте хотя бы одного родителя, чтобы построить дерево',
      linkTo: `/${locale}/people/new`,
      icon: 'Users',
    },
    {
      id: 'story',
      label: 'Share a Story',
      labelRu: 'Поделиться историей',
      weight: 20,
      isComplete: hasStory,
      description: 'Share a memory or family story',
      descriptionRu: 'Поделитесь воспоминанием или семейной историей',
      linkTo: `/${locale}/my-profile`, // Will add story creation from profile
      icon: 'BookOpen',
    },
  ];

  const completedFields = fields.filter((f) => f.isComplete);
  const missingFields = fields.filter((f) => !f.isComplete);
  const percentage = completedFields.reduce((sum, f) => sum + f.weight, 0);

  const message = getCompletionMessage(percentage, locale as 'en' | 'ru');
  const messageRu = getCompletionMessage(percentage, 'ru');

  return {
    percentage,
    fields,
    missingFields,
    completedFields,
    message,
    messageRu,
    celebrateComplete: percentage === 100,
  };
}

/**
 * Get completion data from user profile and related records
 * This should be called from server components or API routes
 */
export async function getCompletionData(
  profile: UserProfile,
  supabase: any
): Promise<CompletionData> {
  // Check if profile has photo
  const hasPhoto = Boolean(profile.avatar_url);

  // Check if user has at least one parent relationship
  const { data: relationships } = await supabase
    .from('relationships')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('relationship_type', 'parent')
    .limit(1);

  // Also check pending_relatives for invited parents
  const { data: pendingParents } = await supabase
    .from('pending_relatives')
    .select('id')
    .eq('invited_by', profile.id)
    .eq('relationship_type', 'parent')
    .limit(1);

  const hasParent = (relationships?.length || 0) > 0 || (pendingParents?.length || 0) > 0;

  // Check if user has shared at least one story
  const { data: stories } = await supabase
    .from('stories')
    .select('id')
    .eq('author_id', profile.id)
    .eq('status', 'approved')
    .limit(1);

  const hasStory = (stories?.length || 0) > 0;

  return {
    profile,
    hasPhoto,
    hasParent,
    hasStory,
  };
}
