/**
 * API Route Tests for Smart Invite Guard
 *
 * Tests POST /api/invitations/check endpoint
 * Validates authentication, input validation, and response formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies - must be hoisted before imports
vi.mock('@/lib/supabase/server-ssr', () => ({
  getSupabaseSSR: vi.fn(),
}));

vi.mock('@/lib/audit/logger', () => ({
  logAudit: vi.fn(),
  extractRequestMeta: vi.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
  })),
}));

vi.mock('@/lib/invitations/invite-guard', () => ({
  checkInviteEligibility: vi.fn(),
}));

// Import after mocks
import { POST } from '@/app/api/invitations/check/route';

// Get mock references
const { getSupabaseSSR } = await import('@/lib/supabase/server-ssr');
const { logAudit, extractRequestMeta } = await import('@/lib/audit/logger');
const { checkInviteEligibility } = await import('@/lib/invitations/invite-guard');

const mockGetSupabaseSSR = getSupabaseSSR as unknown as ReturnType<typeof vi.fn>;
const mockLogAudit = logAudit as unknown as ReturnType<typeof vi.fn>;
const mockExtractRequestMeta = extractRequestMeta as unknown as ReturnType<typeof vi.fn>;
const mockCheckInviteEligibility = checkInviteEligibility as unknown as ReturnType<typeof vi.fn>;

// Helper to create mock request
function createMockRequest(body: any): Request {
  return new Request('http://localhost:3000/api/invitations/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/invitations/check - Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 for unauthenticated request', async () => {
    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    });

    const request = createMockRequest({ email: 'test@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'invite_check_unauthorized',
        responseStatus: 401,
      })
    );
  });

  it('should return 401 when user is null', async () => {
    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const request = createMockRequest({ email: 'test@example.com' });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should proceed with authenticated user', async () => {
    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user_123', email: 'current@example.com' } },
          error: null,
        }),
      },
    });

    mockCheckInviteEligibility.mockResolvedValue({
      status: 'OK_TO_INVITE',
    });

    const request = createMockRequest({ email: 'test@example.com' });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});

describe('POST /api/invitations/check - Input Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user_123', email: 'current@example.com' } },
          error: null,
        }),
      },
    });
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new Request('http://localhost:3000/api/invitations/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid JSON body');
  });

  it('should return 400 when both email and phone are missing', async () => {
    const request = createMockRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email or phone is required');
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'invite_check_validation_failed',
        errorMessage: 'Email or phone is required',
      })
    );
  });

  it('should return 400 for invalid email format', async () => {
    const request = createMockRequest({ email: 'not-an-email' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email format');
  });

  it('should return 400 for invalid email formats', async () => {
    const invalidEmails = [
      'missing-at-sign.com',
      '@no-local-part.com',
      'no-domain@',
      'spaces in@email.com',
      'double@@domain.com',
    ];

    for (const email of invalidEmails) {
      const request = createMockRequest({ email });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    }
  });

  it('should return 400 for invalid phone format', async () => {
    const request = createMockRequest({ phone: '123' }); // Too short
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid phone format');
  });

  it('should return 400 for phone too short', async () => {
    const request = createMockRequest({ phone: '123456' }); // Less than 7 digits
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 400 for phone too long', async () => {
    const request = createMockRequest({ phone: '1234567890123456' }); // More than 15 digits
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should accept valid email format', async () => {
    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({ email: 'valid@example.com' });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should accept valid phone format', async () => {
    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({ phone: '+1 (202) 555-1234' });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should accept both email and phone', async () => {
    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({
      email: 'test@example.com',
      phone: '+1 (202) 555-1234',
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});

describe('POST /api/invitations/check - Response Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user_123', email: 'current@example.com' } },
          error: null,
        }),
      },
    });
  });

  it('should return OK_TO_INVITE status', async () => {
    mockCheckInviteEligibility.mockResolvedValue({
      status: 'OK_TO_INVITE',
    });

    const request = createMockRequest({ email: 'new@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('OK_TO_INVITE');
    expect(data.existingMember).toBeUndefined();
    expect(data.pendingInvite).toBeUndefined();
    expect(data.bridgeCandidate).toBeUndefined();
  });

  it('should return SELF_INVITE status', async () => {
    mockCheckInviteEligibility.mockResolvedValue({
      status: 'SELF_INVITE',
    });

    const request = createMockRequest({ email: 'current@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('SELF_INVITE');
  });

  it('should return EXISTING_MEMBER with details', async () => {
    const existingMemberData = {
      status: 'EXISTING_MEMBER',
      existingMember: {
        id: 'member_123',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        addedBy: {
          id: 'adder_456',
          firstName: 'Jane',
          lastName: 'Smith',
        },
        addedAt: '2024-06-01T00:00:00Z',
        relationshipPath: 'Your sibling',
      },
    };

    mockCheckInviteEligibility.mockResolvedValue(existingMemberData);

    const request = createMockRequest({ email: 'existing@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('EXISTING_MEMBER');
    expect(data.existingMember).toBeDefined();
    expect(data.existingMember.firstName).toBe('John');
    expect(data.existingMember.relationshipPath).toBe('Your sibling');
  });

  it('should return PENDING_INVITE with details', async () => {
    const pendingInviteData = {
      status: 'PENDING_INVITE',
      pendingInvite: {
        id: 'invite_123',
        firstName: 'Pending',
        lastName: 'User',
        invitedBy: {
          id: 'inviter_789',
          firstName: 'Inviter',
          lastName: 'Person',
        },
        invitedAt: '2025-01-15T00:00:00Z',
        status: 'pending',
      },
    };

    mockCheckInviteEligibility.mockResolvedValue(pendingInviteData);

    const request = createMockRequest({ email: 'pending@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('PENDING_INVITE');
    expect(data.pendingInvite).toBeDefined();
    expect(data.pendingInvite.firstName).toBe('Pending');
  });

  it('should return POTENTIAL_BRIDGE status', async () => {
    const bridgeData = {
      status: 'POTENTIAL_BRIDGE',
      bridgeCandidate: {
        exists: true,
      },
    };

    mockCheckInviteEligibility.mockResolvedValue(bridgeData);

    const request = createMockRequest({ email: 'bridge@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('POTENTIAL_BRIDGE');
    expect(data.bridgeCandidate).toBeDefined();
    expect(data.bridgeCandidate.exists).toBe(true);
  });
});

describe('POST /api/invitations/check - Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user_123', email: 'current@example.com' } },
          error: null,
        }),
      },
    });
  });

  it('should log successful check with masked PII', async () => {
    mockCheckInviteEligibility.mockResolvedValue({
      status: 'OK_TO_INVITE',
    });

    const request = createMockRequest({
      email: 'test@example.com',
      phone: '+1 (202) 555-1234',
    });

    await POST(request);

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'invite_check_completed',
        method: 'POST',
        path: '/api/invitations/check',
        requestBody: {
          email: '***@***',
          phone: '***',
        },
        responseStatus: 200,
        responseBody: {
          status: 'OK_TO_INVITE',
          hasExistingMember: false,
          hasPendingInvite: false,
          hasBridgeCandidate: false,
        },
      })
    );
  });

  it('should log with existing member flag', async () => {
    mockCheckInviteEligibility.mockResolvedValue({
      status: 'EXISTING_MEMBER',
      existingMember: {
        id: 'member_123',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: null,
        addedBy: null,
        addedAt: '2024-01-01',
        relationshipPath: null,
      },
    });

    const request = createMockRequest({ email: 'existing@example.com' });
    await POST(request);

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        responseBody: expect.objectContaining({
          hasExistingMember: true,
        }),
      })
    );
  });

  it('should mask email in logs', async () => {
    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({ email: 'sensitive@example.com' });
    await POST(request);

    const auditCall = mockLogAudit.mock.calls[0][0];
    expect(auditCall.requestBody.email).toBe('***@***');
    expect(auditCall.requestBody.email).not.toContain('sensitive');
  });

  it('should mask phone in logs', async () => {
    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({ phone: '+1 (202) 555-9999' });
    await POST(request);

    const auditCall = mockLogAudit.mock.calls[0][0];
    expect(auditCall.requestBody.phone).toBe('***');
    expect(auditCall.requestBody.phone).not.toContain('202');
  });
});

describe('POST /api/invitations/check - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user_123', email: 'current@example.com' } },
          error: null,
        }),
      },
    });
  });

  it('should return 500 on internal error', async () => {
    mockCheckInviteEligibility.mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest({ email: 'test@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should log exceptions with stack trace', async () => {
    const testError = new Error('Test exception');
    testError.stack = 'Error: Test exception\n  at test.ts:123';

    mockCheckInviteEligibility.mockRejectedValue(testError);

    const request = createMockRequest({ email: 'test@example.com' });
    await POST(request);

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'invite_check_exception',
        responseStatus: 500,
        errorMessage: 'Test exception',
        errorStack: expect.stringContaining('Error: Test exception'),
      })
    );
  });

  it('should handle unknown error types', async () => {
    mockCheckInviteEligibility.mockRejectedValue('String error');

    const request = createMockRequest({ email: 'test@example.com' });
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'Unknown error',
      })
    );
  });

  it('should mask PII in error logs', async () => {
    mockCheckInviteEligibility.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      email: 'sensitive@example.com',
      phone: '+1 (555) 999-8888',
    });

    await POST(request);

    const errorLog = mockLogAudit.mock.calls.find(
      (call) => call[0].action === 'invite_check_exception'
    );

    expect(errorLog).toBeDefined();
    expect(errorLog![0].requestBody.email).toBe('***');
    expect(errorLog![0].requestBody.phone).toBe('***');
  });
});

describe('POST /api/invitations/check - Integration Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user_123', email: 'current@example.com' } },
          error: null,
        }),
      },
    });
  });

  it('should handle email-only check', async () => {
    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({ email: 'test@example.com' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockCheckInviteEligibility).toHaveBeenCalledWith(
      'test@example.com',
      null,
      'user_123'
    );
  });

  it('should handle phone-only check', async () => {
    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({ phone: '+1 (202) 555-1234' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockCheckInviteEligibility).toHaveBeenCalledWith(
      null,
      '+1 (202) 555-1234',
      'user_123'
    );
  });

  it('should handle combined email and phone check', async () => {
    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({
      email: 'test@example.com',
      phone: '+1 (202) 555-1234',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockCheckInviteEligibility).toHaveBeenCalledWith(
      'test@example.com',
      '+1 (202) 555-1234',
      'user_123'
    );
  });

  it('should pass correct user ID from session', async () => {
    mockGetSupabaseSSR.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'specific_user_789', email: 'user@example.com' } },
          error: null,
        }),
      },
    });

    mockCheckInviteEligibility.mockResolvedValue({ status: 'OK_TO_INVITE' });

    const request = createMockRequest({ email: 'test@example.com' });
    await POST(request);

    expect(mockCheckInviteEligibility).toHaveBeenCalledWith(
      'test@example.com',
      null,
      'specific_user_789'
    );
  });
});
