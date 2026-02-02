# Online Presence Indicators

> **Feature ID:** Sprint2-D1
> **Status:** ✅ Complete
> **Added:** February 2, 2026

## Overview

Online Presence Indicators show which family members are currently online using Supabase Realtime. Users can see a green dot on avatars, "Last seen X ago" for offline users, and can control their own visibility through privacy settings.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   PresenceProvider                        │   │
│  │   (Wraps app, initializes presence channel)              │   │
│  │                                                           │   │
│  │   ┌─────────────────────────────────────────────────┐    │   │
│  │   │              PresenceInitializer                │    │   │
│  │   │   (Starts tracking on mount)                   │    │   │
│  │   └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │   ┌──────────────────┐  ┌──────────────────────────┐    │   │
│  │   │AvatarWithPresence│  │PersonCardWithPresence    │    │   │
│  │   │  ┌──────────┐    │  │  ┌──────────────────┐   │    │   │
│  │   │  │  Avatar  │    │  │  │   Person Card    │   │    │   │
│  │   │  │   🟢     │    │  │  │      🟢          │   │    │   │
│  │   │  └──────────┘    │  │  └──────────────────┘   │    │   │
│  │   └──────────────────┘  └──────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │    Supabase Realtime         │
              │    Presence Channel          │
              │                              │
              │  presence_state: {           │
              │    [user_id]: {              │
              │      presence_ref: "abc123", │
              │      user_id: "uuid"         │
              │    }                         │
              │  }                           │
              └──────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │        user_profiles         │
              │                              │
              │  last_seen_at: timestamp     │
              │  show_online_status: boolean │
              └──────────────────────────────┘
```

## Database Schema

### Fields Added to `user_profiles`

```sql
-- Timestamp of last activity
ALTER TABLE user_profiles ADD COLUMN
  last_seen_at TIMESTAMPTZ;

-- Privacy toggle for online status
ALTER TABLE user_profiles ADD COLUMN
  show_online_status BOOLEAN DEFAULT true;

-- Index for efficient presence queries
CREATE INDEX idx_user_profiles_presence
  ON user_profiles(id, last_seen_at, show_online_status)
  WHERE show_online_status = true;
```

### Functions

```sql
-- Update last_seen_at (called periodically)
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET last_seen_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Files

### Presence Channel Manager

**`src/lib/presence/presence-channel.ts`**

Singleton class managing the Supabase Realtime presence channel:

```typescript
class PresenceChannelManager {
  private channel: RealtimeChannel | null = null;
  private heartbeatInterval: NodeJS.Timer | null = null;

  async connect(userId: string): Promise<void>;
  disconnect(): void;
  getOnlineUsers(): Set<string>;
  onSync(callback: (users: Set<string>) => void): void;
  onJoin(callback: (userId: string) => void): void;
  onLeave(callback: (userId: string) => void): void;
}

export const presenceChannel = new PresenceChannelManager();
```

### React Hooks

**`src/hooks/usePresence.ts`**

Main hook for presence tracking:

```typescript
import { usePresence } from '@/hooks/usePresence';

function MyComponent() {
  const {
    onlineUsers,      // Set<string> of online user IDs
    isOnline,         // (userId: string) => boolean
    isConnected,      // boolean - connection status
    error,            // Error | null
  } = usePresence();
}
```

**`src/hooks/useLastSeen.ts`**

Hook for fetching last_seen_at data:

```typescript
import { useLastSeen } from '@/hooks/useLastSeen';

function MyComponent({ userIds }) {
  const {
    lastSeenMap,      // Record<string, Date | null>
    isLoading,        // boolean
    refresh,          // () => Promise<void>
  } = useLastSeen(userIds);
}
```

**`src/hooks/useFamilyPresence.ts`**

Combined hook for family member presence:

```typescript
import { useFamilyPresence } from '@/hooks/useFamilyPresence';

function FamilyList({ currentUserId, memberIds }) {
  const {
    getPresence,      // (userId: string) => { isOnline, lastSeen }
    onlineCount,      // number
    refresh,          // () => Promise<void>
  } = useFamilyPresence(currentUserId, memberIds);

  return memberIds.map(id => {
    const { isOnline, lastSeen } = getPresence(id);
    return <AvatarWithPresence isOnline={isOnline} lastSeen={lastSeen} />;
  });
}
```

### Components

**`src/components/ui/avatar-with-presence.tsx`**

Avatar wrapper with presence indicator:

```typescript
import { AvatarWithPresence } from '@/components/ui/avatar-with-presence';

<AvatarWithPresence
  src="/avatar.jpg"
  fallback="JD"
  size="md"                    // xs | sm | md | lg | xl
  isOnline={true}              // Show green dot
  lastSeen={lastSeenDate}      // For tooltip
  presenceHidden={false}       // Respect privacy
/>
```

**`src/components/ui/person-card-with-presence.tsx`**

Person card with presence indicator:

```typescript
import { PersonCardWithPresence } from '@/components/ui/person-card-with-presence';

<PersonCardWithPresence
  person={person}
  isOnline={true}
  lastSeen={lastSeenDate}
  isDeceased={false}          // Overrides presence dot
/>
```

**`src/components/presence/PresenceSettings.tsx`**

Privacy toggle for user settings:

```typescript
import { PresenceSettings } from '@/components/presence';

// In profile settings page
<PresenceSettings />
```

**`src/components/providers/PresenceProvider.tsx`**

