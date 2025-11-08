// Database Types
// Generated from Supabase schema

export type PrivacyLevel = 'public' | 'family' | 'private';

export interface PrivacySettings {
  birth_date: PrivacyLevel;
  birth_place: PrivacyLevel;
  death_date: PrivacyLevel;
  death_place: PrivacyLevel;
  phone: PrivacyLevel;
  occupation: PrivacyLevel;
  bio: PrivacyLevel;
  avatar_url: PrivacyLevel;
  maiden_name: PrivacyLevel;
}

export type Gender = 'male' | 'female' | 'other' | 'unknown';

export type RelationshipType = 
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'uncle_aunt'
  | 'nephew_niece'
  | 'cousin';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'rejected';

export interface UserProfile {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  maiden_name: string | null;
  nickname: string | null;
  birth_date: string | null; // ISO date string
  birth_place: string | null;
  death_date: string | null;
  death_place: string | null;
  is_living: boolean;
  gender: Gender | null;
  bio: string | null;
  avatar_url: string | null;
  occupation: string | null;
  phone: string | null;
  privacy_settings: PrivacySettings;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_phone: string | null;
  relationship_type: RelationshipType;
  token: string;
  status: InvitationStatus;
  message: string | null;
  accepted_user_id: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface Relationship {
  id: string;
  user1_id: string;
  user2_id: string;
  relationship_type: RelationshipType;
  marriage_date: string | null;
  marriage_place: string | null;
  divorce_date: string | null;
  created_from_invitation_id: string | null;
  created_at: string;
  updated_at: string;
}

// DTOs for API requests/responses

export interface CreateProfileDto {
  first_name: string;
  last_name: string;
  middle_name?: string;
  maiden_name?: string;
  nickname?: string;
  birth_date?: string;
  birth_place?: string;
  gender?: Gender;
  bio?: string;
  occupation?: string;
  phone?: string;
}

export interface UpdateProfileDto extends Partial<CreateProfileDto> {
  privacy_settings?: Partial<PrivacySettings>;
}

export interface CreateInvitationDto {
  invitee_email: string;
  invitee_phone?: string;
  relationship_type: RelationshipType;
  message?: string;
}

export interface InvitationWithInviter extends Invitation {
  inviter_profile: UserProfile;
}

export interface ProfileWithRelationships extends UserProfile {
  parents: UserProfile[];
  children: UserProfile[];
  spouses: UserProfile[];
  siblings: UserProfile[];
}

// Utility type for filtering profile by privacy
export type FilteredProfile = Partial<UserProfile>;

// Relationship labels for UI
export const RelationshipLabels: Record<RelationshipType, { singular: string; plural: string }> = {
  parent: { singular: 'Parent', plural: 'Parents' },
  child: { singular: 'Child', plural: 'Children' },
  spouse: { singular: 'Spouse', plural: 'Spouses' },
  sibling: { singular: 'Sibling', plural: 'Siblings' },
  grandparent: { singular: 'Grandparent', plural: 'Grandparents' },
  grandchild: { singular: 'Grandchild', plural: 'Grandchildren' },
  uncle_aunt: { singular: 'Uncle/Aunt', plural: 'Uncles/Aunts' },
  nephew_niece: { singular: 'Nephew/Niece', plural: 'Nephews/Nieces' },
  cousin: { singular: 'Cousin', plural: 'Cousins' },
};

// Gender labels
export const GenderLabels: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  unknown: 'Prefer not to say',
};

// Privacy level labels
export const PrivacyLevelLabels: Record<PrivacyLevel, { label: string; icon: string }> = {
  public: { label: 'Public', icon: '🌍' },
  family: { label: 'Family', icon: '👨‍👩‍👧‍👦' },
  private: { label: 'Private', icon: '🔒' },
};
