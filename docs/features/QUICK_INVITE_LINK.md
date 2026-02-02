# Quick Invite Link + QR Code Generation

> **Feature ID:** Sprint4-A1
> **Status:** Complete
> **Added:** February 2, 2026

## Overview

Quick Invite Links allow users to create shareable invitation links with QR codes for family events and reunions. Users can generate time-limited links, share them via multiple channels (WhatsApp, SMS, Email, native share), and approve signups from people who register through the links.

This feature is ideal for:
- Family reunions and gatherings
- Spreading tree invitations at events
- Mass onboarding of relatives
- Viral growth of family trees

## Architecture

```
+------------------------------------------------------------------+
|                         User Interface                            |
|                                                                   |
|  +-------------------------+    +-----------------------------+   |
|  |  Quick Invite Page      |    |     Join Page               |   |
|  |  /[locale]/quick-invite |    |     /join/[code]            |   |
|  |                         |    |                             |   |
|  |  +-------------------+  |    |  +-----------------------+  |   |
|  |  | QuickInviteLink   |  |    |  | QuickLinkSignupForm   |  |   |
|  |  | Generator         |  |    |  | (guest form)          |  |   |
|  |  +-------------------+  |    |  +-----------------------+  |   |
|  |  | MyQuickLinks      |  |    +-----------------------------+   |
|  |  | (list+manage)     |  |                                      |
|  |  +-------------------+  |                                      |
|  |  | QuickLinkApproval |  |                                      |
|  |  | List (pending)    |  |                                      |
|  |  +-------------------+  |                                      |
|  +-------------------------+                                      |
+------------------------------------------------------------------+
                |                              |
                v                              v
+------------------------------------------------------------------+
|                        API Layer                                  |
|                                                                   |
|   POST /api/quick-links        - Create new link                 |
|   GET  /api/quick-links        - List user's links               |
|   GET  /api/quick-links/[code] - Get link info (public)          |
|   PATCH /api/quick-links/[id]  - Update link (toggle active)     |
|   DELETE /api/quick-links/[id] - Delete link                     |
|   POST /api/quick-links/[code]/signup - Submit signup            |
|   GET  /api/quick-links/[id]/signups  - Get signups for link     |
|   PATCH /api/quick-links/signups/[id] - Approve/reject signup    |
+------------------------------------------------------------------+
                |
                v
+------------------------------------------------------------------+
|                      Database (Supabase)                          |
|                                                                   |
|   +------------------------+    +----------------------------+    |
|   | quick_invite_links     |    | quick_link_signups         |    |
|   |------------------------|    |----------------------------|    |
|   | id (UUID)              |    | id (UUID)                  |    |
|   | created_by (FK)        |    | link_id (FK)               |    |
|   | code (UNIQUE)          |    | email                      |    |
|   | expires_at             |    | first_name, last_name      |    |
|   | max_uses               |    | phone                      |    |
|   | current_uses           |    | claimed_relationship       |    |
|   | event_name             |    | status (pending/approved)  |    |
|   | is_active              |    | approved_by, approved_at   |    |
|   +------------------------+    +----------------------------+    |
+------------------------------------------------------------------+
```

## Database Schema

### `quick_invite_links` Table

```sql
CREATE TABLE IF NOT EXISTS public.quick_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link properties
  code TEXT UNIQUE NOT NULL, -- Short code like "ABC123"

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,

  -- Usage limits
  max_uses INTEGER DEFAULT 50,
  current_uses INTEGER DEFAULT 0,

  -- Optional event name
  event_name TEXT, -- "Smith Family Reunion 2026"

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `quick_link_signups` Table

```sql
CREATE TABLE IF NOT EXISTS public.quick_link_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.quick_invite_links(id) ON DELETE CASCADE,

  -- Signup info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  claimed_relationship TEXT, -- "I'm John's cousin"

  -- Approval status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- If approved, link to created profile
  created_profile_id UUID REFERENCES public.user_profiles(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate signups for same link
  CONSTRAINT unique_email_per_link UNIQUE (link_id, email)
);
```

### Database Functions

```sql
-- Generate a random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars
  result TEXT := '';
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to increment usage count (atomic)
CREATE OR REPLACE FUNCTION increment_quick_link_usage(link_code TEXT)
RETURNS BOOLEAN AS $$
-- Returns FALSE if link is expired, inactive, or at max uses
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies

```sql
-- Users can view their own links
CREATE POLICY "Users can view their own links" ON public.quick_invite_links
  FOR SELECT USING (created_by = auth.uid());

-- Anyone can view active link by code (for signup page)
CREATE POLICY "Anyone can view active link by code" ON public.quick_invite_links
  FOR SELECT USING (is_active = true AND expires_at > NOW());

-- Link creators can view signups
CREATE POLICY "Link creators can view signups" ON public.quick_link_signups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quick_invite_links
      WHERE id = quick_link_signups.link_id AND created_by = auth.uid()
    )
  );

-- Anyone can create signup for active link
CREATE POLICY "Anyone can create signup for active link" ON public.quick_link_signups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quick_invite_links
      WHERE id = quick_link_signups.link_id
        AND is_active = true AND expires_at > NOW()
        AND current_uses < max_uses
    )
  );
```

