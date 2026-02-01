/**
 * Family Milestones Types and Configuration
 *
 * Defines milestone categories, types, and their associated metadata
 * including icons, colors, and localization keys.
 */

import {
  Baby,
  Footprints,
  MessageCircle,
  Smile,
  GraduationCap,
  School,
  Briefcase,
  TrendingUp,
  Heart,
  Gem,
  PartyPopper,
  Home,
  Car,
  Plane,
  Award,
  Star,
  Cake,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Categories
// ============================================================================

export type MilestoneCategory =
  | 'baby'
  | 'education'
  | 'career'
  | 'relationship'
  | 'life'
  | 'custom';

export interface CategoryConfig {
  id: MilestoneCategory;
  labelKey: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
}

export const MILESTONE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'baby',
    labelKey: 'milestones.category.baby',
    icon: Baby,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'education',
    labelKey: 'milestones.category.education',
    icon: GraduationCap,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'career',
    labelKey: 'milestones.category.career',
    icon: Briefcase,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'relationship',
    labelKey: 'milestones.category.relationship',
    icon: Heart,
    color: 'red',
    gradient: 'from-red-500 to-pink-600',
  },
  {
    id: 'life',
    labelKey: 'milestones.category.life',
    icon: Star,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'custom',
    labelKey: 'milestones.category.custom',
    icon: PartyPopper,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
  },
];

// ============================================================================
// Milestone Types
// ============================================================================

export interface MilestoneTypeConfig {
  id: string;
  category: MilestoneCategory;
  labelKey: string;
  descriptionKey?: string;
  icon: LucideIcon;
  suggestedAge?: { min?: number; max?: number }; // Age range this milestone typically occurs
}

export const MILESTONE_TYPES: MilestoneTypeConfig[] = [
  // Baby milestones
  {
    id: 'first_smile',
    category: 'baby',
    labelKey: 'milestones.type.first_smile',
    icon: Smile,
    suggestedAge: { min: 0, max: 1 },
  },
  {
    id: 'first_tooth',
    category: 'baby',
    labelKey: 'milestones.type.first_tooth',
    icon: Smile,
    suggestedAge: { min: 0, max: 2 },
  },
  {
    id: 'first_steps',
    category: 'baby',
    labelKey: 'milestones.type.first_steps',
    icon: Footprints,
    suggestedAge: { min: 0, max: 2 },
  },
  {
    id: 'first_word',
    category: 'baby',
    labelKey: 'milestones.type.first_word',
    icon: MessageCircle,
    suggestedAge: { min: 0, max: 2 },
  },
  {
    id: 'first_birthday',
    category: 'baby',
    labelKey: 'milestones.type.first_birthday',
    icon: Cake,
    suggestedAge: { min: 1, max: 1 },
  },

  // Education milestones
  {
    id: 'first_day_school',
    category: 'education',
    labelKey: 'milestones.type.first_day_school',
    icon: School,
    suggestedAge: { min: 5, max: 7 },
  },
  {
    id: 'elementary_graduation',
    category: 'education',
    labelKey: 'milestones.type.elementary_graduation',
    icon: GraduationCap,
    suggestedAge: { min: 10, max: 12 },
  },
  {
    id: 'high_school_graduation',
    category: 'education',
    labelKey: 'milestones.type.high_school_graduation',
    icon: GraduationCap,
    suggestedAge: { min: 17, max: 19 },
  },
  {
    id: 'college_graduation',
    category: 'education',
    labelKey: 'milestones.type.college_graduation',
    icon: GraduationCap,
    suggestedAge: { min: 21, max: 25 },
  },
  {
    id: 'masters_degree',
    category: 'education',
    labelKey: 'milestones.type.masters_degree',
    icon: Award,
    suggestedAge: { min: 23, max: 35 },
  },
  {
    id: 'doctorate',
    category: 'education',
    labelKey: 'milestones.type.doctorate',
    icon: Award,
  },

  // Career milestones
  {
    id: 'first_job',
    category: 'career',
    labelKey: 'milestones.type.first_job',
    icon: Briefcase,
    suggestedAge: { min: 16, max: 25 },
  },
  {
    id: 'promotion',
    category: 'career',
    labelKey: 'milestones.type.promotion',
    icon: TrendingUp,
  },
  {
    id: 'new_job',
    category: 'career',
    labelKey: 'milestones.type.new_job',
    icon: Briefcase,
  },
  {
    id: 'started_business',
    category: 'career',
    labelKey: 'milestones.type.started_business',
    icon: Star,
  },
  {
    id: 'retirement',
    category: 'career',
    labelKey: 'milestones.type.retirement',
    icon: PartyPopper,
    suggestedAge: { min: 55 },
  },

  // Relationship milestones
  {
    id: 'engagement',
    category: 'relationship',
    labelKey: 'milestones.type.engagement',
    icon: Gem,
  },
  {
    id: 'wedding',
    category: 'relationship',
    labelKey: 'milestones.type.wedding',
    icon: Heart,
  },
  {
    id: 'anniversary',
    category: 'relationship',
    labelKey: 'milestones.type.anniversary',
    icon: Heart,
  },
  {
    id: 'birth_child',
    category: 'relationship',
    labelKey: 'milestones.type.birth_child',
    icon: Baby,
  },

  // Life milestones
  {
    id: 'birthday',
    category: 'life',
    labelKey: 'milestones.type.birthday',
    icon: Cake,
  },
  {
    id: 'moved_home',
    category: 'life',
    labelKey: 'milestones.type.moved_home',
    icon: Home,
  },
  {
    id: 'first_car',
    category: 'life',
    labelKey: 'milestones.type.first_car',
    icon: Car,
  },
  {
    id: 'first_trip_abroad',
    category: 'life',
    labelKey: 'milestones.type.first_trip_abroad',
    icon: Plane,
  },
  {
    id: 'award',
    category: 'life',
    labelKey: 'milestones.type.award',
    icon: Award,
  },

  // Custom milestone (user-defined)
  {
    id: 'custom',
    category: 'custom',
    labelKey: 'milestones.type.custom',
    icon: PartyPopper,
  },
];

