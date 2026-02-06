# Handoff: E2E Test Suite Continuation

**Date**: 2026-02-06
**Previous Agent**: Claude Code (Opus 4.6)
**Status**: In Progress — 2 of 12 test files passing, infrastructure complete
**Priority**: P2

---

## What Was Done

### Infrastructure (100% Complete)
All test infrastructure files are created and working:

| File | Status | Notes |
|------|--------|-------|
| `tests/helpers/test-user-factory.ts` | Done | Creates/deletes test users via Supabase Admin API |
| `tests/helpers/auth-helpers.ts` | Done | **KEY**: Has both `signIn()` (UI-based, slow ~30s) and `signInViaAPI()` (API-based, fast ~5s) |
| `tests/helpers/cleanup.ts` | Done | Global cleanup of e2e-test-* users |
| `tests/helpers/selectors.ts` | Done | Centralized selectors (may need updates for some tests) |
| `tests/helpers/test-data-factory.ts` | Done | Mock data generators |
| `tests/global-setup.ts` | Done | Pre-suite cleanup |
| `src/app/api/test/cleanup/route.ts` | Done | POST cleanup endpoint (blocked in production) |
| `playwright.config.ts` | Done | 3 projects (flows/e2e/legacy), 60s timeout for flows, globalSetup |
| `package.json` | Done | Scripts: test:e2e:flows, test:e2e:flows:p0, test:e2e:flows:p1 |
| `~/.claude/skills/e2e-test-suite/SKILL.md` | Done | Documentation |

### Test Files Status

| File | Tests | Status | Notes |
|------|-------|--------|-------|
| `01-registration.spec.ts` | 10 | **PASSING** (9 pass + 1 flaky retry) | Uses `signIn()` UI-based for auth tests |
| `02-onboarding.spec.ts` | 9 | **PARTIALLY PASSING** | Uses `signInViaAPI()`. First test passes. Remaining 8 untested in batch. |
| `03-add-relatives.spec.ts` | 7 | **NEEDS FIXING** | Not yet run. Likely has selector issues. |
| `04-tree-view.spec.ts` | 8 | **NEEDS FIXING** | Not yet run. |
| `05-quick-add.spec.ts` | 6 | **NEEDS FIXING** | Not yet run. |
| `06-search.spec.ts` | 7 | **NEEDS FIXING** | Not yet run. |
| `07-profile.spec.ts` | 8 | **NEEDS FIXING** | Not yet run. |
| `08-invitations.spec.ts` | 6 | **NEEDS FIXING** | Not yet run. |
| `09-stories.spec.ts` | 7 | **NEEDS FIXING** | Not yet run. |
| `10-voice-stories.spec.ts` | 5 | **NEEDS FIXING** | Not yet run. Requires microphone mocking. |
| `11-family-chat.spec.ts` | 6 | **NEEDS FIXING** | Not yet run. |
| `12-privacy.spec.ts` | 9 | **NEEDS FIXING** | Not yet run. |

---

## Critical Knowledge (Read This First)

### 1. ALWAYS use `signInViaAPI()` for non-auth tests
The UI-based `signIn()` takes ~30s because the Supabase `signInWithPassword()` call from the browser is extremely slow (network latency to `mbntpsfllwhlnzuzspvp.supabase.co`). The API-based `signInViaAPI()` does the Supabase call server-side in Node.js which is much faster (~2-5s).

```typescript
// SLOW (30s) - Only for tests that test the sign-in UI itself
import { signIn } from '../../helpers/auth-helpers';
await signIn(page, email, password, locale);

// FAST (5s) - Use for all other tests
import { signInViaAPI } from '../../helpers/auth-helpers';
await signInViaAPI(page, email, password, '/en/onboarding/wizard', 'en');
```

### 2. Onboarding checker redirects
New test users have `onboarding_completed: false`. When they access any protected route, `OnboardingChecker` (client-side useEffect) redirects them to `/onboarding/wizard`. Use `signInViaAPI()` to navigate directly to the target page.

For tests that need an onboarded user:
```typescript
import { createOnboardedTestUser } from '../../helpers/test-user-factory';
const user = await createOnboardedTestUser({ name: 'E2E Test' });
```

