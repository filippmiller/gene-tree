# Family Messaging System

> **Feature ID:** Sprint2-D2
> **Status:** ✅ Complete
> **Added:** February 2, 2026

## Overview

The Family Messaging System enables private, real-time communication between family members within Gene-Tree. It uses Supabase Realtime for instant message delivery and provides a familiar chat interface.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Header Nav                               │
│  ┌─────────┐                                                    │
│  │ InboxBtn│ ← Unread count badge                               │
│  │   (3)   │                                                    │
│  └────┬────┘                                                    │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   InboxDrawer (Sheet)                    │   │
│  │  ┌─────────────────┐  ┌───────────────────────────────┐ │   │
│  │  │   ThreadList    │  │      MessageThread            │ │   │
│  │  │  ┌───────────┐  │  │  ┌─────────────────────────┐  │ │   │
│  │  │  │ Thread 1  │──┼──┼▶ │ Messages                │  │ │   │
│  │  │  │ Thread 2  │  │  │  │ ┌───────────────────┐   │  │ │   │
│  │  │  │ Thread 3  │  │  │  │ │ Their message     │   │  │ │   │
│  │  │  └───────────┘  │  │  │ └───────────────────┘   │  │ │   │
│  │  └─────────────────┘  │  │      ┌───────────────┐  │  │ │   │
│  │                       │  │      │ Your message  │  │  │ │   │
│  │                       │  │      └───────────────┘  │  │ │   │
│  │                       │  │  ┌─────────────────────┐│  │ │   │
│  │                       │  │  │ Type a message... ▶││  │ │   │
│  │                       │  │  └─────────────────────┘│  │ │   │
│  │                       │  └───────────────────────────┘ │ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌──────────────────────────────────────┐
         │           Supabase Realtime          │
         │  ┌─────────────┐  ┌───────────────┐  │
         │  │ message_    │  │ family_       │  │
         │  │ threads     │  │ messages      │  │
         │  └─────────────┘  └───────────────┘  │
         └──────────────────────────────────────┘
```

## Database Schema

### Tables

**`message_threads`**
```sql
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id),
  participant_2 UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT participants_ordered CHECK (participant_1 < participant_2),
  CONSTRAINT unique_participants UNIQUE (participant_1, participant_2)
);
```

**`family_messages`**
```sql
CREATE TABLE family_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

### Functions

**`get_or_create_message_thread(user_a UUID, user_b UUID)`**

Returns existing thread or creates new one between two users.

### Indexes

```sql
-- Fast thread lookup for a user
CREATE INDEX idx_threads_participant_1 ON message_threads(participant_1);
CREATE INDEX idx_threads_participant_2 ON message_threads(participant_2);

-- Fast message lookup for a thread
CREATE INDEX idx_messages_thread ON family_messages(thread_id, created_at DESC);

-- Unread count optimization
CREATE INDEX idx_messages_unread ON family_messages(thread_id, from_user_id)
  WHERE read_at IS NULL;
```

### RLS Policies

```sql
-- Users can only see threads they participate in
CREATE POLICY "Users can view own threads"
  ON message_threads FOR SELECT
  USING (auth.uid() IN (participant_1, participant_2));

-- Users can only see messages in their threads
CREATE POLICY "Users can view messages in own threads"
  ON family_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = thread_id
      AND auth.uid() IN (participant_1, participant_2)
    )
  );

-- Users can only send messages in their threads
CREATE POLICY "Users can insert messages in own threads"
  ON family_messages FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM message_threads
      WHERE id = thread_id
      AND auth.uid() IN (participant_1, participant_2)
    )
  );
```

## API Endpoints

### `GET /api/messages/threads`

Fetch all threads for current user with last message preview.

**Response:**
```json
{
  "threads": [
    {
      "id": "uuid",
      "participant_1": "uuid",
      "participant_2": "uuid",
      "created_at": "2026-02-02T...",
      "updated_at": "2026-02-02T...",
      "other_participant": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "avatar_url": "https://..."
      },
      "last_message": {
        "content": "Hey!",
        "created_at": "2026-02-02T...",
        "from_user_id": "uuid"
      },
      "unread_count": 3
    }
  ]
}
```

### `POST /api/messages/threads`

Create or get existing thread with another user.

**Request:**
```json
{
  "recipient_id": "uuid"
}
```

**Response:**
```json
{
  "thread": { ... }
}
```

### `GET /api/messages/threads/[threadId]`

Get messages in a thread (paginated).

