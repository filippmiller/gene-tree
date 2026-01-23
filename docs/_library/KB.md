# Gene-Tree Knowledge Base

> **APPEND-ONLY**: New entries are added at the top. Never delete or overwrite existing content.
> Mark outdated information as `[DEPRECATED]` or `[SUPERSEDED BY: section-name]`.

---

## [2026-01-23] FEATURE DESIGN: Memories System (Attach Media to Family Members)

**Ingest ID**: DESIGN-001
**Tags**: `feature-design`, `memories`, `media`, `stories`, `tree`, `privacy`, `ux`, `architecture`
**Entry Type**: discovery
**Status**: PROPOSED (not implemented)

### Summary

Multi-agent brainstorming session (10 iterations) to design a "Memories" feature that allows users to attach photos, audio, and video to family members directly from the tree view. The recommendation is to **extend the existing Stories system** rather than building a new infrastructure.

### The Problem

Users viewing the family tree want to quickly attach contextual media (photos, audio, video) to family members. Current flow requires navigating away from the tree.

### Recommended Architecture

#### Core Principle: Memories ARE Stories

Don't create a new system. Extend the `stories` table with a `story_type` field:

```sql
-- 1. Extend stories table
ALTER TABLE stories ADD COLUMN story_type VARCHAR DEFAULT 'story';
-- Values: 'memory' (lightweight), 'story' (rich), 'document' (archival)

-- 2. Per-person consent tracking
CREATE TABLE story_person_visibility (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  person_id UUID REFERENCES profiles(id),
  status VARCHAR DEFAULT 'pending', -- pending, approved, rejected
  responded_at TIMESTAMPTZ,
  PRIMARY KEY (story_id, person_id)
);
```

#### Privacy Model

| Scenario | Behavior |
|----------|----------|
| Self-only memory | Instant publish |
| Tag living relative | Pending until they approve |
| Tag deceased person | Visible to immediate family |
| Ghost profile tagged | Memory waits for profile claim |

**Key insight**: No spam emails to unclaimed profiles. Memories become a "surprise" on signup.

### Backend API Design

```
POST /api/memories
- person_ids: UUID[]
- caption?: string
- media_type: image | audio | video
→ Returns upload URL, creates story with type='memory'

PATCH /api/memories/:id/visibility
- person_id: UUID
- status: approved | rejected
→ Each tagged person controls their own visibility

GET /api/memories?person_id=X
→ Returns memories visible to current user for that person
```

### Frontend Component Design

**Entry Point**: Tree node panel → "Add Memory" button (person pre-selected)

**UX Flow (3 clicks)**:
1. Click person in tree
2. Click "Add Memory" in side panel
3. Upload media + optional caption → Submit

**Component Hierarchy**:
```
TreePage
└── TreeCanvas (existing)
└── PersonDetailPanel (enhance)
    ├── PersonInfo (existing)
    ├── PersonMemories (NEW - shows existing memories)
    └── AddMemoryButton (NEW)
        └── onClick → opens AddMemoryModal

AddMemoryModal (NEW)
├── MediaUploader (existing, reuse)
├── PersonSelector (KinshipSearchField, multi-select mode)
├── CaptionInput (simple textarea)
└── SubmitButton
```

### Edge Case: Person Not in Tree

For users who want to tag someone not yet in the tree:

1. "Add Memory" modal has "Person not listed?" link
2. Opens inline AddRelativeForm
3. User creates person with relationship type
4. Returns to modal with new person selected
5. Memory creation continues

**Safeguard**: New person must have at least one relationship (to current user) to prevent orphans.

### Notifications

Required notification types:
- `memory_tagged`: "You were tagged in a memory by [name]"
- `memory_approved`: "Your memory was approved by [name]"
- `family_memory_added`: "[Name] added a memory of [deceased relative]"

**Batching**: Multiple memories → digest notification, not individual spam.

### Files to Modify (Implementation)

