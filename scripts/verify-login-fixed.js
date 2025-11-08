const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console logs from browser
  const browserLogs = [];
  page.on('console', msg => {
    const logMsg = `[${msg.type().toUpperCase()}]: ${msg.text()}`;
    console.log(logMsg);
    browserLogs.push(logMsg);
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

  console.log('═══════════════════════════════════════');
  console.log('🔍 TESTING LOGIN AFTER DEPLOYMENT FIX');
  console.log('═══════════════════════════════════════\n');

  const email = 'mylifeis0plus1@gmail.com';
  const password = 'Airbus380+';

  console.log('📍 Opening sign-in page...');
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
  await page.waitForTimeout(1000);
  
  console.log('✍️  Filling credentials...');
  console.log('   Email:', email);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  console.log('🖱️  Clicking Sign In button...\n');
  await page.click('button[type="submit"]');
  
  // Wait longer to see redirect
  console.log('⏳ Waiting for response (10 seconds)...\n');
  await page.waitForTimeout(10000);
  
  const finalUrl = page.url();
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 RESULT');
  console.log('═══════════════════════════════════════');
  console.log('Final URL:', finalUrl);
  
  // Check logs for our debug messages
  const hasSignInLogs = browserLogs.some(log => log.includes('[SIGN-IN]'));
  const hasAuthLogs = browserLogs.some(log => log.includes('[AUTH]'));
  const hasSupabaseLogs = browserLogs.some(log => log.includes('[SUPABASE]'));
  
  console.log('\n📝 Debug Logs Present:');
  console.log('   [SIGN-IN] logs:', hasSignInLogs ? '✅' : '❌');
  console.log('   [AUTH] logs:', hasAuthLogs ? '✅' : '❌');
  console.log('   [SUPABASE] logs:', hasSupabaseLogs ? '✅' : '❌');
  
  // Analyze result
  if (finalUrl.includes('/app') && !finalUrl.includes('/sign-in')) {
    console.log('\n✅ SUCCESS! Login worked and redirected to app!');
    
    // Check if we're actually in the app
    const welcomeText = await page.textContent('h1').catch(() => null);
    if (welcomeText?.includes('Welcome back')) {
      console.log('✅ Dashboard page loaded successfully');
      console.log('   Welcome message:', welcomeText);
    }
    
  } else if (finalUrl.includes('/sign-in')) {
    console.log('\n❌ FAILED - Still on sign-in page');
    
    // Check for error message
    const errorMsg = await page.textContent('.bg-red-50').catch(() => null);
    if (errorMsg) {
      console.log('❌ Error message:', errorMsg);
    } else {
      console.log('⚠️  No error message (might be credential issue)');
    }
    
  } else {
    console.log('\n⚠️  UNEXPECTED - Redirected to:', finalUrl);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'verify-login-result.png', fullPage: true });
  console.log('\n📸 Screenshot saved: verify-login-result.png');
  
  console.log('\n═══════════════════════════════════════');
  console.log('Browser will stay open for 30 seconds...');
  console.log('Press Ctrl+C to close earlier');
  console.log('═══════════════════════════════════════\n');
  
  await page.waitForTimeout(30000);
  
  await browser.close();
})();
