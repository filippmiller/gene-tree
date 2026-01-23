# Notifications System

> **Domain Owner:** Platform Team
> **Last Updated:** 2026-01-23
> **Status:** Production Ready (Phase 1)

---

## Overview

The Gene-Tree notification system alerts users to family activity: new relatives added, photos uploaded, stories submitted/approved/rejected, and invitations received.

### Key Features

- Global notification bell in navbar (all pages)
- Unread count badge with visual states
- Click-through navigation to relevant content
- Avatars with event-type icon overlays
- Relative timestamps ("2 hours ago")
- Bilingual support (English + Russian)
- Mark all as read functionality

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ NotificationBell │  │NotificationsPanel│                     │
│  │   (navbar)       │  │   (dashboard)    │                     │
│  └────────┬─────────┘  └────────┬─────────┘                     │
│           │                     │                                │
│           └──────────┬──────────┘                                │
│                      │                                           │
│           ┌──────────▼──────────┐                               │
│           │  NotificationItem   │                               │
│           │  (shared component) │                               │
│           └──────────┬──────────┘                               │
│                      │                                           │
│           ┌──────────▼──────────┐                               │
│           │  formatRelativeTime │                               │
│           │     (utility)       │                               │
│           └─────────────────────┘                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP
┌─────────────────────────▼───────────────────────────────────────┐
│                          API                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ GET  /api/notifications      - Fetch with actor profile    │ │
│  │ POST /api/notifications/read - Mark as read                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │ SQL
┌─────────────────────────▼───────────────────────────────────────┐
│                       DATABASE                                   │
│  ┌─────────────────┐  ┌─────────────────────────┐               │
│  │  notifications  │  │ notification_recipients │               │
│  │  (events)       │◄─┤ (per-user read status)  │               │
│  └─────────────────┘  └─────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

```sql
-- Core notification events
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,           -- 'relative_added', 'media_added', etc.
  actor_profile_id UUID REFERENCES user_profiles(id),
  primary_profile_id UUID REFERENCES user_profiles(id),
  related_profile_id UUID REFERENCES user_profiles(id),
  payload JSONB,                      -- Event-specific data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-recipient read status
CREATE TABLE notification_recipients (
  notification_id UUID REFERENCES notifications(id),
  profile_id UUID REFERENCES user_profiles(id),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  PRIMARY KEY (notification_id, profile_id)
);
```

### Indexes

```sql
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_recipients_profile ON notification_recipients(profile_id, is_read);
```

### RLS Policies

- `notifications`: Admin-only direct access
- `notification_recipients`: Owner can read/update their own records

---

## Event Types

| Event Type | Trigger | Payload | Recipients |
|------------|---------|---------|------------|
| `relative_added` | User invites family member | `{first_name, last_name, relationship_type}` | Family circle |
| `media_added` | Photo/video uploaded | `{photo_id, media_type, bucket}` | Family circle |
| `STORY_SUBMITTED` | Story added to profile | `{story_id, media_type, preview}` | Profile owner |
| `STORY_APPROVED` | Story approved | `{story_id, title}` | Story author |
| `STORY_REJECTED` | Story rejected | `{story_id, title, reason}` | Story author |

---

## Components

### NotificationBell

**Location:** `src/components/notifications/NotificationBell.tsx`

Global navbar component showing notification icon with unread badge.

```tsx
import NotificationBell from '@/components/notifications/NotificationBell';

// In navbar
<NotificationBell />
```

**Features:**
- Bell icon (BellRing when unread)
- Red badge with count (max "9+")
- Popover dropdown with last 5 notifications
- Mark all as read button
- Auto-refresh every 60 seconds
- Responsive design

### NotificationItem

**Location:** `src/components/notifications/NotificationItem.tsx`

Individual notification row with rich visual design.

```tsx
import NotificationItem from '@/components/notifications/NotificationItem';

<NotificationItem
  notification={row}
  onMarkAsRead={handleMarkAsRead}
  translations={t}
/>
```

**Features:**
- Avatar with actor's photo (initials fallback)
- Type icon overlay (color-coded by event type)
- Read/unread visual states (blue tint, bold, pulsing dot)
- Click navigation to relevant page
- Keyboard accessible (Enter/Space)
- Hover arrow indicator

### NotificationsPanel

**Location:** `src/components/dashboard/NotificationsPanel.tsx`

