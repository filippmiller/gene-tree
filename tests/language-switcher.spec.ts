import { test, expect } from '@playwright/test';

test.describe('Language Switcher', () => {
  test('should switch from Russian to English and back', async ({ page }) => {
    // Go to the sign-in page (public, no auth needed)
    await page.goto('http://localhost:3000/ru/sign-in');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check we're on Russian page
    console.log('Step 1: Checking Russian page');
    const currentUrl1 = page.url();
    console.log('Current URL:', currentUrl1);
    expect(currentUrl1).toContain('/ru/');
    
    // Find the language switcher button
    const langButton = page.locator('button').filter({ hasText: /English|Русский/ });
    await expect(langButton).toBeVisible();
    
    // Check button text
    const buttonText1 = await langButton.textContent();
    console.log('Button shows:', buttonText1);
    expect(buttonText1).toBe('English'); // Should show opposite language
    
    // Click to switch to English
    console.log('Step 2: Clicking to switch to English');
    await langButton.click();
    
    // Wait for navigation
    await page.waitForURL(/\/en\//);
    await page.waitForLoadState('networkidle');
    
    // Check we're now on English page
    console.log('Step 3: Checking English page');
    const currentUrl2 = page.url();
    console.log('Current URL:', currentUrl2);
    expect(currentUrl2).toContain('/en/');
    
    // Check button now shows Russian
    const langButton2 = page.locator('button').filter({ hasText: /English|Русский/ });
    const buttonText2 = await langButton2.textContent();
    console.log('Button shows:', buttonText2);
    expect(buttonText2).toBe('Русский'); // Should show Russian now
    
    // Switch back to Russian
    console.log('Step 4: Clicking to switch back to Russian');
    await langButton2.click();
    
    // Wait for navigation
    await page.waitForURL(/\/ru\//);
    await page.waitForLoadState('networkidle');
    
    // Check we're back on Russian page
    console.log('Step 5: Checking back on Russian page');
    const currentUrl3 = page.url();
    console.log('Current URL:', currentUrl3);
    expect(currentUrl3).toContain('/ru/');
    
    // Check button shows English again
    const langButton3 = page.locator('button').filter({ hasText: /English|Русский/ });
    const buttonText3 = await langButton3.textContent();
    console.log('Button shows:', buttonText3);
    expect(buttonText3).toBe('English');
    
    console.log('✅ Test passed! Language switching works correctly.');
  });
});