### 3. Sign-out button is duplicated
Sidebar renders `data-testid="sign-out-btn"` twice (expanded + collapsed). Always use `.first()`:
```typescript
page.getByTestId('sign-out-btn').first()
```

### 4. Button text is i18n-translated
The wizard's "Next" button is actually "Continue" (i18n key `next` maps to "Continue" in English). Always check `src/messages/en/common.json` for actual text, or use broader regex patterns.

### 5. Test timeout is 60s
Set in `playwright.config.ts` for the `flows` project. Increase if needed for slow tests.

### 6. Env vars are lazy-loaded
`test-user-factory.ts` and `cleanup.ts` read env vars inside functions (not at module level) because dotenv loads them after import.

---

## Actual UI Selectors (Verified)

### Auth Pages
- Sign-in form: `data-testid="sign-in-form"`
- Sign-up form: `data-testid="sign-up-form"`
- Email: `#email`
- Password: `#password`
- Name (sign-up): `#name`
- Confirm password: `#confirmPassword`
- Submit: `button[type="submit"]`
- Sign-in error: `data-testid="sign-in-error"`

### Onboarding Wizard
- Step 1 heading: "Tell us about yourself"
- Step 2 heading: "Add your parents"
- Step 3 heading: Contains "Grandparents"
- Step 4 heading: "Add siblings or spouse"
- Step 5: Invite step
- First name: `#firstName`
- Last name: `#lastName`
- Birth date: `[data-testid="onboarding-birthDate"]`
- Gender: `[data-testid="onboarding-gender"]`
- Mother first name: `#mother-firstName`
- Mother last name: `#mother-lastName`
- Father first name: `#father-firstName`
- Father last name: `#father-lastName`
- Continue button: `button` with text "Continue" (EN) or "Далее" (RU)
- Back button: `button` with text "Back" (EN) or "Назад" (RU)
- Skip button: `button` with text "Skip" (EN) or "Пропустить" (RU)
- Finish button: `button` with text "Finish" (EN) or "Завершить" (RU)
- Skip parent checkbox: `label` containing "Unknown / Skip"

### Sidebar
- Sign out: `data-testid="sign-out-btn"` (use `.first()`)
- Nav: `data-testid="sidebar-nav"`
- Links: `/en/app`, `/en/tree`, `/en/people`, `/en/stories`, etc.

### Add Relative Form (`/people/new`)
- Form: `data-testid="add-relative-form"`
- First name: `data-testid="firstName-input"`
- Last name: `data-testid="lastName-input"`
- Email: `data-testid="email-input"`
- Phone: `data-testid="phone-input"`
- Relationship select: `data-testid="relationship-select"`
- Specific relationship: `data-testid="specific-relationship-select"`
- Deceased checkbox: `data-testid="deceased-checkbox"`
- Submit: `data-testid="submit-relative"`
- Form error: `data-testid="form-error"`
- Button text is i18n (`addRelative` namespace)

### Tree View (`/tree/{id}`)
- `/tree` redirects to `/tree/{userId}` (server-side)
- React Flow container: `.react-flow`
- Person nodes: `.react-flow__node`
- Hover node → QuickAddMenu appears → click opens QuickAddDialog
- Click node → PersonProfileDialog opens
- Loading: "Loading family tree..."
- Empty: "No family tree data available"
- Mini-tree (spouse): absolute positioned, right-4 top-4

### Quick-Add Dialog
- First name: `#qa-firstName`
- Last name: `#qa-lastName`
- Birth year: `#qa-birthYear`
- Deceased checkbox: label with checkbox
- Button text: i18n `quickAdd` namespace (`t('add')`, `t('cancel')`)
- No data-testid attributes — use IDs

### Search (Ctrl+K)
- Modal: `[role="dialog"][aria-modal="true"]`
- Input: `input[aria-autocomplete="list"]`, `maxLength="100"`
- Results container: `#search-results`, `role="listbox"`
- Result items: `#search-result-{index}`, `role="option"`
- Empty hint: `t('hint')` from `search` namespace
- No results: `t('noResults')`
- Keyboard: ArrowUp/Down navigate, Enter selects, Escape closes
- Recent searches stored in localStorage key `gene-tree-recent-searches`

