import { test, expect } from '@playwright/test';

test('profile page debug', async ({ page }) => {
  // Listen to console logs
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('[PROFILE]')) {
      console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
    }
  });

  // First, login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/en/sign-in');
  await page.fill('input[type="email"]', 'filippmiller@gmail.com');
  await page.fill('input[type="password"]', 'Airbus380+');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => console.log('Not redirected to dashboard'));
  
  // Now go to profile page
  console.log('Going to profile page...');
  await page.goto('http://localhost:3000/en/profile');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  console.log('\n=== STEP 1: Check initial data ===');
  const bodyText = await page.textContent('body');
  console.log('✓ Body contains "Filipp":', bodyText?.includes('Filipp'));
  console.log('✓ Body contains "Miller":', bodyText?.includes('Miller'));
  console.log('✓ Navigation visible:', bodyText?.includes('Navigation') || bodyText?.includes('Nav'));
  
  await page.screenshot({ path: 'profile-1-initial.png', fullPage: true });
  
  console.log('\n=== STEP 2: Try uploading avatar ===');
  // Look for avatar upload input
  const avatarInput = page.locator('input[type="file"]');
  if (await avatarInput.count() > 0) {
    // Create a test image file
    const fs = require('fs');
    const testImagePath = 'test-avatar.png';
    // Create a simple 1x1 PNG
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, pngData);
    
    await avatarInput.setInputFiles(testImagePath);
    console.log('✓ Avatar file selected');
    await page.waitForTimeout(3000); // Wait for upload
    await page.screenshot({ path: 'profile-2-avatar.png', fullPage: true });
  } else {
    console.log('✗ Avatar upload input not found');
  }
  
  console.log('\n=== STEP 3: Edit basic info ===');
  // Click "Редактировать" button if in view mode
  const editButton = page.locator('button:has-text("Редактировать")');
  if (await editButton.count() > 0) {
    await editButton.click();
    console.log('✓ Clicked edit button');
    await page.waitForTimeout(1000);
  }
  
  // Fill middle name
  const middleNameInput = page.locator('input[name="middle_name"]');
  if (await middleNameInput.count() > 0) {
    await middleNameInput.fill('Alexandrovich');
    console.log('✓ Filled middle name');
  }
  
  // Select gender
  const genderSelect = page.locator('select[name="gender"]');
  if (await genderSelect.count() > 0) {
    await genderSelect.selectOption('male');
    console.log('✓ Selected gender');
  }
  
  // Fill birth date
  const birthDateInput = page.locator('input[type="date"]');
  if (await birthDateInput.count() > 0) {
    await birthDateInput.fill('1990-05-15');
    console.log('✓ Filled birth date');
  }
  
  // Click save
  const saveButton = page.locator('button:has-text("Сохранить")');
  if (await saveButton.count() > 0) {
    await saveButton.click();
    console.log('✓ Clicked save button');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'profile-3-edited.png', fullPage: true });
  
  console.log('\n=== FINAL CHECK ===');
  const finalText = await page.textContent('body');
  console.log('Data now contains:');
  console.log('  - Filipp:', finalText?.includes('Filipp'));
  console.log('  - Miller:', finalText?.includes('Miller'));
  console.log('  - Alexandrovich:', finalText?.includes('Alexandrovich'));
  console.log('  - male/Мужской:', finalText?.includes('male') || finalText?.includes('Мужской'));
  console.log('\nScreenshots saved: profile-1-initial.png, profile-2-avatar.png, profile-3-edited.png');
});
