/**
 * Type definitions for the Enhanced Duplicate Detection system
 */

/**
 * Name variants mapping for cross-language duplicate detection
 * Supports English and Russian name equivalents
 */
export const NAME_VARIANTS: Record<string, string[]> = {
  // Common English-Russian name mappings
  maria: ['mary', 'marie', 'мария', 'маша', 'маруся'],
  mary: ['maria', 'marie', 'мария', 'маша'],
  alexander: ['alex', 'sasha', 'александр', 'саша', 'шура'],
  alexandra: ['alex', 'sasha', 'александра', 'саша', 'шура'],
  michael: ['mike', 'misha', 'михаил', 'миша'],
  anna: ['ann', 'annie', 'анна', 'аня', 'анюта', 'нюра'],
  elena: ['helen', 'helena', 'елена', 'лена', 'аленка'],
  olga: ['ольга', 'оля', 'оленька'],
  natalia: ['natasha', 'наталья', 'наташа', 'ната'],
  ekaterina: ['kate', 'catherine', 'katya', 'екатерина', 'катя', 'катерина'],
  tatiana: ['tanya', 'татьяна', 'таня'],
  irina: ['irene', 'ира', 'ирина', 'ируся'],
  vladimir: ['volodya', 'vova', 'владимир', 'вова', 'володя'],
  nikolai: ['nicholas', 'nick', 'николай', 'коля', 'николаша'],
  sergei: ['serge', 'сергей', 'серёжа', 'сережа'],
  ivan: ['john', 'иван', 'ваня', 'ванюша'],
  dmitri: ['dima', 'дмитрий', 'дима', 'митя'],
  andrei: ['andrew', 'андрей', 'андрюша'],
  pavel: ['paul', 'pasha', 'павел', 'паша'],
  viktor: ['victor', 'vitya', 'виктор', 'витя'],
  konstantin: ['kostya', 'константин', 'костя'],
  yuri: ['george', 'юрий', 'юра'],
  boris: ['борис', 'боря'],
  evgeny: ['eugene', 'евгений', 'женя'],
  evgenia: ['eugenia', 'евгения', 'женя'],
  valentina: ['валентина', 'валя'],
  valentin: ['валентин', 'валя'],
  ludmila: ['люда', 'людмила', 'мила'],
  svetlana: ['sveta', 'светлана', 'света'],
  marina: ['марина'],
  galina: ['galya', 'галина', 'галя'],
  nina: ['нина'],
  vera: ['вера'],
  sophia: ['sonya', 'софья', 'соня', 'софа'],
  anastasia: ['nastya', 'анастасия', 'настя'],
  elizaveta: ['elizabeth', 'lisa', 'елизавета', 'лиза'],
  // Cyrillic first as key
  мария: ['maria', 'mary', 'marie', 'маша', 'маруся'],
  александр: ['alexander', 'alex', 'sasha', 'саша', 'шура'],
  михаил: ['michael', 'mike', 'misha', 'миша'],
  анна: ['anna', 'ann', 'annie', 'аня', 'анюта', 'нюра'],
  елена: ['elena', 'helen', 'helena', 'лена', 'аленка'],
  владимир: ['vladimir', 'volodya', 'vova', 'вова', 'володя'],
  николай: ['nikolai', 'nicholas', 'nick', 'коля'],
  сергей: ['sergei', 'serge', 'серёжа', 'сережа'],
  иван: ['ivan', 'john', 'ваня', 'ванюша'],
  дмитрий: ['dmitri', 'dima', 'дима', 'митя'],
  андрей: ['andrei', 'andrew', 'андрюша'],
  павел: ['pavel', 'paul', 'pasha', 'паша'],
};

/**
 * Check if two names are variants of each other
 */
export function areNameVariants(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;

  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  if (n1 === n2) return true;

  // Check if name1 has variants that include name2
  const variants1 = NAME_VARIANTS[n1];
  if (variants1 && variants1.includes(n2)) return true;

  // Check if name2 has variants that include name1
  const variants2 = NAME_VARIANTS[n2];
  if (variants2 && variants2.includes(n1)) return true;

  return false;
}

