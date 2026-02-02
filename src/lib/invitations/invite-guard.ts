/**
 * Smart Invite Guard
 *
 * Pre-send validation system that checks email/phone against all relevant sources
 * before allowing an invitation to be sent.
 *
 * Statuses:
 * - OK_TO_INVITE: All clear, can proceed with invitation
 * - SELF_INVITE: User trying to invite themselves
 * - PENDING_INVITE: Someone already invited this person
 * - EXISTING_MEMBER: Person already in the user's family tree
 * - POTENTIAL_BRIDGE: Person exists on platform but not connected to user's tree
 */

import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

// Phone normalization regex - strip all non-digit characters except leading +
const PHONE_SANITIZE_RE = /[^\d+]/g;

/**
 * Normalize phone number for comparison
 */
export function normalizePhone(value: string): string {
  return value.replace(PHONE_SANITIZE_RE, '');
}

/**
 * Possible statuses from invite check
 */
export type InviteCheckStatus =
  | 'OK_TO_INVITE'
  | 'EXISTING_MEMBER'
  | 'PENDING_INVITE'
  | 'POTENTIAL_BRIDGE'
  | 'SELF_INVITE';

/**
 * Information about an existing family member
 */
export interface ExistingMemberInfo {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  addedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  addedAt: string;
  relationshipPath: string | null;
}

/**
 * Information about a pending invitation
 */
export interface PendingInviteInfo {
  id: string;
  firstName: string;
  lastName: string;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  invitedAt: string;
  status: 'pending' | 'expired';
}

/**
 * Information about a potential bridge candidate
 */
export interface BridgeCandidateInfo {
  exists: boolean;
  // No PII revealed - just indicates someone exists with this email/phone
}

/**
 * Result of invite eligibility check
 */
export interface InviteCheckResult {
  status: InviteCheckStatus;
  existingMember?: ExistingMemberInfo;
  pendingInvite?: PendingInviteInfo;
  bridgeCandidate?: BridgeCandidateInfo;
}

/**
 * Check if the current user's email matches the check email
 */
