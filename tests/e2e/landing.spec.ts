/**
 * Landing Page E2E Tests
 *
 * Tests the public landing page at the root URL (/):
 * - Page loads with hero, features, and CTA sections
 * - Language switcher toggles between EN and RU
 * - Navigation links (Sign In, Get Started) work
 * - Key content is visible
 *
 * The landing page is served from src/app/page.tsx (not locale-prefixed).
 * It detects locale from cookies or Accept-Language header.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page - Load and Content', () => {
  test('landing page loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The page should have rendered (dark background with Gene-Tree branding)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('landing page shows hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroSection = page.getByTestId('hero-section');
    await expect(heroSection).toBeVisible({ timeout: 10000 });

    // Hero should contain a headline
    const headline = heroSection.locator('h1');
    await expect(headline).toBeVisible();
  });

  test('landing page shows features section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const featuresSection = page.getByTestId('features-section');
    await expect(featuresSection).toBeVisible();

    // Should have 3 feature cards
    const featureCards = featuresSection.locator('h3');
    await expect(featureCards).toHaveCount(3);
  });

  test('landing page shows CTA section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const ctaSection = page.getByTestId('cta-section');
    await expect(ctaSection).toBeVisible();
  });

  test('landing page shows navigation bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.getByTestId('landing-nav');
    await expect(nav).toBeVisible();

    // Should show Gene-Tree branding
    await expect(nav.getByText('Gene-Tree')).toBeVisible();
  });

  test('landing page has footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText('Gene-Tree')).toBeVisible();
  });
});

test.describe('Landing Page - Navigation Links', () => {
  test('Sign In link navigates to sign-in page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const signInLink = page.getByTestId('nav-sign-in');
    await expect(signInLink).toBeVisible();

    await signInLink.click();
    await page.waitForURL('**/sign-in**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('Get Started link navigates to sign-up page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const getStartedLink = page.getByTestId('nav-get-started');
    await expect(getStartedLink).toBeVisible();

    await getStartedLink.click();
    await page.waitForURL('**/sign-up**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('hero CTA buttons link to sign-up and sign-in', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hero = page.getByTestId('hero-section');

    // "Start Free" button links to sign-up
    const startFreeLink = hero.locator('a').filter({ hasText: /Start Free|Начать бесплатно/ });
    await expect(startFreeLink).toBeVisible();
    const startFreeHref = await startFreeLink.getAttribute('href');
    expect(startFreeHref).toContain('/sign-up');

    // Sign-in link in hero
    const signInLink = hero.locator('a').filter({ hasText: /Sign In|Войти/ });
    await expect(signInLink).toBeVisible();
    const signInHref = await signInLink.getAttribute('href');
    expect(signInHref).toContain('/sign-in');
  });
});

test.describe('Landing Page - Language Switcher', () => {
  test('language switcher is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const langSwitcher = page.getByTestId('landing-language-switcher');
    await expect(langSwitcher).toBeVisible();
  });

  test('language switcher toggles content language', async ({ page }) => {
    // Clear any existing locale cookie first
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const langSwitcher = page.getByTestId('landing-language-switcher');
    await expect(langSwitcher).toBeVisible();

    // Get the current switcher text to determine current language
    const switcherText = await langSwitcher.textContent();

    if (switcherText?.includes('Русский')) {
      // Currently English, clicking switches to Russian
      await langSwitcher.click();
      // The landing page reloads on language switch (sets cookie, reloads)
      await page.waitForLoadState('networkidle');

      // After reload, content should be in Russian
      // The switcher should now show "English"
      await expect(page.getByTestId('landing-language-switcher')).toContainText('English');

      // Hero content should be in Russian
      await expect(page.getByText('История вашей семьи')).toBeVisible({ timeout: 10000 });
    } else {
      // Currently Russian, clicking switches to English
      await langSwitcher.click();
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('landing-language-switcher')).toContainText('Русский');
      await expect(page.getByText('Your Family Story')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Landing Page - English Content', () => {
  test('displays English content when locale is EN', async ({ page }) => {
    // Set locale cookie to English
    await page.context().addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify English content
    await expect(page.getByText('Your Family Story')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Lives Forever')).toBeVisible();
    await expect(page.getByText('Interactive Family Tree')).toBeVisible();
    await expect(page.getByText('Voice Stories')).toBeVisible();
    await expect(page.getByText('Collaborative')).toBeVisible();
  });
});

test.describe('Landing Page - Russian Content', () => {
  test('displays Russian content when locale is RU', async ({ page }) => {
    // Set locale cookie to Russian
    await page.context().addCookies([
      { name: 'NEXT_LOCALE', value: 'ru', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Russian content
    await expect(page.getByText('История вашей семьи')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Живёт вечно')).toBeVisible();
    await expect(page.getByText('Интерактивное древо')).toBeVisible();
    await expect(page.getByText('Голосовые истории')).toBeVisible();
    await expect(page.getByText('Совместная работа')).toBeVisible();
  });
});

test.describe('Landing Page - Trust Badges', () => {
  test('trust badges are visible in hero section', async ({ page }) => {
    await page.context().addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Privacy-first')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Global families')).toBeVisible();
    await expect(page.getByText('Made with love')).toBeVisible();
  });
});