/**
 * Extended match reasons for deceased profile detection
 */
export interface ExtendedMatchReasons {
  // Name matching
  exact_name_match?: boolean;
  first_name_match?: boolean;
  last_name_match?: boolean;
  maiden_name_match?: boolean;
  nickname_match?: boolean;
  name_variant_match?: boolean;
  fuzzy_name_match?: boolean;
  fuzzy_name_similarity?: number;

  // Date matching
  exact_birth_date_match?: boolean;
  birth_year_match?: boolean;
  birth_year_close?: boolean; // Within 2 years
  exact_death_date_match?: boolean;
  death_year_match?: boolean;
  death_year_close?: boolean;

  // Location matching
  birth_city_match?: boolean;
  birth_country_match?: boolean;
  death_place_match?: boolean;

  // Relationship matching
  shared_relatives?: number;
  same_relationship_to_common?: boolean;

  [key: string]: boolean | number | undefined;
}

/**
 * Enhanced profile data for duplicate comparison
 */
export interface EnhancedProfileData {
  id: string;
  first_name: string;
  last_name: string;
  maiden_name?: string | null;
  nickname?: string | null;
  middle_name?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  birth_city?: string | null;
  birth_country?: string | null;
  death_date?: string | null;
  death_place?: string | null;
  death_city?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
  occupation?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  current_city?: string | null;
  current_country?: string | null;
  current_address?: string | null;
  is_living?: boolean | null;
  // Computed fields
  relationships_count?: number;
  stories_count?: number;
  photos_count?: number;
}

/**
 * Extended status types for duplicate resolution
 */
export type ExtendedDuplicateStatus =
  | 'pending'
  | 'confirmed_same'
  | 'confirmed_different'
  | 'merged'
  | 'not_duplicate'
  | 'dismissed';

/**
 * Enhanced potential duplicate record
 */
export interface EnhancedPotentialDuplicate {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  confidence_score: number;
  match_reasons: ExtendedMatchReasons;
  status: ExtendedDuplicateStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  resolution_notes?: string | null;
  kept_profile_id?: string | null;
  is_deceased_pair: boolean;
  shared_relatives_count: number;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profile_a?: EnhancedProfileData;
  profile_b?: EnhancedProfileData;
}

/**
 * Duplicate scan result from enhanced detection
 */
export interface EnhancedDuplicateScanResult {
  profile_a_id: string;
  profile_b_id: string;
  confidence_score: number;
  match_reasons: ExtendedMatchReasons;
  is_deceased_pair: boolean;
  shared_relatives_count: number;
}

/**
 * Enhanced merge request with field selection
 */
export interface EnhancedMergeRequest {
  duplicateId: string;
  keepProfileId: string;
  mergeProfileId: string;
  fieldsToMerge?: string[];
  resolutionNotes?: string;
}

/**
 * Enhanced merge result
 */
export interface EnhancedMergeResult {
  success: boolean;
  mergeHistoryId?: string;
  relationshipsTransferred: number;
  storiesTransferred: number;
  photosTransferred: number;
  error?: string;
}

/**
 * Duplicate resolution action
 */
export interface DuplicateResolutionAction {
  duplicateId: string;
  action: 'confirm_same' | 'confirm_different' | 'dismiss';
  notes?: string;
}

/**
 * Duplicate queue filters with enhanced options
 */
