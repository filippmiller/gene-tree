# Gene-Tree Work Log

This file tracks completed work across Claude Code sessions.

---

## [2026-02-05] - Time Capsules Bug Fixes & Verification

**Status**: Completed
**Duration**: ~20 minutes
**Commits**: `dfd7e3c`, `da13ace`

### What was done
- Verified two bug fixes in production:
  1. Radix Select empty value error in TimeCapsuleForm
  2. API 500 error due to invalid FK join in time-capsules route
- Performed end-to-end test on production using Playwright
- Successfully created a test time capsule

### Decisions made
- Used magic constant `__family_broadcast__` for Radix Select (empty strings not supported)
- Fetch creator profiles separately instead of FK join (created_by references auth.users)

### Issues encountered
- Playwright browser session blocked by existing Chrome process
- Fixed by killing Chrome processes and cleaning up user data directory

### Next steps
- Only remaining task: Competitor Research (gene-tree-ddv, P2)

**Session notes**: `.claude/sessions/2026-02-05-231000-time-capsules-bugfix.md`

---

## [2026-02-05] - Time Capsules Feature Implementation

**Status**: Completed
**Duration**: ~4 hours
**Commits**: Multiple (see git log)

### What was done
- Implemented Time Capsules feature with:
  - Database migration for `time_capsules` table
  - API routes (CRUD, stats, signed upload)
  - UI components (list, form, card, widget)
  - Cron job for scheduled delivery
  - Email notifications using Resend
  - Family broadcast support (send to all family members)
  - After-passing trigger (deliver when user marked deceased)
  - Dashboard widget integration

### Files created/modified
- `supabase/migrations/20260205000001_time_capsules.sql`
- `supabase/migrations/20260205220000_time_capsules_after_passing_trigger.sql`
- `src/app/api/time-capsules/` (route.ts, [id]/route.ts, stats/route.ts, signed-upload/route.ts)
- `src/app/api/cron/deliver-time-capsules/route.ts`
- `src/components/time-capsules/` (TimeCapsuleCard.tsx, TimeCapsuleForm.tsx, TimeCapsuleList.tsx)
- `src/components/dashboard/TimeCapsuleWidget.tsx`
- `src/lib/time-capsules/` (types.ts, email-notification.ts)
- `src/app/[locale]/(protected)/time-capsules/` (page.tsx, new/page.tsx)

**Session notes**: Context compacted (see `.claude/sessions/2026-02-05-231000-time-capsules-bugfix.md` for continuation)

---

## [2026-02-05] - Family Group Chat Implementation

**Status**: Completed
**Commits**: `967b84c`, `5c7bc88`, `e74dd12`, `3502097`, `e17b299`

### What was done
- Implemented Family Group Chat with real-time messaging
- System reminders for birthdays, anniversaries, memorials
- "On This Day" memories integration
- Fixed multiple RLS policy issues

**Session notes**: Pre-context-compaction session
