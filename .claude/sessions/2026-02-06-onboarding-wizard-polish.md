# Session: gene-tree-ggb - Polish Onboarding Wizard (Master Plan #3)
**Date**: 2026-02-06
**Agent**: Claude Code
**Status**: Completed

## Context
- Onboarding wizard is Master Plan #3 priority for Q1 2026
- Wizard has 4 steps: About You, Parents, Siblings, Invite
- Full EN/RU bilingual support
- Uses localStorage for persistence across page refreshes

## Work Performed

### Phase 1: Comprehensive Code Review
- Read all 16 onboarding files (components, API routes, state management, layout)
- Identified 5 bugs and several improvement opportunities

### Phase 2: Critical Bug Fixes

#### Duplicate Relatives on Back/Forward Navigation (CRITICAL)
- **Problem**: When user submits Step 2/3, goes back, then submits again, duplicate records were created in pending_relatives
- **Root cause**: createdRelativeIds was a flat growing array with no idempotency
- **Fix**: Split into step2CreatedIds and step3CreatedIds; API routes now accept previousIds parameter and delete old records before inserting new ones
- **Files**: wizard-state.ts, OnboardingWizard.tsx, step2/route.ts, step3/route.ts

#### Hardcoded English Error Message
- **Problem**: "Please fill in your name" was not translated
- **Fix**: Added `nameRequired` to both EN and RU translation objects
- **Files**: OnboardingWizard.tsx

### Phase 3: Robustness Improvements

#### Deep Merge for localStorage State
- **Problem**: Shallow merge `{...defaultState, ...parsed}` could crash on corrupted nested data
- **Fix**: Implemented field-by-field deep merge with type checks, bounds validation for currentStep, and corrupted state cleanup
- **Files**: wizard-state.ts

#### Birth Year Server-Side Validation
- **Problem**: No validation of birth year ranges on the server
- **Fix**: Added validateBirthYear/validateYear helpers that reject values outside 1850-currentYear range
- **Files**: step2/route.ts, step3/route.ts

#### Trimmed Name Validation
- **Problem**: Whitespace-only names could pass validation
- **Fix**: Added .trim() calls on name validation in both wizard and API
- **Files**: OnboardingWizard.tsx, step2/route.ts, step3/route.ts

### Phase 4: Accessibility Improvements

- Added role="button", tabIndex, and keyboard handler (Enter/Space) to photo upload div
- Added aria-labels to: photo upload, file input, date input, birth year inputs, checkboxes, remove buttons, gender selects, phone input
- Added aria-current="step" to active step indicator
- Added role="alert" to error message container
- **Files**: Step1AboutYou.tsx, Step2Parents.tsx, Step3Siblings.tsx, Step4Invite.tsx, OnboardingWizard.tsx

### Phase 5: Code Cleanup
- Removed unused `useState` import from Step2Parents
- Removed unused `Heart` import from Step2Parents

## Technical Decisions
| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Per-step ID tracking (step2CreatedIds, step3CreatedIds) | Clean separation prevents cross-step pollution and enables targeted delete-before-insert | Server-side upsert (more complex), client-side diff detection (fragile) |
| Deep merge with type guards | Prevents runtime crashes from corrupted localStorage while preserving valid partial data | JSON schema validation (over-engineered), try-catch only (masks root cause) |
| previousIds parameter in API | Simple, backward-compatible idempotency pattern that doesn't require new DB columns | Separate cleanup endpoint (extra round trip), marker column (schema change) |

## Testing Performed
- [x] TypeScript type check passes (npx tsc --noEmit)
- [x] ESLint passes with zero errors/warnings on all changed files
- [x] Build lint phase passes (build fails on pre-existing next-font-manifest issue, unrelated to changes)

## Commits
- Pending (not yet committed)

## ProfileCompletionWidget Verification
- Reviewed completion-calculator.ts: correctly checks avatar_url, birth_date, birth_place, bio, parent relationship, and story
- Parent check looks at both relationships table and pending_relatives (covers onboarding-created parents)
- Weights sum to 100%, calculation logic is correct
- Widget handles both EN/RU locales properly

## OnboardingChecker Edge Cases Verified
- Completed users: wizard page server-redirects to /app (line 46)
- Already on wizard: OnboardingChecker skips redirect (line 28)
- Session expiry: Protected layout redirects to sign-in (line 34-36)
- Browser refresh: localStorage persists state, deep merge recovers corrupted data

## Handoff Notes
- The next-font-manifest.json build error is pre-existing infrastructure issue, not caused by these changes
- The linter auto-applies structured logging (apiLogger instead of console.error) to API routes when they are read
- Consider adding a "reset wizard" button in case users get stuck with corrupted localStorage
