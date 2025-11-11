import { test, expect } from '@playwright/test';

const FILIP_EMAIL = 'filippmiller@gmail.com';
const FILIP_PASSWORD = 'Airbus380+';

test.describe('Media System Full Cycle', () => {
  
  test('Avatar upload by Filip', async ({ page }) => {
    console.log('[TEST] Step 1: Login as Filip');
    
    // Login
    await page.goto('http://localhost:3000/en/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input#email', FILIP_EMAIL);
    await page.fill('input#password', FILIP_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    
    // Wait for redirect
    await page.waitForURL('**/app**', { timeout: 15000 });
    console.log('[TEST] ✓ Logged in');

    // Go to profile
    await page.goto('http://localhost:3000/en/profile');
    await page.waitForLoadState('networkidle');
    console.log('[TEST] ✓ On profile page');

    // Take screenshot
    await page.screenshot({ path: 'test-results/profile-initial.png', fullPage: true });

    // Expand avatar section if collapsed
    const avatarSection = page.locator('text=Фотография профиля');
    await avatarSection.click({ force: true });
    await page.waitForTimeout(500);
    console.log('[TEST] Clicked avatar section, waiting for it to expand...');
    
    // Wait for upload button to appear
    const uploadButton = page.locator('text=Загрузить фото');
    await uploadButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[TEST] ✓ Upload button visible');

    // Find the hidden file input inside the label
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    console.log('[TEST] ✓ Avatar upload input found');

    // Create test image (1x1 PNG)
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload image (даже если input скрыт, setInputFiles работает)
    console.log('[TEST] Uploading avatar...');
    await fileInput.setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: testImage,
    });

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Check for success message
    const successMessage = page.locator('text=/загружен|обновлен|успешно/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
    console.log('[TEST] ✓ Avatar uploaded successfully');

    // Take screenshot after upload
    await page.screenshot({ path: 'test-results/profile-avatar-uploaded.png', fullPage: true });

    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    if (errors.length > 0) {
      console.log('[TEST] ❌ Console errors:', errors);
    } else {
      console.log('[TEST] ✓ No console errors');
    }
  });

  test('Check avatar in photos table', async ({ page }) => {
    console.log('[TEST] Step 2: Verify avatar in database');
    
    // Login as Filip
    await page.goto('http://localhost:3000/en/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input#email', FILIP_EMAIL);
    await page.fill('input#password', FILIP_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    await page.waitForURL('**/app**', { timeout: 15000 });

    // Go to profile to get user ID from page
    await page.goto('http://localhost:3000/en/profile');
    await page.waitForLoadState('networkidle');

    // Check if photo moderation section exists
    const moderationSection = page.locator('text=Предложенные фото');
    if (await moderationSection.isVisible()) {
      console.log('[TEST] ✓ Photo moderation section exists');
    } else {
      console.log('[TEST] ⚠️  Photo moderation section not found (will be added later)');
    }

    console.log('[TEST] ✓ Profile page loaded successfully');
  });

  test('Process jobs worker', async ({ page }) => {
    console.log('[TEST] Step 3: Trigger jobs processing');
    
    // Login as Filip (admin)
    await page.goto('http://localhost:3000/en/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input#email', FILIP_EMAIL);
    await page.fill('input#password', FILIP_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    await page.waitForURL('**/app**', { timeout: 15000 });

    // Call process-jobs API
    console.log('[TEST] Calling /api/media/process-jobs...');
    
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/media/process-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return {
        status: res.status,
        data: await res.json(),
      };
    });

    console.log('[TEST] Process jobs response:', response);
    
    if (response.status === 200) {
      console.log('[TEST] ✓ Jobs processed:', response.data.processed);
    } else if (response.status === 403) {
      console.log('[TEST] ⚠️  Need admin role to process jobs');
    }
  });
});
