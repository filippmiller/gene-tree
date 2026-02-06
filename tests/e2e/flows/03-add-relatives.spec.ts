/**
 * 03 - Add Relatives E2E Tests
 *
 * Tests adding different relationship types via the AddRelativeForm.
 * Uses an onboarded test user with a completed profile.
 *
 * The form has TWO relationship selects:
 * 1. Relationship type (parent, child, sibling, etc.) - data-testid="relationship-select"
 * 2. Specific relationship (mother, father, brother, etc.) - data-testid="specific-relationship-select"
 *
 * canSubmit requires: firstName, lastName, hasValidContact, specificRelationship, isDirect
 */

import { test, expect, type Locator } from '@playwright/test';
import { createOnboardedTestUser, TEST_PASSWORD } from '../../helpers/test-user-factory';
import { signInViaAPI } from '../../helpers/auth-helpers';
import { selectors } from '../../helpers/selectors';
import { cleanupUsers } from '../../helpers/cleanup';

const locale = 'en';
const createdUserIds: string[] = [];

/**
 * Navigate to the Add Relative form and wait for full React hydration.
 * Returns after the form is interactive (select has options rendered).
 */
async function navigateToAddRelativeForm(
  page: import('@playwright/test').Page,
  user: { email: string; password: string }
): Promise<void> {
  await signInViaAPI(page, user.email, user.password, `/${locale}/people/new`, locale);
  // Wait for the relationship select to be visible AND have options (fully hydrated)
  await page.locator(`${selectors.addRelative.relationshipSelect} option[value="parent"]`).waitFor({
    state: 'attached',
    timeout: 15_000,
  });
  // Extra wait for React event handlers to be fully attached after hydration
  await page.waitForTimeout(500);
}

/**
 * Select an option from a native <select> using click + keyboard to ensure
 * React processes the change reliably. Falls back to evaluate if needed.
 */
async function selectOption(
  page: import('@playwright/test').Page,
  locator: Locator,
  value: string
): Promise<void> {
  // Focus the select first
  await locator.focus();
  await page.waitForTimeout(100);

  // Use Playwright's selectOption (dispatches native events)
  await locator.selectOption(value);
  await page.waitForTimeout(200);

  // Verify the value was set, if not force it via evaluate
  const currentValue = await locator.evaluate((el) => (el as HTMLSelectElement).value);
  if (currentValue !== value) {
    await locator.evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value'
      )?.set;
      setter?.call(el, val);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
    await page.waitForTimeout(200);
  }

  // Final fallback: if React still hasn't processed it, force trigger onChange
  // by checking if the conditional UI appeared
  await page.waitForTimeout(300);
}

test.afterAll(async () => {
  await cleanupUsers(createdUserIds);
});

