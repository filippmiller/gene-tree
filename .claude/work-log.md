# Gene-Tree Work Log

This file tracks completed work across Claude Code sessions.

---

## [2026-02-06] - Polish Onboarding Wizard (Master Plan #3)

**Status**: Completed
**Beads**: gene-tree-ggb

### What was done
- Fixed critical duplicate relatives bug on back/forward wizard navigation
- Fixed hardcoded English error message (now bilingual EN/RU)
- Added deep merge for localStorage state recovery (prevents corruption crashes)
- Added server-side birth year validation (1850-current year range)
- Added trimmed name validation (whitespace-only names rejected)
- Added comprehensive accessibility attributes (aria-labels, role, tabIndex, keyboard handlers)
- Removed unused imports
- Added role="alert" to error messages

### Decisions made
- Split createdRelativeIds into per-step tracking (step2CreatedIds, step3CreatedIds) for idempotent re-submission
- API routes accept previousIds to delete before re-inserting (clean, backward-compatible)
- Deep merge validates each nested field type individually rather than trusting localStorage JSON structure

### Issues encountered
- Build has pre-existing next-font-manifest.json error (infrastructure, not related to changes)
- git stash/pop conflict due to linter auto-modifications -- resolved by reapplying changes from scratch

### Next steps
- Consider adding "reset wizard" button for stuck users
- Monitor for any edge cases in production

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
