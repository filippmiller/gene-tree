# API Endpoints Reference

> **APPEND-ONLY**: Document all API endpoints. Mark deprecated endpoints as `[DEPRECATED]`.

---

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://gene-tree-production.up.railway.app`

---

## Authentication

### POST /api/auth/session
Get current user session.

**Response**: `{ user: User | null }`

---

## Relationships & Family Tree

### GET /api/relationships
Get all relationships for current user.

**Response**: `{ relationships: Relationship[] }`

### POST /api/relationships
Create a new relationship.

**Body**: `{ to_user_id: string, relationship_type: string }`

**Response**: `{ relationship: Relationship }`

### GET /api/relationships/[id]
Get specific relationship.

### GET /api/relationships-depth
Get relationships organized by genealogical depth.

### GET /api/relatives
Get list of relatives for current user.

### POST /api/kin/resolve
Calculate kinship between two users.

**Body**: `{ from_id: string, to_id: string }`

**Response**: `{ relationship: string, path: string[] }`

---

## Media Management

### POST /api/media/signed-upload
Generate signed URL for file upload.

**Body**: `{ filename: string, content_type: string }`

**Response**: `{ upload_url: string, storage_path: string }`

### POST /api/media/commit
Confirm upload completion.

**Body**: `{ storage_path: string }`

### POST /api/media/approve
Approve photo (moderator action).

**Body**: `{ photo_id: string }`

### POST /api/media/reject
Reject photo with reason.

**Body**: `{ photo_id: string, reason: string }`

### GET /api/media/pending
Get photos pending moderation.

### POST /api/media/set-avatar
Set profile avatar from existing photo.

**Body**: `{ photo_id: string }`

### POST /api/media/process-jobs
Process background media jobs (internal/cron).

### GET /api/media/stories/[...path]
Serve media story files.

---

## Voice Stories

### POST /api/voice-stories/signed-upload
Get signed URL for voice recording upload.

**Body**: `{ filename: string, duration_seconds: number }`

### POST /api/voice-stories/commit
Finalize voice story upload.

**Body**: `{ storage_path: string, subject_id: string }`

---

## Avatars

### POST /api/avatar/upload
Direct avatar upload endpoint.

**Body**: FormData with `file`

**Response**: `{ avatar_url: string }`

---

## Stories (Text)

### GET /api/stories
Get stories (with optional filters).

### POST /api/stories
Create new story.

**Body**: `{ subject_id: string, title: string, content: string }`

### GET /api/stories/[id]/approve
Approve story.

### GET /api/stories/[id]/reject
Reject story.

### GET /api/stories/pending
Get stories pending moderation.

### GET /api/stories/profile/[id]
Get stories for specific profile.

---

## Invitations

### POST /api/invitations/accept
Accept family invitation.

**Body**: `{ invitation_id: string }`

### POST /api/invitations/reject
Reject family invitation.

**Body**: `{ invitation_id: string }`

### POST /api/invites/accept
Accept invite (alternative endpoint).

### POST /api/invites/decline
Decline invite.

### GET /api/invites/my-pending
Get current user's pending invites.

---

## Profile

### POST /api/profile/quick-setup
Quick profile setup for new users.

**Body**: `{ first_name: string, last_name: string }`

### POST /api/profile/complete
Complete profile with all details.

**Body**: Full profile object

---

## User & Notifications

### GET /api/user/locale
Get/set user locale preference.

### GET /api/users
Search/list users.

### GET /api/notifications
Get user notifications.

### POST /api/notifications/read
Mark notifications as read.

**Body**: `{ notification_ids: string[] }`

---

## Tree Data

### GET /api/tree-data
Get full tree visualization data.

**Response**: `{ nodes: Node[], edges: Edge[] }`

### GET /api/tree
Tree endpoint (alternative).

---

## Health Checks

### GET /api/health
Basic health check.

**Response**: `{ status: "ok" }`

### GET /api/health/db
Database connectivity check.

**Response**: `{ status: "ok", latency_ms: number }`

---

## Library (Knowledge Base)

### GET /api/library/query
Query the knowledge base.

**Query Params**:
- `keywords` (required): Comma-separated search terms
- `top_k` (optional): Max results (default: 8)

**Response**:
```json
{
  "matches": [
    {
      "topic": "string",
      "score": 0.95,
      "excerpt": "string",
      "file": "string",
      "anchor": "string"
    }
  ],
  "suggested_keywords": ["string"]
}
```

### POST /api/library/ingest
Ingest new knowledge into the library.

**Headers**: `Authorization: Bearer {LIBRARY_TOKEN}` (if configured)

**Body**: See Ingest Contract in `docs/AGENT_RULES_LIBRARY.md`

**Response**:
```json
{
  "ok": true,
  "ingested_id": "INGEST-001",
  "topics_added": ["string"],
  "files_updated": ["string"]
}
```

---

### [2026-01-13] INGEST-001

#### GET /api/library/query
Search knowledge base by keywords (PULL operation for agents)

**Input**: keywords (comma-separated), top_k (optional, default 8)

**Output**: { matches: [{topic, score, excerpt, file, anchor}], suggested_keywords }

#### POST /api/library/ingest
Add new knowledge to library (PUSH operation for agents)

**Input**: IngestPayload JSON with source, keywords, artifacts, knowledge, tags

**Output**: { ok, ingested_id, topics_added, files_updated }

#### GET /api/library/index
List all knowledge domain files with metadata


**Output**: { domains: [{name, filename, type, size, sizeKB, lastModified, description}] }

#### GET /api/library/domain/[name]
Get content of a specific knowledge domain file


**Output**: { name, filename, type, content, size, lastModified }

#### GET /api/library/sessions
List agent activity sessions from ingest log


**Output**: { sessions: [{id, timestamp, agent, commit, branch, keywords, summary, filesChanged, topicsUpdated}] }

---

## API Additions Log

### [2026-01-13] Library Endpoints Added

- `GET /api/library/query` - Knowledge base search
- `POST /api/library/ingest` - Knowledge ingestion

---

<!-- New endpoint documentation will be appended here -->
