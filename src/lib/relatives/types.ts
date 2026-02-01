/**
 * Types for the Relative Matching / Cousin Finder system
 */

export interface MatchingPreferences {
  user_id: string;
  allow_matching: boolean;
  notify_on_match: boolean;
  min_ancestor_depth: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectionRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  shared_ancestor_id: string | null;
  relationship_description: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  responded_at: string | null;
}

export interface ConnectionRequestWithProfiles extends ConnectionRequest {
  from_user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  to_user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  shared_ancestor?: {
    id: string;
    first_name: string;
    last_name: string;
    birth_date: string | null;
    death_date: string | null;
  } | null;
}

export interface PotentialRelative {
  relative_user_id: string;
  relative_name: string;
  relative_avatar_url: string | null;
  shared_ancestor_id: string;
  shared_ancestor_name: string;
  shared_ancestor_birth_year: number | null;
  shared_ancestor_death_year: number | null;
  user_depth: number;
  relative_depth: number;
  relationship_closeness: number;
  relationship_description: string;
}

export interface AncestorInfo {
  ancestor_id: string;
  depth: number;
  path: string[];
  name?: string;
  birth_year?: number | null;
  death_year?: number | null;
}

export interface SharedAncestor {
  ancestor_id: string;
  user1_depth: number;
  user2_depth: number;
  ancestor_name: string;
  birth_year?: number | null;
  death_year?: number | null;
}

export type RelationshipLabel = {
  en: string;
  ru: string;
};

export interface FindRelativesOptions {
  maxDepth?: number;
  limit?: number;
  excludeConnected?: boolean;
}

export interface ConnectionRequestFilters {
  status?: ConnectionRequest['status'] | 'all';
  direction?: 'sent' | 'received' | 'all';
}
