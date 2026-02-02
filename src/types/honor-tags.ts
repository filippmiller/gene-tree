/**
 * Honor Tags Types
 *
 * Types for the honor tags system used to commemorate
 * special statuses, awards, and distinctions.
 */

export type HonorTagCategory =
  | 'military_wwii'
  | 'military_other'
  | 'civil_honors'
  | 'labor'
  | 'family'
  | 'persecution'
  | 'academic'
  | 'custom';

export type VerificationLevel =
  | 'self_declared'    // Added by profile owner, not verified
  | 'family_verified'  // Confirmed by 3+ family members
  | 'documented';      // Supporting document uploaded

export interface HonorTag {
  id: string;
  code: string;
  name: string;
  name_ru: string | null;
  description: string | null;
  description_ru: string | null;
  category: HonorTagCategory;
  icon: string;
  color: string;
  background_color: string;
  is_official: boolean;
  requires_verification: boolean;
  country_code: string | null;
  applicable_to_deceased: boolean;
  applicable_to_living: boolean;
  sort_order: number;
}

export interface ProfileHonorTag {
  id: string;
  profile_id: string;
  honor_tag_id: string;
  verification_level: VerificationLevel;
  verified_by: string[];
  document_url: string | null;
  notes: string | null;
  display_order: number;
  is_featured: boolean;
  added_by: string | null;
  added_at: string;
  // Joined data from honor_tags
  honor_tag?: HonorTag;
}

export interface ProfileHonorTagWithDetails extends ProfileHonorTag {
  code: string;
  name: string;
  name_ru: string | null;
  description: string | null;
  description_ru: string | null;
  category: HonorTagCategory;
  icon: string;
  color: string;
  background_color: string;
}

export interface HonorTagVerification {
  id: string;
  profile_honor_tag_id: string;
  verifier_id: string;
  verified: boolean;
  comment: string | null;
  created_at: string;
}

/**
 * Category metadata for UI grouping
 */
export const honorTagCategories: Record<
  HonorTagCategory,
  { label: string; label_ru: string; description: string; icon: string }
> = {
  military_wwii: {
    label: 'World War II',
    label_ru: 'Великая Отечественная война',
    description: 'Veterans, survivors, and participants of WWII',
    icon: 'medal',
  },
  military_other: {
    label: 'Military Service',
    label_ru: 'Военная служба',
    description: 'Veterans of other conflicts and military service',
    icon: 'shield',
  },
  civil_honors: {
    label: 'Civil Honors',
    label_ru: 'Гражданские награды',
    description: 'Government awards and professional distinctions',
    icon: 'award',
  },
  labor: {
    label: 'Labor',
    label_ru: 'Трудовые заслуги',
    description: 'Labor achievements and recognition',
    icon: 'briefcase',
  },
  family: {
    label: 'Family',
    label_ru: 'Семейные',
    description: 'Family-specific honors and roles',
    icon: 'heart',
  },
  persecution: {
    label: 'Persecution & Survival',
    label_ru: 'Преследования и выживание',
    description: 'Survivors of persecution and displacement',
    icon: 'candle',
  },
  academic: {
    label: 'Academic',
    label_ru: 'Академические',
    description: 'Academic degrees and achievements',
    icon: 'graduation-cap',
  },
  custom: {
    label: 'Custom',
    label_ru: 'Особые',
    description: 'Family-defined honors',
    icon: 'star',
  },
};

/**
 * Verification level metadata
 */
export const verificationLevels: Record<
  VerificationLevel,
  { label: string; label_ru: string; icon: string; color: string }
> = {
  self_declared: {
    label: 'Self-declared',
    label_ru: 'Заявлено',
    icon: 'circle',
    color: '#9CA3AF',
  },
  family_verified: {
    label: 'Family Verified',
    label_ru: 'Подтверждено семьёй',
    icon: 'check-circle',
    color: '#D97706',
  },
  documented: {
    label: 'Documented',
    label_ru: 'Документировано',
    icon: 'star',
    color: '#059669',
  },
};
