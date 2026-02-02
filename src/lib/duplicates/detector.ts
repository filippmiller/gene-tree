/**
 * Duplicate Profile Detector
 *
 * Compares profiles using multiple signals:
 * - Name similarity (fuzzy matching)
 * - Name variants (cross-language support for EN/RU)
 * - Birth date matching
 * - Death date matching (for deceased profiles)
 * - Birth/death place matching
 * - Relationship matching (shared relatives)
 * - Additional fields as tie-breakers
 */

import type { ProfileData, MatchReasons, DuplicateScanResult } from './types';
import {
  areNameVariants,
  type EnhancedProfileData,
  type ExtendedMatchReasons,
  type EnhancedDuplicateScanResult,
} from '@/types/duplicate';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy name matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  if (aLower === bLower) return 1;

  const maxLen = Math.max(aLower.length, bLower.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(aLower, bLower);
  return 1 - distance / maxLen;
}

/**
 * Check if two strings match exactly (case-insensitive)
 */
function exactMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

/**
 * Parse a date string and extract year
 */
function extractYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.getFullYear();
}

/**
 * Check if two dates are the same (YYYY-MM-DD comparison)
 */
function datesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  // Compare just the date portion (YYYY-MM-DD)
  return a.substring(0, 10) === b.substring(0, 10);
}

/**
 * Configuration for score weights
 */
const SCORE_WEIGHTS = {
  exactNameMatch: 50,
  firstNameMatch: 25,
  lastNameMatch: 15,
  maidenNameMatch: 10,
  nicknameMatch: 5,
  fuzzyNameMatch: 20, // For high similarity (>0.8)
  exactBirthDateMatch: 30,
  birthYearMatch: 15,
  birthCityMatch: 15,
  birthCountryMatch: 5,
  maxNameScore: 50,
  maxDateScore: 30,
  maxPlaceScore: 20,
};

/**
 * Compare two profiles and calculate a duplicate confidence score
 *
 * @param profileA First profile to compare
 * @param profileB Second profile to compare
 * @returns Object with confidence score (0-100) and match reasons
 */
export function compareProfiles(
  profileA: ProfileData,
  profileB: ProfileData
): { score: number; reasons: MatchReasons } {
  let nameScore = 0;
  let dateScore = 0;
  let placeScore = 0;
  const reasons: MatchReasons = {};

  // Name matching
  const firstNameExact = exactMatch(profileA.first_name, profileB.first_name);
  const lastNameExact = exactMatch(profileA.last_name, profileB.last_name);

  if (firstNameExact && lastNameExact) {
    nameScore = SCORE_WEIGHTS.exactNameMatch;
    reasons.exact_name_match = true;
  } else {
    if (firstNameExact) {
      nameScore += SCORE_WEIGHTS.firstNameMatch;
      reasons.first_name_match = true;
    } else {
      // Try fuzzy matching on first name
      const firstNameSimilarity = stringSimilarity(
        profileA.first_name || '',
        profileB.first_name || ''
      );
      if (firstNameSimilarity >= 0.8) {
        nameScore += Math.floor(SCORE_WEIGHTS.fuzzyNameMatch * firstNameSimilarity);
        reasons.fuzzy_name_match = true;
        reasons.fuzzy_name_similarity = firstNameSimilarity;
      }
    }

    if (lastNameExact) {
      nameScore += SCORE_WEIGHTS.lastNameMatch;
      reasons.last_name_match = true;
    }
  }

  // Maiden name matching
  if (exactMatch(profileA.maiden_name, profileB.maiden_name)) {
    nameScore += SCORE_WEIGHTS.maidenNameMatch;
    reasons.maiden_name_match = true;
  }

  // Nickname matching
  if (exactMatch(profileA.nickname, profileB.nickname)) {
    nameScore += SCORE_WEIGHTS.nicknameMatch;
    reasons.nickname_match = true;
  }

  // Cross-check: nickname matches first name of other profile
  if (
    exactMatch(profileA.nickname, profileB.first_name) ||
    exactMatch(profileB.nickname, profileA.first_name)
  ) {
    nameScore += 5;
  }

  // Cap name score
  nameScore = Math.min(nameScore, SCORE_WEIGHTS.maxNameScore);

  // Birth date matching
  if (datesMatch(profileA.birth_date, profileB.birth_date)) {
    dateScore = SCORE_WEIGHTS.exactBirthDateMatch;
    reasons.exact_birth_date_match = true;
  } else {
    const yearA = extractYear(profileA.birth_date);
    const yearB = extractYear(profileB.birth_date);
    if (yearA && yearB && yearA === yearB) {
      dateScore = SCORE_WEIGHTS.birthYearMatch;
      reasons.birth_year_match = true;
    }
  }

  // Cap date score
  dateScore = Math.min(dateScore, SCORE_WEIGHTS.maxDateScore);

  // Birth place matching
  if (exactMatch(profileA.birth_city, profileB.birth_city)) {
    placeScore += SCORE_WEIGHTS.birthCityMatch;
    reasons.birth_city_match = true;
  }

  if (exactMatch(profileA.birth_country, profileB.birth_country)) {
    placeScore += SCORE_WEIGHTS.birthCountryMatch;
    reasons.birth_country_match = true;
  }

  // Cap place score
  placeScore = Math.min(placeScore, SCORE_WEIGHTS.maxPlaceScore);

  // Total score
  const totalScore = nameScore + dateScore + placeScore;

  return {
    score: Math.min(totalScore, 100),
    reasons,
  };
}

