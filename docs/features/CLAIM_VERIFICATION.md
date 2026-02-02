# Claim Verification Flow

> **Feature ID:** Sprint2-A
> **Status:** ✅ Complete
> **Added:** February 2, 2026

## Overview

The Claim Verification Flow allows invited users to review their invitation details before accepting, make corrections if needed, and dispute invitations that don't belong to them. This builds trust and ensures data accuracy in the family tree.

## User Flow

```
                    ┌─────────────────┐
                    │  Invitation     │
                    │  Email Received │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Click Link     │
                    │  /invite/[token]│
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │    Claim Verification Page    │
              │                              │
              │  "John Doe invited you as    │
              │   their Cousin"              │
              │                              │
              │  Name: Jane Smith            │
              │  Birthdate: Jan 1, 1990      │
              │  Email: jane@example.com     │
              │                              │
              │  [Confirm & Accept]          │
              │  [Edit Information]          │
              │  [This isn't me]             │
              └──────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌────────────┐   ┌────────────┐   ┌────────────┐
    │   Accept   │   │    Edit    │   │  Dispute   │
    │            │   │            │   │            │
    │ • Verify   │   │ • Show form│   │ • Enter    │
    │   claim    │   │ • Save     │   │   reason   │
    │ • Notify   │   │   changes  │   │ • Reject   │
    │   inviter  │   │ • Then     │   │   invite   │
    │ • Redirect │   │   accept   │   │ • Notify   │
    │   to auth  │   │            │   │   inviter  │
    └────────────┘   └────────────┘   └────────────┘
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Invite Page                           │
│              /[locale]/invite/[token]                   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │            ClaimVerificationForm                  │ │
│  │                                                   │ │
│  │  mode: 'view' | 'edit' | 'dispute'               │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │ Invitation Details (read-only or editable) │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │ Action Buttons                              │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │ /api/invitations/        │
              │     verify-claim         │
              │                          │
              │ action: 'accept'|        │
              │         'dispute'        │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │    pending_relatives     │
              │    (status update)       │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │    notifications         │
              │    (to inviter)          │
              └──────────────────────────┘
```

## Files

### Page

**`src/app/[locale]/invite/[token]/page.tsx`**

Server component that:
- Fetches invitation by token
- Validates token exists and is pending
- Renders ClaimVerificationForm or error state

### Component

**`src/components/invite/ClaimVerificationForm.tsx`**

Client component with three modes:
- **view** - Display invitation details with action buttons
- **edit** - Editable form for corrections
- **dispute** - Form to enter dispute reason

### API

**`src/app/api/invitations/verify-claim/route.ts`**

Handles two actions:
- `accept` - Marks invitation as accepted, notifies inviter
- `dispute` - Marks invitation as rejected, notifies inviter with reason

### Types

**`src/types/notifications.ts`** (updated)

Added notification types:
- `INVITATION_ACCEPTED`
- `CLAIM_DISPUTED`

## API Endpoint

### `POST /api/invitations/verify-claim`

**Request (Accept):**
```json
{
  "invitationId": "uuid",
  "action": "accept",
  "corrections": {
    "first_name": "Jane",
    "last_name": "Smith",
    "birth_date": "1990-01-15"
  }
}
```

**Request (Dispute):**
```json
{
  "invitationId": "uuid",
  "action": "dispute",
  "reason": "I don't know this person"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Invitation accepted",
  "redirectUrl": "/auth/magic-link?email=jane@example.com"
}
```

**Response (Error):**
```json
{
  "error": "Invitation not found or already processed"
}
```

## Component Props

### ClaimVerificationForm

```typescript
interface ClaimVerificationFormProps {
  invitation: {
    id: string;
    email: string;
    phone?: string;
    first_name: string;
    last_name: string;
    birth_date?: string;
    relationship_type: string;
    inviter: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
  locale: string;
}
```

## Notification Payloads

### INVITATION_ACCEPTED

```typescript
interface InvitationAcceptedPayload {
  invitationId: string;
  acceptedByName: string;
  relationshipType: string;
  corrections?: {
    first_name?: string;
    last_name?: string;
    birth_date?: string;
  };
}
```

### CLAIM_DISPUTED

