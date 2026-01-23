# Invite Delivery (SMS + Email)

This document describes the current invite delivery flow (SMS + email), consent requirements, rate limits, and logging.

## Flow Summary

1. User submits `AddRelativeForm`.
2. `POST /api/relatives` creates a `pending_relatives` record.
3. If contact info exists for a living person:
   - SMS is attempted first (requires explicit consent).
   - If SMS fails and email exists, email is sent as fallback.
4. `pending_relatives.invited_at` is set on successful delivery.

## Consent Rules

- **SMS consent is required** when phone is the only contact method.
- If both phone and email are provided, email can be used without SMS consent.

## Rate Limiting

- Server enforces per-inviter limits over a 24-hour window.
- Configured via `INVITES_MAX_PER_DAY` (default: 25).
- When the limit is reached, `POST /api/relatives` returns `429`.

## Environment Variables

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
INVITES_MAX_PER_DAY=25
```

## Audit Log Events

The following events are written to `audit_logs`:

- `invitation_sms_sent`
- `invitation_sms_failed`
- `invitation_email_sent`
- `invitation_email_failed`
- `invite_rate_limited`
- `invite_rate_limit_check_failed`

## Implementation Files

- `src/app/api/relatives/route.ts`
- `src/lib/invitations/sms.ts`
- `src/lib/invitations/email.ts`
- `src/components/relatives/AddRelativeForm.tsx`
