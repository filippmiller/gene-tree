# Technical Changelog - gene-tree

This file tracks all significant system changes, issues, and resolutions for collaboration with technical advisors.

---

## 2025-11-12 08:24 UTC - RLS Migration Failed: Table Not Found

### Problem
Attempted to apply RLS recursion fix migration but got error:
```
ERROR: 42P01: relation "public.user_profiles" does not exist
```

### Context
- Migration file: `supabase/migrations/20251112000000_fix_rls_recursion_combined.sql`
- Issue: Migration references `public.user_profiles` but table doesn't exist with that name
- Root cause: Schema mismatch - need to identify correct table name

### Investigation Needed
1. Check actual table name in Supabase (might be `persons`, `profiles`, or different schema)
2. Review existing migrations to find table creation/naming
3. Update migration with correct table reference

### Files Affected
- `supabase/migrations/20251112000000_fix_rls_recursion_combined.sql`

### Current State
- ❌ Migration not applied
- ❌ RLS recursion bug still active
- ❌ Avatar uploads still broken

### Next Steps
- [x] Query Supabase to get actual table name → Found: `public.user_profiles` exists in migration but not in production DB
- [x] Root cause: Base migration `001_invitation_based_tree.sql` not applied to production
- [x] Solution: Created `20251112010000_ensure_user_profiles_table.sql` - creates table if missing
- [ ] **ACTION REQUIRED**: Apply migrations in Supabase SQL Editor in this order:
  1. `20251112010000_ensure_user_profiles_table.sql` (creates table)
  2. `20251112000000_fix_rls_recursion_combined.sql` (fixes recursion)
- [ ] Test avatar upload after migrations

---

## 2025-11-12 08:00 UTC - RLS Infinite Recursion Fix Created

### Problem
Avatar uploads failing with `infinite recursion detected in policy for relation "user_profiles"`

### Root Cause
```
storage upload → storage policy → current_user_is_admin()
    → user_profiles query → user_profiles policy → current_user_is_admin()
    → infinite loop
```

### Solution Implemented
1. Drop "Admins have full access" policy on user_profiles (causes recursion)
2. Rewrite `current_user_is_admin()` with `SECURITY DEFINER` to bypass RLS
3. Remove admin checks from storage.objects policies
4. Use simple `auth.uid()` checks instead

### Files Changed
- Created: `supabase/migrations/20251112000000_fix_rls_recursion_combined.sql`
- Commit: 8ca822b
- Pushed to Railway: ✅

### Current State
- ✅ Code deployed to Railway
- ❌ SQL migration not yet applied (table name issue)

---

## 2025-11-11 22:00 UTC - Avatar Upload Rewritten for RLS

### Changes
- Rewrote `src/app/api/avatar/upload/route.ts` to use SSR client instead of admin client
- Added explicit TypeScript types to fix "never" type error
- Path structure: `{user.id}/avatar.{ext}` with upsert
- Removed `photos` table tracking

### Files Changed
- `src/app/api/avatar/upload/route.ts`
- Commits: 6620eec, 80f26a2

### Issues Encountered
- TypeScript type inference broken for Supabase client
- Solution: Cast via `as unknown as SupabaseClient<Database>`

---

## 2025-11-11 - Auth Flow Stabilization

### Issues Fixed
- Login loop (user signs in but redirected back)
- Session cookie not synced between client/server
- Hydration errors in protected routes

### Solution
- Created `/api/auth/session` endpoint for server-side session sync
- Centralized auth guard in protected layout
- Changed `getUser()` to `getSession()` (reads cookies directly)

### Files Changed
- `src/app/api/auth/session/route.ts` (created)
- `src/app/[locale]/(auth)/sign-in/page.tsx`
- `src/app/[locale]/(protected)/layout.tsx`

---

## Technical Debt & Known Issues

### CRITICAL
- [ ] RLS recursion bug (migration pending)
- [ ] Next.js 15.0.3 has 7 CVEs (upgrade to 15.5.6 needed)

### HIGH
- [ ] Missing security headers (CSP, X-Frame-Options, HSTS)
- [ ] 40+ TypeScript `any` usages need proper typing

### MEDIUM
- [ ] Unused dependencies: @radix-ui/react-icons, zustand
- [ ] No automated tests for critical paths
- [ ] .env.production in git history (verify no secrets)

---

## Environment Info

**Stack:**
- Next.js 15.0.3
- React 18.2.0
- Supabase (PostgreSQL + Auth + Storage)
- Railway (deployment)

**Supabase Project:**
- Reference: mbntpsfllwhlnzuzspvp
- Region: us-east-2

**Repository:**
- GitHub: filippmiller/gene-tree
- Branch: main
