# Gene-Tree Knowledge Base

> **APPEND-ONLY**: New entries are added at the top. Never delete or overwrite existing content.
> Mark outdated information as `[DEPRECATED]` or `[SUPERSEDED BY: section-name]`.

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