### Stories Page (`/stories`)
- Title: "Family Stories" (EN) / "Семейные истории" (RU)
- Add button: "Add Story" links to `/stories/new`
- Empty state: "No stories yet" with "Be the first to add a family story!"
- No data-testid attributes — use text selectors

### Family Chat (`/family-chat`)
- Title: chat name from API
- Member count: `{members.length} members`
- Empty state: "No messages yet" + "Be the first to say hello to your family!"
- Input: `ChatInput` component with placeholder from `t('placeholder')`
- Muted state: "You are muted and cannot send messages"
- No data-testid attributes — use text/role selectors

---

## How to Continue

### Step 1: Run the full 02-onboarding test
```bash
npx playwright test tests/e2e/flows/02-onboarding.spec.ts --project=flows --reporter=list
```
Fix any failures. The `signInViaAPI()` approach should make them faster.

### Step 2: Fix tests 03-12 one file at a time
For each file:
1. **Read the actual component** to verify selectors (headings, IDs, button text)
2. **Update the test** with correct selectors and `signInViaAPI()` (all tests 03-12 currently import `signIn` — change to `signInViaAPI`)
3. **Run the single test file**: `npx playwright test tests/e2e/flows/XX-name.spec.ts --project=flows --reporter=list`
4. **Fix failures** based on error messages and screenshots in `test-results/`
5. **Repeat until green**

### Step 3: Run the full suite
```bash
npm run test:e2e:flows
```

### Step 4: Verify existing tests still pass
```bash
npm run test:e2e
```

### Step 5: Commit
```bash
git add tests/ src/app/api/test/ playwright.config.ts package.json
git commit -m "feat(tests): add comprehensive E2E test suite with 94 tests across 12 flows"
```

---

## Common Issues and Fixes

| Issue | Fix |
|-------|-----|
| `signIn()` timeout | Switch to `signInViaAPI()` |
| `getByTestId` matches 2+ elements | Use `.first()` or more specific locator |
| Button text doesn't match | Check `src/messages/en/common.json` for actual i18n text |
| Wizard spinner never resolves | Check if page cookies are set (signInViaAPI handles this) |
| `net::ERR_ABORTED` on goto | Don't navigate while OnboardingChecker is redirecting |
| Test timeout exceeded | Increase timeout in playwright.config.ts or per-test with `test.setTimeout()` |
| Flaky sign-out test | `waitForURL` with 30s timeout + retry on first failure |

---

## Files You'll Need to Read

Before fixing each test, read the corresponding component:

| Test File | Read These Components |
|-----------|----------------------|
| 03-add-relatives | `src/app/[locale]/(protected)/people/new/page.tsx`, `src/components/people/AddRelativeForm.tsx` |
| 04-tree-view | `src/app/[locale]/(protected)/tree/page.tsx`, `src/components/tree/FamilyTree.tsx` |
| 05-quick-add | `src/components/tree/QuickAddDialog.tsx` |
| 06-search | `src/components/search/SearchCommandPalette.tsx` |
| 07-profile | `src/app/[locale]/(protected)/my-profile/page.tsx` |
| 08-invitations | `src/app/[locale]/(protected)/onboarding/invites/page.tsx` |
| 09-stories | `src/app/[locale]/(protected)/stories/page.tsx` |
| 10-voice-stories | `src/components/voice/VoiceStoryRecorder.tsx` |
| 11-family-chat | `src/app/[locale]/(protected)/family-chat/page.tsx`, `src/components/chat/` |
| 12-privacy | Multiple — tests RLS via API calls |

---

## Environment
- Dev server: `npm run dev` on `http://localhost:3000`
- Supabase: `mbntpsfllwhlnzuzspvp.supabase.co`
- Test users use email: `e2e-test-{timestamp}-{suffix}@test.gene-tree.app`
- Password: `TestPass123!`
- `.env.local` has the real service role key (updated this session)