| File | Change |
|------|--------|
| `supabase/migrations/` | Add `story_type` column, create `story_person_visibility` table |
| `src/app/api/memories/route.ts` | NEW - Create memory endpoint |
| `src/app/api/memories/[id]/visibility/route.ts` | NEW - Visibility approval |
| `src/components/tree/PersonDetailPanel.tsx` | ADD memory gallery + button |
| `src/components/stories/AddMemoryModal.tsx` | NEW - Memory creation modal |
| `src/components/stories/MediaUploader.tsx` | Reuse as-is |
| `src/lib/notifications.ts` | Add memory notification types |

### Effort Estimate

| Component | Complexity |
|-----------|------------|
| Backend (extend stories, new endpoints) | 3-5 days |
| Frontend (modal, panel, notifications) | 5-7 days |
| Privacy/visibility system | 2-3 days |
| **Total MVP** | ~2 weeks |

### Open Questions (for Product)

1. **Storage limits** — Should users have quotas per family?
2. **Comments/reactions** — Should memories have engagement features?
3. **Search** — Transcribe audio/video for searchability?
4. **AI tagging** — Auto-detect faces? (Privacy concerns)

### Strategic Alignment

This feature directly supports the **north star metric**: *Families with 10+ verified profiles and 5+ stories*

Memories lower the barrier to content creation:
- Simpler than full stories
- Tree integration encourages spontaneous additions
- Consent model builds trust
- Ghost profile tagging drives viral signup

### Agent Consensus

All 4 agents (Judge, Lead, Senior Programmer, Critic Architect) agreed on:
1. Extend Stories, don't build new system
2. Entry point = tree node panel
3. Privacy = per-person approval
4. MVP = existing relatives; v1.1 = inline person creation

---

## [2026-01-23] SYSTEM ARCHITECTURE MAP

**Ingest ID**: MAP-001
**Tags**: `architecture`, `system-map`, `onboarding`, `reference`

### System Overview

Gene-Tree is a **privacy-first digital genealogy platform** targeting Russian-speaking diaspora (US, Germany, Israel) and privacy-conscious families. The platform enables verified family tree building with cultural kinship awareness.

### Core Philosophy (5 Pillars)

| Pillar | Description |
|--------|-------------|
| **Privacy-First** | Every data field has explicit privacy controls |
| **Cultural Awareness** | Kinship terminology respects Russian complexity (15+ cousin terms) |
| **Verification-Based Trust** | Two-way relationship confirmation required |
| **Preservation Over Perfection** | Support uncertain dates, approximate data, gaps |
| **Stories Matter** | Photos, voice recordings, memories — not just names and dates |

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 + App Router | Full-stack React with SSR |
| UI | TailwindCSS + shadcn/ui + Radix | Premium component system |
| Database | PostgreSQL (Supabase) | Primary data store with RLS |
| Auth | Supabase Auth (JWT) | Email/password authentication |
| Storage | Supabase Storage | Avatars (public), media (private) |
| Visualization | D3.js + ELK.js + XYFlow | Interactive family tree |
| i18n | next-intl | English + Russian localization |
| Deployment | Railway | Docker-based CI/CD |

### Directory Structure

```
src/
├── app/
│   ├── api/                    # 43 REST API routes
│   │   ├── auth/               # Session management
│   │   ├── relationships/      # Family connections
│   │   ├── media/              # Photo/story upload & moderation
│   │   ├── invites/            # Invitation system
│   │   ├── library/            # Knowledge base API
│   │   └── health/             # Health checks
│   └── [locale]/               # i18n pages (en, ru)
│       ├── (auth)/             # Sign-in, sign-up (public)
│       └── (protected)/        # Auth-gated routes
│           ├── dashboard/      # Main dashboard
│           ├── tree/           # Family tree visualization
│           ├── profile/        # User profile
│           ├── relations/      # Relationship management
│           └── admin/          # Admin tools (librarian)
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── tree/                   # D3 visualization components
│   ├── profile/                # Profile forms (education, residence, bio)
│   ├── stories/                # Media management
│   ├── relatives/              # Add relative forms
│   └── notifications/          # Notification UI
├── lib/
│   ├── supabase/               # 3 client types (browser, SSR, admin)
│   ├── relationships/          # Kinship computation engine
│   ├── invitations/            # SMS (Twilio) + Email (Resend)
│   ├── library/                # Knowledge base system
│   └── notifications.ts        # Family circle fan-out
├── messages/                   # i18n JSON (en, ru)
└── types/                      # TypeScript interfaces
```

