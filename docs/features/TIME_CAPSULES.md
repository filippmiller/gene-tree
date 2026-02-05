# Time Capsule Messages

> **Feature ID:** Sprint3-TC1
> **Status:** Complete
> **Added:** February 5, 2026

## Overview

Time Capsule Messages allow family members to write messages (text, audio, video, images) scheduled for future delivery. A grandfather can record a message for a grandchild's 18th birthday, or leave a sealed letter to be opened after passing. Messages remain sealed until the delivery date, then unlock with a notification.

This feature supports the platform's philosophy that "stories matter" by enabling intergenerational communication across time.

## Architecture

```
+------------------------------------------------------------------+
|                     TimeCapsulePageClient                         |
|                   (Main Client Component)                         |
|                                                                   |
|   +----------------------------------------------------------+   |
|   |                      Tab Views                            |   |
|   |                                                           |   |
|   |   [Sent Capsules]              [Received Capsules]        |   |
|   |        |                              |                   |   |
|   |        v                              v                   |   |
|   |   Creator sees                  Recipient sees            |   |
|   |   all states                    only delivered            |   |
|   +----------------------------------------------------------+   |
|                                                                   |
|   +----------------------------------------------------------+   |
|   |                    Dialogs                                |   |
|   |                                                           |   |
|   |   [Create]  -->  [Edit]  -->  [View Delivered]            |   |
|   |       |              |               |                    |   |
|   |       v              v               v                    |   |
|   |   Form Modal    Form Modal    Viewer Modal                |   |
|   +----------------------------------------------------------+   |
+------------------------------------------------------------------+
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
+--------------------+  +----------------+  +------------------+
|  TimeCapsuleCard   |  | TimeCapsuleForm|  | TimeCapsuleViewer|
|                    |  |                |  |                  |
| - Sealed state     |  | - Recipient    |  | - Message view   |
| - Delivered state  |  | - Title/Message|  | - Media player   |
| - Actions menu     |  | - Date picker  |  | - Creator info   |
+--------------------+  | - Media upload |  +------------------+
                        +----------------+
                              |
                              v
              +----------------------------------+
              |          API Routes              |
              |                                  |
              |  GET  /api/time-capsules         |
              |  POST /api/time-capsules         |
              |  GET  /api/time-capsules/:id     |
              |  PATCH /api/time-capsules/:id    |
              |  DELETE /api/time-capsules/:id   |
              |  POST /api/time-capsules/signed-upload |
              +----------------------------------+
                              |
              +---------------+---------------+
              |                               |
              v                               v
+---------------------------+    +------------------------+
|     Supabase Database     |    |   Supabase Storage     |
|                           |    |                        |
|  Table: time_capsules     |    |  Bucket: time-capsule- |
|  - RLS policies           |    |          media         |
|  - Indexes                |    |  Max: 50 MB            |
+---------------------------+    +------------------------+
              |
              v
+---------------------------+
|      Cron Job             |
|                           |
| /api/cron/deliver-time-   |
|           capsules        |
| Runs every 6 hours        |
| Creates notifications     |
+---------------------------+
```

## Database Schema

### time_capsules

```sql
CREATE TABLE IF NOT EXISTS public.time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Creator (the person writing the capsule)
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recipient (optional - if null, it's for the whole family)
  recipient_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

  -- Content
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  message TEXT CHECK (char_length(message) <= 10000),

  -- Media attachment (optional)
  media_type TEXT CHECK (media_type IN (NULL, 'audio', 'video', 'image')),
  media_url TEXT,

  -- Delivery scheduling
  scheduled_delivery_date TIMESTAMPTZ NOT NULL CHECK (scheduled_delivery_date > created_at),
  delivery_trigger TEXT NOT NULL DEFAULT 'date'
    CHECK (delivery_trigger IN ('date', 'after_passing', 'event')),

  -- Delivery status
  delivered_at TIMESTAMPTZ,
  delivery_status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (delivery_status IN ('scheduled', 'delivered', 'cancelled')),

  -- Privacy (always private for time capsules)
  privacy_level TEXT NOT NULL DEFAULT 'private' CHECK (privacy_level IN ('private')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'time-capsule-media',
  'time-capsule-media',
  false,              -- Private bucket
  52428800,           -- 50 MB max
  ARRAY[
    'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav',
    'video/webm', 'video/mp4', 'video/quicktime',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp'
  ]
);
```

