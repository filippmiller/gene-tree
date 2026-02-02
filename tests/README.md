# Gene-Tree Testing Guide

This directory contains all tests for the Gene-Tree application.

## Test Structure

```
tests/
├── setup.ts                      # Global test configuration & mocks
├── unit/                         # Unit tests (Vitest)
│   ├── invite-guard.spec.ts      # Smart Invite Guard core logic
│   └── invitations-check-api.spec.ts  # API route tests
├── e2e/                          # End-to-end tests (Playwright)
│   ├── smart-invite-guard.spec.ts     # Smart Invite Guard user flows
│   └── invitation-flow.spec.ts        # Full invitation flows
└── README.md                     # This file
```

---

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Unit Tests
```bash
npm run test:unit
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run E2E Tests
```bash
# Start dev server first
npm run dev

# In another terminal
npm run test:e2e:invite-guard
```

### Generate Coverage Report
```bash
npm run test:coverage
```

---

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run test:ui` | Open Vitest UI for interactive testing |
| `npm run test:coverage` | Generate code coverage report |
| `npm run test:unit` | Run only unit tests |
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:invite-guard` | Run Smart Invite Guard E2E tests only |

---

## Test Frameworks

### Vitest (Unit & Integration Tests)

**Configuration**: `vitest.config.ts`
**Setup**: `tests/setup.ts`

Vitest is used for:
- Unit tests (business logic, utilities)
- API route tests (with mocked dependencies)
- Component tests (React components)

**Key Features**:
- Fast execution with ES modules
- Jest-compatible API
- Built-in coverage with V8
- Watch mode for development

### Playwright (E2E Tests)

**Configuration**: `playwright.config.ts`

Playwright is used for:
- End-to-end user flows
- Browser automation
- Visual regression testing
- Cross-browser testing

**Key Features**:
- Real browser testing (Chromium, Firefox, WebKit)
- Network interception
- Screenshot & video recording
- Parallel test execution

---

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myFunction } from '@/lib/my-module';

describe('myFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can complete flow', async ({ page }) => {
  await page.goto('/en/feature');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## Mocking Strategies

### Supabase Client

```typescript
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase/server-ssr', () => ({
  getSupabaseSSR: () => mockSupabase,
}));
```

### Next.js Router

Already mocked globally in `tests/setup.ts`:
```typescript
const mockRouter = useRouter(); // Auto-mocked
mockRouter.push('/path'); // Available in tests
```

### API Routes

```typescript
// Mock dependencies before importing route
vi.mock('@/lib/supabase/server-ssr');
import { POST } from '@/app/api/route';

// Create request
const request = new Request('http://localhost/api', {
  method: 'POST',
  body: JSON.stringify({ data: 'test' }),
});

// Test
const response = await POST(request);
expect(response.status).toBe(200);
```

---

## Test Best Practices

### 1. Test Naming

Use descriptive names:
- ✅ `should return OK_TO_INVITE for new email`
- ❌ `test1`

### 2. Arrange-Act-Assert (AAA)

```typescript
it('should validate email', () => {
  // Arrange
  const email = 'test@example.com';

  // Act
  const result = validateEmail(email);

  // Assert
  expect(result).toBe(true);
});
```

### 3. Test Independence

Each test should be independent:
```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Reset mocks
});
```

### 4. Avoid Hardcoded Data

Use dynamic test data:
```typescript
const testEmail = `test-${Date.now()}@example.com`;
```

### 5. Test Edge Cases

- ✓ Happy path
- ✓ Error conditions
- ✓ Boundary values
- ✓ Null/undefined
- ✓ Empty strings

### 6. Mock Strategically

Mock only what's necessary:
- ✅ External APIs (Supabase, third-party services)
- ✅ File system operations
- ❌ Internal business logic (test that for real)

---

## Coverage Goals

### Current Coverage

Run `npm run test:coverage` to see current coverage.

### Target Coverage

| Metric | Target | Status |
|--------|--------|--------|
| Statements | 80% | 🎯 In Progress |
| Branches | 75% | 🎯 In Progress |
| Functions | 80% | 🎯 In Progress |
| Lines | 80% | 🎯 In Progress |

### Coverage Exclusions

See `vitest.config.ts` for excluded files:
- `node_modules/`
- `tests/`
- `**/*.config.{ts,js}`
- `**/*.d.ts`

---

## Debugging Tests

### Vitest UI

Interactive test runner with filtering and debugging:
```bash
npm run test:ui
```

### Verbose Output

```bash
npm test -- --reporter=verbose
```

### Run Single Test File

```bash
npm test tests/unit/invite-guard.spec.ts
```

### Run Single Test

```bash
npm test -- -t "should return OK_TO_INVITE"
```

### Playwright Debug Mode

```bash
PWDEBUG=1 npm run test:e2e:invite-guard
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## Common Issues

### Issue: "Cannot find module '@/...'"

**Solution**: Check `vitest.config.ts` path aliases match `tsconfig.json`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue: "Timeout exceeded"

**Solution**: Increase timeout for slow tests:
```typescript
test('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Issue: "Module not mocked"

**Solution**: Ensure mocks are defined before imports:
```typescript
vi.mock('@/lib/module');  // Must come before import
import { function } from '@/lib/module';
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

## Getting Help

- Check test reports in `docs/tests/`
- Review existing tests for patterns
- Ask in team chat or create an issue

---

**Last Updated**: February 2, 2026
