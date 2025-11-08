const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}]:`, text);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]:`, error.message);
    console.log(error.stack);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]:`, request.url());
  });

  // Capture response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ${response.status()}]:`, response.url());
    }
  });

  console.log('Opening sign-in page...');
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
  
  console.log('\n=== Page loaded ===');
  console.log('URL:', page.url());
  
  // Check for Build number
  const buildText = await page.textContent('.font-mono').catch(() => 'Not found');
  console.log('Build:', buildText);
  
  // Fill in credentials
  console.log('\n=== Filling form ===');
  await page.fill('input[type="email"]', 'filippmiller@gmail.com');
  await page.fill('input[type="password"]', 'Airbus380+');
  
  console.log('\n=== Clicking Sign In ===');
  await page.click('button[type="submit"]');
  
  // Wait for any navigation or errors
  console.log('\n=== Waiting 8 seconds ===');
  await page.waitForTimeout(8000);
  
  console.log('\n=== Final state ===');
  console.log('URL:', page.url());
  
  // Check for error messages
  const errorMsg = await page.textContent('.bg-red-50').catch(() => null);
  if (errorMsg) {
    console.log('ERROR MESSAGE:', errorMsg);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'login-detailed.png', fullPage: true });
  console.log('Screenshot saved');
  
  // Keep open
  console.log('\n=== Browser staying open (Ctrl+C to close) ===');
  await new Promise(() => {}); // Keep alive forever until Ctrl+C
})();
