# Gene-Tree Knowledge Base

> **APPEND-ONLY**: New entries are added at the top. Never delete or overwrite existing content.
> Mark outdated information as `[DEPRECATED]` or `[SUPERSEDED BY: section-name]`.

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