### Database Schema (Key Tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_profiles` | Core user data | first_name, last_name, privacy settings |
| `pending_relatives` | Unified relationships | invited_by, relationship_type, relationship_status |
| `relationships` | [DEPRECATED] | Use pending_relatives instead |
| `invitations` | Email invites | token, expires_at, accepted_at |
| `photos` | Photo storage | storage_path, moderation_status |
| `stories` | Text stories | subject_id, content, approved |
| `voice_stories` | Audio recordings | storage_path, duration_seconds |
| `notifications` | System notifications | type, target_user_id |
| `notification_recipients` | Fan-out table | notification_id, user_id, read_at |
| `education` | Education history | institution_name, degree, years |
| `residences` | Residence history | city, country, date range |
| `audit_logs` | Action logging | action, user_id, entity_type |

### API Endpoints Summary

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Auth | `/api/auth/session` | Session management |
| Relationships | `/api/relationships`, `/api/relatives`, `/api/kin/resolve` | Family connections |
| Media | `/api/media/*`, `/api/avatar/upload` | Photo/story uploads |
| Voice | `/api/voice-stories/*` | Audio recording |
| Invitations | `/api/invites/*`, `/api/invitations/*` | Family invitations |
| Profile | `/api/profile/*` | User profile management |
| Tree | `/api/tree`, `/api/tree-data` | Tree visualization data |
| Notifications | `/api/notifications/*` | User notifications |
| Library | `/api/library/*` | Knowledge base |
| Health | `/api/health`, `/api/health/db` | System health |

### Core Functions (Business Logic)

| Function | Location | Purpose |
|----------|----------|---------|
| `computeRelationship()` | `lib/relationships/computeRelationship.ts` | Calculate indirect relationships |
| `generateKinshipLabel()` | `lib/relationships/generateLabel.ts` | Generate culturally-aware labels |
| `sendSmsInvite()` | `lib/invitations/sms.ts` | Twilio SMS delivery |
| `sendEmailInvite()` | `lib/invitations/email.ts` | Resend email delivery |
| `createNotification()` | `lib/notifications.ts` | Create and fan-out notifications |
| `getSupabaseAdmin()` | `lib/supabase/server-admin.ts` | Admin client (bypasses RLS) |
| `getSupabaseSSR()` | `lib/supabase/server-ssr.ts` | SSR client (respects RLS) |
| `queryLibrary()` | `lib/library/index.ts` | Knowledge base search |
| `ingestKnowledge()` | `lib/library/index.ts` | Knowledge base ingestion |

### Data Flows

```
1. AUTH FLOW
   Email/Password → Supabase Auth → JWT Cookie → Protected Routes

2. RELATIONSHIP FLOW
   Add Relative → pending_relatives (status: pending) → Invitation →
   User Accepts → pending_relatives (status: verified)

3. MEDIA FLOW
   Signed Upload → Storage → Commit → Moderation Queue →
   Approve/Reject → Public/Deleted

4. TREE VISUALIZATION
   user_profiles + pending_relatives → Build Graph →
   ELK.js Layout → D3.js Render

5. KINSHIP COMPUTATION
   Source User → BFS Traversal → Path Finding →
   Relationship Rules → Cultural Label (EN/RU)
```

