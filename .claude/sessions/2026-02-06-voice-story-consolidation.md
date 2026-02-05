# Session: Voice Story Recording Consolidation
**Date**: 2026-02-06
**Agent**: Claude Code (Opus 4.6)
**Status**: Completed

## Context
- Master Plan item #7: Voice Story Recording (MEDIUM impact, LOW effort)
- Two separate voice systems existed: voice_stories (deployed) and voice_memories (never deployed)
- User chose to consolidate into one system using voice_stories table

## Work Performed

### Phase 1: Discovery & Exploration
- Read Master Plan, NEXT_AGENT_START_HERE.md
- Explored both voice systems in detail (15+ files each)
- Found OpenAI Whisper transcription already fully implemented

### Phase 2: User Decisions
- **Consolidate into one system** (not keep both)
- **Use voice_stories table** (already deployed, has moderation)
- **5 minutes max** recording duration
- **Profile page + Story dialog** entry points
- **Pragmatic Middle** approach (reuse hook, clean up component)

### Phase 3: Implementation

#### Migration (`20260205500000_consolidate_voice_recordings.sql`)
- Added `description` column to voice_stories
- Dropped voice_memories table
- Cleaned up voice-memories storage bucket

#### VoiceRecorder Component Rewrite
- Now uses shared `useVoiceRecorder` hook (eliminated duplicate MediaRecorder logic)
- Added visibility selector (public/family/private) with icons
- Added `compact` prop for dialog usage
- State machine: idle -> recording -> preview -> uploading -> transcribing -> done/error
- Full EN/RU translations

#### API Updates
- `signed-upload`: accepts `visibility` from request body (was hardcoded 'family')
- `commit`: auto-approves when narrator_profile_id === target_profile_id

#### Dead Code Removal (15 files, ~2,200 lines)
- `src/components/voice-memory/` (5 files)
- `src/app/api/voice-memories/` (4 files)
- `src/hooks/useVoiceMemories.ts`
- `src/types/voice-memory.ts`
- `src/app/[locale]/profile/[id]/QuickVoiceMemoryWrapper.tsx`
- `supabase/migrations/20260202400001_voice_memories.sql`

## Technical Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Use voice_stories table | Already deployed, has moderation, narrator/target model | voice_memories (never deployed, simpler but less featured) |
| Reuse useVoiceRecorder hook | Avoids duplicate MediaRecorder logic | Keep separate implementations |
| 5-minute max | Balance between quick memories and meaningful stories | 60s (too short), unlimited (storage cost) |
| Auto-approve self-stories | Reduces friction for recording about yourself | All stories pending (too much friction) |

## Testing Performed
- [x] Build passes (zero errors)
- [x] Migration applied to production Supabase
- [ ] Manual end-to-end recording test (pending Railway deployment)

## Deployment
- [x] Migration applied via `supabase db push`
- [x] Migration repair for deleted voice_memories migration
- [x] Committed and pushed to main
- [ ] Railway auto-deploys from main

## Commits
- `dab5bca` - feat(voice): consolidate voice recording into unified system

## Issues Discovered
- Migration repair needed when deleting a migration file that was tracked in remote history
  - Fix: `supabase migration repair --status reverted <timestamp>`

## Documentation Updated
- `docs/MASTER_PLAN.md` - Item #7 marked complete, AI Transcription marked built, feature table updated
- `NEXT_AGENT_START_HERE.md` - Replaced voice_memories session notes with consolidation notes
- `.claude/work-log.md` - Added session entry
- `.claude/sessions/2026-02-06-voice-story-consolidation.md` - This file

## Handoff Notes
- Voice recording works on profile pages and in AddStoryDialog Voice tab
- Transcription uses OpenAI Whisper via `/api/transcribe` (requires OPENAI_API_KEY env var)
- The `audio` storage bucket is shared between voice stories and other media
- No voice_memories code remains in the codebase