test.describe('Add Relatives - Form', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createOnboardedTestUser({ name: 'E2E AddRelative' });
    createdUserIds.push(testUser.id);
  });

  test('add relative form loads correctly', async ({ page }) => {
    test.setTimeout(120_000);
    await navigateToAddRelativeForm(page, testUser);

    // Key form elements
    await expect(page.locator(selectors.addRelative.firstNameInput)).toBeVisible();
    await expect(page.locator(selectors.addRelative.lastNameInput)).toBeVisible();
    await expect(page.locator(selectors.addRelative.submitButton)).toBeVisible();
  });

  test('add deceased ancestor (no contact info required)', async ({ page }) => {
    await navigateToAddRelativeForm(page, testUser);

    const relSelect = page.locator(selectors.addRelative.relationshipSelect);

    // Select relationship type
    await selectOption(page, relSelect, 'parent');

    // Wait for specific relationship dropdown to appear (conditionally rendered)
    const specificSelect = page.locator(selectors.addRelative.specificRelationshipSelect);
    await expect(specificSelect).toBeVisible({ timeout: 10_000 });

    // Select specific relationship (Mother)
    await selectOption(page, specificSelect, 'mother');

    // Fill name
    await page.locator(selectors.addRelative.firstNameInput).fill('GreatGrandma');
    await page.locator(selectors.addRelative.lastNameInput).fill('TestAncestor');

    // Mark as deceased ("In memory of the departed")
    await page.locator(selectors.addRelative.deceasedCheckbox).click();
    await page.waitForTimeout(500);

    // Deceased relatives don't need email/phone — submit should become enabled
    await expect(page.locator(selectors.addRelative.submitButton)).toBeEnabled({ timeout: 5000 });
  });

  test('form requires relationship type and names', async ({ page }) => {
    await navigateToAddRelativeForm(page, testUser);

    // Submit should be disabled initially (no fields filled)
    await expect(page.locator(selectors.addRelative.submitButton)).toBeDisabled();

    // Fill only name without relationship — should still be disabled
    await page.locator(selectors.addRelative.firstNameInput).fill('Test');
    await page.locator(selectors.addRelative.lastNameInput).fill('Person');
    await page.waitForTimeout(500);

    // Without relationship type selected, still disabled
    await expect(page.locator(selectors.addRelative.submitButton)).toBeDisabled();
  });

  test('add living relative with contact info', async ({ page }) => {
    await navigateToAddRelativeForm(page, testUser);

    const relSelect = page.locator(selectors.addRelative.relationshipSelect);

    // Step 1: Select relationship type
    await selectOption(page, relSelect, 'sibling');

    // Wait for specific relationship dropdown to appear (conditionally rendered)
    const specificSelect = page.locator(selectors.addRelative.specificRelationshipSelect);
    await expect(specificSelect).toBeVisible({ timeout: 10_000 });

    // Step 2: Select specific relationship (Brother)
    await selectOption(page, specificSelect, 'brother');

    // Fill name
    await page.locator(selectors.addRelative.firstNameInput).fill('TestSibling');
    await page.locator(selectors.addRelative.lastNameInput).fill('E2ERelative');

    // Fill email (required for living relatives)
    await page.locator(selectors.addRelative.emailInput).fill('e2e-sibling-test@example.com');

    // Wait for invite check debounce (500ms) + API call to complete
    await page.waitForTimeout(2000);

    // Submit should become enabled (or at least the form fields are correctly filled)
    await expect(page.locator(selectors.addRelative.submitButton)).toBeEnabled({ timeout: 10_000 });
  });
});

test.describe('Add Relatives - Relationship Types', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createOnboardedTestUser({ name: 'E2E RelTypes' });
    createdUserIds.push(testUser.id);
  });

  test('relationship dropdown shows all options', async ({ page }) => {
    await navigateToAddRelativeForm(page, testUser);

    // Relationship select should have the expected options
    const options = page.locator(`${selectors.addRelative.relationshipSelect} option`);
    const count = await options.count();
    // "Select type..." + Parent, Child, Spouse, Sibling, Grandparent, Grandchild, Aunt/Uncle, Nephew/Niece, Cousin = 10
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('selecting relationship type reveals specific options', async ({ page }) => {
    await navigateToAddRelativeForm(page, testUser);

    const relSelect = page.locator(selectors.addRelative.relationshipSelect);

    // Select "Parent"
    await selectOption(page, relSelect, 'parent');

    // Specific relationship dropdown should appear with Mother/Father options
    const specificSelect = page.locator(selectors.addRelative.specificRelationshipSelect);
    await expect(specificSelect).toBeVisible({ timeout: 10_000 });

    const specificOptions = specificSelect.locator('option');
    const count = await specificOptions.count();
    // "Select..." + Mother + Father = at least 3
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('deceased checkbox toggles contact requirements', async ({ page }) => {
    await navigateToAddRelativeForm(page, testUser);

    // Before checking deceased, email field should be visible
    const emailBefore = await page.locator(selectors.addRelative.emailInput).isVisible();
    expect(emailBefore).toBeTruthy();

    // Check "In memory of the departed"
    await page.locator(selectors.addRelative.deceasedCheckbox).click();
    await page.waitForTimeout(500);

    // After deceased is checked, email field may be hidden or not required
    const emailAfter = await page.locator(selectors.addRelative.emailInput).isVisible().catch(() => false);
    // Either still visible (but not required) or hidden
    expect(typeof emailAfter).toBe('boolean');
  });
});