### Indexes

```sql
-- Fast lookup for cron job delivery queries
CREATE INDEX idx_time_capsules_delivery_due
  ON time_capsules(scheduled_delivery_date, delivery_status)
  WHERE delivery_status = 'scheduled';

-- User's capsules (created or received)
CREATE INDEX idx_time_capsules_created_by
  ON time_capsules(created_by, created_at DESC);

CREATE INDEX idx_time_capsules_recipient
  ON time_capsules(recipient_profile_id, delivery_status, created_at DESC);
```

## Files

### Components

| File | Purpose |
|------|---------|
| `src/components/time-capsules/TimeCapsuleCard.tsx` | Card displaying sealed or opened capsule |
| `src/components/time-capsules/TimeCapsuleForm.tsx` | Create/edit form with media upload |
| `src/components/time-capsules/TimeCapsuleViewer.tsx` | Full view of delivered capsule |

### Types

| File | Purpose |
|------|---------|
| `src/lib/time-capsules/types.ts` | TypeScript interfaces and request types |

### API Routes

| File | Purpose |
|------|---------|
| `src/app/api/time-capsules/route.ts` | List (GET) and create (POST) capsules |
| `src/app/api/time-capsules/[id]/route.ts` | Get, update, delete single capsule |
| `src/app/api/time-capsules/signed-upload/route.ts` | Get signed URL for media upload |
| `src/app/api/cron/deliver-time-capsules/route.ts` | Cron job for scheduled delivery |

### Pages

| File | Purpose |
|------|---------|
| `src/app/[locale]/(protected)/time-capsules/page.tsx` | Server component with data fetching |
| `src/app/[locale]/(protected)/time-capsules/TimeCapsulePageClient.tsx` | Client component with UI logic |

### Database

| File | Purpose |
|------|---------|
| `supabase/migrations/20260205000001_time_capsules.sql` | Schema, RLS, storage policies |

## Type Definitions

### Core Types

```typescript
export type DeliveryTrigger = 'date' | 'after_passing' | 'event';
export type DeliveryStatus = 'scheduled' | 'delivered' | 'cancelled';
export type CapsuleMediaType = 'audio' | 'video' | 'image' | null;

export interface TimeCapsule {
  id: string;
  created_by: string;
  recipient_profile_id: string | null;
  title: string;
  message: string | null;
  media_type: CapsuleMediaType;
  media_url: string | null;
  scheduled_delivery_date: string;
  delivery_trigger: DeliveryTrigger;
  delivered_at: string | null;
  delivery_status: DeliveryStatus;
  privacy_level: 'private';
  created_at: string;
  updated_at: string;
}

export interface TimeCapsuleWithProfiles extends TimeCapsule {
  creator: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  recipient: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}
```

### Request Types

```typescript
export interface CreateTimeCapsuleRequest {
  recipient_profile_id: string | null;
  title: string;
  message: string | null;
  media_type: CapsuleMediaType;
  media_url: string | null;
  scheduled_delivery_date: string;
  delivery_trigger: DeliveryTrigger;
}

export interface UpdateTimeCapsuleRequest {
  title?: string;
  message?: string;
  media_type?: CapsuleMediaType;
  media_url?: string;
  scheduled_delivery_date?: string;
  delivery_trigger?: DeliveryTrigger;
  delivery_status?: 'cancelled';
}
```

## API Endpoints