// ============================================================================
// Database Types (matching Supabase schema)
// ============================================================================

export interface Milestone {
  id: string;
  profile_id: string;
  created_by: string;
  milestone_type: string;
  category: MilestoneCategory;
  title: string;
  description: string | null;
  milestone_date: string; // ISO date string
  media_urls: string[];
  visibility: 'public' | 'family' | 'private' | 'unlisted';
  remind_annually: boolean;
  reminder_days_before: number;
  created_at: string;
  updated_at: string;
}

export interface MilestoneInsert {
  profile_id: string;
  created_by: string;
  milestone_type: string;
  category: MilestoneCategory;
  title: string;
  description?: string | null;
  milestone_date: string;
  media_urls?: string[];
  visibility?: 'public' | 'family' | 'private' | 'unlisted';
  remind_annually?: boolean;
  reminder_days_before?: number;
}

export interface MilestoneUpdate {
  milestone_type?: string;
  category?: MilestoneCategory;
  title?: string;
  description?: string | null;
  milestone_date?: string;
  media_urls?: string[];
  visibility?: 'public' | 'family' | 'private' | 'unlisted';
  remind_annually?: boolean;
  reminder_days_before?: number;
}

// ============================================================================
// Extended types with profile data
// ============================================================================

export interface MilestoneWithProfile extends Milestone {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getMilestoneTypeConfig(typeId: string): MilestoneTypeConfig | undefined {
  return MILESTONE_TYPES.find(t => t.id === typeId);
}

export function getCategoryConfig(categoryId: MilestoneCategory): CategoryConfig | undefined {
  return MILESTONE_CATEGORIES.find(c => c.id === categoryId);
}

export function getMilestonesByCategory(category: MilestoneCategory): MilestoneTypeConfig[] {
  return MILESTONE_TYPES.filter(t => t.category === category);
}

export function getDefaultTitle(typeId: string, locale: string = 'en'): string {
  // This would normally use i18n, but we provide sensible defaults
  const typeLabels: Record<string, Record<string, string>> = {
    en: {
      first_smile: 'First Smile',
      first_tooth: 'First Tooth',
      first_steps: 'First Steps',
      first_word: 'First Word',
      first_birthday: 'First Birthday',
      first_day_school: 'First Day of School',
      elementary_graduation: 'Elementary School Graduation',
      high_school_graduation: 'High School Graduation',
      college_graduation: 'College Graduation',
      masters_degree: "Master's Degree",
      doctorate: 'Doctorate',
      first_job: 'First Job',
      promotion: 'Promotion',
      new_job: 'New Job',
      started_business: 'Started a Business',
      retirement: 'Retirement',
      engagement: 'Engagement',
      wedding: 'Wedding',
      anniversary: 'Anniversary',
      birth_child: 'Birth of Child',
      birthday: 'Birthday',
      moved_home: 'Moved to New Home',
      first_car: 'First Car',
      first_trip_abroad: 'First Trip Abroad',
      award: 'Award',
      custom: 'Milestone',
    },
    ru: {
      first_smile: 'Первая улыбка',
      first_tooth: 'Первый зуб',
      first_steps: 'Первые шаги',
      first_word: 'Первое слово',
      first_birthday: 'Первый день рождения',
      first_day_school: 'Первый день в школе',
      elementary_graduation: 'Окончание начальной школы',
      high_school_graduation: 'Окончание школы',
      college_graduation: 'Окончание университета',
      masters_degree: 'Магистратура',
      doctorate: 'Докторская степень',
      first_job: 'Первая работа',
      promotion: 'Повышение',
      new_job: 'Новая работа',
      started_business: 'Открытие бизнеса',
      retirement: 'Выход на пенсию',
      engagement: 'Помолвка',
      wedding: 'Свадьба',
      anniversary: 'Годовщина',
      birth_child: 'Рождение ребёнка',
      birthday: 'День рождения',
      moved_home: 'Переезд',
      first_car: 'Первая машина',
      first_trip_abroad: 'Первая поездка за границу',
      award: 'Награда',
      custom: 'Событие',
    },
  };

  const labels = typeLabels[locale] || typeLabels['en'];
  return labels[typeId] || labels['custom'];
}
