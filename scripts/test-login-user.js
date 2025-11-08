const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console logs
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });

  // Capture network responses
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ${response.status()}]:`, response.url());
    }
  });

  console.log('Opening sign-in page...');
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
  
  const email = 'mylifeis0plus1@gmail.com';
  const password = 'Airbus380+';
  
  console.log('\n=== Attempting login ===');
  console.log('Email:', email);
  
  // Fill form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  console.log('Clicking Sign In...');
  await page.click('button[type="submit"]');
  
  // Wait for navigation or error
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('\n=== Result ===');
  console.log('Current URL:', url);
  
  if (url.includes('/sign-in')) {
    console.log('❌ Login failed - still on sign-in page');
    
    // Check for error message
    const errorMsg = await page.textContent('.bg-red-50').catch(() => null);
    if (errorMsg) {
      console.log('Error message:', errorMsg);
    } else {
      console.log('No error message displayed (BUG!)');
    }
  } else if (url.includes('/app')) {
    console.log('✅ Login successful! Redirected to app');
  } else {
    console.log('⚠️  Unexpected redirect to:', url);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'login-user.png', fullPage: true });
  console.log('\nScreenshot saved to login-user.png');
  
  console.log('\nKeeping browser open for 60 seconds...');
  await page.waitForTimeout(60000);
  
  await browser.close();
})();