### Current Phase: Foundation (Q1 2026)

**Priorities from Master Plan:**
1. Privacy-first positioning
2. PostgreSQL recursive CTEs (performance)
3. Guided onboarding wizard
4. Observability infrastructure

### North Star Metric

> **Families with 10+ verified profiles and 5+ stories**

### Pain Points / Technical Debt

| Issue | Location | Severity |
|-------|----------|----------|
| ~350 ESLint warnings | Various | LOW |
| `any` types in legacy code | API routes | MEDIUM |
| Deprecated `relationships` table | Migration 0015+ | LOW |
| Voice story recording incomplete | `VoiceStoryRecorder.tsx` | MEDIUM |
| Education/Residence UI incomplete | Profile components | LOW |

### Key Environment Variables

```
# Client (public)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Server (secret)
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL

# Invitations
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
RESEND_API_KEY
INVITES_MAX_PER_DAY
```

### Essential Commands

```powershell
npm install           # Install dependencies
npm run dev           # Start dev server (localhost:3000)
npm run typecheck     # TypeScript check
npm run lint          # ESLint
npm run build         # Production build
npm run library:bootstrap  # Scan repo and update knowledge base
```

---

## [2026-01-17] Session: Deploy Verification & Codebase Analysis

**Ingest ID**: INGEST-002
**Commit**: `ffd4b26`
**Tags**: `bugfix`, `deploy`, `analysis`, `documentation`

### Issue Fixed

**Problem**: Build failed with `prefer-const` linter error
- **File**: `src/lib/library/index.ts:194`
- **Error**: `'excerpt' is never reassigned. Use 'const' instead.`
- **Fix**: Changed `let excerpt: string[] = []` to `const excerpt: string[] = []`

The array was being mutated via `.push()` but never reassigned, so `const` is correct.

### Codebase Architecture Summary

#### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.0.3 (App Router) |
| UI | Radix UI + Tailwind CSS |
| Auth | Supabase Auth (@supabase/ssr) |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (avatars, stories buckets) |
| i18n | next-intl (ru, en) |
| Visualization | D3.js + elkjs |
| State | React hooks (minimal) |

#### Directory Structure
```
src/
├── app/
│   ├── api/              # 43 API route handlers
│   └── [locale]/         # i18n pages
│       ├── (auth)/       # Sign-in, sign-up
│       └── (protected)/  # Auth-gated routes
├── components/
│   ├── ui/               # Radix wrappers
│   ├── tree/             # D3 visualization
│   ├── profile/          # Profile forms
│   ├── stories/          # Media management
│   └── relationships/    # Family connections
├── lib/
│   ├── supabase/         # 3 client types (browser, SSR, admin)
│   ├── relationships/    # Kinship computation
│   ├── library/          # Knowledge base system
│   └── notifications.ts  # Family circle fan-out
├── messages/             # i18n JSON (en, ru)
└── types/                # TypeScript interfaces
```

#### Core Data Flows
1. **Auth**: Email/password → Supabase Auth → JWT cookies
2. **Profile**: user_profiles table with privacy settings per field
3. **Relationships**: invitations → relationships (bidirectional)
4. **Media**: signed-upload → commit → moderation (pending → approved)
5. **Tree**: user_profiles + pending_relatives → D3 nodes/edges
6. **Kinship**: BFS graph traversal with Russian terminology support

#### Database Tables (34 migrations)
- `user_profiles` - Core user data
- `relationships` - Family connections
- `pending_relatives` - Unregistered family members
- `invitations` - Email invites with tokens
- `photos`, `stories`, `voice_stories` - Media with moderation
- `notifications` + `notification_recipients` - Event fan-out

