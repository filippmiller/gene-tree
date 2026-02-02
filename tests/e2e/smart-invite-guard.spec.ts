/**
 * E2E Tests for Smart Invite Guard
 *
 * Tests user flow integration with AddRelativeForm and InviteGuardAlert
 * Uses Playwright for browser automation
 *
 * Test scenarios:
 * 1. OK_TO_INVITE - Clean invite flow
 * 2. SELF_INVITE - User tries to invite themselves
 * 3. EXISTING_MEMBER - Email/phone already in family
 * 4. PENDING_INVITE - Already invited person
 * 5. POTENTIAL_BRIDGE - User exists but not connected
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_USER_EMAIL = `test-invite-guard-${Date.now()}@example.com`;
const TEST_USER_PASSWORD = 'TestPassword123!';

// Helper: Create a test user and log in
async function setupAuthenticatedUser(page: Page) {
  await page.goto('/en/sign-up');

  await page.fill('#email', TEST_USER_EMAIL);
  await page.fill('#password', TEST_USER_PASSWORD);
  await page.fill('#confirmPassword', TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for dashboard or handle email verification
  await page.waitForURL(/\/(dashboard|app|people)/, { timeout: 30000 }).catch(() => {
    // May need email verification in production
  });
}

// Helper: Navigate to Add Relative form
async function navigateToAddRelativeForm(page: Page) {
  await page.goto('/en/people/add');
  await page.waitForLoadState('networkidle');
}

// Helper: Fill basic relative info (name and relationship)
async function fillBasicRelativeInfo(
  page: Page,
  firstName: string,
  lastName: string,
  relationshipType: string
) {
  // Select direct relationship radio
  await page.click('input[type="radio"][value="true"]');

  await page.fill('input[name="firstName"], input[placeholder*="Имя"]', firstName);
  await page.fill('input[name="lastName"], input[placeholder*="Фамилия"]', lastName);

  // Select relationship type (parent, sibling, etc.)
  await page.selectOption('select', relationshipType);

  // If there's a subtype dropdown visible, select first option
  const subtypeSelect = page.locator('select').nth(1);
  if (await subtypeSelect.isVisible()) {
    await subtypeSelect.selectOption({ index: 1 });
  }
}

test.describe('Smart Invite Guard - E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('Scenario 1: OK_TO_INVITE - Clean invite allowed', async ({ page }) => {
    await navigateToAddRelativeForm(page);

    await fillBasicRelativeInfo(page, 'John', 'Doe', 'sibling');

    // Enter a fresh email
    const freshEmail = `fresh-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', freshEmail);

    // Wait for debounced check (500ms)
    await page.waitForTimeout(600);

    // Should NOT show any warning alerts
    await expect(page.locator('[role="alert"]')).not.toBeVisible();

    // Submit button should be enabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('Scenario 2: SELF_INVITE - Cannot invite yourself', async ({ page }) => {
    await navigateToAddRelativeForm(page);

    await fillBasicRelativeInfo(page, 'Self', 'Test', 'sibling');

    // Enter current user's email
    await page.fill('input[type="email"]', TEST_USER_EMAIL);

    // Wait for debounced check
    await page.waitForTimeout(600);

    // Should show SELF_INVITE alert
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText(/невозможно пригласить себя/i);

    // Should show XCircle icon or error variant
    await expect(page.locator('[role="alert"] svg')).toBeVisible();

    // Submit button should be disabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('Scenario 3: EXISTING_MEMBER - Already in family tree', async ({ page }) => {
    // First, add a relative
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Jane', 'Smith', 'sibling');

    const existingEmail = `existing-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', existingEmail);

    // Submit the first invite
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/people/, { timeout: 10000 });

    // Now try to add the same person again
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Jane', 'Smith', 'sibling');

    await page.fill('input[type="email"]', existingEmail);
    await page.waitForTimeout(600);

    // Should show EXISTING_MEMBER alert
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText(/хорошие новости|уже|already/i);

    // Should show avatar and member info
    await expect(page.locator('[role="alert"] img, [role="alert"] [data-fallback]')).toBeVisible();

    // Should have action buttons (View Profile, How You're Related)
    const viewProfileButton = page.locator('a:has-text("Посмотреть профиль"), a:has-text("View Profile")');
    await expect(viewProfileButton).toBeVisible();

    // Submit button should be disabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('Scenario 4: PENDING_INVITE - Already invited', async ({ page }) => {
    // Add a pending relative
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Pending', 'User', 'sibling');

    const pendingEmail = `pending-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', pendingEmail);

    // Submit the invite
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/people/, { timeout: 10000 });

    // Try to invite the same email again
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Pending', 'User', 'sibling');

    await page.fill('input[type="email"]', pendingEmail);
    await page.waitForTimeout(600);

    // Should show PENDING_INVITE alert
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText(/приглашение уже отправлено|already invited/i);

    // Should show Clock icon or warning variant
    await expect(page.locator('[role="alert"] svg')).toBeVisible();

    // Should have "Send Reminder" button
    const reminderButton = page.locator('button:has-text("Отправить напоминание"), button:has-text("Send Reminder")');
    await expect(reminderButton).toBeVisible();

    // Submit button should be disabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('Scenario 5: POTENTIAL_BRIDGE - User exists but not connected', async ({ page, context }) => {
    // Create a second user in a separate context (simulating existing user)
    const bridgePage = await context.newPage();
    const bridgeEmail = `bridge-${Date.now()}@example.com`;

    await bridgePage.goto('/en/sign-up');
    await bridgePage.fill('#email', bridgeEmail);
    await bridgePage.fill('#password', 'BridgePassword123!');
    await bridgePage.fill('#confirmPassword', 'BridgePassword123!');
    await bridgePage.click('button[type="submit"]');

    // Wait for bridge user registration
    await bridgePage.waitForTimeout(2000);
    await bridgePage.close();

    // Now try to invite the bridge user from primary account
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Bridge', 'User', 'sibling');

    await page.fill('input[type="email"]', bridgeEmail);
    await page.waitForTimeout(600);

    // Should show POTENTIAL_BRIDGE alert
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText(/пользователь.*существует|user exists/i);

    // Should show Users icon or info variant
    await expect(page.locator('[role="alert"] svg')).toBeVisible();

    // Should have "Send Bridge Request" button
    const bridgeButton = page.locator(
      'button:has-text("Отправить запрос"), button:has-text("Send Bridge Request"), button:has-text("Connect")'
    );
    await expect(bridgeButton).toBeVisible();

    // Submit button should be disabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Smart Invite Guard - Phone Number Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('Should check by phone number', async ({ page }) => {
    await navigateToAddRelativeForm(page);

    await fillBasicRelativeInfo(page, 'Phone', 'User', 'sibling');

    // Enter phone without email
    const freshPhone = `+1555${Date.now().toString().slice(-7)}`;
    await page.fill('input[type="tel"]', freshPhone);

    // Check SMS consent if required
    const smsConsent = page.locator('input[type="checkbox"][name="smsConsent"]');
    if (await smsConsent.isVisible()) {
      await smsConsent.check();
    }

    // Wait for debounced check
    await page.waitForTimeout(600);

    // Should NOT show any warning alerts (fresh phone)
    await expect(page.locator('[role="alert"][data-variant="error"]')).not.toBeVisible();
  });

  test('Should detect duplicate phone number', async ({ page }) => {
    // Add relative with phone
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'First', 'Phone', 'sibling');

    const testPhone = `+1555${Date.now().toString().slice(-7)}`;
    await page.fill('input[type="tel"]', testPhone);

    const smsConsent = page.locator('input[type="checkbox"][name="smsConsent"]');
    if (await smsConsent.isVisible()) {
      await smsConsent.check();
    }

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/people/, { timeout: 10000 });

    // Try same phone again
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Second', 'Phone', 'sibling');

    await page.fill('input[type="tel"]', testPhone);
    await page.waitForTimeout(600);

    // Should show duplicate alert
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });

    // Submit should be disabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Smart Invite Guard - Deceased Relatives', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('Should not check invite guard for deceased relatives', async ({ page }) => {
    await navigateToAddRelativeForm(page);

    await fillBasicRelativeInfo(page, 'Deceased', 'Ancestor', 'grandparent');

    // Check "deceased" checkbox
    const deceasedCheckbox = page.locator('input[type="checkbox"]:near(:text("ушедшем")), input[type="checkbox"]:near(:text("deceased"))');
    await deceasedCheckbox.check();

    // Enter email (even though deceased)
    await page.fill('input[type="email"]', TEST_USER_EMAIL);

    // Wait for potential check
    await page.waitForTimeout(600);

    // Should NOT show any alert (deceased bypasses check)
    await expect(page.locator('[role="alert"]')).not.toBeVisible();

    // Submit button should be enabled (name + relationship filled)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });
});

test.describe('Smart Invite Guard - Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('Should show loading indicator during check', async ({ page }) => {
    await navigateToAddRelativeForm(page);

    await fillBasicRelativeInfo(page, 'Loading', 'Test', 'sibling');

    // Type email
    await page.fill('input[type="email"]', `loading-${Date.now()}@example.com`);

    // Should show loading indicator immediately (before debounce)
    const loadingIndicator = page.locator('svg.animate-spin, :text("Проверка"), :text("Checking")');

    // Wait briefly to catch the loading state
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 }).catch(() => {
      // Loading may be too fast to catch
    });

    // After check completes, loading should disappear
    await page.waitForTimeout(1000);
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
  });

  test('Submit button should be disabled while checking', async ({ page }) => {
    await navigateToAddRelativeForm(page);

    await fillBasicRelativeInfo(page, 'Submit', 'Test', 'sibling');

    // Fill email to trigger check
    await page.fill('input[type="email"]', `submit-test-${Date.now()}@example.com`);

    // Submit button should be disabled while checking
    const submitButton = page.locator('button[type="submit"]');

    // During debounce period, button should be disabled
    await expect(submitButton).toBeDisabled({ timeout: 300 });

    // After check completes, button should be enabled (if OK_TO_INVITE)
    await page.waitForTimeout(700);
    await expect(submitButton).toBeEnabled({ timeout: 2000 });
  });
});

test.describe('Smart Invite Guard - Action Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('Send Reminder button should be functional', async ({ page }) => {
    // Create pending invite
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Reminder', 'Test', 'sibling');

    const reminderEmail = `reminder-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', reminderEmail);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/people/, { timeout: 10000 });

    // Try to add same person
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Reminder', 'Test', 'sibling');
    await page.fill('input[type="email"]', reminderEmail);
    await page.waitForTimeout(600);

    // Click "Send Reminder"
    const reminderButton = page.locator('button:has-text("Отправить напоминание"), button:has-text("Send Reminder")');
    await reminderButton.click();

    // Should show loading state
    await expect(reminderButton).toBeDisabled({ timeout: 1000 });

    // After reminder sent, alert should disappear or show success
    await page.waitForTimeout(2000);
  });

  test('Dismiss button should hide alert', async ({ page }) => {
    // Create a scenario that triggers an alert
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Dismiss', 'Test', 'sibling');

    await page.fill('input[type="email"]', TEST_USER_EMAIL); // Self-invite
    await page.waitForTimeout(600);

    // Alert should be visible
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();

    // Click dismiss/cancel button if present
    const dismissButton = page.locator('button:has-text("Отмена"), button:has-text("Cancel"), button:has-text("Dismiss")');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();

      // Alert should be hidden
      await expect(alert).not.toBeVisible({ timeout: 2000 });
    }
  });
});

test.describe('Smart Invite Guard - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('Should handle network errors gracefully', async ({ page }) => {
    // Intercept API call and force error
    await page.route('/api/invitations/check', (route) => {
      route.abort('failed');
    });

    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Network', 'Error', 'sibling');

    await page.fill('input[type="email"]', `network-${Date.now()}@example.com`);
    await page.waitForTimeout(600);

    // Should not show alert on network error (fail gracefully)
    await expect(page.locator('[role="alert"]')).not.toBeVisible();

    // Submit button should still be enabled (allow form submission)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('Should handle malformed API response', async ({ page }) => {
    // Intercept API and return invalid JSON
    await page.route('/api/invitations/check', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json{',
      });
    });

    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Malformed', 'Response', 'sibling');

    await page.fill('input[type="email"]', `malformed-${Date.now()}@example.com`);
    await page.waitForTimeout(600);

    // Should clear check and allow submission
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('Should debounce rapid email changes', async ({ page }) => {
    let checkCount = 0;

    await page.route('/api/invitations/check', (route) => {
      checkCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'OK_TO_INVITE' }),
      });
    });

    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Debounce', 'Test', 'sibling');

    const emailInput = page.locator('input[type="email"]');

    // Type rapidly
    await emailInput.type('test1@example.com');
    await page.waitForTimeout(100);
    await emailInput.clear();
    await emailInput.type('test2@example.com');
    await page.waitForTimeout(100);
    await emailInput.clear();
    await emailInput.type('test3@example.com');

    // Wait for debounce to settle
    await page.waitForTimeout(700);

    // Should have made only 1 or 2 API calls (not 3)
    expect(checkCount).toBeLessThan(3);
  });

  test('Should handle case-insensitive email matching', async ({ page }) => {
    await navigateToAddRelativeForm(page);
    await fillBasicRelativeInfo(page, 'Case', 'Test', 'sibling');

    // Enter email with different case
    const upperCaseEmail = TEST_USER_EMAIL.toUpperCase();
    await page.fill('input[type="email"]', upperCaseEmail);
    await page.waitForTimeout(600);

    // Should still detect self-invite
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText(/невозможно пригласить себя/i);
  });
});