Dashboard sidebar panel showing recent notifications.

**Features:**
- Header with count badge
- Mark all as read button
- Empty state with helpful CTA
- Error state with retry
- Loading spinner
- View all footer link

---

## API Endpoints

### GET /api/notifications

Returns latest 50 notifications for current user with actor profile info.

**Response:**
```json
{
  "notifications": [
    {
      "notification_id": "uuid",
      "is_read": false,
      "read_at": null,
      "notification": {
        "id": "uuid",
        "event_type": "relative_added",
        "actor_profile_id": "uuid",
        "primary_profile_id": "uuid",
        "related_profile_id": "uuid",
        "payload": {
          "first_name": "Maria",
          "last_name": "Miller",
          "relationship_type": "spouse"
        },
        "created_at": "2026-01-23T10:30:00Z",
        "actor_first_name": "John",
        "actor_last_name": "Doe",
        "actor_avatar_url": "https://..."
      }
    }
  ]
}
```

### POST /api/notifications/read

Marks notifications as read.

**Request:**
```json
{
  "ids": ["notification_id_1", "notification_id_2"]
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Type Definitions

**Location:** `src/types/notifications.ts`

```typescript
// Event types
type NotificationEventType =
  | 'relative_added'
  | 'media_added'
  | 'STORY_SUBMITTED'
  | 'STORY_APPROVED'
  | 'STORY_REJECTED';

// Payload interfaces
interface RelativeAddedPayload {
  first_name: string;
  last_name: string;
  relationship_type: string;
}

interface MediaAddedPayload {
  photo_id?: string;
  story_id?: string;
  media_type: 'photo' | 'video' | 'voice';
  bucket?: string;
}

interface StorySubmittedPayload {
  story_id: string;
  media_type: string;
  preview?: string;
}

// ... etc.
```

---

## URL Navigation

**Location:** `src/lib/notifications.ts`

```typescript
function getNotificationUrl(
  eventType: NotificationEventType,
  payload: NotificationPayload,
  notification: { primary_profile_id?: string; related_profile_id?: string }
): string
```

| Event Type | Navigation Target |
|------------|-------------------|
| `relative_added` | `/profile/{related_profile_id}` or `/tree` |
| `media_added` | `/profile/{primary_profile_id}#photos` |
| `STORY_SUBMITTED` | `/stories/{story_id}` |
| `STORY_APPROVED` | `/stories/{story_id}` |
| `STORY_REJECTED` | `/stories` |

---

## Utilities

### formatRelativeTime

**Location:** `src/lib/utils/formatRelativeTime.ts`

Converts timestamps to human-readable relative time.

```typescript
formatRelativeTime('2026-01-23T10:30:00Z', 'en')
// Returns: "2 hours ago"

formatRelativeTime('2026-01-23T10:30:00Z', 'ru')
// Returns: "2 часа назад"
```

**Output Examples:**
- `< 1 min` → "Just now" / "Только что"
- `< 1 hour` → "5 minutes ago" / "5 минут назад"
- `< 24 hours` → "3 hours ago" / "3 часа назад"
- `yesterday` → "Yesterday" / "Вчера"
- `< 7 days` → "4 days ago" / "4 дня назад"
- `> 7 days` → "Jan 15" / "15 янв."

---

## Internationalization

**Locations:**
- `src/messages/en/common.json`
- `src/messages/ru/common.json`

```json
{
  "notifications": {
    "title": "Notifications",
    "markAllRead": "Mark all as read",
    "viewAll": "View all",
    "empty": "No notifications yet",
    "emptyHint": "When family members add content, you'll see it here",
    "loading": "Loading...",
    "error": "Failed to load notifications",
    "relativeAdded": "{name} was added as your {relationship}",
    "mediaAdded": "New {mediaType} added to {name}'s profile",
    "storySubmitted": "New story about {name}",
    "storyApproved": "Your story was approved",
    "storyRejected": "Your story was declined"
  }
}
```

---

## Visual States

### Read vs Unread

| State | Background | Text | Indicator |
|-------|------------|------|-----------|
| Unread | `bg-blue-50/70` | Bold, dark | Blue pulsing dot |
| Read | `bg-white` | Normal, muted | None |

### Event Type Colors

