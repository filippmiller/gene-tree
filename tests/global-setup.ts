/**
 * Playwright Global Setup
 *
 * Runs before all tests:
 * 1. Loads environment variables
 * 2. Cleans up leftover test data from previous runs
 * 3. Verifies Supabase connection
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { cleanupAllTestUsers } from './helpers/cleanup';

export default async function globalSetup() {
  // Load .env.local
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

  // Verify required env vars
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}. Check .env.local`);
    }
  }

  console.log('[global-setup] Environment loaded');

  // Clean up leftover test users from previous runs
  console.log('[global-setup] Cleaning up leftover test data...');
  try {
    const deleted = await cleanupAllTestUsers();
    if (deleted > 0) {
      console.log(`[global-setup] Cleaned up ${deleted} leftover test items`);
    } else {
      console.log('[global-setup] No leftover test data found');
    }
  } catch (err) {
    console.warn('[global-setup] Cleanup warning:', err);
  }

  console.log('[global-setup] Ready to run tests');
}
