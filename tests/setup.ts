/**
 * Vitest Setup File
 *
 * Configures test environment and global mocks
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
  useParams: () => ({ locale: 'en' }),
}));

// Mock Next.js link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => {
    return children;
  },
}));

// Global test utilities
global.fetch = vi.fn();
