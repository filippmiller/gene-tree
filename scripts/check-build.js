const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Checking build number on production...\n');
  
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
  
  const buildText = await page.textContent('.font-mono').catch(() => null);
  const currentHash = 'b79b622'; // First 7 chars of our commit
  
  console.log('Build shown on page:', buildText);
  console.log('Expected commit:', currentHash);
  
  if (buildText && buildText.includes(currentHash)) {
    console.log('\n✅ NEW BUILD IS LIVE!');
  } else {
    console.log('\n⏳ Old build still running. Wait a bit more...');
  }
  
  await browser.close();
})();
