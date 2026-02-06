/**
 * 02 - Onboarding Wizard E2E Tests
 *
 * Tests the 5-step onboarding flow:
 * Step 1: About You (name, birth date, gender, avatar)
 * Step 2: Parents
 * Step 3: Grandparents
 * Step 4: Siblings
 * Step 5: Invite
 *
 * Creates a fresh test user per describe block.
 */

import { test, expect } from '@playwright/test';
import { createTestUser, TEST_PASSWORD } from '../../helpers/test-user-factory';
import { signInViaAPI } from '../../helpers/auth-helpers';
import { cleanupUsers } from '../../helpers/cleanup';

const locale = 'en';
const createdUserIds: string[] = [];

test.afterAll(async () => {
  await cleanupUsers(createdUserIds);
});

/** Sign in via API and navigate directly to wizard */
async function goToWizard(page: import('@playwright/test').Page, email: string, password: string) {
  await signInViaAPI(page, email, password, `/${locale}/onboarding/wizard`, locale);

  // Wait for wizard to hydrate (step 1 heading)
  await expect(page.getByText('Tell us about yourself')).toBeVisible({ timeout: 20_000 });
}

/** Fill step 1 and click Continue */
async function completeStep1(page: import('@playwright/test').Page) {
  await page.fill('#firstName', 'E2E');
  await page.fill('#lastName', 'TestUser');
  const continueBtn = page.locator('button').filter({ hasText: /Continue|Далее/ });
  await expect(continueBtn).toBeEnabled({ timeout: 5000 });
  await continueBtn.click();
  await expect(page.getByText('Add your parents')).toBeVisible({ timeout: 20_000 });
}

test.describe('Onboarding Wizard - Full Flow', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createTestUser({ name: 'E2E Onboarding Test' });
    createdUserIds.push(testUser.id);
  });

  test('wizard loads after sign-in for new user', async ({ page }) => {
    await goToWizard(page, testUser.email, testUser.password);
    await expect(page.getByText('Tell us about yourself')).toBeVisible();
  });

  test('Step 1: fill About You and proceed', async ({ page }) => {
    await goToWizard(page, testUser.email, testUser.password);

    await page.fill('#firstName', 'E2E');
    await page.fill('#lastName', 'TestUser');
    await page.fill('[data-testid="onboarding-birthDate"]', '1990-06-15');

    const continueBtn = page.locator('button').filter({ hasText: /Continue|Далее/ });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    await expect(page.getByText('Add your parents')).toBeVisible({ timeout: 20_000 });
  });

  test('Step 1: Continue disabled without name', async ({ page }) => {
    await goToWizard(page, testUser.email, testUser.password);

    await page.fill('#firstName', '');
    await page.fill('#lastName', '');

    const continueBtn = page.locator('button').filter({ hasText: /Continue|Далее/ });
    await expect(continueBtn).toBeDisabled();
  });
});

test.describe('Onboarding Wizard - Parents Step', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createTestUser({ name: 'E2E Parents Test' });
    createdUserIds.push(testUser.id);
  });

  test('Step 2: add parents and proceed', async ({ page }) => {
    await goToWizard(page, testUser.email, testUser.password);
    await completeStep1(page);

    await expect(page.getByText('Add your parents')).toBeVisible();

    await page.fill('#mother-firstName', 'TestMother');
    await page.fill('#mother-lastName', 'Family');
    await page.fill('#father-firstName', 'TestFather');
    await page.fill('#father-lastName', 'Family');

    const continueBtn = page.locator('button').filter({ hasText: /Continue|Далее/ });
    await continueBtn.click();

    await expect(page.getByRole('heading', { name: /Grandparents/i })).toBeVisible({ timeout: 20_000 });
  });

  test('Step 2: skip parent with checkbox', async ({ page }) => {
    await goToWizard(page, testUser.email, testUser.password);
    await completeStep1(page);

    await expect(page.getByText('Add your parents')).toBeVisible();

    // Click the "Unknown / Skip" label for mother
    const skipLabels = page.locator('label').filter({ hasText: /Unknown.*Skip|Неизвестно/ });
    await skipLabels.first().click();

    await expect(page.locator('#mother-firstName')).not.toBeVisible();

    await page.fill('#father-firstName', 'TestDad');
    await page.fill('#father-lastName', 'TestFamily');

    const continueBtn = page.locator('button').filter({ hasText: /Continue|Далее/ });
    await continueBtn.click();

    await expect(page.getByRole('heading', { name: /Grandparents/i })).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Onboarding Wizard - Navigation', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createTestUser({ name: 'E2E NavTest' });
    createdUserIds.push(testUser.id);
  });

  test('Back button returns to previous step', async ({ page }) => {
    await goToWizard(page, testUser.email, testUser.password);
    await completeStep1(page);

    await expect(page.getByText('Add your parents')).toBeVisible();

    const backBtn = page.locator('button').filter({ hasText: /Back|Назад/ });
    await backBtn.click();

    await expect(page.getByText('Tell us about yourself')).toBeVisible({ timeout: 10_000 });
  });

  test('Skip button advances to next step', async ({ page }) => {
    await goToWizard(page, testUser.email, testUser.password);
    await completeStep1(page);

    await expect(page.getByText('Add your parents')).toBeVisible();
    const skipBtn = page.locator('button').filter({ hasText: /Skip|Пропустить/ });
    await skipBtn.click();

    await expect(page.getByRole('heading', { name: /Grandparents/i })).toBeVisible({ timeout: 10_000 });
  });

  test('Back button disabled on Step 1', async ({ page }) => {
    await goToWizard(page, testUser.email, testUser.password);

    const backBtn = page.locator('button').filter({ hasText: /Back|Назад/ });
    await expect(backBtn).toBeDisabled();
  });
});

test.describe('Onboarding Wizard - Completion', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createTestUser({ name: 'E2E Complete' });
    createdUserIds.push(testUser.id);
  });

  test('completing wizard redirects to /tree', async ({ page }) => {
    test.setTimeout(120_000);
    await goToWizard(page, testUser.email, testUser.password);

    // Step 1: fill name and click Continue
    await page.fill('#firstName', 'E2E');
    await page.fill('#lastName', 'CompletionTest');
    const continueBtn = page.locator('button').filter({ hasText: /Continue|Далее/ });
    await continueBtn.click();

    // Step 2 (Parents) - Skip
    await expect(page.getByText('Add your parents')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(500); // Wait for animation (150ms) + React handler update
    const skipBtn = page.locator('button').filter({ hasText: /Skip|Пропустить/ });
    await skipBtn.click();

    // Step 3 (Grandparents) - Skip
    await expect(page.getByRole('heading', { name: /Grandparents/i })).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await skipBtn.click();

    // Step 4 (Siblings) - Skip
    await expect(page.getByText(/siblings|spouse/i)).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await skipBtn.click();

    // Step 5 (Invite) - Should show "Invite a family member" and "Finish" button
    await expect(page.getByText('Invite a family member')).toBeVisible({ timeout: 10_000 });
    const finishBtn = page.locator('button').filter({ hasText: /Finish|Завершить/ });
    await expect(finishBtn).toBeVisible({ timeout: 10_000 });
    await finishBtn.click();

    // Should redirect to /tree (may be slow on first run due to cold compilation)
    await page.waitForURL(/\/tree/, { timeout: 60_000, waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/tree/);
  });
});
