/**
 * 01 - Registration Flow E2E Tests
 *
 * Tests sign-up, sign-in, sign-out, and auth redirects.
 * Creates real test users via Supabase Admin, then cleans up.
 */

import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, generateTestEmail, TEST_PASSWORD } from '../../helpers/test-user-factory';
import { signIn, signOut, signUp } from '../../helpers/auth-helpers';
import { selectors, urlPatterns } from '../../helpers/selectors';
import { cleanupUsers } from '../../helpers/cleanup';

const locale = 'en';
const createdUserIds: string[] = [];

test.afterAll(async () => {
  await cleanupUsers(createdUserIds);
});

test.describe('Registration - Sign-Up Page', () => {
  test('sign-up page loads with correct elements (EN)', async ({ page }) => {
    await page.goto(`/${locale}/sign-up`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator(selectors.auth.signUpForm)).toBeVisible();
    await expect(page.locator(selectors.auth.nameInput)).toBeVisible();
    await expect(page.locator(selectors.auth.emailInput)).toBeVisible();
    await expect(page.locator(selectors.auth.passwordInput)).toBeVisible();
    await expect(page.locator(selectors.auth.confirmPasswordInput)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  });

  test('sign-up page loads with correct elements (RU)', async ({ page }) => {
    await page.goto('/ru/sign-up');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(selectors.auth.signUpForm)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Создать аккаунт' })).toBeVisible();
  });

  test('register new user with valid data shows success', async ({ page }) => {
    const email = generateTestEmail('register');

    await signUp(page, 'E2E Registration Test', email, TEST_PASSWORD, locale);

    // Should show success message about email confirmation
    await expect(page.getByText(/check your email|Проверьте почту/i)).toBeVisible({ timeout: 10_000 });
  });

  test('register with weak password shows validation error', async ({ page }) => {
    await page.goto(`/${locale}/sign-up`);
    await page.waitForLoadState('networkidle');

    await page.fill(selectors.auth.emailInput, generateTestEmail('weakpw'));
    await page.fill(selectors.auth.passwordInput, '123');
    await page.fill(selectors.auth.confirmPasswordInput, '123');
    await page.click(selectors.auth.submitButton);

    // Should show password too short error
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible({ timeout: 5000 });
  });

  test('password mismatch shows error', async ({ page }) => {
    await page.goto(`/${locale}/sign-up`);
    await page.waitForLoadState('networkidle');

    await page.fill(selectors.auth.passwordInput, 'StrongPass1!');
    await page.fill(selectors.auth.confirmPasswordInput, 'DifferentPass1!');

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('sign-in link from sign-up page navigates correctly', async ({ page }) => {
    await page.goto(`/${locale}/sign-up`);
    await page.waitForLoadState('networkidle');

    await page.click(selectors.auth.signInLink(locale));
    await page.waitForURL(urlPatterns.signIn(locale), { timeout: 10_000 });

    await expect(page).toHaveURL(urlPatterns.signIn(locale));
  });
});

test.describe('Registration - Sign-In After Registration', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createTestUser({ name: 'E2E SignIn Test' });
    createdUserIds.push(testUser.id);
  });

  test('sign in with valid credentials redirects to app', async ({ page }) => {
    await signIn(page, testUser.email, testUser.password, locale);

    await expect(page).toHaveURL(/\/(app|tree|onboarding)/);
  });

  test('sign out redirects to sign-in page', async ({ page }) => {
    await signIn(page, testUser.email, testUser.password, locale);

    // Set desktop viewport for sidebar
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    const signOutBtn = page.getByTestId('sign-out-btn').first();
    await expect(signOutBtn).toBeVisible({ timeout: 5000 });
    await signOutBtn.click();

    await page.waitForURL(urlPatterns.signIn(locale), { timeout: 30_000 });
    await expect(page).toHaveURL(urlPatterns.signIn(locale));
  });
});

test.describe('Registration - Auth Guards', () => {
  test('protected route redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto(`/${locale}/app`);

    // Should be redirected to sign-in
    await page.waitForURL(urlPatterns.signIn(locale), { timeout: 15_000 });
    await expect(page).toHaveURL(urlPatterns.signIn(locale));
  });

  test('sign in with invalid credentials shows error', async ({ page }) => {
    await page.goto(`/${locale}/sign-in`);
    await page.waitForLoadState('networkidle');

    await page.fill(selectors.auth.emailInput, 'nonexistent@example.com');
    await page.fill(selectors.auth.passwordInput, 'WrongPassword123!');
    await page.click(selectors.auth.submitButton);

    await expect(page.locator(selectors.auth.signInError)).toBeVisible({ timeout: 10_000 });
  });
});