/**
 * Scan a list of profiles and find potential duplicates
 *
 * @param profiles List of profiles to scan
 * @param minConfidence Minimum confidence score to include (default: 50)
 * @param existingPairs Set of already detected pairs (to skip)
 * @returns Array of potential duplicate pairs
 */
export function scanForDuplicates(
  profiles: ProfileData[],
  minConfidence: number = 50,
  existingPairs?: Set<string>
): DuplicateScanResult[] {
  const results: DuplicateScanResult[] = [];
  const pairSet = existingPairs || new Set<string>();

  // Compare each pair of profiles
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const profileA = profiles[i];
      const profileB = profiles[j];

      // Ensure consistent ordering (smaller ID first)
      const [first, second] = profileA.id < profileB.id
        ? [profileA, profileB]
        : [profileB, profileA];

      // Skip if already detected
      const pairKey = `${first.id}:${second.id}`;
      if (pairSet.has(pairKey)) {
        continue;
      }

      // Compare profiles
      const { score, reasons } = compareProfiles(first, second);

      if (score >= minConfidence) {
        results.push({
          profile_a_id: first.id,
          profile_b_id: second.id,
          confidence_score: score,
          match_reasons: reasons,
        });
      }
    }
  }

  // Sort by confidence score (highest first)
  return results.sort((a, b) => b.confidence_score - a.confidence_score);
}

/**
 * Get a human-readable description of match reasons
 */
export function describeMatchReasons(reasons: MatchReasons): string[] {
  const descriptions: string[] = [];

  if (reasons.exact_name_match) {
    descriptions.push('Exact name match (first and last name)');
  } else {
    if (reasons.first_name_match) {
      descriptions.push('First name matches exactly');
    }
    if (reasons.last_name_match) {
      descriptions.push('Last name matches exactly');
    }
    if (reasons.fuzzy_name_match && reasons.fuzzy_name_similarity) {
      descriptions.push(
        `Names are similar (${Math.round(reasons.fuzzy_name_similarity * 100)}% match)`
      );
    }
  }

  if (reasons.maiden_name_match) {
    descriptions.push('Maiden name matches');
  }

  if (reasons.nickname_match) {
    descriptions.push('Nickname matches');
  }

  if (reasons.exact_birth_date_match) {
    descriptions.push('Birth date matches exactly');
  } else if (reasons.birth_year_match) {
    descriptions.push('Birth year matches');
  }

  if (reasons.birth_city_match) {
    descriptions.push('Birth city matches');
  }

  if (reasons.birth_country_match) {
    descriptions.push('Birth country matches');
  }

  return descriptions;
}

/**
 * Get confidence level label based on score
 */
