# Sprint 1: Smart Invite Guard - Implementation Spec

> **Sprint:** 1 (Critical Safety)
> **Priority:** P0 - Blocking other work
> **Estimated Effort:** 1-2 days
> **Created:** 2026-02-02

---

## Problem Statement

When User B tries to invite someone (e.g., `cousin@email.com`) who is already in the family tree (added by User A), there is no detection. This causes:
1. Confusion for the inviter
2. Duplicate invitation emails
3. Potential duplicate profiles
4. Poor user experience

---

## Solution: Smart Invite Guard

A pre-send validation system that checks email/phone against all relevant sources before allowing an invitation.

---

## Technical Implementation

### 1. New API Endpoint

**Path:** `POST /api/invitations/check`

**Request:**
```typescript
interface InviteCheckRequest {
  email?: string;
  phone?: string;
}
```

**Response:**
```typescript
interface InviteCheckResult {
  status: 'OK_TO_INVITE' | 'EXISTING_MEMBER' | 'PENDING_INVITE' | 'POTENTIAL_BRIDGE' | 'SELF_INVITE';

  // If EXISTING_MEMBER
  existingMember?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    addedBy: {
      id: string;
      firstName: string;
      lastName: string;
    };
    addedAt: string;
    relationshipPath?: string; // "Your cousin through Aunt Maria"
  };

  // If PENDING_INVITE
  pendingInvite?: {
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
  };

  // If POTENTIAL_BRIDGE
  bridgeCandidate?: {
    exists: boolean;
    // No PII revealed - just indicates someone exists
  };
}
```

### 2. Database Queries Required

```typescript
// lib/invitations/invite-guard.ts

export async function checkInviteEligibility(
  email: string | null,
  phone: string | null,
  currentUserId: string
): Promise<InviteCheckResult> {
  const supabase = getSupabaseAdmin();

  // 1. Self-invite check
  if (email) {
    const { data: currentUser } = await supabase.auth.admin.getUserById(currentUserId);
    if (currentUser?.user?.email?.toLowerCase() === email.toLowerCase()) {
      return { status: 'SELF_INVITE' };
    }
  }

  // 2. Check pending_relatives (same family tree)
  if (email || phone) {
    const query = supabase
      .from('pending_relatives')
      .select(`
        id, first_name, last_name, status, created_at,
        inviter:invited_by(id, first_name, last_name)
      `)
      .eq('status', 'pending');

    if (email) query.eq('email', email.toLowerCase());
    if (phone) query.eq('phone', normalizePhone(phone));

    const { data: pendingInvite } = await query.limit(1).single();

    if (pendingInvite) {
      return {
        status: 'PENDING_INVITE',
        pendingInvite: {
          id: pendingInvite.id,
          firstName: pendingInvite.first_name,
          lastName: pendingInvite.last_name,
          invitedBy: pendingInvite.inviter,
          invitedAt: pendingInvite.created_at,
          status: pendingInvite.status,
        }
      };
    }
  }

  // 3. Check user_profiles (registered users in family)
  // This requires checking if user is in same family tree
  if (email) {
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select(`
        id, first_name, last_name, avatar_url, created_at,
        user:id(email)
      `)
      .eq('user.email', email.toLowerCase())
      .limit(1)
      .single();

    if (existingUser) {
      // Check if in same family tree
      const isInFamily = await checkFamilyConnection(currentUserId, existingUser.id);

      if (isInFamily) {
        return {
          status: 'EXISTING_MEMBER',
          existingMember: {
            id: existingUser.id,
            firstName: existingUser.first_name,
            lastName: existingUser.last_name,
            avatarUrl: existingUser.avatar_url,
            addedBy: await getProfileCreator(existingUser.id),
            addedAt: existingUser.created_at,
            relationshipPath: await getRelationshipDescription(currentUserId, existingUser.id),
          }
        };
      } else {
        // User exists but not connected - potential bridge
        return {
          status: 'POTENTIAL_BRIDGE',
          bridgeCandidate: { exists: true }
        };
      }
    }
  }

  // 4. Check by phone in user_profiles
  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    const { data: existingByPhone } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url, created_at')
      .eq('phone', normalizedPhone)
      .limit(1)
      .single();

    if (existingByPhone) {
      const isInFamily = await checkFamilyConnection(currentUserId, existingByPhone.id);

      if (isInFamily) {
        return {
          status: 'EXISTING_MEMBER',
          existingMember: {
            id: existingByPhone.id,
            firstName: existingByPhone.first_name,
            lastName: existingByPhone.last_name,
            avatarUrl: existingByPhone.avatar_url,
            addedBy: await getProfileCreator(existingByPhone.id),
            addedAt: existingByPhone.created_at,
            relationshipPath: await getRelationshipDescription(currentUserId, existingByPhone.id),
          }
        };
      } else {
        return {
          status: 'POTENTIAL_BRIDGE',
          bridgeCandidate: { exists: true }
        };
      }
    }
  }

  // 5. All clear - OK to invite
  return { status: 'OK_TO_INVITE' };
}
```

### 3. Frontend Integration

**File:** `src/components/relatives/AddRelativeForm.tsx`

Add real-time validation when email/phone is entered:

```typescript
const [inviteCheck, setInviteCheck] = useState<InviteCheckResult | null>(null);
const [isChecking, setIsChecking] = useState(false);

// Debounced check when email/phone changes
useEffect(() => {
  const checkEligibility = async () => {
    if (!email && !phone) {
      setInviteCheck(null);
      return;
    }

    setIsChecking(true);
    try {
      const res = await fetch('/api/invitations/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      setInviteCheck(data);
    } finally {
      setIsChecking(false);
    }
  };

  const timeout = setTimeout(checkEligibility, 500); // Debounce 500ms
  return () => clearTimeout(timeout);
}, [email, phone]);
```

### 4. UI Components for Each Status

#### EXISTING_MEMBER State
```tsx
<Alert variant="info" className="mt-4">
  <UserCheck className="h-4 w-4" />
  <AlertTitle>Good news!</AlertTitle>
  <AlertDescription>
    <div className="flex items-center gap-3 mt-2">
      <Avatar src={existingMember.avatarUrl} />
      <div>
        <p className="font-medium">{existingMember.firstName} {existingMember.lastName}</p>
        <p className="text-sm text-muted-foreground">
          Added by {existingMember.addedBy.firstName} on {formatDate(existingMember.addedAt)}
        </p>
        {existingMember.relationshipPath && (
          <p className="text-sm">{existingMember.relationshipPath}</p>
        )}
      </div>
    </div>
    <div className="flex gap-2 mt-3">
      <Button variant="outline" asChild>
        <Link href={`/profile/${existingMember.id}`}>View Profile</Link>
      </Button>
      <Button variant="outline">
        See How You're Related
      </Button>
    </div>
  </AlertDescription>
</Alert>
```

#### PENDING_INVITE State
```tsx
<Alert variant="warning" className="mt-4">
  <Clock className="h-4 w-4" />
  <AlertTitle>Pending Invitation</AlertTitle>
  <AlertDescription>
    <p>
      {pendingInvite.firstName} was already invited by {pendingInvite.invitedBy.firstName}
      on {formatDate(pendingInvite.invitedAt)}.
    </p>
    <div className="flex gap-2 mt-3">
      <Button variant="outline" onClick={handleSendReminder}>
        Send Reminder
      </Button>
      <Button variant="ghost" onClick={() => setInviteCheck(null)}>
        Cancel
      </Button>
    </div>
  </AlertDescription>
</Alert>
```

#### POTENTIAL_BRIDGE State
```tsx
<Alert variant="info" className="mt-4">
  <Users className="h-4 w-4" />
  <AlertTitle>Someone with this email exists</AlertTitle>
  <AlertDescription>
    <p>
      A Gene-Tree user with this email exists but isn't connected to your family tree yet.
      Would you like to send a connection request?
    </p>
    <div className="flex gap-2 mt-3">
      <Button variant="default" onClick={handleSendBridgeRequest}>
        Send Connection Request
      </Button>
      <Button variant="ghost" onClick={() => setInviteCheck(null)}>
        Cancel
      </Button>
    </div>
  </AlertDescription>
</Alert>
```

#### SELF_INVITE State
```tsx
<Alert variant="error" className="mt-4">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Cannot invite yourself</AlertTitle>
  <AlertDescription>
    <p>This is your own email address. Looking for someone with a similar email?</p>
    <Button variant="link" className="p-0 h-auto mt-1">
      Contact Support
    </Button>
  </AlertDescription>
</Alert>
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/invitations/invite-guard.ts` | CREATE | Core guard logic |
| `src/app/api/invitations/check/route.ts` | CREATE | API endpoint |
| `src/components/relatives/AddRelativeForm.tsx` | MODIFY | Add guard integration |
| `src/components/relatives/InviteGuardAlert.tsx` | CREATE | Alert components |
| `supabase/migrations/00XX_invite_guard_indexes.sql` | CREATE | Performance indexes |

---

## Migration: Performance Indexes

```sql
-- Migration: 00XX_invite_guard_indexes.sql

-- Ensure email lookup is fast on auth.users (Supabase handles this)
-- Add index for phone lookups on user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
ON user_profiles(phone)
WHERE phone IS NOT NULL;

-- Composite index for pending invite checks
CREATE INDEX IF NOT EXISTS idx_pending_relatives_email_status
ON pending_relatives(email, status)
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pending_relatives_phone_status
ON pending_relatives(phone, status)
WHERE phone IS NOT NULL;
```

---

## Testing Requirements

### Unit Tests
- [ ] `checkInviteEligibility` returns correct status for each scenario
- [ ] Phone normalization handles various formats
- [ ] Email comparison is case-insensitive

### Integration Tests
- [ ] API endpoint returns correct responses
- [ ] Rate limiting works correctly
- [ ] Audit logging captures all checks

### E2E Tests
- [ ] User sees "existing member" alert for family member
- [ ] User sees "pending invite" alert with reminder option
- [ ] User sees "bridge request" option for external users
- [ ] User cannot proceed with self-invite

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Duplicate invite prevention rate | >95% |
| False positive rate | <1% |
| API response time | <200ms |
| User satisfaction (reduced confusion) | Qualitative |

---

## Related Features

- **Sprint 1.2:** Pending Invite Detection (uses same check)
- **Sprint 1.3:** Self-Invite Prevention (implemented here)
- **Sprint 4:** Family Bridge Requests (extends POTENTIAL_BRIDGE flow)