| Event | Icon | Background Color |
|-------|------|------------------|
| `relative_added` | User | `bg-blue-500` |
| `media_added` | Camera | `bg-purple-500` |
| `STORY_SUBMITTED` | BookOpen | `bg-amber-500` |
| `STORY_APPROVED` | CheckCircle | `bg-emerald-500` |
| `STORY_REJECTED` | XCircle | `bg-red-500` |

---

## Creating Notifications

### Using the Helper Function

```typescript
import { createNotification } from '@/lib/notifications';

await createNotification(supabase, {
  event_type: 'relative_added',
  actor_profile_id: currentUserId,
  primary_profile_id: null,
  related_profile_id: newRelativeId,
  payload: {
    first_name: 'Maria',
    last_name: 'Miller',
    relationship_type: 'spouse'
  }
});
```

### Direct Database Insert

For story events that only notify specific users:

```typescript
const { data: notification } = await supabase
  .from('notifications')
  .insert({
    event_type: 'STORY_SUBMITTED',
    actor_profile_id: authorId,
    primary_profile_id: subjectId,
    payload: { story_id, media_type, preview }
  })
  .select()
  .single();

await supabase
  .from('notification_recipients')
  .insert({
    notification_id: notification.id,
    profile_id: subjectId,
    is_read: false
  });
```

---

## Testing

### Manual Testing

1. **Bell visibility:** Navigate to any protected page, verify bell in navbar
2. **Badge count:** Create notifications, verify count updates
3. **Dropdown:** Click bell, verify popover opens with recent items
4. **Mark as read:** Click notification or "Mark all", verify visual change
5. **Navigation:** Click notification, verify redirect to correct page
6. **i18n:** Switch to Russian, verify all text translated

### Creating Test Notifications

```bash
# Via API (requires auth cookie)
curl -X POST http://localhost:3000/api/relatives \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","relationship_type":"sibling"}'
```

---

## Future Improvements

### Phase 2 (Planned)

| Feature | Description | Priority |
|---------|-------------|----------|
| Settings page | Per-type notification toggles | HIGH |
| Dedicated /notifications page | Full history with filtering | HIGH |
| Email digests | Daily/weekly summary emails | MEDIUM |
| Notification grouping | "3 people added photos" | MEDIUM |

### Phase 3 (Future)

| Feature | Description | Priority |
|---------|-------------|----------|
| Supabase Realtime | Instant updates via WebSocket | HIGH |
| Browser push | Native OS notifications | MEDIUM |
| In-app toast | Pop-up for events while browsing | LOW |

---

## Troubleshooting

### No notifications appearing

1. Check user is authenticated
2. Verify `notification_recipients` has records for user's `profile_id`
3. Check browser console for API errors
4. Confirm RLS policies allow access

### Bell not showing in navbar

1. Verify `NotificationBell` imported in `Nav.tsx`
2. Check for JavaScript errors in console
3. Confirm `@radix-ui/react-popover` installed

### Translations missing

1. Check `src/messages/{locale}/common.json` has `notifications` key
2. Verify `useTranslations('notifications')` in component
3. Clear Next.js cache: `rm -rf .next && npm run dev`

---

## File Index

| File | Purpose |
|------|---------|
| `src/components/notifications/NotificationBell.tsx` | Navbar bell with dropdown |
| `src/components/notifications/NotificationItem.tsx` | Individual notification row |
| `src/components/dashboard/NotificationsPanel.tsx` | Dashboard sidebar panel |
| `src/components/ui/popover.tsx` | Radix popover wrapper |
| `src/lib/notifications.ts` | createNotification, getNotificationUrl |
| `src/lib/utils/formatRelativeTime.ts` | Timestamp formatting |
| `src/types/notifications.ts` | TypeScript definitions |
| `src/app/api/notifications/route.ts` | GET notifications API |
| `src/app/api/notifications/read/route.ts` | POST mark as read API |
| `supabase/migrations/0027_notifications.sql` | Database schema |
| `src/messages/en/common.json` | English translations |
| `src/messages/ru/common.json` | Russian translations |

---

## Changelog

### 2026-01-23 — Phase 1 Complete

- Added `NotificationBell` component to navbar
- Created `NotificationItem` with avatars, icons, visual states
- Implemented click-through navigation
- Added relative timestamps with i18n
- Fixed backend types for all 5 event types
- API now returns actor profile data
- Full English + Russian translations