### GET /api/time-capsules

List time capsules with filtering.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| filter | string | 'all' | 'all', 'sent', or 'received' |
| limit | number | 20 | Results per page (max 50) |
| offset | number | 0 | Pagination offset |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "To my grandson on his 18th birthday",
      "message": "Dear...",
      "scheduled_delivery_date": "2030-05-15T00:00:00Z",
      "delivery_status": "scheduled",
      "creator": { "id": "...", "first_name": "John", "last_name": "Doe" },
      "recipient": { "id": "...", "first_name": "Tommy", "last_name": "Doe" }
    }
  ],
  "total": 5,
  "hasMore": false
}
```

### POST /api/time-capsules

Create a new time capsule.

**Request:**
```json
{
  "recipient_profile_id": "uuid",       // null for "to family"
  "title": "To my grandson",
  "message": "Dear Tommy...",
  "media_type": "video",                // null, 'audio', 'video', 'image'
  "media_url": "path/to/file.mp4",      // storage path from upload
  "scheduled_delivery_date": "2030-05-15T00:00:00Z",
  "delivery_trigger": "date"            // 'date', 'after_passing', 'event'
}
```

**Response:** Created capsule object (201)

### GET /api/time-capsules/:id

Get a single time capsule.

**Response:**
```json
{
  "id": "uuid",
  "title": "...",
  "message": "...",
  "creator": { ... },
  "recipient": { ... },
  ...
}
```

### PATCH /api/time-capsules/:id

Update a capsule (only before delivery).

**Request:**
```json
{
  "title": "Updated title",
  "message": "Updated message",
  "scheduled_delivery_date": "2031-01-01T00:00:00Z"
}
```

**Constraints:**
- Only creator can update
- Only `scheduled` capsules can be updated
- Setting `delivery_status: 'cancelled'` cancels the capsule

### DELETE /api/time-capsules/:id

Delete a capsule (only before delivery).

**Response:**
```json
{ "success": true }
```

### POST /api/time-capsules/signed-upload

Get a signed URL for media upload.

**Request:**
```json
{
  "file_size_bytes": 5242880,
  "content_type": "video/mp4"
}
```

**Response:**
```json
{
  "upload_url": "https://signed-url...",
  "storage_path": "user-id/timestamp-random.mp4"
}
```

## Cron Job

### GET /api/cron/deliver-time-capsules

Runs every 6 hours via Vercel Cron.

**Configuration (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/deliver-time-capsules",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Flow:**
1. Query capsules where `delivery_status = 'scheduled'` AND `scheduled_delivery_date <= NOW()`
2. For each capsule:
   - Update `delivery_status` to `'delivered'`
   - Set `delivered_at` timestamp
   - Create notification for recipient
3. Return delivery count

**Authorization:**
- Requires `CRON_SECRET` header or Vercel cron authentication

## RLS Policies

### time_capsules table

**SELECT:**
```sql
-- Creator can always see their own capsules
created_by = auth.uid()
-- Recipient can only see after delivery
OR (recipient_profile_id = auth.uid() AND delivery_status = 'delivered')
```

**INSERT:**
```sql
-- User can only create capsules as themselves
created_by = auth.uid()
```

**UPDATE:**
```sql
-- Only creator, only before delivery
created_by = auth.uid() AND delivery_status = 'scheduled'
```

**DELETE:**
```sql
-- Only creator, only before delivery
created_by = auth.uid() AND delivery_status = 'scheduled'
```

### Storage Bucket

**INSERT:**
```sql
-- User can upload to their own folder
bucket_id = 'time-capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]
```

**SELECT:**
```sql
-- User can read from their own folder
bucket_id = 'time-capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]
```

**DELETE:**
```sql
-- User can delete from their own folder
bucket_id = 'time-capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]
```

## UI States

### Sealed Capsule (before delivery)

- **Icon:** Lock (amber/gold)
- **Info shown:** Title, recipient name, delivery date
- **Actions (creator only):** Edit, Delete, Cancel
- **Hover:** "This message will be delivered on [date]"
- **Gradient:** Amber to orange

### Delivered Capsule (after delivery)

- **Icon:** Mail/Envelope (violet/purple)
- **Info shown:** Title, creator name, delivered date
- **Actions:** Open to view full content
- **Click:** Opens TimeCapsuleViewer dialog
- **Gradient:** Violet to purple

## Notification Integration

### Event Type

Added `TIME_CAPSULE_DELIVERED` to notification system.

### Payload

```typescript
interface TimeCapsuleDeliveredPayload {
  capsule_id: string;
  title: string;
  creator_name: string;
}
```

### Routing

Clicking notification navigates to:
```
/time-capsules?open={capsule_id}
```

## Localization

### Translations (src/messages/{locale}/common.json)

```json
{
  "timeCapsules": {
    "title": "Time Capsules",
    "subtitle": "Messages for the future",
    "createNew": "Create Time Capsule",
    "sealedUntil": "Sealed until",
    "deliveredOn": "Delivered on",
    "from": "From",
    "to": "To",
    "toFamily": "To My Family",
    "sent": "Sent",
    "received": "Received",
    "noSent": "You haven't created any time capsules yet.",
    "noReceived": "No delivered capsules yet.",
    "edit": "Edit",
    "delete": "Delete",
    "confirmDelete": "Are you sure? This capsule will be permanently deleted.",
    "messageFrom": "Message from",
    "close": "Close"
  }
}
```

## Testing Checklist

### Creation Tests

- [ ] Form validates required title
- [ ] Form validates title max length (200 chars)
- [ ] Form validates message max length (10,000 chars)
- [ ] Delivery date must be in future
- [ ] Recipient dropdown shows family members
- [ ] "To My Family" option works (null recipient)
- [ ] Media upload gets signed URL
- [ ] Media upload to storage works
- [ ] Submit creates capsule in database

### Viewing Tests

- [ ] Sent tab shows creator's capsules
- [ ] Received tab shows delivered capsules only
- [ ] Sealed capsules show locked state
- [ ] Delivered capsules show mail state
- [ ] Card displays correct recipient/creator info
- [ ] Date formatting is localized

### Editing Tests

- [ ] Edit button appears for creator only
- [ ] Edit button hidden for delivered capsules
- [ ] Form pre-fills with existing data
- [ ] Updates save correctly
- [ ] Cancel action sets status to 'cancelled'

### Deletion Tests

- [ ] Delete button appears for creator only
- [ ] Delete button hidden for delivered capsules
- [ ] Confirmation dialog appears
- [ ] Media file deleted from storage
- [ ] Database record deleted

### Delivery Tests

- [ ] Cron finds due capsules
- [ ] Status updated to 'delivered'
- [ ] delivered_at timestamp set
- [ ] Notification created for recipient
- [ ] Recipient can now view capsule

### Edge Cases

- [ ] No recipient (family-wide) capsule works
- [ ] Very long message displays correctly
- [ ] Large media files (up to 50MB) upload
- [ ] Multiple capsules deliver in same cron run
- [ ] Deleted recipient doesn't break capsule

## Future Improvements

1. **After Passing Trigger** - Deliver capsule when creator is marked deceased
2. **Family Broadcast** - Capsule to all family members at once
3. **Email Notifications** - Send email when capsule is delivered
4. **Dashboard Widget** - Show upcoming/recently delivered capsules
5. **Reminder Notifications** - Notify creator before delivery date
6. **Template Messages** - Pre-written message starters
7. **Scheduled Editing** - Queue edits for later
8. **Multiple Recipients** - Send same capsule to multiple people
9. **Read Receipts** - Know when recipient opened capsule
10. **Anniversary Capsules** - Auto-repeat yearly