export interface EnhancedDuplicateQueueFilters {
  status?: ExtendedDuplicateStatus;
  minConfidence?: number;
  maxConfidence?: number;
  deceasedOnly?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'confidence' | 'created_at' | 'shared_relatives';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Scan options for duplicate detection
 */
export interface DuplicateScanOptions {
  scanType: 'full' | 'deceased_only' | 'incremental';
  minConfidence: number;
  includeRelationshipMatching: boolean;
}

/**
 * Scan history record
 */
export interface DuplicateScanHistory {
  id: string;
  scanned_by: string;
  profiles_scanned: number;
  duplicates_found: number;
  duplicates_inserted: number;
  scan_type: 'full' | 'deceased_only' | 'incremental';
  min_confidence: number;
  duration_ms: number;
  created_at: string;
}

/**
 * Profile comparison data for side-by-side view
 */
export interface ProfileComparisonField {
  key: string;
  label: string;
  labelRu: string;
  profileAValue: string | null;
  profileBValue: string | null;
  isMatch: boolean;
  matchType?: 'exact' | 'similar' | 'variant' | 'none';
}

/**
 * Build profile comparison fields for UI
 */
export function buildProfileComparison(
  profileA: EnhancedProfileData,
  profileB: EnhancedProfileData
): ProfileComparisonField[] {
  const fields: ProfileComparisonField[] = [
    {
      key: 'first_name',
      label: 'First Name',
      labelRu: 'Имя',
      profileAValue: profileA.first_name,
      profileBValue: profileB.first_name,
      isMatch: profileA.first_name?.toLowerCase() === profileB.first_name?.toLowerCase(),
      matchType: areNameVariants(profileA.first_name || '', profileB.first_name || '')
        ? 'variant'
        : profileA.first_name?.toLowerCase() === profileB.first_name?.toLowerCase()
          ? 'exact'
          : 'none',
    },
    {
      key: 'last_name',
      label: 'Last Name',
      labelRu: 'Фамилия',
      profileAValue: profileA.last_name,
      profileBValue: profileB.last_name,
      isMatch: profileA.last_name?.toLowerCase() === profileB.last_name?.toLowerCase(),
      matchType: profileA.last_name?.toLowerCase() === profileB.last_name?.toLowerCase()
        ? 'exact'
        : 'none',
    },
    {
      key: 'maiden_name',
      label: 'Maiden Name',
      labelRu: 'Девичья фамилия',
      profileAValue: profileA.maiden_name || null,
      profileBValue: profileB.maiden_name || null,
      isMatch:
        !!profileA.maiden_name &&
        !!profileB.maiden_name &&
        profileA.maiden_name.toLowerCase() === profileB.maiden_name.toLowerCase(),
      matchType:
        profileA.maiden_name?.toLowerCase() === profileB.maiden_name?.toLowerCase() && profileA.maiden_name
          ? 'exact'
          : 'none',
    },
    {
      key: 'birth_date',
      label: 'Birth Date',
      labelRu: 'Дата рождения',
      profileAValue: profileA.birth_date || null,
      profileBValue: profileB.birth_date || null,
      isMatch: profileA.birth_date === profileB.birth_date && !!profileA.birth_date,
      matchType: profileA.birth_date === profileB.birth_date && profileA.birth_date ? 'exact' : 'none',
    },
    {
      key: 'birth_city',
      label: 'Birth City',
      labelRu: 'Город рождения',
      profileAValue: profileA.birth_city || null,
      profileBValue: profileB.birth_city || null,
      isMatch:
        profileA.birth_city?.toLowerCase() === profileB.birth_city?.toLowerCase() && !!profileA.birth_city,
      matchType:
        profileA.birth_city?.toLowerCase() === profileB.birth_city?.toLowerCase() && profileA.birth_city
          ? 'exact'
          : 'none',
    },
    {
      key: 'death_date',
      label: 'Death Date',
      labelRu: 'Дата смерти',
      profileAValue: profileA.death_date || null,
      profileBValue: profileB.death_date || null,
      isMatch: profileA.death_date === profileB.death_date && !!profileA.death_date,
      matchType: profileA.death_date === profileB.death_date && profileA.death_date ? 'exact' : 'none',
    },
    {
      key: 'death_place',
      label: 'Death Place',
      labelRu: 'Место смерти',
      profileAValue: profileA.death_place || null,
      profileBValue: profileB.death_place || null,
      isMatch:
        profileA.death_place?.toLowerCase() === profileB.death_place?.toLowerCase() && !!profileA.death_place,
      matchType:
        profileA.death_place?.toLowerCase() === profileB.death_place?.toLowerCase() && profileA.death_place
          ? 'exact'
          : 'none',
    },
    {
      key: 'occupation',
      label: 'Occupation',
      labelRu: 'Профессия',
      profileAValue: profileA.occupation || null,
      profileBValue: profileB.occupation || null,
      isMatch: false,
      matchType: 'none',
    },
  ];

  return fields;
}
