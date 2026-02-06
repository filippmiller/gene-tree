/**
 * Authentication Flow E2E Tests
 *
 * Tests sign-in, sign-out, error handling, and locale behavior
 * on the authentication pages.
 *
 * Uses real credentials against the running app (localhost:3000 or production).
 * The sign-in page is at /{locale}/sign-in and uses FloatingInput with ids
 * #email and #password.
 */

import { test, expect, type Page } from '@playwright/test';

const TEST_EMAIL = process.env.PLAYWRIGHT_E2E_EMAIL || 'filippmiller@gmail.com';
const TEST_PASSWORD = process.env.PLAYWRIGHT_E2E_PASSWORD || 'Airbus380+';

/**
 * Helper: sign in and wait for the dashboard to load.
 */
async function signIn(page: Page, locale: string = 'en') {
  await page.goto(`/${locale}/sign-in`);
  await page.waitForLoadState('networkidle');
  await page.fill('#email', TEST_EMAIL);
  await page.fill('#password', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/${locale}/app**`, { timeout: 20000 });
}

// ---------------------------------------------------------------------------
// Sign-In Tests
// ---------------------------------------------------------------------------

test.describe('Authentication - Sign In', () => {
  test('sign-in page loads with correct elements (EN)', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.waitForLoadState('networkidle');

    // The form should be visible
    await expect(page.getByTestId('sign-in-form')).toBeVisible();

    // Email and password fields are present
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Submit button is present
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Page title text
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('sign-in page loads with correct elements (RU)', async ({ page }) => {
    await page.goto('/ru/sign-in');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('sign-in-form')).toBeVisible();
    await expect(page.getByText('С возвращением')).toBeVisible();
  });

  test('sign in with valid credentials redirects to dashboard', async ({ page }) => {
    await signIn(page, 'en');

    // Should be on the app/dashboard page
    await expect(page).toHaveURL(/\/en\/app/);
  });

  test('sign in with invalid credentials shows error', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Error alert should appear
    await expect(page.getByTestId('sign-in-error')).toBeVisible({ timeout: 10000 });
  });

  test('sign in with empty fields does not submit (HTML validation)', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.waitForLoadState('networkidle');

    // Click submit without filling anything
    await page.click('button[type="submit"]');

    // Should still be on sign-in page (HTML required validation prevents submission)
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test('sign-up link navigates to sign-up page', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/en/sign-up"]');
    await page.waitForURL('**/sign-up**', { timeout: 10000 });

    await expect(page).toHaveURL(/\/en\/sign-up/);
  });
});

// ---------------------------------------------------------------------------
// Language Switcher on Auth Pages
// ---------------------------------------------------------------------------

test.describe('Authentication - Language Switcher', () => {
  test('language switcher toggles locale on sign-in page', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.waitForLoadState('networkidle');

    // Should see "Welcome Back" in English
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Find the language switcher button (shows the OTHER language)
    const langButton = page.locator('button').filter({ hasText: /Русский/ });
    await expect(langButton).toBeVisible();

    // Click to switch to Russian
    await langButton.click();
    await page.waitForURL(/\/ru\/sign-in/, { timeout: 10000 });

    // Should now see Russian text
    await expect(page.getByText('С возвращением')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Sign-Out Tests
// ---------------------------------------------------------------------------

test.describe('Authentication - Sign Out', () => {
  test('sign out redirects to sign-in page', async ({ page }) => {
    // First, sign in
    await signIn(page, 'en');

    // Verify we are on the dashboard
    await expect(page).toHaveURL(/\/en\/app/);

    // Click the sign-out button in the sidebar (desktop view)
    // The sidebar is hidden on mobile, so set a large viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    const signOutBtn = page.getByTestId('sign-out-btn');
    await expect(signOutBtn).toBeVisible({ timeout: 5000 });
    await signOutBtn.click();

    // Should redirect to sign-in page
    await page.waitForURL(/\/en\/sign-in/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });
});

// ---------------------------------------------------------------------------
// Sign-Up Page Tests (non-destructive, no actual account creation)
// ---------------------------------------------------------------------------

test.describe('Authentication - Sign Up Page', () => {
  test('sign-up page loads with correct elements (EN)', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('sign-up-form')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByText('Create Account')).toBeVisible();
  });

  test('sign-up shows password mismatch error', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', 'test-no-create@example.com');
    await page.fill('#password', 'StrongPassword1!');
    await page.fill('#confirmPassword', 'DifferentPassword1!');

    // The confirm password field should show a mismatch indicator
    // The FloatingInput has an error prop for mismatch
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('sign-in link from sign-up page works', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/en/sign-in"]');
    await page.waitForURL('**/sign-in**', { timeout: 10000 });

    await expect(page).toHaveURL(/\/en\/sign-in/);
  });
});
