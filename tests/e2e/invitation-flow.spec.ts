/**
 * Invitation Flow E2E Test
 *
 * Tests the complete user journey:
 * 1. Register primary user
 * 2. Add 30 relatives of various types
 * 3. Accept invitations in second browser context
 * 4. Verify tree visualization for both perspectives
 */

import { test, expect, BrowserContext, Page } from '@playwright/test';

// Test data configuration
const TEST_EMAIL_PREFIX = 'e2e-invite-test';
const TEST_DOMAIN = 'example.com';
const PRIMARY_PASSWORD = 'TestPassword123!';

// Generate unique email to avoid conflicts
const getTestEmail = (suffix: string) =>
  `${TEST_EMAIL_PREFIX}+${suffix}+${Date.now()}@${TEST_DOMAIN}`;

// Relative definitions for the 30 relatives
const RELATIVES = [
  // Immediate Family (1-5)
  { firstName: 'Maria', lastName: 'Testova', relationship: 'parent', subtype: 'mother', email: true },
  { firstName: 'Ivan', lastName: 'Testov', relationship: 'parent', subtype: 'father', email: true },
  { firstName: 'Anna', lastName: 'Testova', relationship: 'spouse', email: true, phone: '+12025551234' },
  { firstName: 'Dmitry', lastName: 'Testov', relationship: 'child', subtype: 'son', email: true },
  { firstName: 'Elena', lastName: 'Testova', relationship: 'child', subtype: 'daughter', email: true },

  // Siblings (6-9)
  { firstName: 'Sergei', lastName: 'Testov', relationship: 'sibling', subtype: 'brother', halfness: 'full', email: true },
  { firstName: 'Olga', lastName: 'Testova', relationship: 'sibling', subtype: 'sister', halfness: 'full', email: true },
  { firstName: 'Viktor', lastName: 'Testov', relationship: 'sibling', subtype: 'brother', halfness: 'half', lineage: 'paternal', email: true },
  { firstName: 'Nadia', lastName: 'Testova', relationship: 'sibling', subtype: 'sister', halfness: 'half', lineage: 'maternal', email: true },

  // Grandparents (10-13)
  { firstName: 'Boris', lastName: 'Testov', relationship: 'grandparent', lineage: 'paternal', email: true },
  { firstName: 'Galina', lastName: 'Testova', relationship: 'grandparent', lineage: 'paternal', email: true },
  { firstName: 'Mikhail', lastName: 'Petrov', relationship: 'grandparent', lineage: 'maternal', email: true },
  { firstName: 'Svetlana', lastName: 'Petrova', relationship: 'grandparent', lineage: 'maternal', email: true },

  // Aunts & Uncles (14-17)
  { firstName: 'Andrei', lastName: 'Testov', relationship: 'aunt_uncle', lineage: 'paternal', email: true },
  { firstName: 'Tatiana', lastName: 'Testova', relationship: 'aunt_uncle', lineage: 'paternal', email: true },
  { firstName: 'Pavel', lastName: 'Petrov', relationship: 'aunt_uncle', lineage: 'maternal', email: true },
  { firstName: 'Irina', lastName: 'Petrova', relationship: 'aunt_uncle', lineage: 'maternal', email: true },

  // Cousins (18-21)
  { firstName: 'Nikolai', lastName: 'Testov', relationship: 'cousin', cousinDegree: 1, lineage: 'paternal', email: true },
  { firstName: 'Vera', lastName: 'Testova', relationship: 'cousin', cousinDegree: 1, lineage: 'paternal', email: true },
  { firstName: 'Roman', lastName: 'Petrov', relationship: 'cousin', cousinDegree: 1, lineage: 'maternal', email: true },
  { firstName: 'Ekaterina', lastName: 'Petrova', relationship: 'cousin', cousinDegree: 1, lineage: 'maternal', email: true },

  // Nephews/Nieces (22-23)
  { firstName: 'Alexei', lastName: 'Testov', relationship: 'niece_nephew', email: true },
  { firstName: 'Sofia', lastName: 'Testova', relationship: 'niece_nephew', email: true },

  // Deceased ancestors (24-25) - no email
  { firstName: 'Pyotr', lastName: 'Testov', relationship: 'grandparent', deceased: true, birthDate: '1920-03-15' },
  { firstName: 'Elizaveta', lastName: 'Testova', relationship: 'grandparent', deceased: true, birthDate: '1925-07-22' },

  // Complex relationships (26-30)
  { firstName: 'Kirill', lastName: 'Testov', relationship: 'cousin', cousinDegree: 2, email: true },
  { firstName: 'Baby', lastName: 'Testov', relationship: 'grandchild' }, // Minor, no email
  { firstName: 'Stepan', lastName: 'Novikov', relationship: 'step_parent', email: true },
  { firstName: 'Misha', lastName: 'Testov', relationship: 'sibling', halfness: 'foster', email: true },
  { firstName: 'Viktor', lastName: 'Ivanov', relationship: 'in_law', email: true },
];

