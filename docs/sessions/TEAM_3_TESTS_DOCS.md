# Team 3: Tests & Documentation

## Objective
Fix E2E tests to use correct selectors, run tests, update documentation.

## Files to Handle

### Tests (Untracked)
```
tests/e2e/                        (entire directory)
```

### Documentation (Untracked)
```
docs/test-plans/                  (entire directory)
docs/sessions/2026-01-24-admin-db-explorer-fix.md
docs/sessions/2026-01-24_critical-bug-fixes-invitation-flow.md
```

### Documentation (Modified)
```
NEXT_AGENT_START_HERE.md
CLAUDE.md
```

## E2E Test Issues to Fix

### Problem 1: Sign-up Form Selectors
Current test uses:
```typescript
await inviterPage.fill('[name="firstName"]', 'Alexander');
await inviterPage.fill('[name="lastName"]', 'Testov');
```

Actual form has:
- Single `name` field (optional) with `id="name"`
- No firstName/lastName split

**Fix:**
```typescript
await inviterPage.fill('#name', 'Alexander Testov');
```

### Problem 2: Add Relative Form Selectors
Current test uses:
```typescript
await inviterPage.click('button:has-text("Add Relative")');
await inviterPage.fill('[name="firstName"]', relative.firstName);
```

Actual form has:
- Russian button text: "Добавить родственника" or navigation to /people/add
- Form fields use `formData.firstName` (value binding, not name attribute)

**Fix:**
```typescript
// Navigate directly to add page
await inviterPage.goto('/ru/people/add');
// Use input by placeholder or label
await inviterPage.getByPlaceholder('Иван').fill(relative.firstName);
await inviterPage.getByPlaceholder('Иванов').fill(relative.lastName);
```

### Problem 3: Relationship Selection
Current test uses:
```typescript
await inviterPage.selectOption('[name="relationshipType"]', relative.relationship);
```

Actual form flow:
1. Select "Тип родства" (relationship category)
2. Select "Конкретная связь" (specific relationship)

**Fix:** Use the actual select elements or add data-testid attributes.

## Recommended Test Strategy

### Option A: Simplified Test (Quick)
Create a minimal test that:
1. Signs up a user
2. Navigates to dashboard
3. Verifies basic elements

### Option B: Add data-testid (Thorough)
Add test IDs to components:
```typescript
// AddRelativeForm.tsx
<input data-testid="firstName-input" ... />
<input data-testid="lastName-input" ... />
<button data-testid="submit-relative" ... />
```

## Documentation Updates

### Update INVITATION_FLOW_TEST_RESULTS.md
- Mark bugs 1-4 as FIXED
- Add verification date
- Note remaining test gaps

### Update NEXT_AGENT_START_HERE.md
- Add final session summary
- Clear "Next Steps" with completed items
- Add any new blockers

## Commit Message Template

```
test: e2e tests and documentation updates

Tests:
- Fix invitation flow test selectors
- Add simplified smoke test
- Update test for Russian UI

Documentation:
- Add session notes for 2026-01-24
- Update test results with bug fix status
- Update NEXT_AGENT_START_HERE.md

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Steps

1. Review and fix E2E test selectors
2. Run `npx playwright test tests/e2e/invitation-flow.spec.ts`
3. Fix failures or create simplified test
4. Update documentation files
5. Stage all test and doc files
6. Create commit

## Do NOT Include
- Bug fix source files (Team 1)
- Admin pages (Team 2)
- Migration (Team 1)
