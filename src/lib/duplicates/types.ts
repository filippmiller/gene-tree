/**
 * Type definitions for the Duplicate Detection system
 */

export interface MatchReasons {
  exact_name_match?: boolean;
  first_name_match?: boolean;
  last_name_match?: boolean;
  maiden_name_match?: boolean;
  nickname_match?: boolean;
  exact_birth_date_match?: boolean;
  birth_year_match?: boolean;
  birth_city_match?: boolean;
  birth_country_match?: boolean;
  fuzzy_name_match?: boolean;
  fuzzy_name_similarity?: number;
  [key: string]: boolean | number | undefined;
}

export interface ProfileData {
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
  gender?: string | null;
  avatar_url?: string | null;
  occupation?: string | null;
  bio?: string | null;
  phone?: string | null;
  current_city?: string | null;
  current_country?: string | null;
  current_address?: string | null;
  is_living?: boolean | null;
}

export type DuplicateStatus = 'pending' | 'merged' | 'not_duplicate' | 'dismissed';

export interface PotentialDuplicate {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  confidence_score: number;
  match_reasons: MatchReasons;
  status: DuplicateStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profile_a?: ProfileData;
  profile_b?: ProfileData;
}

export interface MergeHistory {
  id: string;
  kept_profile_id: string;
  merged_profile_id: string;
  merged_by: string;
  duplicate_record_id?: string | null;
  merge_data: {
    fields_from_merged: string[];
    relationships_transferred: number;
    original_merged_data: Partial<ProfileData>;
  };
  relationships_transferred: number;
  created_at: string;
}

export interface DuplicateScanResult {
  profile_a_id: string;
  profile_b_id: string;
  confidence_score: number;
  match_reasons: MatchReasons;
}

export interface MergeRequest {
  duplicateId: string;
  keepProfileId: string;
  mergeProfileId: string;
  fieldsToMerge?: string[];
}

export interface MergeResult {
  success: boolean;
  mergeHistoryId?: string;
  relationshipsTransferred: number;
  error?: string;
}

export interface DuplicateQueueFilters {
  status?: DuplicateStatus;
  minConfidence?: number;
  maxConfidence?: number;
  limit?: number;
  offset?: number;
}