export function getConfidenceLevel(score: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Get confidence level color for UI
 */
export function getConfidenceColor(score: number): string {
  if (score >= 80) return 'text-red-600 dark:text-red-400';
  if (score >= 60) return 'text-orange-600 dark:text-orange-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-gray-600 dark:text-gray-400';
}

/**
 * Get confidence badge variant for UI
 */
export function getConfidenceBadgeVariant(
  score: number
): 'destructive' | 'warning' | 'secondary' | 'outline' {
  if (score >= 80) return 'destructive';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'secondary';
  return 'outline';
}

// ============================================================================
// ENHANCED DECEASED PROFILE DETECTION
// ============================================================================

/**
 * Configuration for deceased profile detection weights
 * Adjusted to prioritize deceased-specific matching signals
 */
const DECEASED_SCORE_WEIGHTS = {
  // Name matching (40% weight)
  exactNameMatch: 40,
  firstNameMatch: 20,
  lastNameMatch: 15,
  maidenNameMatch: 15,
  nicknameMatch: 5,
  nameVariantMatch: 18, // Name variant gets good weight
  fuzzyNameMatch: 16,

  // Date matching (30% weight)
  exactBirthDateMatch: 20,
  birthYearMatch: 12,
  birthYearClose: 8, // Within 2 years
  exactDeathDateMatch: 15,
  deathYearMatch: 8,
  deathYearClose: 5,

  // Location matching (15% weight)
  birthCityMatch: 10,
  birthCountryMatch: 3,
  deathPlaceMatch: 8,

  // Relationship matching (15% weight)
  sharedRelativeBase: 8, // Per shared relative
  sharedRelativeMax: 15,

  // Caps
  maxNameScore: 40,
  maxDateScore: 30,
  maxPlaceScore: 15,
  maxRelationshipScore: 15,
};

/**
 * Extract year from date string, handling various formats
 */
function extractYearSafe(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.getFullYear();
  } catch {
    return null;
  }
}

/**
 * Check if two years are within a threshold
 */
function yearsWithinRange(
  date1: string | null | undefined,
  date2: string | null | undefined,
  range: number
): boolean {
  const year1 = extractYearSafe(date1);
  const year2 = extractYearSafe(date2);
  if (year1 === null || year2 === null) return false;
  return Math.abs(year1 - year2) <= range;
}

/**
 * Compare two deceased profiles with enhanced matching
 *
 * @param profileA First profile to compare
 * @param profileB Second profile to compare
 * @param sharedRelativesCount Number of shared relatives (optional, from pre-computation)
 * @returns Object with confidence score (0-100) and detailed match reasons
 */
