# Sources of Truth

> **APPEND-ONLY**: Document where authoritative information lives. Mark outdated sources as `[DEPRECATED]`.

---

## Database Schema

- **Primary Source**: `supabase/migrations/` (34 migration files)
- **Types**: `src/types/supabase.ts`
- **Setup Guide**: `docs/ops/supabase-setup.md`
- **Connection**: Environment variables `SUPABASE_URL`, `DATABASE_URL`

## API Endpoints

- **Primary Source**: `src/app/api/` (Next.js App Router API routes)
- **Documentation**: `docs/_library/API.md`

## Authentication

- **Primary Source**: `src/lib/supabase/` (client configurations)
- **Flow Documentation**: `docs/AUTH_FLOW.md`
- **Helper Functions**: `src/lib/auth.supabase.ts`

## Environment Variables

- **Template**: `.env.example`
- **Production**: `.env.production` (secrets - NOT in git)
- **Required Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (client-safe)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key (client-safe)
  - `SUPABASE_URL` - Server-side Supabase URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Admin key (server-only, NEVER expose)
  - `DATABASE_URL` - Direct PostgreSQL connection string
  - `CRON_SECRET` - Optional, for scheduled jobs

## Deployment

- **Platform**: Railway
- **Config**: `railway.json`
- **Docker**: `Dockerfile` (multi-stage, Node 20 Alpine)
- **CI/CD**: `.github/workflows/ci.yml`
- **Quickstart**: `docs/ops/railway-quickstart.md`

## External Services

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| Supabase | Database, Auth, Storage | `.env.*`, `docs/ops/supabase-setup.md` |
| Railway | Hosting, Deployment | `railway.json`, `docs/ops/railway-quickstart.md` |
| GitHub Actions | CI/CD Pipeline | `.github/workflows/ci.yml` |

## Internationalization

- **Messages**: `src/messages/{locale}/` (en, ru)
- **Config**: `src/i18n/request.ts`
- **Documentation**: `docs/LOCALIZATION.md`

## Architecture Documentation

- **Overview**: `docs/arch/overview.md`
- **Decisions**: `docs/DECISIONS.md`
- **System Functionality**: `docs/SYSTEM_FUNCTIONALITY.md`

---

## Scan History

### [SCAN-001] 2026-01-13 - Initial Repository Scan

**Detected Components**:
- Framework: Next.js 15.0.3 (App Router)
- Database: Supabase PostgreSQL
- Migrations: 34 files in `supabase/migrations/`
- API Routes: 39 endpoints in `src/app/api/`
- Components: shadcn/ui + custom
- Deployment: Railway + Docker

---

<!-- New scan results will be appended here -->


### [SCAN-1768302600062] 2026-01-13 - Bootstrap Scan

**Scan Timestamp**: 2026-01-13T11:10:00.061Z

**API Routes Found**: 40
- `/api/auth/session`
- `/api/avatar/upload`
- `/api/health`
- `/api/health/db`
- `/api/invitations/accept`
- `/api/invitations/reject`
- `/api/invites/accept`
- `/api/invites/decline`
- `/api/invites/my-pending`
- `/api/kin/resolve`
- `/api/library/ingest`
- `/api/library/query`
- `/api/media/approve`
- `/api/media/commit`
- `/api/media/pending`
- `/api/media/process-jobs`
- `/api/media/reject`
- `/api/media/set-avatar`
- `/api/media/signed-upload`
- `/api/media/stories/[...path]`
- `/api/notifications`
- `/api/notifications/read`
- `/api/profile/complete`
- `/api/profile/quick-setup`
- `/api/relationships`
- `/api/relationships-depth`
- `/api/relationships-temp`
- `/api/relationships/[id]`
- `/api/relatives`
- `/api/stories`

*... and 10 more*

**Migrations Found**: 35
- `migrations/001_education_residence_schema.sql`
- `supabase/migrations/0010_kinship_search.sql`
- `supabase/migrations/0012_tree_views_corrected.sql`
- `supabase/migrations/0013_depth_functions.sql`
- `supabase/migrations/0014_fix_views_pending_relatives.sql`
- `supabase/migrations/0015_merge_relationships_tables.sql`
- `supabase/migrations/0016_merge_tables_with_flags.sql`
- `supabase/migrations/0017_add_user_roles.sql`
- `supabase/migrations/0018_extended_profile_fields.sql`
- `supabase/migrations/0019_avatars_storage.sql`
- `supabase/migrations/001_invitation_based_tree.sql`
- `supabase/migrations/0020_fix_user_profiles_rls.sql`
- `supabase/migrations/0021_fix_rls_recursion.sql`
- `supabase/migrations/0022_media_storage_system.sql`
- `supabase/migrations/0023_media_rls_policies.sql`

*... and 20 more*

**Library Files** (src/lib/): 23
- `src/lib/audit/logger.ts`
- `src/lib/auth.supabase.ts`
- `src/lib/auth.ts`
- `src/lib/build-info.ts`
- `src/lib/env.client.ts`
- `src/lib/env.server.ts`
- `src/lib/library/index.ts`
- `src/lib/locale-detection.ts`
- `src/lib/logger.ts`
- `src/lib/notifications.ts`
- `src/lib/relationships/computeRelationship.ts`
- `src/lib/relationships/generateLabel.ts`
- `src/lib/relationships/kinshipMapping.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/error-handler.ts`
- `src/lib/supabase/server-admin.ts`
- `src/lib/supabase/server-ssr.ts`
- `src/lib/types/supabase.ts`
- `src/lib/types/supabase_fresh.ts`

*... and 3 more*

**Config Files Found**:
- `Dockerfile`
- `eslint.config.mjs`
- `next.config.ts`
- `playwright.config.ts`
- `postcss.config.mjs`
- `src/lib/relationships/kinship-config.json`
- `supabase/config.toml`
- `tailwind.config.ts`
- `tsconfig.json`
- `tsconfig.tsbuildinfo`

**Environment Files**:
- `.env.example`
- `.env.local`
- `.env.production`

---