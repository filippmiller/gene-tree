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
  
  const email = 'mylifeis0plus1@gmail.com';
  const password = 'Airbus380+';
  
  console.log('\nRegistering user:', email);
  
  // Fill form
  await page.fill('input#name', 'Filip');
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
    console.log('\n🔔 Please check your email and click the confirmation link!');
  }
  
  // Check for error message
  const errorMsg = await page.textContent('.bg-red-50').catch(() => null);
  if (errorMsg) {
    console.log('\n❌ Error:', errorMsg);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'signup-user.png', fullPage: true });
  console.log('\nScreenshot saved to signup-user.png');
  
  console.log('\nKeeping browser open for 60 seconds...');
  await page.waitForTimeout(60000);
  
  await browser.close();
})();
