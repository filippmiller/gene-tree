const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}]:`, msg.text());
  });

  console.log('Opening sign-in page...');
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
  
  console.log('Filling credentials...');
  await page.fill('input[type="email"]', 'filippmiller@gmail.com');
  await page.fill('input[type="password"]', 'Airbus380+');
  
  console.log('Clicking Sign In...');
  await page.click('button[type="submit"]');
  
  // Wait a bit and check
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('\nCurrent URL:', url);
  
  if (url.includes('/sign-in')) {
    console.log('❌ Login failed - still on sign-in page\n');
    
    // Try to find error message
    const errorElement = await page.$('.bg-red-50');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('Error message:', errorText);
    } else {
      console.log('No error message element found');
      
      // Check if button is still loading
      const buttonText = await page.textContent('button[type="submit"]');
      console.log('Button text:', buttonText);
    }
  } else {
    console.log('✅ Login successful! Redirected to:', url);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'login-test.png', fullPage: true });
  console.log('\nScreenshot saved to login-test.png');
  
  console.log('\nKeeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();