## Files

### Types

**`src/types/quick-invite.ts`**

```typescript
export type QuickLinkExpiration = '1h' | '6h' | '24h' | '7d';

export interface QuickInviteLink {
  id: string;
  created_by: string;
  code: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  event_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type QuickLinkSignupStatus = 'pending' | 'approved' | 'rejected';

export interface QuickLinkSignup {
  id: string;
  link_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  claimed_relationship: string | null;
  status: QuickLinkSignupStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

// Helper functions
export function isLinkValid(link: QuickInviteLink): boolean;
export function getTimeRemaining(expiresAt: string): { expired: boolean; days: number; hours: number; minutes: number };
export function getExpirationMs(expiration: QuickLinkExpiration): number;
```

### Components

| Component | Path | Description |
|-----------|------|-------------|
| `QuickInviteLinkGenerator` | `src/components/quick-invite/QuickInviteLinkGenerator.tsx` | Dialog to create new links with expiration and max uses |
| `QRCodeDisplay` | `src/components/quick-invite/QRCodeDisplay.tsx` | Renders QR code with download and print buttons |
| `ShareButtons` | `src/components/quick-invite/ShareButtons.tsx` | WhatsApp, SMS, Email, native share buttons |
| `MyQuickLinks` | `src/components/quick-invite/MyQuickLinks.tsx` | List and manage user's quick links |
| `QuickLinkApprovalList` | `src/components/quick-invite/QuickLinkApprovalList.tsx` | Approve/reject pending signups |
| `QuickLinkSignupForm` | `src/components/quick-invite/QuickLinkSignupForm.tsx` | Public form for guests to sign up |

### Pages

| Page | Path | Description |
|------|------|-------------|
| Quick Invite Management | `src/app/[locale]/(protected)/quick-invite/page.tsx` | Protected page to manage links |
| Join Page | `src/app/join/[code]/page.tsx` | Public page for signup via link code |

## Component Props

### QuickInviteLinkGenerator

```typescript
interface QuickInviteLinkGeneratorProps {
  locale?: string;
  onLinkCreated?: (link: QuickInviteLink) => void;
}
```

### QRCodeDisplay

```typescript
interface QRCodeDisplayProps {
  url: string;           // Full URL to encode
  size?: number;         // QR code size in pixels (default: 200)
  eventName?: string;    // Event name to show above QR
  code: string;          // Short code to display below QR
  locale?: string;
}
```

### ShareButtons

```typescript
interface ShareButtonsProps {
  url: string;
  eventName?: string | null;
  locale?: string;
}
```

### QuickLinkSignupForm

```typescript
interface QuickLinkSignupFormProps {
  code: string;
  eventName?: string | null;
  creatorName?: string | null;
  locale?: string;
}
```

### QuickLinkApprovalList

```typescript
interface QuickLinkApprovalListProps {
  signups: QuickLinkSignup[];
  linkId: string;
  onApprove: (signupId: string) => Promise<void>;
  onReject: (signupId: string, reason?: string) => Promise<void>;
  locale?: string;
}
```

## API Endpoints

### `POST /api/quick-links`

Create a new quick invite link.

**Request:**
```json
{
  "expiration": "24h",
  "maxUses": 50,
  "eventName": "Smith Family Reunion 2026"
}
```

**Response:**
```json
{
  "success": true,
  "link": {
    "id": "uuid",
    "code": "ABC123",
    "expires_at": "2026-02-03T12:00:00Z",
    "max_uses": 50,
    "current_uses": 0,
    "event_name": "Smith Family Reunion 2026",
    "is_active": true
  }
}
```

### `GET /api/quick-links`

List user's quick invite links.

**Response:**
```json
{
  "links": [...]
}
```

### `GET /api/quick-links/[code]`

Get link info by code (public endpoint for join page).

**Response:**
```json
{
  "valid": true,
  "link": {
    "id": "uuid",
    "code": "ABC123",
    "eventName": "Smith Family Reunion",
    "expiresAt": "2026-02-03T12:00:00Z",
    "remainingUses": 48,
    "creator": {
      "firstName": "John",
      "lastName": "Smith"
    }
  }
}
```

### `POST /api/quick-links/[code]/signup`

