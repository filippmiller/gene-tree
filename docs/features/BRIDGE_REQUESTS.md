# Family Bridge Requests

> **Feature ID:** Sprint4-B1
> **Status:** Complete
> **Added:** February 2, 2026

## Overview

Family Bridge Requests enable users to discover and connect with potential relatives across different family trees. The system uses intelligent matching based on shared attributes (last name, maiden name, birth place, etc.) to suggest potential connections, and provides a request/approval workflow for establishing verified relationships.

This feature supports Gene-Tree's viral growth strategy by:
- Connecting separate family tree fragments
- Discovering distant relatives
- Building a network effect across families
- Enabling organic tree expansion

## Architecture

```
+------------------------------------------------------------------+
|                        User Interface                             |
|                                                                   |
|  +---------------------------+    +----------------------------+  |
|  | Dashboard Widget          |    | Connections Page           |  |
|  | BridgeDiscoveryWidget     |    | /[locale]/connections      |  |
|  |                           |    |                            |  |
|  | - Potential matches count |    | +------------------------+ |  |
|  | - Top 3 candidates        |    | | BridgeRequestsList     | |  |
|  | - "Connect" button        |    | | (sent/received)        | |  |
|  +---------------------------+    | +------------------------+ |  |
|              |                    | | BridgeDiscoveryWidget  | |  |
|              v                    | | (full list)            | |  |
|  +---------------------------+    | +------------------------+ |  |
|  | SendBridgeRequestModal    |    +----------------------------+  |
|  | - Target profile info     |                |                   |
|  | - Relationship claim      |                v                   |
|  | - Ancestor hint           |    +----------------------------+  |
|  | - Supporting info         |    | BridgeAcceptModal          |  |
|  +---------------------------+    | - Select relationship type |  |
|                                   | - Response message         |  |
|                                   +----------------------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                          API Layer                                |
|                                                                   |
|  GET  /api/bridges/discover      - Find potential matches        |
|  GET  /api/bridges/requests      - List requests (sent/received) |
|  POST /api/bridges/requests      - Send new request              |
|  PATCH /api/bridges/requests/[id] - Accept/reject/withdraw       |
|  DELETE /api/bridges/requests/[id] - Delete request              |
|  GET  /api/bridges/counts        - Get pending counts            |
|  POST /api/bridges/block         - Block a user                  |
|  DELETE /api/bridges/block       - Unblock a user                |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     Database (Supabase)                           |
|                                                                   |
|  +------------------------+   +-----------------------------+     |
|  | bridge_requests        |   | bridge_candidates           |     |
|  |------------------------|   |-----------------------------|     |
|  | id (UUID)              |   | id (UUID)                   |     |
|  | requester_id (FK)      |   | user_id (FK)                |     |
|  | target_user_id (FK)    |   | candidate_user_id (FK)      |     |
|  | claimed_relationship   |   | match_score                 |     |
|  | common_ancestor_hint   |   | match_reasons (JSONB)       |     |
|  | supporting_info        |   | is_dismissed                |     |
|  | status                 |   +-----------------------------+     |
|  | expires_at             |                                       |
|  +------------------------+   +-----------------------------+     |
|                               | bridge_blocked_users        |     |
|  +------------------------+   |-----------------------------|     |
|  | relationships          |   | user_id (FK)                |     |
|  | (created on accept)    |   | blocked_user_id (FK)        |     |
|  +------------------------+   | reason                      |     |
|                               +-----------------------------+     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                   Discovery Algorithm                             |
|                                                                   |
|  fn_find_bridge_candidates(user_id) -> candidates[]              |
|                                                                   |
|  Scoring:                                                        |
|  - Same last name:    20 points                                  |
|  - Same maiden name:  25 points                                  |
|  - Same birth place:  15 points                                  |
|  - Shared ancestors:  10 points each (max 40)                    |
|                                                                   |
|  Minimum threshold: 15 points                                    |
|  Maximum results: 20 candidates                                  |
+------------------------------------------------------------------+
```

## Database Schema

### `bridge_requests` Table

```sql
CREATE TABLE IF NOT EXISTS public.bridge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request content
  claimed_relationship TEXT NOT NULL,
  common_ancestor_hint TEXT,
  supporting_info TEXT,

  -- Status workflow
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'expired', 'withdrawn'
  )),
  responded_at TIMESTAMPTZ,
  response_message TEXT,
  established_relationship_type TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Prevent duplicate pending requests
  CONSTRAINT unique_pending_request UNIQUE (requester_id, target_user_id, status)
);
```

### `bridge_candidates` Table

```sql
CREATE TABLE IF NOT EXISTS public.bridge_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Matching data
  match_score DECIMAL(5,2) DEFAULT 0.0,
  match_reasons JSONB DEFAULT '[]'::jsonb,

  -- User can dismiss suggestions
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_candidate UNIQUE (user_id, candidate_user_id)
);
```

