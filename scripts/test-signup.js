const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console logs
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });

  console.log('Opening sign-up page...');
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-up');
  
  // Generate unique email (using test domain that Supabase accepts)
  const timestamp = Date.now();
  const email = `test.user.${timestamp}@gmail.com`;
  const password = 'TestPassword123!';
  
  console.log('\nRegistering new user:', email);
  
  // Fill form
  await page.fill('input#name', 'Test User');
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.fill('input#confirmPassword', password);
  
  console.log('Clicking Sign Up...');
  await page.click('button[type="submit"]');
  
  // Wait for response
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('\nCurrent URL:', url);
  
  // Check for success message
  const successMsg = await page.textContent('.bg-green-50').catch(() => null);
  if (successMsg) {
    console.log('\n✅ Success:', successMsg);
  }
  
  // Check for error message
  const errorMsg = await page.textContent('.bg-red-50').catch(() => null);
  if (errorMsg) {
    console.log('\n❌ Error:', errorMsg);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'signup-test.png', fullPage: true });
  console.log('\nScreenshot saved to signup-test.png');
  
  console.log('\n=== User Credentials ===');
  console.log('Email:', email);
  console.log('Password:', password);
  
  console.log('\nKeeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();
