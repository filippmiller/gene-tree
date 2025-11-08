const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Opening production site...');
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'production-signin.png', fullPage: true });
  console.log('Screenshot saved as production-signin.png');
  
  // Check for any console errors
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  
  // Wait 5 seconds to see
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
