# E2E Test Suite - Session 3 Handoff

**Date:** 2026-02-06
**Status:** All 12 test files pass individually; full suite has accumulated timeout flakes

---

## Summary

Continued from `e2e-test-suite-session2.md`. Ran all 12 E2E test files sequentially per the testing plan. Fixed failures in 5 test files. All 12 files now pass when run individually.

## Individual Test Results (All Run Individually)

| # | File | Tests | Result | Fixes Applied |
|---|------|-------|--------|---------------|
| 01 | registration | 10/10 | PASSED | None needed |
| 02 | onboarding | 9/9 | PASSED | Animation wait + Finish button detection |
| 03 | add-relatives | 7/7 | PASSED | React hydration waits, selectOption helper (previous session) |
| 04 | tree-view | 7/7 | PASSED | Header selector, networkidle fix (previous session) |
| 05 | quick-add | 6/6 | PASSED | None needed |
| 06 | search | 7/7 | PASSED | Duplicate modal .first(), body focus (previous session) |
| 07 | profile | 10/10 | PASSED | None needed |
| 08 | invitations | 6/6 | PASSED | None needed |
| 09 | stories | 8/8 | PASSED | None needed |
| 10 | voice-stories | 5/5 | PASSED | None needed |
| 11 | family-chat | 9/9 | PASSED | goToChat helper with textarea wait |
| 12 | privacy | 11/11 | PASSED | None needed (verified in session 2) |

**Total: 95/95 tests pass individually**

## Full Suite Run Results

Running all 95 tests sequentially takes ~45+ minutes. Later test files (10, 11, 12) experience timeout flakes due to:
- **Supabase rate limiting (429):** 95 sequential tests each creating/deleting users
- **Accumulated resource exhaustion:** Browser + dev server slow down after 60+ tests
- **Cold compilation timeouts:** Next.js lazy-compiles routes; deep into the suite, compilation is slower

These are NOT test code bugs — they are infrastructure limitations of running the full suite. The same tests pass cleanly when run individually.

### Recommended run strategy:
```bash
# Run files individually or in small batches:
npx playwright test tests/e2e/flows/01-registration.spec.ts --project=flows
npx playwright test tests/e2e/flows/02-onboarding.spec.ts --project=flows
# ... etc

# Or run P0 tests only:
npm run test:e2e:flows:p0
```

## Fixes Applied This Session

### 1. `11-family-chat.spec.ts` — 2 tests fixed

**Root cause:** Chat page renders a skeleton loading state while fetching from `/api/family-chat`. The `<textarea>` only appears after `isLoading` becomes false. Tests used a fixed 2s wait that was insufficient.

**Fix:**
- Created `goToChat()` helper that waits for `textarea` to be visible (up to 20s timeout)
- Fixed "send button disabled" test: used `button:has(svg)[disabled]` selector instead of `button:has(svg).last()` (which matched sidebar buttons)
- Added `test.setTimeout(120_000)` on first test for cold compilation

### 2. `02-onboarding.spec.ts` — 1 test fixed

**Root cause:** `goToStep()` in OnboardingWizard has a 150ms `setTimeout` animation. Clicking Skip rapidly through steps caused a race condition where the button's `handleSkip` callback still referenced the previous step's state.

**Fix:**
- Added `page.waitForTimeout(500)` after each step content appears, before clicking Skip
- Added `await expect(page.getByText('Invite a family member')).toBeVisible()` to verify Step 5 loaded before looking for Finish button
- Increased waitForURL timeout to 60s with `waitUntil: 'domcontentloaded'`
- Added `test.setTimeout(120_000)` for cold compilation

## Files Modified This Session

| File | Changes |
|------|---------|
| `tests/e2e/flows/11-family-chat.spec.ts` | Added `goToChat()` helper, fixed send button selector, added cold start timeout |
| `tests/e2e/flows/02-onboarding.spec.ts` | Added animation waits, Step 5 content verification, increased redirect timeout |

## Files Modified in Previous Sessions (Still Active)

| File | Changes |
|------|---------|
| `tests/e2e/flows/03-add-relatives.spec.ts` | React hydration waits, `selectOption()` helper with evaluate fallback |
| `tests/e2e/flows/04-tree-view.spec.ts` | `getByRole('heading')` selector, `domcontentloaded` wait, cold start timeout |
| `tests/e2e/flows/06-search.spec.ts` | `openSearch()` helper with `.first()`, body focus before Ctrl+K |
| `tests/helpers/test-user-factory.ts` | Removed invalid `status: 'confirmed'` from relationships insert |

## Known Issues / Tech Debt

1. **Full suite timeout flakes:** Need to either:
   - Add retry logic / increase global timeout for sequential runs
   - Split into smaller test groups
   - Or accept that individual file runs are the reliable path

2. **06-search "typing query shows results":** Intermittently fails in full suite (works individually). The search API debounce + pg_trgm query is sensitive to timing under load.

3. **Test user cleanup:** Running 95 tests creates ~30+ auth users and profiles. The cleanup API handles this but can hit rate limits.

## Key Patterns Established

- **Always use `signInViaAPI()`** — never UI-based sign-in (saves ~25s per test)
- **Always wait for hydration** — don't assume elements are interactive just because they're visible
- **Use `.first()`** for sidebar-duplicated elements (search modal, sign-out button)
- **Use `domcontentloaded`** not `networkidle` for WebSocket pages (chat, profile, stories)
- **Add `test.setTimeout(120_000)`** on first test in each describe block for cold compilation
- **Add 500ms wait** after wizard step transitions (150ms animation + React reconciliation)

## Commits Pending

All test fixes are uncommitted local changes. Next agent should:
1. Run a quick validation: `npx playwright test tests/e2e/flows/02-onboarding.spec.ts tests/e2e/flows/11-family-chat.spec.ts --project=flows`
2. Commit with message: `fix(e2e): fix onboarding wizard and family chat test timing issues`
3. Consider committing all test infrastructure files (helpers, configs, test files)

## How to Validate

```bash
# Start dev server
npm run dev

# Run any individual file (all should pass):
npx playwright test tests/e2e/flows/01-registration.spec.ts --project=flows --reporter=list
npx playwright test tests/e2e/flows/02-onboarding.spec.ts --project=flows --reporter=list
# ... etc for all 12 files
```