### `bridge_blocked_users` Table

```sql
CREATE TABLE IF NOT EXISTS public.bridge_blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_block UNIQUE (user_id, blocked_user_id)
);
```

### Discovery Function

```sql
CREATE OR REPLACE FUNCTION public.find_bridge_candidates(p_user_id UUID)
RETURNS TABLE (
  candidate_id UUID,
  match_score DECIMAL(5,2),
  match_reasons JSONB
) AS $$
-- Compares user profiles to find potential relatives
-- Scoring based on:
-- - Same last name: 20 points
-- - Same maiden name: 25 points
-- - Same birth place: 15 points
-- - Shared deceased ancestors in pending_relatives: 10 points each
--
-- Excludes:
-- - Already connected users
-- - Blocked users (both directions)
-- - Users with pending/rejected requests
-- - Users who opted out of matching
--
-- Returns top 20 candidates with score >= 15
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### Accept Function

```sql
CREATE OR REPLACE FUNCTION public.accept_bridge_request(
  p_request_id UUID,
  p_relationship_type TEXT,
  p_response_message TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
-- Updates request status to 'accepted'
-- Creates verified relationship in relationships table
-- Returns success/failure with details
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Counts Function

```sql
CREATE OR REPLACE FUNCTION public.get_bridge_request_counts(p_user_id UUID)
RETURNS JSONB AS $$
-- Returns counts for dashboard widget:
-- - pending_received: requests awaiting user's response
-- - pending_sent: requests user sent, awaiting response
-- - potential_matches: undismissed candidates
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

## Files

### Types

**`src/types/bridge-request.ts`**

```typescript
// Request status
export type BridgeRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';

// Match reason types
export type MatchReasonType =
  | 'same_last_name'
  | 'same_maiden_name'
  | 'same_birth_place'
  | 'shared_ancestor'
  | 'same_location'
  | 'email_domain';

export interface MatchReason {
  type: MatchReasonType;
  value: string;
  details?: string;
}

export interface BridgeRequest {
  id: string;
  requester_id: string;
  target_user_id: string;
  claimed_relationship: string;
  common_ancestor_hint: string | null;
  supporting_info: string | null;
  status: BridgeRequestStatus;
  responded_at: string | null;
  response_message: string | null;
  established_relationship_type: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface DiscoveryResult {
  candidate_id: string;
  match_score: number;
  match_reasons: MatchReason[];
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    birth_place: string | null;
  };
}

export interface BridgeRequestCounts {
  pending_received: number;
  pending_sent: number;
  potential_matches: number;
}

// Relationship types for bridge connections
export const BRIDGE_RELATIONSHIP_TYPES = [
  'distant_cousin',
  'second_cousin',
  'third_cousin',
  'cousin_removed',
  'extended_family',
  'step_family',
  'in_law',
  'other',
] as const;
```

### Hooks

**`src/hooks/useBridgeRequests.ts`**

```typescript
// Discovery hook
export function useBridgeDiscovery(): {
  candidates: DiscoveryResult[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

// Requests management hook
export function useBridgeRequests(filter: 'sent' | 'received' | 'all'): {
  requests: BridgeRequestWithProfiles[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  sendRequest: (payload: SendBridgeRequestPayload) => Promise<BridgeRequest>;
  acceptRequest: (requestId: string, payload: AcceptBridgeRequestPayload) => Promise<void>;
  rejectRequest: (requestId: string, message?: string) => Promise<void>;
  withdrawRequest: (requestId: string) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
};

// Counts hook for dashboard
export function useBridgeCounts(): {
  counts: BridgeRequestCounts;
  loading: boolean;
  refetch: () => Promise<void>;
};

// Blocking hook
export function useBridgeBlocking(): {
  blockUser: (userId: string, reason?: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  loading: boolean;
};
```

### Components

| Component | Path | Description |
|-----------|------|-------------|
| `BridgeDiscoveryWidget` | `src/components/bridges/BridgeDiscoveryWidget.tsx` | Dashboard widget showing potential matches |
| `SendBridgeRequestModal` | `src/components/bridges/SendBridgeRequestModal.tsx` | Modal to send connection request |
| `BridgeRequestCard` | `src/components/bridges/BridgeRequestCard.tsx` | Individual request card |
| `BridgeAcceptModal` | `src/components/bridges/BridgeAcceptModal.tsx` | Modal to accept request with relationship type |
| `BridgeRequestsList` | `src/components/bridges/BridgeRequestsList.tsx` | List of sent/received requests |
| `BridgeCelebration` | `src/components/bridges/BridgeCelebration.tsx` | Celebration animation on connection |

### Pages

| Page | Path | Description |
|------|------|-------------|
| Connections | `src/app/[locale]/(protected)/connections/page.tsx` | Full connections management page |

## Component Props

### BridgeDiscoveryWidget

```typescript
// No props - uses hooks internally
// Displays on dashboard as a card
```

### SendBridgeRequestModal

```typescript
interface SendBridgeRequestModalProps {
  open: boolean;
  onClose: () => void;
  candidate: DiscoveryResult;
  onSuccess?: () => void;
}
```

### BridgeAcceptModal

```typescript
interface BridgeAcceptModalProps {
  open: boolean;
  onClose: () => void;
  request: BridgeRequestWithProfiles;
  onAccept: (relationshipType: string, message?: string) => Promise<void>;
}
```

### BridgeRequestCard

```typescript
interface BridgeRequestCardProps {
  request: BridgeRequestWithProfiles;
  type: 'sent' | 'received';
  onAccept?: (request: BridgeRequestWithProfiles) => void;
  onReject?: (requestId: string) => void;
  onWithdraw?: (requestId: string) => void;
  onDelete?: (requestId: string) => void;
  locale?: string;
}
```

## API Endpoints

### `GET /api/bridges/discover`

Find potential bridge candidates for the current user.

**Response:**
```json
{
  "candidates": [
    {
      "candidate_id": "uuid",
      "match_score": 45.0,
      "match_reasons": [
        { "type": "same_last_name", "value": "Smith" },
        { "type": "same_birth_place", "value": "Moscow" }
      ],
      "profile": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Smith",
        "avatar_url": "https://...",
        "birth_place": "Moscow"
      }
    }
  ]
}
```

### `POST /api/bridges/requests`

Send a new bridge request.

**Request:**
```json
{
  "target_user_id": "uuid",
  "claimed_relationship": "I believe we're second cousins...",
  "common_ancestor_hint": "Our shared ancestor might be Ivan Petrov...",
  "supporting_info": "My grandmother mentioned..."
}
```

**Response:**
```json
{
  "success": true,
  "request": { ... }
}
```

### `GET /api/bridges/requests`

List bridge requests.

**Query Parameters:**
- `filter`: `'sent'` | `'received'` | `'all'` (default: `'all'`)

**Response:**
```json
{
  "requests": [
    {
      "id": "uuid",
      "requester_id": "uuid",
      "target_user_id": "uuid",
      "claimed_relationship": "...",
      "status": "pending",
      "requester": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Smith",
        "avatar_url": "..."
      },
      "target": { ... }
    }
  ]
}
```

### `PATCH /api/bridges/requests/[id]`

Update request status (accept, reject, withdraw).

**Accept Request:**
```json
{
  "relationship_type": "second_cousin",
  "response_message": "Welcome to the family!"
}
```

**Reject/Withdraw Request:**
```json
{
  "status": "rejected",
  "response_message": "Sorry, I don't recognize this connection"
}
```

### `GET /api/bridges/counts`

Get counts for dashboard widget.

**Response:**
```json
{
  "counts": {
    "pending_received": 3,
    "pending_sent": 1,
    "potential_matches": 12
  }
}
```

### `POST /api/bridges/block`

Block a user from sending requests.

**Request:**
```json
{
  "blocked_user_id": "uuid",
  "reason": "Spam requests"
}
```

## Match Scoring

| Signal | Points | Notes |
|--------|--------|-------|
| Same last name | 20 | Case-insensitive comparison |
| Same maiden name | 25 | Important for tracing female lineage |
| Same birth place | 15 | City-level match |
| Shared deceased ancestor | 10 each | Max 40 points (4 ancestors) |
| **Minimum threshold** | 15 | Below this, no suggestion shown |
| **Maximum score** | 100 | Normalized to percentage |

## Localization

### English (`en`)

```typescript
{
  title: 'Family Connections',
  description: 'We found people who might be related to you',
  foundPotential: 'Found {count} potential connections',
  noCandidates: 'No potential connections found yet',
  noCandidatesHint: 'As more families join, we may find relatives for you',
  viewAll: 'View All',
  connect: 'Connect',
  pendingRequests: '{count} pending request(s)',
  matchReasons: {
    same_last_name: 'Same last name',
    same_maiden_name: 'Same maiden name',
    same_birth_place: 'Same birth place',
    shared_ancestor: 'Shared ancestor',
    same_location: 'Same location',
    email_domain: 'Same organization',
  },
  // Send modal
  sendTitle: 'Send Bridge Request',
  sendDescription: 'Connect with a potential family member',
  relationshipLabel: 'How do you think you are related?',
  relationshipPlaceholder: 'I believe we might be second cousins through our grandparents...',
  ancestorHintLabel: 'Common ancestor hint (optional)',
  supportingInfoLabel: 'Additional information (optional)',
  send: 'Send Request',
  // Accept modal
  acceptTitle: 'Accept Connection',
  selectRelationship: 'Select relationship type',
  relationshipTypes: {
    distant_cousin: 'Distant Cousin',
    second_cousin: 'Second Cousin',
    third_cousin: 'Third Cousin',
    extended_family: 'Extended Family',
    in_law: 'In-law',
    other: 'Other Relation',
  },
}
```

### Russian (`ru`)

```typescript
{
  title: 'Семейные связи',
  description: 'Мы нашли людей, которые могут быть вашими родственниками',
  foundPotential: 'Найдено {count} потенциальных связей',
  noCandidates: 'Пока не найдено потенциальных связей',
  noCandidatesHint: 'По мере присоединения семей мы можем найти ваших родственников',
  viewAll: 'Смотреть все',
  connect: 'Связаться',
  pendingRequests: '{count} ожидающий(-их) запрос(-ов)',
  matchReasons: {
    same_last_name: 'Одинаковая фамилия',
    same_maiden_name: 'Одинаковая девичья фамилия',
    same_birth_place: 'Одно место рождения',
    shared_ancestor: 'Общий предок',
    same_location: 'Одна локация',
    email_domain: 'Одна организация',
  },
  // Send modal
  sendTitle: 'Отправить запрос на связь',
  sendDescription: 'Свяжитесь с потенциальным родственником',
  relationshipLabel: 'Как, по-вашему, вы связаны?',
  relationshipPlaceholder: 'Я думаю, мы можем быть троюродными через наших бабушек...',
  ancestorHintLabel: 'Подсказка о общем предке (необязательно)',
  supportingInfoLabel: 'Дополнительная информация (необязательно)',
  send: 'Отправить запрос',
  // Accept modal
  acceptTitle: 'Принять связь',
  selectRelationship: 'Выберите тип родства',
  relationshipTypes: {
    distant_cousin: 'Дальний родственник',
    second_cousin: 'Троюродный брат/сестра',
    third_cousin: 'Четвероюродный брат/сестра',
    extended_family: 'Дальняя родня',
    in_law: 'Родственник по браку',
    other: 'Другое родство',
  },
}
```

## Request Status Workflow

```
                   +-------------+
                   |   pending   |
                   +------+------+
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
    +-----------+   +-----------+   +------------+
    | accepted  |   | rejected  |   | withdrawn  |
    +-----------+   +-----------+   +------------+
                          |
                          v
                    +-----------+
                    |  expired  | (after 30 days)
                    +-----------+
```

## Testing Checklist

### Discovery
- [ ] Candidates load on dashboard widget
- [ ] Match reasons display correctly
- [ ] Match score displays as badge
- [ ] "View All" navigates to connections page
- [ ] Empty state shows when no candidates

### Send Request
- [ ] Modal opens with candidate info
- [ ] Relationship field is required
- [ ] Ancestor hint is optional
- [ ] Supporting info is optional
- [ ] Success toast shows on send
- [ ] Error handling works

### Receive Request
- [ ] Pending requests show in list
- [ ] Request details display correctly
- [ ] Accept modal opens
- [ ] Relationship type selection works
- [ ] Response message is optional
- [ ] Reject with reason works
- [ ] Success toast shows on accept/reject

### Request Management
- [ ] Sent requests show in list
- [ ] Withdraw sent request works
- [ ] Delete request works
- [ ] Status badges display correctly
- [ ] Expired requests marked correctly

### Blocking
- [ ] Block user works
- [ ] Blocked user not shown in candidates
- [ ] Blocked user cannot send requests
- [ ] Unblock works

### Integration
- [ ] Accepted request creates relationship
- [ ] Users appear in each other's family trees
- [ ] Celebration animation plays on accept

## Privacy Considerations

1. **Opt-out**: Users can disable relative matching in preferences
2. **Limited Info**: Only name and birth place shown to non-connected users
3. **Blocking**: Users can block others from sending requests
4. **Expiration**: Requests expire after 30 days
5. **No Email Exposure**: Email addresses never shared

## Future Improvements

1. **DNA Integration**: Match based on uploaded DNA data
2. **Photo Matching**: AI face recognition for old photos
3. **Tree Overlap Detection**: Automatic detection of overlapping trees
4. **Smart Suggestions**: ML-based relationship predictions
5. **Group Bridges**: Connect entire branches at once
6. **Pending Verification**: Multi-step verification for high-confidence matches
7. **Notification System**: Email/push when new matches found
8. **Match Quality Score**: Show confidence level to users
9. **Historical Records**: Integration with Ancestry/FamilySearch data
10. **Location Clustering**: Suggest based on geographic proximity