#### Environment Variables
```
# Client (public)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Server (secret)
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

#### Deployment
- **Platform**: Railway
- **Container**: Docker (node:20-alpine, multi-stage)
- **Port**: 3000
- **CI**: Build with 350 warning threshold

### ESLint Status

~350 warnings (within threshold), mostly:
- `@typescript-eslint/no-explicit-any` - Untyped legacy code
- `@typescript-eslint/no-unused-vars` - Dead code
- `@next/next/no-img-element` - Native img tags

No blocking errors after fix.

### Files Changed
- `src/lib/library/index.ts` (1 line fix)

---

## [2026-01-13] Implemented complete Librarian knowledge base system with API endpoints, admin UI dashboard, and agent integration rules

**Ingest ID**: INGEST-001
**Commit**: `0e07b11`
**Tags**: `librarian`, `api`, `admin-ui`, `documentation`, `feature`, `infrastructure`

## Librarian System Implementation

### Overview
The Librarian is a knowledge management system that enables AI agents to share institutional knowledge across sessions. It follows an **append-only** architecture to preserve history.

### Architecture

#### 4-Layer Design:
1. **Local Knowledge Store** (`docs/_library/`)
   - KB.md - Main knowledge base (new entries prepended)
   - INDEX.json - Topic index for keyword search
   - INGEST_LOG.md - Audit trail of all ingestions
   - SOURCES.md - Sources of truth (DB, env, configs)
   - SCHEMA.md - Database schema documentation
   - API.md - API endpoints reference
   - FLOWS.md - Data flows and background processes

2. **API Layer** (`src/app/api/library/`)
   - query/route.ts - Keyword search with scoring
   - ingest/route.ts - Knowledge ingestion with validation
   - index/route.ts - Domain listing
   - domain/[name]/route.ts - Domain content retrieval
   - sessions/route.ts - Session history parsing

3. **Core Library** (`src/lib/library/index.ts`)
   - queryLibrary() - Search with relevance scoring
   - ingestKnowledge() - Append to all relevant files
   - scanRepository() - Find API routes, migrations, configs
   - bootstrapLibrary() - Initial repo scan

4. **Admin UI** (`/admin/librarian`)
   - Tabs: Knowledge Base | Agent Sessions
   - Domain viewer with syntax highlighting
   - Session details with metadata display

### Key Design Decisions

1. **Append-Only Storage**: Never delete or overwrite - mark as DEPRECATED instead
2. **File-Based**: No database dependency, works in any environment
3. **Token Protection**: Optional LIBRARY_TOKEN for production ingestion
4. **Relevance Scoring**: Keywords matched against topic index with partial matching

### Agent Protocol

**PULL** (session start):
```
1. Extract keywords from user prompt
2. GET /api/library/query?keywords=...
3. Read matches and suggested_keywords
4. Load referenced files if needed
```

**PUSH** (after commit):
```
1. Prepare IngestPayload with:
   - source: {agent, repo, branch, commit}
   - keywords: relevant terms
   - artifacts: {files_changed, endpoints_added, db_changes, flows}
   - knowledge: {summary, details_md}
   - tags: category labels
2. POST /api/library/ingest
3. Verify response shows files_updated
```

### Files Created
- 19 files, +3194 lines of code
- Commit: 0e07b11

### Testing Commands
```bash
# Query the library
curl 'http://localhost:3000/api/library/query?keywords=auth,login'

# List domains
curl 'http://localhost:3000/api/library/index'

# Get domain content
curl 'http://localhost:3000/api/library/domain/KB'

