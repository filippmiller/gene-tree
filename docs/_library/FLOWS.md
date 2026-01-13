# Data Flows & Background Processes

> **APPEND-ONLY**: Document data flows, background jobs, cron tasks, and async processes.

---

## Authentication Flow

```
1. User submits credentials (sign-in/sign-up)
   └─> src/app/[locale]/(auth)/sign-in/page.tsx

2. Supabase Auth validates
   └─> src/lib/supabase/browser.ts

3. Session cookie set
   └─> Automatic via @supabase/ssr

4. Server validates on protected routes
   └─> src/lib/supabase/server-ssr.ts

5. API routes use admin client if needed
   └─> src/lib/supabase/server-admin.ts
```

---

## Photo Upload Flow

```
1. Client requests signed URL
   └─> POST /api/media/signed-upload

2. Client uploads directly to Supabase Storage
   └─> PUT {signed_url}

3. Client confirms upload
   └─> POST /api/media/commit

4. Photo enters moderation queue (status: pending)
   └─> photos table, status='pending'

5. Moderator reviews
   └─> POST /api/media/approve or /api/media/reject

6. Photo becomes visible (if approved)
   └─> status='approved'
```

---

## Avatar Upload Flow

```
1. Client uploads avatar directly
   └─> POST /api/avatar/upload (FormData)

2. Server uploads to 'avatars' bucket
   └─> Public bucket, immediate availability

3. user_profiles.avatar_url updated

4. Avatar visible immediately (no moderation)
```

---

## Voice Story Flow

```
1. Client records audio in browser
   └─> MediaRecorder API

2. Request signed URL
   └─> POST /api/voice-stories/signed-upload

3. Upload to storage
   └─> PUT {signed_url}

4. Commit with metadata
   └─> POST /api/voice-stories/commit
```

---

## Invitation Flow

```
1. User A invites User B (by email)
   └─> Creates pending_relatives record

2. Notification sent to User B
   └─> notifications table

3. User B accepts/rejects
   └─> POST /api/invitations/accept or /reject

4. If accepted:
   └─> relationships record created
   └─> Both users' trees updated
```

---

## Background Jobs (media_jobs)

```
Job Types:
- process_photo: EXIF stripping, resize
- generate_thumbnail: Create thumbnail versions
- cleanup_orphaned: Remove orphaned storage files

Trigger:
- POST /api/media/process-jobs (cron or manual)

Flow:
1. Job created with status='pending'
2. Worker picks up job
3. Processes payload
4. Updates status='completed' or 'failed'
```

---

## Tree Visualization Flow

```
1. Client loads tree page
   └─> src/app/[locale]/(protected)/tree/page.tsx

2. Fetches tree data
   └─> GET /api/tree-data

3. Server computes relationships
   └─> src/lib/relationships/computeRelationship.ts

4. Returns nodes and edges
   └─> { nodes: [...], edges: [...] }

5. D3.js renders visualization
   └─> elkjs for layout calculations
```

---

## Kinship Calculation Flow

```
1. Request kinship between two users
   └─> POST /api/kin/resolve

2. Build relationship graph
   └─> Query relationships table

3. Find shortest path
   └─> BFS/graph traversal

4. Generate human-readable label
   └─> src/lib/relationships/generateLabel.ts

5. Return relationship and path
```

---

## Locale Detection Flow

```
1. Request arrives
2. Check URL path for [locale]
3. If missing, detect from:
   - Cookie preference
   - Accept-Language header
   - Default (en)
4. Redirect to localized route
5. next-intl provides translations
```

---

## Library Knowledge Flow (NEW)

```
PULL (Agent starts work):
1. Agent receives user prompt
2. Extract keywords (3-15 terms)
3. GET /api/library/query?keywords=...
4. Receive relevant KB sections
5. Use knowledge to inform work

PUSH (Agent completes work):
1. Agent commits changes
2. Prepare ingest payload:
   - files_changed
   - endpoints_added
   - db_changes
   - knowledge summary
3. POST /api/library/ingest
4. Library updates:
   - INGEST_LOG.md (append)
   - KB.md (new section at top)
   - INDEX.json (topics updated)
```

---

## Flow Updates Log

### [2026-01-13] Library Flow Added

- Documented PULL/PUSH knowledge flow for agents
- Integrated with existing documentation

---

<!-- New flow documentation will be appended here -->
