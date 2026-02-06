/**
 * Auth Helpers for Playwright E2E Tests
 *
 * Provides sign-in, sign-out, and authentication check utilities
 * for use across all test files.
 *
 * Uses two approaches:
 * - signIn: UI-based sign-in (for testing the sign-in flow itself)
 * - signInViaAPI: API-based sign-in (fast, for tests that need auth but aren't testing sign-in)
 */

import { type Page, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_LOCALE = 'en';
const NAVIGATION_TIMEOUT = 30_000;

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

/**
 * Sign in via the sign-in form (UI-based).
 * Use this only for tests that specifically test the sign-in UI.
 * For most tests, prefer signInViaAPI() which is 10x faster.
 */
export async function signIn(
  page: Page,
  email: string,
  password: string,
  locale: string = DEFAULT_LOCALE
): Promise<void> {
  await page.goto(`/${locale}/sign-in`);
  await page.waitForLoadState('networkidle');

  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to app (dashboard, onboarding, or tree)
  await page.waitForURL(
    (url) => {
      const p = url.pathname;
      return p.includes('/app') || p.includes('/tree') || p.includes('/onboarding');
    },
    { timeout: NAVIGATION_TIMEOUT }
  );
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Fast API-based sign-in that bypasses the UI entirely.
 * 1. Signs in via Supabase SDK (Node.js side) to get tokens
 * 2. Posts tokens to /api/auth/session to set server-side cookies
 * 3. Navigates to the target page
 *
 * ~2-5s vs ~30s for UI-based signIn
 */
export async function signInViaAPI(
  page: Page,
  email: string,
  password: string,
  targetPath?: string,
  locale: string = DEFAULT_LOCALE
): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // 1. Sign in via Supabase SDK (server-side, fast)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(`API sign-in failed: ${error?.message || 'No session returned'}`);
  }

  // 2. Navigate to the app first to establish the origin
  const baseUrl = page.context().pages()[0]?.url()?.startsWith('http')
    ? undefined
    : undefined;
  await page.goto(`/${locale}/sign-in`, { waitUntil: 'domcontentloaded' });

  // 3. Set the session cookie via the session endpoint (with retry for rate limits)
  let response: Awaited<ReturnType<typeof page.request.post>>;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await page.request.post('/api/auth/session', {
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });

    if (response.status() === 429) {
      const body = await response.text();
      const retryAfter = JSON.parse(body)?.retryAfter || 10;
      await new Promise((r) => setTimeout(r, retryAfter * 1000 + 1000));
      continue;
    }
    break;
  }

  if (response!.status() !== 204) {
    throw new Error(`Session sync failed: ${response!.status()} ${await response!.text()}`);
  }

  // 4. Navigate to target page (or app dashboard)
  const target = targetPath || `/${locale}/app`;
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  // Don't use networkidle — pages with WebSocket/SSE (profile, chat, stories) never reach it.
  // A short wait after domcontentloaded is sufficient for React to hydrate.
  await page.waitForTimeout(1000);
}

/**
 * Sign out by clicking the sidebar sign-out button.
 */
export async function signOut(
  page: Page,
  locale: string = DEFAULT_LOCALE
): Promise<void> {
  // Ensure desktop viewport for sidebar visibility
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(300);

  const signOutBtn = page.getByTestId('sign-out-btn').first();
  await expect(signOutBtn).toBeVisible({ timeout: 5000 });
  await signOutBtn.click();

  await page.waitForURL(`**/${locale}/sign-in`, { timeout: NAVIGATION_TIMEOUT });
}

/**
 * Sign up via the sign-up form.
 * Note: In test mode with admin-created users, prefer createTestUser() instead.
 */
export async function signUp(
  page: Page,
  name: string,
  email: string,
  password: string,
  locale: string = DEFAULT_LOCALE
): Promise<void> {
  await page.goto(`/${locale}/sign-up`);
  await page.waitForLoadState('networkidle');

  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  await page.click('button[type="submit"]');
}

/**
 * Check if the page is on an authenticated route.
 * If not, sign in with the provided credentials (via API for speed).
 */
export async function ensureAuthenticated(
  page: Page,
  email: string,
  password: string,
  locale: string = DEFAULT_LOCALE
): Promise<void> {
  const url = page.url();

  if (url.includes('/sign-in') || url.includes('/sign-up') || url === 'about:blank') {
    await signInViaAPI(page, email, password, undefined, locale);
  }
}

/**
 * Navigate to a protected route, signing in via API if needed.
 */
export async function navigateAuthenticated(
  page: Page,
  path: string,
  email: string,
  password: string,
  locale: string = DEFAULT_LOCALE
): Promise<void> {
  await signInViaAPI(page, email, password, `/${locale}${path}`, locale);
}