# View sessions
curl 'http://localhost:3000/api/library/sessions'
```

### UI Access
Admin dashboard: `/{locale}/admin/librarian`

### Bootstrap
```bash
npm run library:bootstrap
```
Scans repo and updates SOURCES.md with discovered components.

### Files Changed
- `src/lib/library/index.ts`
- `src/app/api/library/query/route.ts`
- `src/app/api/library/ingest/route.ts`
- `src/app/api/library/index/route.ts`
- `src/app/api/library/domain/[name]/route.ts`
- `src/app/api/library/sessions/route.ts`
- `src/app/[locale]/(protected)/admin/librarian/page.tsx`
- `src/app/[locale]/(protected)/admin/librarian/LibrarianDashboard.tsx`
- `docs/_library/KB.md`
- `docs/_library/INDEX.json`
- `docs/_library/INGEST_LOG.md`
- `docs/_library/SOURCES.md`
- `docs/_library/SCHEMA.md`
- `docs/_library/API.md`
- `docs/_library/FLOWS.md`
- `docs/AGENT_RULES_LIBRARY.md`
- `docs/library_endpoint.md`
- `scripts/library_bootstrap.ts`
- `package.json`

### Endpoints Added
- **GET /api/library/query**: Search knowledge base by keywords (PULL operation for agents)
- **POST /api/library/ingest**: Add new knowledge to library (PUSH operation for agents)
- **GET /api/library/index**: List all knowledge domain files with metadata
- **GET /api/library/domain/[name]**: Get content of a specific knowledge domain file
- **GET /api/library/sessions**: List agent activity sessions from ingest log



### Flows Added/Modified
- **Agent PULL Flow** (Agent session start (after first user prompt)): Agent extracts 3-15 keywords from prompt, calls GET /api/library/query, reads returned matches and referenced files before working
- **Agent PUSH Flow** (After git commit+push): Agent prepares ingest payload with files_changed, endpoints_added, db_changes, knowledge summary, calls POST /api/library/ingest
- **Library Bootstrap Flow** (Manual via npm run library:bootstrap): Scans repository for API routes, migrations, components, configs, env files. Appends results to SOURCES.md

---

## [2026-01-13] Initial Knowledge Base Setup

### Project Overview

**Gene-Tree** is a genealogical social platform for building and visualizing family trees. Built with:

- **Framework**: Next.js 15.0.3 (App Router, TypeScript strict)
- **Database**: Supabase (PostgreSQL with RLS)
- **UI**: React 18 + shadcn/ui + Tailwind CSS
- **Visualization**: D3.js + @xyflow/react
- **i18n**: next-intl (en, ru)
- **Deployment**: Railway (Docker, GitHub Actions CI/CD)

### Authentication

- Supabase Auth with email/password
- Three client types:
  - Browser client (`src/lib/supabase/browser.ts`) - client-side, ANON key
  - SSR client (`src/lib/supabase/server-ssr.ts`) - server components, respects RLS
  - Admin client (`src/lib/supabase/server-admin.ts`) - API routes, bypasses RLS
- Session stored in cookies, validated server-side
- Protected routes under `src/app/[locale]/(protected)/`

### Database

- 34+ migrations in `supabase/migrations/`
- Key tables: `user_profiles`, `relationships`, `pending_relatives`, `photos`, `stories`, `voice_stories`, `notifications`
- Storage buckets: `avatars` (public), `media` (private, signed URLs)
- RLS policies for data isolation

### Family Tree

- Invitation-based tree building
- Relationship types: parent, child, spouse, sibling
- Kinship calculation in `src/lib/relationships/`
- Tree visualization via D3.js in `src/app/[locale]/(protected)/tree/`

### Media System

- Photo upload flow: signed URL -> upload -> commit -> moderation
- Avatar direct upload to `avatars` bucket
- Voice stories with audio recording
- Background job queue (`media_jobs` table)
- Moderation workflow: pending -> approve/reject

### API Structure

- All endpoints in `src/app/api/`
- ~39 routes covering: auth, relationships, media, stories, invitations, notifications
- Health checks at `/api/health` and `/api/health/db`

### Internationalization

- Locale routing: `/[locale]/...`
- Messages in `src/messages/{en,ru}/`
- Locale detection and switching supported

### Components

- shadcn/ui components in `src/components/ui/`
- Custom components organized by feature
- Providers in `src/components/providers/`

---

<!-- END OF INITIAL KNOWLEDGE BASE -->
