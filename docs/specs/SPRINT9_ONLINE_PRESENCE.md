# Sprint 9: Online Presence & Internal Messaging - Implementation Spec

> **Sprint:** 9-10 (Future Social Features)
> **Priority:** P2 - Enhancement
> **Estimated Effort:** 1-2 weeks
> **Created:** 2026-02-02
> **Requested by:** User (real-time social features)

---

## Problem Statement

Users cannot tell when family members are online, and there's no way to send private messages within the platform. This reduces engagement and forces users to communicate through external channels.

---

## Feature 18: Online Presence Indicators

### User Experience
- Green dot on avatar when user is online
- "Last seen" timestamp when offline (e.g., "Last seen 5 minutes ago")
- Privacy setting to hide online status

### Technical Implementation

#### 1. Supabase Realtime Presence

```typescript
// lib/presence/presence-channel.ts
import { createClient } from '@supabase/supabase-js';

export function initializePresence(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const channel = supabase.channel('online-users', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      // state contains all online users
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      // User came online
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      // User went offline
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online_at: new Date().toISOString(),
          user_id: userId,
        });
      }
    });

  return channel;
}
```

#### 2. Database Schema

```sql
-- Migration: 00XX_online_presence.sql

-- User presence settings
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Index for presence queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen
ON user_profiles(last_seen_at DESC)
WHERE show_online_status = true;
```

#### 3. Presence Hook

```typescript
// hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export interface PresenceState {
  [userId: string]: {
    online_at: string;
    user_id: string;
  }[];
}

export function usePresence(userId: string | null) {
  const supabase = useSupabaseClient();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const online = new Set(Object.keys(state));
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId, supabase]);

  const isOnline = (checkUserId: string) => onlineUsers.has(checkUserId);

  return { onlineUsers, isOnline, isConnected };
}
```

#### 4. Avatar with Presence Indicator

```tsx
// components/ui/avatar-with-presence.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarWithPresenceProps {
  src?: string;
  fallback: string;
  isOnline?: boolean;
  lastSeen?: Date;
  showPresence?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarWithPresence({
  src,
  fallback,
  isOnline,
  lastSeen,
  showPresence = true,
  size = 'md',
}: AvatarWithPresenceProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const dotSizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  return (
    <div className="relative inline-block">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={src} alt={fallback} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {showPresence && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            dotSizeClasses[size],
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
          title={isOnline ? 'Online' : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
        />
      )}
    </div>
  );
}

function formatLastSeen(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

---

## Feature 19: Internal Family Messaging

### User Experience
- Inbox icon with unread count badge in header
- Click to open inbox with conversation list
- Thread-based messaging with family members
- Real-time message delivery
- Push notifications (optional)

### Database Schema

```sql
-- Migration: 00XX_family_messaging.sql

-- Conversations between two users
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 < participant_2) -- Ensure consistent ordering
);

-- Individual messages
CREATE TABLE IF NOT EXISTS family_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_thread_created ON family_messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_unread ON family_messages(from_user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_threads_participant_1 ON message_threads(participant_1);
CREATE INDEX idx_threads_participant_2 ON message_threads(participant_2);

-- RLS Policies
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see threads they're part of
CREATE POLICY "Users can view own threads" ON message_threads
  FOR SELECT USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- Users can create threads with verified connections only
CREATE POLICY "Users can create threads with connections" ON message_threads
  FOR INSERT WITH CHECK (
    auth.uid() IN (participant_1, participant_2)
    -- TODO: Add check for verified family connection
  );

-- Users can view messages in their threads
CREATE POLICY "Users can view thread messages" ON family_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = thread_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- Users can send messages to their threads
CREATE POLICY "Users can send messages" ON family_messages
  FOR INSERT WITH CHECK (
    from_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = thread_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- Users can mark messages as read
CREATE POLICY "Users can mark messages read" ON family_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = thread_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );
```

### API Endpoints

```typescript
// POST /api/messages/threads - Create or get thread
// GET /api/messages/threads - List all threads with last message
// GET /api/messages/threads/[threadId] - Get messages in thread
// POST /api/messages/threads/[threadId] - Send message
// PATCH /api/messages/[messageId]/read - Mark as read
// GET /api/messages/unread-count - Get unread count
```

### Real-time Subscriptions

```typescript
// Subscribe to new messages
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'family_messages',
      filter: `thread_id=in.(${userThreadIds.join(',')})`,
    },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe();
```

---

## Privacy Controls

### User Settings

```typescript
interface MessagingPrivacySettings {
  showOnlineStatus: boolean;       // Show green dot
  showLastSeen: boolean;           // Show "last seen" timestamp
  allowMessagesFrom: 'all' | 'verified' | 'none';
  notifyOnMessage: boolean;        // Push notifications
  notifyOnMention: boolean;        // Notify when @mentioned
}
```

### Settings UI Location
Add to: `src/app/[locale]/(protected)/settings/privacy/page.tsx`

---

## UI Components to Create

1. `components/ui/avatar-with-presence.tsx` - Avatar with online indicator
2. `components/messaging/InboxButton.tsx` - Header icon with unread badge
3. `components/messaging/InboxDrawer.tsx` - Side drawer with thread list
4. `components/messaging/MessageThread.tsx` - Conversation view
5. `components/messaging/MessageInput.tsx` - Message composer
6. `components/messaging/ThreadList.tsx` - List of conversations

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/presence/presence-channel.ts` | Presence initialization |
| `src/hooks/usePresence.ts` | Presence React hook |
| `src/hooks/useMessages.ts` | Messages React hook |
| `src/components/ui/avatar-with-presence.tsx` | Avatar component |
| `src/components/messaging/*.tsx` | Messaging UI components |
| `src/app/api/messages/**/*.ts` | Messaging API routes |
| `supabase/migrations/00XX_online_presence.sql` | Presence schema |
| `supabase/migrations/00XX_family_messaging.sql` | Messaging schema |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Users enabling online status | >60% |
| Messages sent per active user | 5+ per month |
| Message response time | <4 hours average |
| Push notification opt-in | >40% |

---

## Implementation Order

1. **Phase 1: Presence** (3 days)
   - Database migration
   - Presence hook
   - Avatar component
   - Privacy settings

2. **Phase 2: Messaging Core** (5 days)
   - Database migration
   - API endpoints
   - Thread list UI
   - Message thread UI

3. **Phase 3: Real-time** (2 days)
   - Real-time subscriptions
   - Unread badges
   - Push notifications (optional)

---

## Dependencies

- Supabase Realtime (already enabled)
- Supabase Auth (already configured)
- No additional external services needed
