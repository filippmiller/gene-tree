/**
 * Duplicate Profile Detector
 *
 * Compares profiles using multiple signals:
 * - Name similarity (fuzzy matching)
 * - Birth date matching
 * - Birth place matching
 * - Additional fields as tie-breakers
 */

import type { ProfileData, MatchReasons, DuplicateScanResult } from './types';

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