async function checkSelfInvite(
  email: string | null,
  currentUserId: string
): Promise<boolean> {
  if (!email) return false;

  const supabase = getSupabaseAdmin();
  const { data: currentUser } = await supabase.auth.admin.getUserById(currentUserId);

  if (currentUser?.user?.email?.toLowerCase() === email.toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Check for pending invitations with matching email or phone
 */
async function checkPendingInvites(
  email: string | null,
  phone: string | null
): Promise<PendingInviteInfo | null> {
  if (!email && !phone) return null;

  const supabase = getSupabaseAdmin();

  // Build query for pending relatives
  let query = supabase
    .from('pending_relatives')
    .select(`
      id,
      first_name,
      last_name,
      status,
      created_at,
      invited_by,
      invited_at
    `)
    .eq('status', 'pending');

  // Check by email first, then by phone
  if (email) {
    query = query.eq('email', email.toLowerCase());
  } else if (phone) {
    query = query.eq('phone', normalizePhone(phone));
  }

  const { data: pendingInvite, error } = await query.limit(1).maybeSingle();

  if (error || !pendingInvite) {
    // If email search found nothing, try phone
    if (email && phone) {
      const phoneQuery = supabase
        .from('pending_relatives')
        .select(`
          id,
          first_name,
          last_name,
          status,
          created_at,
          invited_by,
          invited_at
        `)
        .eq('status', 'pending')
        .eq('phone', normalizePhone(phone))
        .limit(1)
        .maybeSingle();

      const { data: phoneMatch } = await phoneQuery;
      if (phoneMatch) {
        return await formatPendingInvite(phoneMatch);
      }
    }
    return null;
  }

  return formatPendingInvite(pendingInvite);
}

/**
 * Format pending invite data with inviter information
 */
async function formatPendingInvite(
  pendingInvite: {
    id: string;
    first_name: string;
    last_name: string;
    status: string;
    created_at: string;
    invited_by: string;
    invited_at: string | null;
  }
): Promise<PendingInviteInfo> {
  const supabase = getSupabaseAdmin();

  // Get inviter profile
  const { data: inviterProfile } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name')
    .eq('id', pendingInvite.invited_by)
    .single();

  return {
    id: pendingInvite.id,
    firstName: pendingInvite.first_name,
    lastName: pendingInvite.last_name,
    invitedBy: {
      id: pendingInvite.invited_by,
      firstName: inviterProfile?.first_name || 'Unknown',
      lastName: inviterProfile?.last_name || '',
    },
    invitedAt: pendingInvite.invited_at || pendingInvite.created_at,
    status: pendingInvite.status === 'pending' ? 'pending' : 'expired',
  };
}

/**
 * Check if user exists and is in the current user's family tree
 */
async function checkExistingMember(
  email: string | null,
  phone: string | null,
  currentUserId: string
): Promise<{ member: ExistingMemberInfo; isInFamily: boolean } | null> {
  if (!email && !phone) return null;

  const supabase = getSupabaseAdmin();

  // First, find user by email in auth.users
  let targetUserId: string | null = null;

  if (email) {
    // Use admin API to look up user by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const matchedUser = users?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (matchedUser) {
      targetUserId = matchedUser.id;
    }
  }

  // If not found by email, try by phone in user_profiles
  if (!targetUserId && phone) {
    const { data: profileByPhone } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', normalizePhone(phone))
      .limit(1)
      .maybeSingle();

    if (profileByPhone) {
      targetUserId = profileByPhone.id;
    }
  }

  if (!targetUserId) return null;

  // Get the user's profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url, created_at')
    .eq('id', targetUserId)
    .single();

  if (!profile) return null;

  // Check if user is in the current user's family circle using the DB function
  const { data: isConnected } = await supabase.rpc('is_in_family_circle', {
    profile_id: targetUserId,
    user_id: currentUserId,
  });

  const memberInfo: ExistingMemberInfo = {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    addedBy: null, // Will be populated if we can determine who added them
    addedAt: profile.created_at || new Date().toISOString(),
    relationshipPath: null, // Could be populated with relationship description
  };

  // Try to get relationship path description
  if (isConnected) {
    const relationshipPath = await getRelationshipDescription(currentUserId, targetUserId);
    memberInfo.relationshipPath = relationshipPath;

    // Try to find who created the connection
    const addedBy = await getProfileCreator(targetUserId, currentUserId);
    memberInfo.addedBy = addedBy;
  }

  return {
    member: memberInfo,
    isInFamily: Boolean(isConnected),
  };
}

/**
 * Get a human-readable description of the relationship path
 */
async function getRelationshipDescription(
  fromUserId: string,
  toUserId: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  // Check direct relationships first
  const { data: directRel } = await supabase
    .from('relationships')
    .select('relationship_type')
    .or(`and(user1_id.eq.${fromUserId},user2_id.eq.${toUserId}),and(user1_id.eq.${toUserId},user2_id.eq.${fromUserId})`)
    .limit(1)
    .maybeSingle();

  if (directRel) {
    return formatRelationshipType(directRel.relationship_type);
  }

  // Check pending_relatives for indirect path info
  const { data: pendingRel } = await supabase
    .from('pending_relatives')
    .select('relationship_type, related_to_relationship, related_to_user_id')
    .eq('id', toUserId)
    .limit(1)
    .maybeSingle();

  if (pendingRel && pendingRel.related_to_user_id === fromUserId) {
    return formatRelationshipType(pendingRel.relationship_type);
  }

  // For more complex paths, return null (could be enhanced with path-finder)
  return null;
}

/**
 * Format relationship type into human-readable form
 */
function formatRelationshipType(relType: string): string {
  const labels: Record<string, string> = {
    parent: 'Your parent',
    child: 'Your child',
    sibling: 'Your sibling',
    spouse: 'Your spouse',
    grandparent: 'Your grandparent',
    grandchild: 'Your grandchild',
    aunt: 'Your aunt',
    uncle: 'Your uncle',
    aunt_uncle: 'Your aunt/uncle',
    cousin: 'Your cousin',
    niece: 'Your niece',
    nephew: 'Your nephew',
    niece_nephew: 'Your niece/nephew',
  };

  return labels[relType] || `Your ${relType.replace(/_/g, ' ')}`;
}

/**
 * Try to determine who added/invited a profile to the tree
 */
async function getProfileCreator(
  profileId: string,
  currentUserId: string
): Promise<{ id: string; firstName: string; lastName: string } | null> {
  const supabase = getSupabaseAdmin();

  // Check if they were invited via pending_relatives
  const { data: pendingRecord } = await supabase
    .from('pending_relatives')
    .select('invited_by')
    .eq('id', profileId)
    .limit(1)
    .maybeSingle();

  if (pendingRecord?.invited_by) {
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', pendingRecord.invited_by)
      .single();

    if (inviterProfile) {
      return {
        id: inviterProfile.id,
        firstName: inviterProfile.first_name,
        lastName: inviterProfile.last_name,
      };
    }
  }

  // Check relationships for created_by
  const { data: relationship } = await supabase
    .from('relationships')
    .select('created_by')
    .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`)
    .not('created_by', 'is', null)
    .limit(1)
    .maybeSingle();

  if (relationship?.created_by) {
    const { data: creatorProfile } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', relationship.created_by)
      .single();

    if (creatorProfile) {
      return {
        id: creatorProfile.id,
        firstName: creatorProfile.first_name,
        lastName: creatorProfile.last_name,
      };
    }
  }

  return null;
}

/**
 * Main function to check invite eligibility
 *
 * Checks in order:
 * 1. Self-invite (user trying to invite themselves)
 * 2. Pending invites (someone already invited this person)
 * 3. Existing family member (person already in the tree)
 * 4. Potential bridge (person exists but not connected)
 * 5. OK to invite (all clear)
 */
export async function checkInviteEligibility(
  email: string | null,
  phone: string | null,
  currentUserId: string
): Promise<InviteCheckResult> {
  // Normalize inputs
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  // 1. Self-invite check
  if (normalizedEmail) {
    const isSelfInvite = await checkSelfInvite(normalizedEmail, currentUserId);
    if (isSelfInvite) {
      return { status: 'SELF_INVITE' };
    }
  }

  // 2. Check pending invitations
  const pendingInvite = await checkPendingInvites(normalizedEmail, normalizedPhone);
  if (pendingInvite) {
    return {
      status: 'PENDING_INVITE',
      pendingInvite,
    };
  }

  // 3 & 4. Check existing members and potential bridges
  const existingCheck = await checkExistingMember(normalizedEmail, normalizedPhone, currentUserId);

  if (existingCheck) {
    if (existingCheck.isInFamily) {
      // Person is in the family tree
      return {
        status: 'EXISTING_MEMBER',
        existingMember: existingCheck.member,
      };
    } else {
      // Person exists but not connected - potential bridge
      return {
        status: 'POTENTIAL_BRIDGE',
        bridgeCandidate: { exists: true },
      };
    }
  }

  // 5. All clear - OK to invite
  return { status: 'OK_TO_INVITE' };
}

/**
 * Lightweight check for self-invite only (for quick validation)
 */
export async function isEmailSelfInvite(
  email: string,
  currentUserId: string
): Promise<boolean> {
  return checkSelfInvite(email, currentUserId);
}