**Query params:** `?limit=50&before=messageId`

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "thread_id": "uuid",
      "from_user_id": "uuid",
      "content": "Hello!",
      "created_at": "2026-02-02T...",
      "read_at": null
    }
  ],
  "has_more": false
}
```

### `POST /api/messages/threads/[threadId]`

Send a message.

**Request:**
```json
{
  "content": "Hello!"
}
```

### `POST /api/messages/threads/[threadId]/read`

Mark all unread messages in thread as read.

### `GET /api/messages/unread-count`

Get total unread message count.

**Response:**
```json
{
  "count": 5
}
```

## React Hooks

### `useMessages()`

Main hook for managing threads and unread count.

```typescript
import { useMessages } from '@/hooks/useMessages';

function MyComponent() {
  const {
    threads,           // MessageThread[]
    unreadCount,       // number
    isLoading,         // boolean
    error,             // Error | null
    refreshThreads,    // () => Promise<void>
  } = useMessages();
}
```

### `useThreadMessages(threadId)`

Hook for managing messages within a single thread.

```typescript
import { useThreadMessages } from '@/hooks/useMessages';

function ChatView({ threadId }) {
  const {
    messages,          // FamilyMessage[]
    isLoading,         // boolean
    error,             // Error | null
    sendMessage,       // (content: string) => Promise<void>
    markAsRead,        // () => Promise<void>
    loadMore,          // () => Promise<void>
    hasMore,           // boolean
  } = useThreadMessages(threadId);
}
```

## Components

### `InboxButton`

Header button with unread badge.

```typescript
import { InboxButton } from '@/components/messaging';

// In Nav.tsx
<InboxButton />
```

### `InboxDrawer`

Slide-out drawer containing thread list or message view.

```typescript
import InboxDrawer from '@/components/messaging/InboxDrawer';

<InboxDrawer
  open={isOpen}
  onOpenChange={setIsOpen}
  threads={threads}
  isLoading={isLoading}
/>
```

### `ThreadList`

List of conversation threads.

```typescript
import ThreadList from '@/components/messaging/ThreadList';

<ThreadList
  threads={threads}
  onSelectThread={(thread) => setSelectedThread(thread)}
  currentUserId={userId}
/>
```

### `MessageThread`

Chat view with messages and input.

```typescript
import MessageThread from '@/components/messaging/MessageThread';

<MessageThread
  thread={selectedThread}
  currentUserId={userId}
  onBack={() => setSelectedThread(null)}
/>
```

## Real-time Updates

Messages are delivered in real-time using Supabase Realtime:

```typescript
// In useThreadMessages hook
useEffect(() => {
  const channel = supabase
    .channel(`thread:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'family_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        setMessages((prev) => [...prev, payload.new as FamilyMessage]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [threadId]);
```

## Localization

**`src/messages/en/common.json`**
```json
{
  "messaging": {
    "inbox": "Messages",
    "noMessages": "No messages yet",
    "noMessagesDescription": "Start a conversation with a family member",
    "typeMessage": "Type a message...",
    "send": "Send",
    "you": "You",
    "today": "Today",
    "yesterday": "Yesterday"
  }
}
```

**`src/messages/ru/common.json`**
```json
{
  "messaging": {
    "inbox": "Сообщения",
    "noMessages": "Нет сообщений",
    "noMessagesDescription": "Начните разговор с родственником",
    "typeMessage": "Введите сообщение...",
    "send": "Отправить",
    "you": "Вы",
    "today": "Сегодня",
    "yesterday": "Вчера"
  }
}
```

## Security

1. **RLS Policies** - Users can only access their own threads/messages
2. **Server-side validation** - All inputs validated before database operations
3. **Rate limiting** - Consider adding rate limits for message sending
4. **Content filtering** - Future: Add spam/abuse detection

## Testing

### Manual Testing Checklist

- [ ] Open inbox from header
- [ ] View empty state when no threads
- [ ] Create thread with another user
- [ ] Send message and see it appear
- [ ] Receive message in real-time
- [ ] See unread count update
- [ ] Mark messages as read
- [ ] Navigate back to thread list
- [ ] Verify read receipts work

### E2E Tests

```typescript
// tests/e2e/messaging.spec.ts
test('can send and receive messages', async ({ page, context }) => {
  // Login as user A
  // Open inbox
  // Start conversation with user B
  // Send message
  // Login as user B in new context
  // Verify message received
});
```

## Performance Considerations

1. **Pagination** - Messages loaded in batches of 50
2. **Indexes** - Optimized for common queries
3. **Realtime subscriptions** - Clean up on unmount
4. **Virtual scrolling** - Consider for long message lists

## Future Improvements

1. **Typing indicators** - Show when other user is typing
2. **Message reactions** - Add emoji reactions
3. **Image attachments** - Allow sending photos
4. **Group chats** - Multi-person conversations
5. **Push notifications** - Mobile notifications for new messages
6. **Message search** - Search through conversation history
7. **Message deletion** - Allow deleting own messages
