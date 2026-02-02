/**
 * Family Bridge Request Types
 * Types for connecting family trees between users
 */

// Request status
export type BridgeRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';

// Match reason types
export type MatchReasonType =
  | 'same_last_name'
  | 'same_maiden_name'
  | 'same_birth_place'
  | 'shared_ancestor'
  | 'same_location'
  | 'email_domain';

// Match reason object
export interface MatchReason {
  type: MatchReasonType;
  value: string;
  details?: string;
}

// Bridge request from database
export interface BridgeRequest {
  id: string;
  requester_id: string;
  target_user_id: string;
  claimed_relationship: string;
  common_ancestor_hint: string | null;
  supporting_info: string | null;
  status: BridgeRequestStatus;
  responded_at: string | null;
  response_message: string | null;
  established_relationship_type: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// Bridge request with user profile info
export interface BridgeRequestWithProfiles extends BridgeRequest {
  requester?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  target?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

// Bridge candidate (potential match)
export interface BridgeCandidate {
  id: string;
  user_id: string;
  candidate_user_id: string;
  match_score: number;
  match_reasons: MatchReason[];
  is_dismissed: boolean;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Bridge candidate with profile info
export interface BridgeCandidateWithProfile extends BridgeCandidate {
  candidate?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    birth_place: string | null;
  };
}

// Blocked user
export interface BridgeBlockedUser {
  id: string;
  user_id: string;
  blocked_user_id: string;
  reason: string | null;
  created_at: string;
}

// API request/response types

// Send bridge request
export interface SendBridgeRequestPayload {
  target_user_id: string;
  claimed_relationship: string;
  common_ancestor_hint?: string;
  supporting_info?: string;
}

// Accept bridge request
export interface AcceptBridgeRequestPayload {
  relationship_type: string;
  response_message?: string;
}

// Reject/withdraw bridge request
export interface UpdateBridgeRequestPayload {
  status: 'rejected' | 'withdrawn';
  response_message?: string;
}

// Discovery result from API
export interface DiscoveryResult {
  candidate_id: string;
  match_score: number;
  match_reasons: MatchReason[];
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    birth_place: string | null;
  };
}

// Bridge request counts for dashboard
export interface BridgeRequestCounts {
  pending_received: number;
  pending_sent: number;
  potential_matches: number;
}

// API response types
export interface BridgeRequestsApiResponse {
  requests: BridgeRequestWithProfiles[];
}

export interface DiscoveryApiResponse {
  candidates: DiscoveryResult[];
}

export interface BridgeCountsApiResponse {
  counts: BridgeRequestCounts;
}

// Relationship types for bridge connections
export const BRIDGE_RELATIONSHIP_TYPES = [
  'distant_cousin',
  'second_cousin',
  'third_cousin',
  'cousin_removed',
  'extended_family',
  'step_family',
  'in_law',
  'other',
] as const;

export type BridgeRelationshipType = (typeof BRIDGE_RELATIONSHIP_TYPES)[number];

// Helper to get readable relationship label
export function getBridgeRelationshipLabel(type: string, locale: 'en' | 'ru' = 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    distant_cousin: { en: 'Distant Cousin', ru: 'Дальний родственник' },
    second_cousin: { en: 'Second Cousin', ru: 'Троюродный брат/сестра' },
    third_cousin: { en: 'Third Cousin', ru: 'Четвероюродный брат/сестра' },
    cousin_removed: { en: 'Cousin Once Removed', ru: 'Двоюродный/троюродный разной степени' },
    extended_family: { en: 'Extended Family', ru: 'Дальняя родня' },
    step_family: { en: 'Step Family', ru: 'Сводные родственники' },
    in_law: { en: 'In-law', ru: 'Родственник по браку' },
    other: { en: 'Other Relation', ru: 'Другое родство' },
  };

  return labels[type]?.[locale] || type;
}