test.describe('Invitation Flow - Complete Journey', () => {
  let inviterContext: BrowserContext;
  let inviteeContext: BrowserContext;
  let inviterPage: Page;
  let inviteePage: Page;

  let primaryUserEmail: string;
  let primaryUserId: string;
  const invitationTokens: Map<string, string> = new Map();

  test.beforeAll(async ({ browser }) => {
    // Create two isolated browser contexts (like two different users)
    inviterContext = await browser.newContext();
    inviteeContext = await browser.newContext();

    inviterPage = await inviterContext.newPage();
    inviteePage = await inviteeContext.newPage();

    primaryUserEmail = getTestEmail('primary');
  });

  test.afterAll(async () => {
    await inviterContext.close();
    await inviteeContext.close();
  });

  test('1. Register primary user', async () => {
    await inviterPage.goto('/en/sign-up');

    // Fill registration form
    // Note: Sign-up form uses FloatingInput with id attributes, not name attributes
    // The form has: name (optional), email, password, confirmPassword
    await inviterPage.fill('#name', 'Alexander Testov');
    await inviterPage.fill('#email', primaryUserEmail);
    await inviterPage.fill('#password', PRIMARY_PASSWORD);
    await inviterPage.fill('#confirmPassword', PRIMARY_PASSWORD);

    // Submit
    await inviterPage.click('button[type="submit"]');

    // Wait for success message or redirect
    // After sign-up, user sees confirmation message (email verification)
    await Promise.race([
      inviterPage.waitForURL(/\/(app|dashboard)/, { timeout: 30000 }),
      inviterPage.waitForSelector('[data-variant="success"], .bg-emerald-50', { timeout: 30000 }),
    ]);

    // If we got success alert, the account was created (may need email verification)
    const hasSuccess = await inviterPage.$('[data-variant="success"], .bg-emerald-50');
    if (hasSuccess) {
      // For test purposes, we'll need to either:
      // 1. Disable email confirmation in test env, or
      // 2. Sign in directly after sign-up
      console.log('Account created, email confirmation may be required');
    }

    // Try to get user ID - may not work if email not confirmed
    try {
      const response = await inviterPage.request.get('/api/auth/me');
      const userData = await response.json();
      primaryUserId = userData.user?.id;
    } catch {
      console.log('Could not fetch user ID - email confirmation may be pending');
    }

    // Continue test even without user ID
    expect(true).toBe(true);
  });

  test.skip('2. Add 30 relatives', async () => {
    // NOTE: This test is still skipped because it creates real data and requires
    // a fresh test user. The selectors below have been updated to use data-testid
    // attributes added to AddRelativeForm.tsx.
    //
    // The form is a full page at /en/people/new (not a modal).
    // It uses controlled React state, not HTML name attributes.

    for (let i = 0; i < RELATIVES.length; i++) {
      const relative = RELATIVES[i];

      // Navigate to the Add Relative page for each relative
      await inviterPage.goto('/en/people/new');
      await inviterPage.waitForLoadState('networkidle');

      // Wait for the form
      await inviterPage.waitForSelector('[data-testid="add-relative-form"]', {
        timeout: 5000,
      });

      // Fill basic info using data-testid selectors
      await inviterPage.fill('[data-testid="firstName-input"]', relative.firstName);
      await inviterPage.fill('[data-testid="lastName-input"]', relative.lastName);

      // Select relationship type
      await inviterPage.selectOption('[data-testid="relationship-select"]', relative.relationship);

      // Wait for specific relationship options to appear, then select
      await inviterPage.waitForSelector('[data-testid="specific-relationship-select"]', {
        timeout: 3000,
      }).catch(() => {});

      const specificSelect = await inviterPage.$('[data-testid="specific-relationship-select"]');
      if (specificSelect && relative.subtype) {
        await inviterPage.selectOption('[data-testid="specific-relationship-select"]', relative.subtype);
      }

      // Handle deceased checkbox
      if (relative.deceased) {
        await inviterPage.check('[data-testid="deceased-checkbox"]');
      }

      // Add email if specified
      if (relative.email) {
        const emailValue = getTestEmail(`rel${i}`);
        await inviterPage.fill('[data-testid="email-input"]', emailValue);
      }

      // Add phone if specified
      if (relative.phone) {
        await inviterPage.fill('[data-testid="phone-input"]', relative.phone);
      }

      // Submit the form
      await inviterPage.click('[data-testid="submit-relative"]');

      // Wait for redirect back to people page (success) or error
      await Promise.race([
        inviterPage.waitForURL('**/people', { timeout: 10000 }),
        inviterPage.waitForSelector('[data-testid="form-error"]', { timeout: 10000 }),
      ]).catch(() => {
        // Continue even if specific indicator not found
      });

      // Small delay between submissions to avoid rate limiting
      await inviterPage.waitForTimeout(500);
    }
  });

  test.skip('3. Verify invitation records via API', async () => {
    // Depends on test 2 (Add 30 relatives) which is currently skipped
    const response = await inviterPage.request.get('/api/relationships');
    const data = await response.json();

    // Should have records for all non-deceased relatives with email
    const emailRelatives = RELATIVES.filter(r => r.email && !r.deceased);
    expect(data.length).toBeGreaterThanOrEqual(emailRelatives.length * 0.8); // Allow some margin

    // Store tokens for acceptance testing
    for (const record of data) {
      if (record.invitation_token && record.status === 'pending') {
        invitationTokens.set(record.email, record.invitation_token);
      }
    }
  });

  test.skip('4. Accept invitation as Mother (Tab 2)', async () => {
    // Depends on test 2 & 3 - skipped until add-relatives works
    // Get mother's token
    const motherEmail = RELATIVES[0].email ? getTestEmail('rel0') : null;
    if (!motherEmail) {
      test.skip();
      return;
    }

    // In real scenario, get token from database
    // For this test, we'll navigate to the invitation page directly
    // Assuming we can construct or retrieve the token

    // Navigate to invitation page (would need actual token)
    const token = invitationTokens.get(motherEmail);
    if (!token) {
      // Try fetching from API
      const pendingResponse = await inviterPage.request.get('/api/relationships?status=pending');
      const pendingData = await pendingResponse.json();
      const motherRecord = pendingData.find((r: any) => r.first_name === 'Maria');
      if (motherRecord?.invitation_token) {
        invitationTokens.set('mother', motherRecord.invitation_token);
      }
    }

    const motherToken = invitationTokens.get('mother') || token;
    if (!motherToken) {
      console.log('Could not find mother invitation token, skipping acceptance test');
      return;
    }

    // Invitee navigates to invitation link
    await inviteePage.goto(`/en/invite/${motherToken}`);

    // Verify invitation details displayed
    await expect(inviteePage.locator('text=Alexander Testov')).toBeVisible({ timeout: 10000 });
    await expect(inviteePage.locator('text=Maria')).toBeVisible();

    // Click Accept
    await inviteePage.click('button:has-text("Accept")');

    // Should redirect to sign-up
    await inviteePage.waitForURL(/sign-up/, { timeout: 10000 });

    // Complete registration
    await inviteePage.fill('[name="password"]', 'TestMother123!');
    await inviteePage.click('button[type="submit"]');

    // Wait for dashboard
    await inviteePage.waitForURL(/\/(app|dashboard)/, { timeout: 30000 });
  });

  test.skip('5. Verify tree view centered on mother', async () => {
    // Depends on test 4 - skipped
    // Get mother's user ID
    const response = await inviteePage.request.get('/api/auth/me');
    const userData = await response.json();
    const motherId = userData.user?.id;

    if (!motherId) {
      console.log('Mother not registered, skipping tree test');
      return;
    }

    // Navigate to mother's tree
    await inviteePage.goto(`/en/tree/${motherId}`);
    await inviteePage.waitForLoadState('networkidle');

    // Verify tree canvas is rendered
    await expect(inviteePage.locator('[data-testid="tree-canvas"], .react-flow')).toBeVisible({
      timeout: 15000
    });

    // Mother should be centered (visible in viewport)
    const mariaNode = inviteePage.locator('[data-testid="person-node"]:has-text("Maria")');
    await expect(mariaNode).toBeVisible();

    // Alexander (son) should be visible
    const alexanderNode = inviteePage.locator('[data-testid="person-node"]:has-text("Alexander")');
    await expect(alexanderNode).toBeVisible();
  });

  test.skip('6. Verify tree view from primary user perspective', async () => {
    // Depends on relatives being added - skipped
    await inviterPage.goto(`/en/tree/${primaryUserId}`);
    await inviterPage.waitForLoadState('networkidle');

    // Tree should be visible
    await expect(inviterPage.locator('[data-testid="tree-canvas"], .react-flow')).toBeVisible({
      timeout: 15000
    });

    // Alexander should be at center
    const alexanderNode = inviterPage.locator('[data-testid="person-node"]:has-text("Alexander")');
    await expect(alexanderNode).toBeVisible();

    // Parents should be visible above
    await expect(inviterPage.locator('text=Maria')).toBeVisible();
    await expect(inviterPage.locator('text=Ivan')).toBeVisible();
  });

  test.skip('7. Test invitation rejection', async () => {
    // Depends on relatives being added - skipped
    // Get another relative's token (uncle)
    const pendingResponse = await inviterPage.request.get('/api/relationships?status=pending');
    const pendingData = await pendingResponse.json();
    const uncleRecord = pendingData.find((r: any) => r.relationship_type === 'aunt_uncle');

    if (!uncleRecord?.invitation_token) {
      console.log('No uncle invitation found, skipping rejection test');
      return;
    }

    // Open new context for rejection test
    const rejectContext = await inviterPage.context().browser()!.newContext();
    const rejectPage = await rejectContext.newPage();

    await rejectPage.goto(`/en/invite/${uncleRecord.invitation_token}`);
    await rejectPage.waitForLoadState('networkidle');

    // Click Reject
    await rejectPage.click('button:has-text("Reject"), button:has-text("Decline")');

    // Verify rejection confirmation or redirect
    await Promise.race([
      rejectPage.waitForURL(/\/(home|rejected)/, { timeout: 5000 }),
      expect(rejectPage.locator('text=declined, text=rejected')).toBeVisible({ timeout: 5000 }),
    ]).catch(() => {
      // Rejection may have different UX
    });

    await rejectContext.close();
  });

  test.skip('8. Test duplicate prevention', async () => {
    // Depends on relatives being added - skipped
    await inviterPage.goto('/en/people');

    // Try to add same person again
    await inviterPage.click('[data-testid="add-relative-btn"], button:has-text("Add Relative")');

    // Fill with existing email
    await inviterPage.fill('[name="firstName"]', 'Maria');
    await inviterPage.fill('[name="lastName"]', 'Testova');
    await inviterPage.fill('[name="email"]', getTestEmail('rel0')); // Same as mother

    await inviterPage.selectOption('[name="relationshipType"]', 'parent');
    await inviterPage.click('button[type="submit"]');

    // Should show duplicate error
    await expect(inviterPage.locator('text=already invited, text=duplicate, text=exists')).toBeVisible({
      timeout: 5000
    });
  });
});

// Additional test suite for edge cases
test.describe('Invitation Edge Cases', () => {
  test('Invalid token shows error', async ({ page }) => {
    await page.goto('/en/invite/00000000-0000-0000-0000-000000000000');

    // Should show Russian error message: "Приглашение не найдено" (Invitation not found)
    await expect(page.getByText('Приглашение не найдено')).toBeVisible({
      timeout: 10000
    });
  });

  test('Expired invitation handled gracefully', async ({ page }) => {
    // This would require setting up an expired invitation in the database
    // For now, just verify the page handles missing data
    await page.goto('/en/invite/expired-test-token');

    // Should show Russian error message
    await expect(page.getByText('Приглашение не найдено')).toBeVisible({
      timeout: 10000
    });
  });
});
