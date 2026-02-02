/**
 * Unit Tests for Smart Invite Guard
 *
 * Tests core logic in src/lib/invitations/invite-guard.ts
 * Covers all 5 status outcomes: OK_TO_INVITE, SELF_INVITE, EXISTING_MEMBER,
 * PENDING_INVITE, POTENTIAL_BRIDGE
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkInviteEligibility,
  normalizePhone,
  isEmailSelfInvite,
  type InviteCheckResult,
} from '@/lib/invitations/invite-guard';

// Mock Supabase admin client
const mockSupabaseAdmin = {
  auth: {
    admin: {
      getUserById: vi.fn(),
      listUsers: vi.fn(),
    },
  },
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/server-admin', () => ({
  getSupabaseAdmin: () => mockSupabaseAdmin,
}));

describe('normalizePhone', () => {
  it('should strip all non-digit characters except leading +', () => {
    expect(normalizePhone('+1 (202) 555-1234')).toBe('+12025551234');
    expect(normalizePhone('202-555-1234')).toBe('2025551234');
    expect(normalizePhone('+7 999 123 45 67')).toBe('+79991234567');
  });

  it('should handle already normalized phones', () => {
    expect(normalizePhone('+12025551234')).toBe('+12025551234');
    expect(normalizePhone('2025551234')).toBe('2025551234');
  });

  it('should handle empty string', () => {
    expect(normalizePhone('')).toBe('');
  });
});

describe('checkInviteEligibility - OK_TO_INVITE', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock: User doesn't exist anywhere
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'current@example.com' } },
    });

    mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
      data: { users: [] },
    });

    mockSupabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      or: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
    });

    mockSupabaseAdmin.rpc.mockResolvedValue({ data: false });
  });

  it('should return OK_TO_INVITE for new email', async () => {
    const result = await checkInviteEligibility(
      'newuser@example.com',
      null,
      'user_123'
    );

    expect(result.status).toBe('OK_TO_INVITE');
    expect(result.existingMember).toBeUndefined();
    expect(result.pendingInvite).toBeUndefined();
    expect(result.bridgeCandidate).toBeUndefined();
  });

  it('should return OK_TO_INVITE for new phone', async () => {
    const result = await checkInviteEligibility(
      null,
      '+1 (202) 555-9999',
      'user_123'
    );

    expect(result.status).toBe('OK_TO_INVITE');
  });

  it('should return OK_TO_INVITE for both email and phone', async () => {
    const result = await checkInviteEligibility(
      'newuser@example.com',
      '+1 (202) 555-9999',
      'user_123'
    );

    expect(result.status).toBe('OK_TO_INVITE');
  });

  it('should normalize email to lowercase', async () => {
    const result = await checkInviteEligibility(
      'NewUser@Example.COM',
      null,
      'user_123'
    );

    expect(result.status).toBe('OK_TO_INVITE');
    // Verify email was normalized in the mock calls
    expect(mockSupabaseAdmin.auth.admin.listUsers).toHaveBeenCalled();
  });
});

describe('checkInviteEligibility - SELF_INVITE', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock: Current user's email matches
    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'current@example.com' } },
    });
  });

  it('should detect self-invite by email', async () => {
    const result = await checkInviteEligibility(
      'current@example.com',
      null,
      'user_123'
    );

    expect(result.status).toBe('SELF_INVITE');
    expect(result.existingMember).toBeUndefined();
    expect(result.pendingInvite).toBeUndefined();
  });

  it('should detect self-invite with case-insensitive email', async () => {
    const result = await checkInviteEligibility(
      'CURRENT@EXAMPLE.COM',
      null,
      'user_123'
    );

    expect(result.status).toBe('SELF_INVITE');
  });

  it('should prioritize self-invite check over other checks', async () => {
    // Even if there's a pending invite, self-invite should be detected first
    mockSupabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'pending_123',
          first_name: 'John',
          last_name: 'Doe',
          status: 'pending',
          invited_by: 'other_user',
          created_at: new Date().toISOString(),
          invited_at: new Date().toISOString(),
        },
      }),
      single: vi.fn().mockReturnThis(),
    });

    const result = await checkInviteEligibility(
      'current@example.com',
      '+1234567890',
      'user_123'
    );

    expect(result.status).toBe('SELF_INVITE');
  });
});

describe('checkInviteEligibility - PENDING_INVITE', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'current@example.com' } },
    });

    // Mock: Pending invite exists
    const pendingInviteData = {
      id: 'pending_123',
      first_name: 'Jane',
      last_name: 'Smith',
      status: 'pending',
      invited_by: 'inviter_456',
      created_at: new Date('2025-01-15').toISOString(),
      invited_at: new Date('2025-01-15').toISOString(),
    };

    const inviterProfileData = {
      id: 'inviter_456',
      first_name: 'John',
      last_name: 'Doe',
    };

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'pending_relatives') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: pendingInviteData }),
        };
      }
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: inviterProfileData }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        single: vi.fn().mockResolvedValue({ data: null }),
      };
    });
  });

  it('should detect pending invite by email', async () => {
    const result = await checkInviteEligibility(
      'pending@example.com',
      null,
      'user_123'
    );

    expect(result.status).toBe('PENDING_INVITE');
    expect(result.pendingInvite).toBeDefined();
    expect(result.pendingInvite?.firstName).toBe('Jane');
    expect(result.pendingInvite?.lastName).toBe('Smith');
    expect(result.pendingInvite?.invitedBy.firstName).toBe('John');
    expect(result.pendingInvite?.invitedBy.lastName).toBe('Doe');
  });

  it('should detect pending invite by phone', async () => {
    const result = await checkInviteEligibility(
      null,
      '+1 (202) 555-1234',
      'user_123'
    );

    expect(result.status).toBe('PENDING_INVITE');
    expect(result.pendingInvite).toBeDefined();
  });

  it('should format invitation date correctly', async () => {
    const result = await checkInviteEligibility(
      'pending@example.com',
      null,
      'user_123'
    );

    expect(result.pendingInvite?.invitedAt).toBeTruthy();
    expect(result.pendingInvite?.status).toBe('pending');
  });

  it('should handle expired invitations', async () => {
    const expiredInviteData = {
      id: 'pending_expired',
      first_name: 'Expired',
      last_name: 'User',
      status: 'expired',
      invited_by: 'inviter_456',
      created_at: new Date('2024-01-01').toISOString(),
      invited_at: new Date('2024-01-01').toISOString(),
    };

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'pending_relatives') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: expiredInviteData }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'inviter_456', first_name: 'John', last_name: 'Doe' },
        }),
      };
    });

    const result = await checkInviteEligibility(
      'expired@example.com',
      null,
      'user_123'
    );

    expect(result.status).toBe('PENDING_INVITE');
    expect(result.pendingInvite?.status).toBe('expired');
  });
});

describe('checkInviteEligibility - EXISTING_MEMBER', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'current@example.com' } },
    });

    mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
      data: {
        users: [
          { id: 'target_user_789', email: 'existing@example.com' },
        ],
      },
    });

    const existingProfileData = {
      id: 'target_user_789',
      first_name: 'Existing',
      last_name: 'Member',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: new Date('2024-06-01').toISOString(),
    };

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          single: vi.fn().mockResolvedValue({ data: existingProfileData }),
        };
      }
      if (table === 'pending_relatives') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      if (table === 'relationships') {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { relationship_type: 'sibling' },
          }),
          not: vi.fn().mockReturnThis(),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      };
    });

    // Mock: User is in family circle
    mockSupabaseAdmin.rpc.mockResolvedValue({ data: true });
  });

  it('should detect existing family member by email', async () => {
    const result = await checkInviteEligibility(
      'existing@example.com',
      null,
      'user_123'
    );

    expect(result.status).toBe('EXISTING_MEMBER');
    expect(result.existingMember).toBeDefined();
    expect(result.existingMember?.firstName).toBe('Existing');
    expect(result.existingMember?.lastName).toBe('Member');
    expect(result.existingMember?.avatarUrl).toBe('https://example.com/avatar.jpg');
  });

  it('should include relationship path if available', async () => {
    const result = await checkInviteEligibility(
      'existing@example.com',
      null,
      'user_123'
    );

    expect(result.existingMember?.relationshipPath).toBeDefined();
  });

  it('should use is_in_family_circle RPC call', async () => {
    await checkInviteEligibility(
      'existing@example.com',
      null,
      'user_123'
    );

    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('is_in_family_circle', {
      profile_id: 'target_user_789',
      user_id: 'user_123',
    });
  });

  it('should handle existing member found by phone', async () => {
    mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
      data: { users: [] },
    });

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'target_user_phone' },
          }),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'target_user_phone',
              first_name: 'Phone',
              last_name: 'User',
              avatar_url: null,
              created_at: new Date().toISOString(),
            },
          }),
        };
      }
      if (table === 'pending_relatives') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      if (table === 'relationships') {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          not: vi.fn().mockReturnThis(),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      };
    });

    mockSupabaseAdmin.rpc.mockResolvedValue({ data: true });

    const result = await checkInviteEligibility(
      null,
      '+1 (555) 123-4567',
      'user_123'
    );

    expect(result.status).toBe('EXISTING_MEMBER');
    expect(result.existingMember?.firstName).toBe('Phone');
  });
});

describe('checkInviteEligibility - POTENTIAL_BRIDGE', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'current@example.com' } },
    });

    mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
      data: {
        users: [
          { id: 'bridge_user_999', email: 'bridge@example.com' },
        ],
      },
    });

    const bridgeProfileData = {
      id: 'bridge_user_999',
      first_name: 'Bridge',
      last_name: 'Candidate',
      avatar_url: null,
      created_at: new Date().toISOString(),
    };

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: bridgeProfileData }),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      if (table === 'pending_relatives') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      };
    });

    // Mock: User exists but NOT in family circle
    mockSupabaseAdmin.rpc.mockResolvedValue({ data: false });
  });

  it('should detect potential bridge candidate', async () => {
    const result = await checkInviteEligibility(
      'bridge@example.com',
      null,
      'user_123'
    );

    expect(result.status).toBe('POTENTIAL_BRIDGE');
    expect(result.bridgeCandidate).toBeDefined();
    expect(result.bridgeCandidate?.exists).toBe(true);
  });

  it('should not reveal PII for bridge candidates', async () => {
    const result = await checkInviteEligibility(
      'bridge@example.com',
      null,
      'user_123'
    );

    // Should only return exists flag, no name or details
    expect(result.bridgeCandidate).toEqual({ exists: true });
    expect(result.existingMember).toBeUndefined();
  });

  it('should use is_in_family_circle to detect bridge', async () => {
    await checkInviteEligibility(
      'bridge@example.com',
      null,
      'user_123'
    );

    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('is_in_family_circle', {
      profile_id: 'bridge_user_999',
      user_id: 'user_123',
    });
  });
});

describe('isEmailSelfInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'current@example.com' } },
    });
  });

  it('should return true for self email', async () => {
    const result = await isEmailSelfInvite('current@example.com', 'user_123');
    expect(result).toBe(true);
  });

  it('should return false for different email', async () => {
    const result = await isEmailSelfInvite('other@example.com', 'user_123');
    expect(result).toBe(false);
  });

  it('should be case-insensitive', async () => {
    const result = await isEmailSelfInvite('CURRENT@EXAMPLE.COM', 'user_123');
    expect(result).toBe(true);
  });
});

describe('Edge cases and error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'current@example.com' } },
    });

    mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
      data: { users: [] },
    });

    mockSupabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      single: vi.fn().mockResolvedValue({ data: null }),
    });

    mockSupabaseAdmin.rpc.mockResolvedValue({ data: false });
  });

  it('should handle null email and phone gracefully', async () => {
    const result = await checkInviteEligibility(null, null, 'user_123');
    expect(result.status).toBe('OK_TO_INVITE');
  });

  it('should trim and normalize whitespace in email', async () => {
    const result = await checkInviteEligibility(
      '  spaced@example.com  ',
      null,
      'user_123'
    );
    expect(result.status).toBe('OK_TO_INVITE');
  });

  it('should handle database errors gracefully', async () => {
    mockSupabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
    });

    // Should not throw, should handle error and continue
    const result = await checkInviteEligibility('test@example.com', null, 'user_123');

    // Should return OK_TO_INVITE when checks fail with errors
    expect(result.status).toBe('OK_TO_INVITE');
  });

  it('should handle missing inviter profile data', async () => {
    const pendingInviteData = {
      id: 'pending_orphan',
      first_name: 'Orphan',
      last_name: 'Invite',
      status: 'pending',
      invited_by: 'missing_inviter',
      created_at: new Date().toISOString(),
      invited_at: new Date().toISOString(),
    };

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'pending_relatives') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: pendingInviteData }),
        };
      }
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }), // Missing inviter
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      };
    });

    const result = await checkInviteEligibility(
      'orphan@example.com',
      null,
      'user_123'
    );

    expect(result.status).toBe('PENDING_INVITE');
    expect(result.pendingInvite?.invitedBy.firstName).toBe('Unknown');
  });
});
