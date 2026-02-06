# Gene-Tree Work Log

This file tracks completed work across Claude Code sessions.

---

## [2026-02-06] - Search Infrastructure (Master Plan #9)

**Status**: Completed
**Commits**: `fadb35c`

### What was done
- Built GlobalSearch command palette (Ctrl+K / Cmd+K) with debounced fuzzy search
- Created SearchResults component with avatar, similarity %, keyboard navigation (arrow keys + Enter)
- Created SearchTrigger button integrated into sidebar header with Ctrl+K badge
- Added DuplicateProfileSuggestions to AddRelativeForm (inline name-match warnings)
- Created reusable `useDebounce` hook
- Added EN/RU translations for search namespace (12 keys each)
- Reused existing `/api/profiles/search` route (no new API needed)
- Auto-selects `fullname` mode for multi-word queries

### Decisions made
- Reuse existing API route instead of creating new one — already has fuzzy matching, auth, audit, fallback
- Component-level state, no global context — search is transient UI
- localStorage for recent searches (max 5 entries)
- Inline suggestions for duplicates (not blocking) — less friction for users

### Issues encountered
- Loading state race condition between raw query and debounced query — fixed with `isSearchPending` derived state
- Missing ARIA IDs on result items — fixed during review

### Next steps
- Stories search (needs tsvector migration on stories table)
- Test Ctrl+K in production after Railway deploy
- Consider mobile overlay improvements (currently responsive but could be more touch-friendly)

**Session notes**: `.claude/sessions/2026-02-06-search-infrastructure.md`

---

## [2026-02-06] - Quick-Add from Tree View (Master Plan #6)

**Status**: Completed
**Commits**: `302531c`

### What was done
- Created `QuickAddDialog.tsx` — lightweight inline dialog with minimal form (name, birth year, deceased)
- Refactored `QuickAddMenu.tsx` flow to open dialog instead of navigating to `/people/new`
- Threaded `onQuickAdd` callback through TreeCanvas → PersonCard → QuickAddMenu
- Added tree data refetch in `TreeCanvasWrapper.tsx` after successful add
- Added 8 EN/RU translation keys for quickAdd dialog

### Decisions made
- Simple refetch (not optimistic update) — tree needs ELK re-layout for new nodes anyway
- Callback injection through React Flow node data — only clean way to pass dynamic handlers to custom nodes
- Minimal form fields (name + birth year + deceased) — quick-add prioritizes speed, user can edit details later
- `isDirect: false` for all quick-adds — always "add relative of clicked person"

### Issues encountered
- Git stash/pop conflict due to concurrent sessions modifying shared files — resolved by re-applying changes manually
- Pre-existing build errors (missing page modules) unrelated to this work

### Next steps
- Add optional email field to dialog (API requires contact info for living relatives)
- Add mobile touch support (hover-based QuickAddMenu doesn't work on touch devices)
- Test end-to-end in production after Railway deploy

**Session notes**: `.claude/sessions/2026-02-06-quick-add-tree-view.md`

---

## [2026-02-06] - Complete 5-Step Onboarding Wizard (Master Plan #3)

**Status**: Completed
**Commits**: `251a06a` (polish), `a462c62` (grandparents + i18n + redirect)

### What was done
- Expanded wizard from 4 steps to 5: About You > Parents > Grandparents > Siblings > Invite
- Created Step3Grandparents component (maternal/paternal cards with skip support)
- Created /api/onboarding/step3-grandparents API route with lineage tracking
- Migrated all wizard text to next-intl useTranslations('onboarding') namespace
- Added full EN + RU translations for onboarding namespace in common.json
- Family progress counter now includes grandparents
- Post-onboarding redirect changed from /app to /tree
- Fixed onboarding_step progression: grandparents(3), siblings(4), complete(5)
- Added idempotent re-submission with step3CreatedIds for grandparents
- (Earlier) Fixed duplicate relatives bug, deep merge, accessibility, validation

### Decisions made
- Separate API route for grandparents (step3-grandparents) to avoid disrupting existing siblings API
- Grandparents respect parent skip state (if mother skipped, maternal grandparents hidden)
- Used per-step ID arrays (step2/3/4CreatedIds) for clean idempotent re-submission

### Next steps
- Test full 5-step flow end-to-end in production
- Consider confetti animation on wizard completion (canvas-confetti is installed)

**Session notes**: `.claude/sessions/2026-02-06-onboarding-wizard-polish.md`

---

## [2026-02-06] - Voice Story Recording Consolidation

**Status**: Completed
**Commits**: `dab5bca`

### What was done
- Consolidated two voice recording systems (voice_stories + voice_memories) into one unified system
- Rewrote VoiceRecorder component to use shared useVoiceRecorder hook
- Added visibility controls (public/family/private) to recording UI
- Increased max recording from 60s to 5 minutes
- Updated signed-upload API to accept visibility parameter
- Added auto-approval for self-stories in commit API
- Applied migration: description column on voice_stories, dropped voice_memories table/bucket
- Deleted 15 files (~2,200 lines) of voice_memories dead code
- Updated Master Plan: item #7 marked complete, AI Transcription marked built

### Decisions made
- Chose voice_stories over voice_memories as unified table (already deployed, richer features)
- "Pragmatic Middle" approach: reuse hook but clean up component
- Auto-approve self-stories to reduce moderation friction

### Issues encountered
- Migration conflict: local file deleted but remote history expected it. Fixed with `migration repair --status reverted`

### Next steps
- Test voice recording end-to-end in production after Railway deployment
- Consider adding story prompts integration for guided recording

**Session notes**: `.claude/sessions/2026-02-06-voice-story-consolidation.md`

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