```typescript
interface ClaimDisputedPayload {
  invitationId: string;
  originalName: string;
  relationshipType: string;
  reason?: string;
}
```

## Localization

**English:**
```typescript
const translations = {
  en: {
    title: 'Family Invitation',
    invitedAs: '{inviter} invited you as their {relationship}',
    yourInfo: 'Your Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    birthDate: 'Date of Birth',
    email: 'Email',
    phone: 'Phone',
    confirmAccept: 'Confirm & Accept',
    editInfo: 'Edit Information',
    notMe: "This isn't me",
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    disputeTitle: 'Report Incorrect Invitation',
    disputeReason: 'Please explain why this invitation is incorrect',
    disputeReasonPlaceholder: "I don't know this person...",
    submitDispute: 'Submit',
    processing: 'Processing...',
  },
};
```

**Russian:**
```typescript
const translations = {
  ru: {
    title: 'Семейное приглашение',
    invitedAs: '{inviter} пригласил(а) вас как {relationship}',
    yourInfo: 'Ваша информация',
    firstName: 'Имя',
    lastName: 'Фамилия',
    birthDate: 'Дата рождения',
    email: 'Email',
    phone: 'Телефон',
    confirmAccept: 'Подтвердить и принять',
    editInfo: 'Редактировать информацию',
    notMe: 'Это не я',
    saveChanges: 'Сохранить изменения',
    cancel: 'Отмена',
    disputeTitle: 'Сообщить об ошибке',
    disputeReason: 'Пожалуйста, объясните, почему это приглашение ошибочно',
    disputeReasonPlaceholder: 'Я не знаю этого человека...',
    submitDispute: 'Отправить',
    processing: 'Обработка...',
  },
};
```

## Security Considerations

1. **Token Validation** - Only valid, pending tokens can access the form
2. **One-time Use** - Token becomes invalid after accept/dispute
3. **Rate Limiting** - Consider limiting dispute submissions
4. **Audit Logging** - All actions logged for review
5. **No PII in URLs** - Token is opaque, no personal data exposed

## Audit Logging

All verification actions are logged:

```typescript
await logAudit({
  action: 'claim_verification',
  resourceType: 'pending_relative',
  resourceId: invitationId,
  details: {
    action: 'accept' | 'dispute',
    corrections: corrections,
    reason: reason,
  },
});
```

## Error States

### Invalid Token

```
┌─────────────────────────────────────┐
│  ⚠️  Invitation Not Found           │
│                                     │
│  This invitation link is invalid    │
│  or has expired.                    │
│                                     │
│  [Return Home]                      │
└─────────────────────────────────────┘
```

### Already Processed

```
┌─────────────────────────────────────┐
│  ℹ️  Already Processed              │
│                                     │
│  This invitation has already been   │
│  accepted or declined.              │
│                                     │
│  [Return Home]                      │
└─────────────────────────────────────┘
```

## Testing

### Manual Testing Checklist

- [ ] Valid token shows invitation details
- [ ] Invalid token shows error page
- [ ] Expired token shows error page
- [ ] Accept redirects to magic link page
- [ ] Accept with corrections saves changes
- [ ] Accept notifies inviter
- [ ] Edit mode allows changing name/birthdate
- [ ] Dispute shows reason input
- [ ] Dispute notifies inviter with reason
- [ ] Dispute redirects to home page

### E2E Tests

```typescript
// tests/e2e/claim-verification.spec.ts
test('user can accept invitation', async ({ page }) => {
  const token = await createTestInvitation();
  await page.goto(`/en/invite/${token}`);
  await page.click('text=Confirm & Accept');
  await expect(page).toHaveURL(/auth\/magic-link/);
});

test('user can dispute invitation', async ({ page }) => {
  const token = await createTestInvitation();
  await page.goto(`/en/invite/${token}`);
  await page.click("text=This isn't me");
  await page.fill('textarea', 'Wrong person');
  await page.click('text=Submit');
  await expect(page).toHaveURL('/');
});
```

## Future Improvements

1. **Identity verification** - Additional verification steps for sensitive data
2. **Photo comparison** - If inviter added a photo, show for confirmation
3. **Relationship quiz** - Ask questions only the real person would know
4. **Inviter approval** - Require inviter to confirm corrections
5. **Dispute investigation** - Admin workflow for reviewing disputes