export function compareDeceasedProfiles(
  profileA: EnhancedProfileData,
  profileB: EnhancedProfileData,
  sharedRelativesCount: number = 0
): { score: number; reasons: ExtendedMatchReasons } {
  let nameScore = 0;
  let dateScore = 0;
  let placeScore = 0;
  let relationshipScore = 0;
  const reasons: ExtendedMatchReasons = {};

  // ==================== NAME MATCHING ====================
  const firstNameExact = exactMatch(profileA.first_name, profileB.first_name);
  const lastNameExact = exactMatch(profileA.last_name, profileB.last_name);

  // Check for name variants (cross-language)
  const firstNameVariant = areNameVariants(profileA.first_name || '', profileB.first_name || '');

  if (firstNameExact && lastNameExact) {
    nameScore = DECEASED_SCORE_WEIGHTS.exactNameMatch;
    reasons.exact_name_match = true;
  } else {
    if (firstNameExact) {
      nameScore += DECEASED_SCORE_WEIGHTS.firstNameMatch;
      reasons.first_name_match = true;
    } else if (firstNameVariant) {
      nameScore += DECEASED_SCORE_WEIGHTS.nameVariantMatch;
      reasons.name_variant_match = true;
    } else {
      // Try fuzzy matching on first name
      const firstNameSimilarity = stringSimilarity(
        profileA.first_name || '',
        profileB.first_name || ''
      );
      if (firstNameSimilarity >= 0.8) {
        nameScore += Math.floor(DECEASED_SCORE_WEIGHTS.fuzzyNameMatch * firstNameSimilarity);
        reasons.fuzzy_name_match = true;
        reasons.fuzzy_name_similarity = firstNameSimilarity;
      }
    }

    if (lastNameExact) {
      nameScore += DECEASED_SCORE_WEIGHTS.lastNameMatch;
      reasons.last_name_match = true;
    }
  }

  // Maiden name matching (important for deceased women)
  if (exactMatch(profileA.maiden_name, profileB.maiden_name)) {
    nameScore += DECEASED_SCORE_WEIGHTS.maidenNameMatch;
    reasons.maiden_name_match = true;
  }

  // Nickname matching
  if (exactMatch(profileA.nickname, profileB.nickname)) {
    nameScore += DECEASED_SCORE_WEIGHTS.nicknameMatch;
    reasons.nickname_match = true;
  }

  // Cap name score
  nameScore = Math.min(nameScore, DECEASED_SCORE_WEIGHTS.maxNameScore);

  // ==================== DATE MATCHING ====================

  // Birth date
  if (datesMatch(profileA.birth_date, profileB.birth_date)) {
    dateScore = DECEASED_SCORE_WEIGHTS.exactBirthDateMatch;
    reasons.exact_birth_date_match = true;
  } else {
    const yearA = extractYearSafe(profileA.birth_date);
    const yearB = extractYearSafe(profileB.birth_date);
    if (yearA && yearB) {
      if (yearA === yearB) {
        dateScore = DECEASED_SCORE_WEIGHTS.birthYearMatch;
        reasons.birth_year_match = true;
      } else if (Math.abs(yearA - yearB) <= 2) {
        dateScore = DECEASED_SCORE_WEIGHTS.birthYearClose;
        reasons.birth_year_close = true;
      }
    }
  }

  // Death date (extra weight for deceased profiles)
  if (datesMatch(profileA.death_date, profileB.death_date)) {
    dateScore += DECEASED_SCORE_WEIGHTS.exactDeathDateMatch;
    reasons.exact_death_date_match = true;
  } else if (yearsWithinRange(profileA.death_date, profileB.death_date, 0)) {
    dateScore += DECEASED_SCORE_WEIGHTS.deathYearMatch;
    reasons.death_year_match = true;
  } else if (yearsWithinRange(profileA.death_date, profileB.death_date, 2)) {
    dateScore += DECEASED_SCORE_WEIGHTS.deathYearClose;
    reasons.death_year_close = true;
  }

  // Cap date score
  dateScore = Math.min(dateScore, DECEASED_SCORE_WEIGHTS.maxDateScore);

  // ==================== LOCATION MATCHING ====================

  // Birth city
  if (exactMatch(profileA.birth_city, profileB.birth_city)) {
    placeScore += DECEASED_SCORE_WEIGHTS.birthCityMatch;
    reasons.birth_city_match = true;
  }

  // Birth country
  if (exactMatch(profileA.birth_country, profileB.birth_country)) {
    placeScore += DECEASED_SCORE_WEIGHTS.birthCountryMatch;
    reasons.birth_country_match = true;
  }

  // Death place
  if (
    exactMatch(profileA.death_place, profileB.death_place) ||
    exactMatch(profileA.death_city, profileB.death_city)
  ) {
    placeScore += DECEASED_SCORE_WEIGHTS.deathPlaceMatch;
    reasons.death_place_match = true;
  }

  // Cap place score
  placeScore = Math.min(placeScore, DECEASED_SCORE_WEIGHTS.maxPlaceScore);

  // ==================== RELATIONSHIP MATCHING ====================

  if (sharedRelativesCount > 0) {
    relationshipScore = Math.min(
      sharedRelativesCount * DECEASED_SCORE_WEIGHTS.sharedRelativeBase,
      DECEASED_SCORE_WEIGHTS.sharedRelativeMax
    );
    reasons.shared_relatives = sharedRelativesCount;
  }

  // Total score
  const totalScore = nameScore + dateScore + placeScore + relationshipScore;

  return {
    score: Math.min(totalScore, 100),
    reasons,
  };
}

/**
 * Scan a list of profiles for potential duplicates with enhanced deceased detection
 *
 * @param profiles List of profiles to scan
 * @param minConfidence Minimum confidence score to include (default: 70 for deceased)
 * @param existingPairs Set of already detected pairs (to skip)
 * @param sharedRelativesMap Map of profile pairs to shared relative counts
 * @returns Array of potential duplicate pairs
 */
export function scanForDeceasedDuplicates(
  profiles: EnhancedProfileData[],
  minConfidence: number = 70,
  existingPairs?: Set<string>,
  sharedRelativesMap?: Map<string, number>
): EnhancedDuplicateScanResult[] {
  const results: EnhancedDuplicateScanResult[] = [];
  const pairSet = existingPairs || new Set<string>();

  // Filter to deceased profiles only
  const deceasedProfiles = profiles.filter((p) => p.is_living === false);

  // Compare each pair of deceased profiles
  for (let i = 0; i < deceasedProfiles.length; i++) {
    for (let j = i + 1; j < deceasedProfiles.length; j++) {
      const profileA = deceasedProfiles[i];
      const profileB = deceasedProfiles[j];

      // Ensure consistent ordering (smaller ID first)
      const [first, second] =
        profileA.id < profileB.id ? [profileA, profileB] : [profileB, profileA];

      // Skip if already detected
      const pairKey = `${first.id}:${second.id}`;
      if (pairSet.has(pairKey)) {
        continue;
      }

      // Get shared relatives count if available
      const sharedRelatives = sharedRelativesMap?.get(pairKey) || 0;

      // Compare profiles
      const { score, reasons } = compareDeceasedProfiles(first, second, sharedRelatives);

      if (score >= minConfidence) {
        results.push({
          profile_a_id: first.id,
          profile_b_id: second.id,
          confidence_score: score,
          match_reasons: reasons,
          is_deceased_pair: true,
          shared_relatives_count: sharedRelatives,
        });
      }
    }
  }

  // Sort by confidence score (highest first)
  return results.sort((a, b) => b.confidence_score - a.confidence_score);
}