Context provider for global presence state:

```typescript
import { PresenceProvider } from '@/components/providers/PresenceProvider';

// In layout
<PresenceProvider userId={userId}>
  {children}
</PresenceProvider>
```

**`src/components/presence/PresenceInitializer.tsx`**

Initializes presence tracking on mount:

```typescript
// In protected layout
<PresenceInitializer userId={userId} />
```

## API Endpoints

### `GET /api/presence/settings`

Fetch current presence settings.

**Response:**
```json
{
  "show_online_status": true,
  "last_seen_at": "2026-02-02T12:00:00Z"
}
```

### `PATCH /api/presence/settings`

Update presence settings.

**Request:**
```json
{
  "show_online_status": false
}
```

### `GET /api/presence/last-seen`

Fetch last_seen_at for multiple users.

**Query:** `?ids=uuid1,uuid2,uuid3`

**Response:**
```json
{
  "users": {
    "uuid1": { "last_seen_at": "2026-02-02T12:00:00Z", "visible": true },
    "uuid2": { "last_seen_at": "2026-02-02T11:30:00Z", "visible": true },
    "uuid3": { "last_seen_at": null, "visible": false }
  }
}
```

## Presence States

| State | Indicator | Tooltip |
|-------|-----------|---------|
| Online | Green dot | "Online" |
| Recently seen | Gray dot | "Last seen 5 minutes ago" |
| Offline | No dot | "Last seen 2 hours ago" |
| Hidden | No dot | No tooltip |
| Deceased | Memorial icon | "In memory of..." |

## Heartbeat

The presence system sends periodic heartbeats to update `last_seen_at`:

```typescript
// In presence-channel.ts
private startHeartbeat(): void {
  this.heartbeatInterval = setInterval(async () => {
    await supabase.rpc('update_last_seen');
  }, 60000); // Every 60 seconds
}
```

## Privacy Controls

Users can hide their online status:

1. Go to Profile Settings
2. Find "Online Presence" section
3. Toggle "Show my online status"

When disabled:
- User appears offline to others
- User's `last_seen_at` not shared
- User can still see others' presence

## Reconnection

The presence channel handles reconnection with exponential backoff:

```typescript
private async reconnect(): Promise<void> {
  const delays = [1000, 2000, 4000, 8000, 16000, 30000];

  for (const delay of delays) {
    await sleep(delay);
    try {
      await this.connect(this.userId!);
      return;
    } catch (error) {
      console.warn('Reconnect failed, retrying...');
    }
  }
}
```

## Localization

**English:**
```typescript
const translations = {
  en: {
    online: 'Online',
    lastSeen: 'Last seen {time}',
    justNow: 'just now',
    minutesAgo: '{count} minutes ago',
    hoursAgo: '{count} hours ago',
    daysAgo: '{count} days ago',
    showOnlineStatus: 'Show my online status',
    showOnlineStatusDescription: 'Let family members see when you\'re online',
  },
};
```

**Russian:**
```typescript
const translations = {
  ru: {
    online: 'Онлайн',
    lastSeen: 'Был(а) {time}',
    justNow: 'только что',
    minutesAgo: '{count} мин. назад',
    hoursAgo: '{count} ч. назад',
    daysAgo: '{count} дн. назад',
    showOnlineStatus: 'Показывать мой статус онлайн',
    showOnlineStatusDescription: 'Позвольте родственникам видеть, когда вы онлайн',
  },
};
```

## Sizes

The presence dot scales with avatar size:

| Avatar Size | Dot Size | Position |
|-------------|----------|----------|
| xs (24px) | 6px | bottom-right |
| sm (32px) | 8px | bottom-right |
| md (40px) | 10px | bottom-right |
| lg (48px) | 12px | bottom-right |
| xl (64px) | 14px | bottom-right |

## Performance

1. **Batched queries** - `useLastSeen` batches user IDs
2. **Caching** - Last seen data cached for 60 seconds
3. **Lazy loading** - Presence only tracked for visible users
4. **Connection reuse** - Single Realtime channel for all presence

## Testing

### Manual Testing Checklist

- [ ] Login shows green dot on own avatar
- [ ] Other logged-in users show green dot
- [ ] Logout changes status to "Last seen..."
- [ ] Privacy toggle hides presence
- [ ] Hidden users show no presence indicator
- [ ] Tooltip shows correct time format
- [ ] Works after page refresh
- [ ] Reconnects after network interruption

### Unit Tests

```typescript
// tests/unit/presence.spec.ts
describe('usePresence', () => {
  it('tracks online users', async () => {
    const { result } = renderHook(() => usePresence());

    // Simulate user joining
    act(() => {
      presenceChannel.emit('join', 'user-123');
    });

    expect(result.current.isOnline('user-123')).toBe(true);
  });
});
```

## Troubleshooting

### Users Not Showing Online

1. Check Supabase Realtime is enabled
2. Verify user has `show_online_status = true`
3. Check browser console for WebSocket errors
4. Ensure RLS policies allow presence queries

### Presence Not Updating

1. Check heartbeat interval is running
2. Verify `update_last_seen()` function exists
3. Check network connectivity
4. Clear browser cache and reconnect

## Future Improvements

1. **Typing indicators** - Show when user is typing
2. **Activity status** - "Viewing family tree", "Editing profile"
3. **Custom status** - "Away", "Do not disturb"
4. **Presence history** - When was user last active this week
5. **Mobile push** - Notify when specific users come online
