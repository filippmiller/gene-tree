const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Capture network errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]:`, error.message);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]:`, request.url(), request.failure().errorText);
  });

  console.log('Opening sign-in page...');
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
  
  console.log('Page loaded. Current URL:', page.url());
  
  // Fill in credentials
  console.log('Filling email...');
  await page.fill('input[type="email"]', 'filippmiller@gmail.com');
  
  console.log('Filling password...');
  await page.fill('input[type="password"]', 'Airbus380+');
  
  console.log('Clicking sign in button...');
  await page.click('button[type="submit"]');
  
  // Wait and see what happens
  console.log('Waiting for navigation...');
  await page.waitForTimeout(5000);
  
  console.log('Final URL:', page.url());
  
  // Take screenshot
  await page.screenshot({ path: 'after-login.png', fullPage: true });
  console.log('Screenshot saved as after-login.png');
  
  // Keep browser open
  console.log('\nBrowser will stay open. Press Ctrl+C to close.');
  await page.waitForTimeout(300000); // Wait 5 minutes
  
  await browser.close();
})();