/**
 * Get human-readable descriptions for extended match reasons
 */
export function describeExtendedMatchReasons(
  reasons: ExtendedMatchReasons,
  locale: 'en' | 'ru' = 'en'
): string[] {
  const descriptions: string[] = [];

  const texts = {
    en: {
      exact_name_match: 'Exact name match (first and last name)',
      first_name_match: 'First name matches exactly',
      last_name_match: 'Last name matches exactly',
      name_variant_match: 'Names are language variants (e.g., Maria / Мария)',
      maiden_name_match: 'Maiden name matches',
      nickname_match: 'Nickname matches',
      fuzzy_name_match: 'Names are similar',
      exact_birth_date_match: 'Birth date matches exactly',
      birth_year_match: 'Birth year matches',
      birth_year_close: 'Birth year within 2 years',
      exact_death_date_match: 'Death date matches exactly',
      death_year_match: 'Death year matches',
      death_year_close: 'Death year within 2 years',
      birth_city_match: 'Birth city matches',
      birth_country_match: 'Birth country matches',
      death_place_match: 'Death place matches',
      shared_relatives: 'shared relative(s)',
    },
    ru: {
      exact_name_match: 'Точное совпадение имени и фамилии',
      first_name_match: 'Имя совпадает',
      last_name_match: 'Фамилия совпадает',
      name_variant_match: 'Имена являются вариантами (напр., Maria / Мария)',
      maiden_name_match: 'Девичья фамилия совпадает',
      nickname_match: 'Прозвище совпадает',
      fuzzy_name_match: 'Имена похожи',
      exact_birth_date_match: 'Дата рождения совпадает',
      birth_year_match: 'Год рождения совпадает',
      birth_year_close: 'Год рождения в пределах 2 лет',
      exact_death_date_match: 'Дата смерти совпадает',
      death_year_match: 'Год смерти совпадает',
      death_year_close: 'Год смерти в пределах 2 лет',
      birth_city_match: 'Город рождения совпадает',
      birth_country_match: 'Страна рождения совпадает',
      death_place_match: 'Место смерти совпадает',
      shared_relatives: 'общих родственника(ов)',
    },
  };

  const t = texts[locale];

  if (reasons.exact_name_match) {
    descriptions.push(t.exact_name_match);
  } else {
    if (reasons.first_name_match) descriptions.push(t.first_name_match);
    if (reasons.last_name_match) descriptions.push(t.last_name_match);
    if (reasons.name_variant_match) descriptions.push(t.name_variant_match);
    if (reasons.fuzzy_name_match && reasons.fuzzy_name_similarity) {
      descriptions.push(
        `${t.fuzzy_name_match} (${Math.round(reasons.fuzzy_name_similarity * 100)}%)`
      );
    }
  }

  if (reasons.maiden_name_match) descriptions.push(t.maiden_name_match);
  if (reasons.nickname_match) descriptions.push(t.nickname_match);

  if (reasons.exact_birth_date_match) {
    descriptions.push(t.exact_birth_date_match);
  } else if (reasons.birth_year_match) {
    descriptions.push(t.birth_year_match);
  } else if (reasons.birth_year_close) {
    descriptions.push(t.birth_year_close);
  }

  if (reasons.exact_death_date_match) {
    descriptions.push(t.exact_death_date_match);
  } else if (reasons.death_year_match) {
    descriptions.push(t.death_year_match);
  } else if (reasons.death_year_close) {
    descriptions.push(t.death_year_close);
  }

  if (reasons.birth_city_match) descriptions.push(t.birth_city_match);
  if (reasons.birth_country_match) descriptions.push(t.birth_country_match);
  if (reasons.death_place_match) descriptions.push(t.death_place_match);

  if (reasons.shared_relatives && reasons.shared_relatives > 0) {
    descriptions.push(`${reasons.shared_relatives} ${t.shared_relatives}`);
  }

  return descriptions;
}