Submit a signup request.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "claimedRelationship": "I'm John's cousin"
}
```

**Response:**
```json
{
  "success": true,
  "signupId": "uuid"
}
```

**Error Codes:**
- `409` - Already signed up with this email
- `410` - Link expired or inactive

### `PATCH /api/quick-links/signups/[id]`

Approve or reject a signup.

**Request:**
```json
{
  "action": "approve"
}
```
or
```json
{
  "action": "reject",
  "reason": "Not recognized as family"
}
```

## Localization

### English (`en`)

```typescript
{
  title: 'Quick Invite Links',
  subtitle: 'Create shareable links with QR codes for family events and reunions',
  createLink: 'Create Invite Link',
  eventName: 'Event Name (optional)',
  eventNamePlaceholder: 'e.g., Smith Family Reunion 2026',
  expiration: 'Link Expires In',
  maxUses: 'Maximum Uses',
  linkReady: 'Your Link is Ready!',
  copyLink: 'Copy Link',
  copied: 'Copied!',
  shareLink: 'Share this link',
  expirations: {
    '1h': '1 hour',
    '6h': '6 hours',
    '24h': '24 hours',
    '7d': '7 days',
  },
  // Signup form
  joinTitle: 'Join the Family',
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone (optional)',
  relationship: 'How are you related?',
  submit: 'Request to Join',
  successTitle: 'Request Submitted!',
  successMessage: 'Your request has been sent. You will be notified when approved.',
}
```

### Russian (`ru`)

```typescript
{
  title: 'Быстрые ссылки-приглашения',
  subtitle: 'Создавайте ссылки с QR-кодами для семейных мероприятий',
  createLink: 'Создать ссылку',
  eventName: 'Название события (опционально)',
  eventNamePlaceholder: 'напр., Воссоединение семьи Ивановых 2026',
  expiration: 'Ссылка истекает через',
  maxUses: 'Максимум использований',
  linkReady: 'Ваша ссылка готова!',
  copyLink: 'Копировать ссылку',
  copied: 'Скопировано!',
  shareLink: 'Поделиться ссылкой',
  expirations: {
    '1h': '1 час',
    '6h': '6 часов',
    '24h': '24 часа',
    '7d': '7 дней',
  },
  // Signup form
  joinTitle: 'Присоединиться к семье',
  firstName: 'Имя',
  lastName: 'Фамилия',
  email: 'Email',
  phone: 'Телефон (опционально)',
  relationship: 'Как вы связаны с семьёй?',
  submit: 'Отправить запрос',
  successTitle: 'Запрос отправлен!',
  successMessage: 'Ваш запрос отправлен. Вы получите уведомление после одобрения.',
}
```

## QR Code Generation

The QR code is generated using the `qrcode` npm package with these settings:

```typescript
QRCode.toCanvas(canvas, url, {
  width: 200,
  margin: 2,
  color: {
    dark: '#1a1a2e',  // Brand color
    light: '#ffffff',
  },
  errorCorrectionLevel: 'H', // High error correction
});
```

### Download and Print Features

- **Download**: Creates a PNG with event name header, QR code, and code text
- **Print**: Opens a print-friendly window with styled QR code and instructions

## Share Channels

| Channel | Implementation | Notes |
|---------|----------------|-------|
| WhatsApp | `https://wa.me/?text={message}` | Works on mobile and desktop |
| SMS | `sms:?body={message}` | Mobile only |
| Email | `mailto:?subject={subject}&body={body}` | All platforms |
| Native Share | `navigator.share()` | Mobile only, with clipboard fallback |

## Code Generation

Link codes are 6 characters using a limited character set to avoid confusion:

```
ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

Excluded characters:
- `0` (confused with O)
- `O` (confused with 0)
- `1` (confused with I and l)
- `I` (confused with 1 and l)

## Testing Checklist

### Link Creation
- [ ] Create link with default settings
- [ ] Create link with custom expiration (1h, 6h, 24h, 7d)
- [ ] Create link with custom max uses
- [ ] Create link with event name
- [ ] QR code displays correctly
- [ ] Copy link button works
- [ ] Download QR code works
- [ ] Print QR code works

### Share Functionality
- [ ] WhatsApp share opens correctly
- [ ] SMS share opens correctly (mobile)
- [ ] Email share opens correctly
- [ ] Native share works (mobile)
- [ ] Messages include event name when present

### Link Management
- [ ] List displays all user's links
- [ ] Pending approval count shown
- [ ] Activate/deactivate link works
- [ ] Delete link works
- [ ] Expired links shown as expired

### Signup Flow
- [ ] Join page loads for valid code
- [ ] Join page shows error for invalid code
- [ ] Join page shows error for expired link
- [ ] Signup form validates required fields
- [ ] Signup form validates email format
- [ ] Duplicate email shows appropriate error
- [ ] Success message displays after signup

### Approval Flow
- [ ] Signups list displays correctly
- [ ] Approve signup works
- [ ] Reject signup with reason works
- [ ] Approve all button works
- [ ] Pending count updates after action

## Security Considerations

1. **Rate Limiting**: Signup endpoints should be rate-limited to prevent abuse
2. **Link Validation**: Always verify link is active, not expired, and under max uses
3. **Email Verification**: Consider email verification before full approval
4. **Spam Prevention**: Monitor for mass signups from same IP
5. **Privacy**: Creator name visibility is optional

## Future Improvements

1. **Email Notifications**: Notify creator when someone signs up
2. **Automatic Approval**: Option to auto-approve signups
3. **Custom Branding**: Allow custom colors/logos on QR code
4. **Link Analytics**: Track views, scans, and conversion rates
5. **Bulk Invite**: Upload CSV of emails to pre-populate signups
6. **Password Protection**: Optional password for sensitive events
7. **RSVP Integration**: Add event RSVP functionality
8. **Reminder Notifications**: Send reminders before link expires
