/**
 * Rate Limiting for Gene-Tree API
 *
 * Uses Upstash Redis for distributed rate limiting across serverless functions.
 * Falls back to in-memory limiting when Redis is not configured.
 *
 * Rate limit tiers:
 * - auth: 5 requests/minute (login, register, password reset)
 * - api: 60 requests/minute (general API endpoints)
 * - search: 30 requests/minute (search endpoints)
 * - tree: 20 requests/minute (expensive tree queries)
 * - upload: 10 requests/minute (file uploads)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { apiLogger } from '@/lib/logger';

// Rate limit configurations by tier
export const RATE_LIMIT_TIERS = {
  auth: { requests: 5, window: '1m' },      // Strict for auth
  api: { requests: 60, window: '1m' },      // General API
  search: { requests: 30, window: '1m' },   // Search endpoints
  tree: { requests: 20, window: '1m' },     // Expensive tree queries
  upload: { requests: 10, window: '1m' },   // File uploads
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

// In-memory fallback store for development/when Redis unavailable
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if Upstash Redis is configured
 */
function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Create rate limiter instance
 * Uses Redis if configured, otherwise falls back to in-memory
 */
function createRateLimiter(tier: RateLimitTier): Ratelimit | null {
  if (!isRedisConfigured()) {
    return null; // Will use in-memory fallback
  }

  const config = RATE_LIMIT_TIERS[tier];

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: `gene-tree:ratelimit:${tier}`,
    });
  } catch (error) {
    apiLogger.error({ error, tier }, 'Failed to create Redis rate limiter');
    return null;
  }
}

// Cache rate limiters by tier
const rateLimiters = new Map<RateLimitTier, Ratelimit | null>();

function getRateLimiter(tier: RateLimitTier): Ratelimit | null {
  if (!rateLimiters.has(tier)) {
    rateLimiters.set(tier, createRateLimiter(tier));
  }
  return rateLimiters.get(tier) || null;
}

/**
 * In-memory rate limiting fallback
 * Used when Redis is not configured (development, etc.)
 */
function checkInMemoryLimit(
  identifier: string,
  tier: RateLimitTier
): { success: boolean; remaining: number; reset: number } {
  const config = RATE_LIMIT_TIERS[tier];
  const key = `${tier}:${identifier}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: config.requests - 1, reset: now + windowMs };
  }

  if (entry.count >= config.requests) {
    // Rate limited
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  // Increment counter
  entry.count++;
  return { success: true, remaining: config.requests - entry.count, reset: entry.resetAt };
}

/**
 * Clean up expired entries from in-memory store periodically
 */
function cleanupInMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetAt) {
      inMemoryStore.delete(key);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupInMemoryStore, 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  tier: RateLimitTier;
}

/**
 * Check rate limit for an identifier (usually IP or user ID)
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param tier - Rate limit tier to apply
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'api'
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_TIERS[tier];
  const limiter = getRateLimiter(tier);

  if (limiter) {
    // Use Redis rate limiter
    try {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: config.requests,
        remaining: result.remaining,
        reset: result.reset,
        tier,
      };
    } catch (error) {
      apiLogger.error({ error, identifier, tier }, 'Redis rate limit check failed, using fallback');
      // Fall through to in-memory
    }
  }

  // Use in-memory fallback
  const result = checkInMemoryLimit(identifier, tier);
  return {
    success: result.success,
    limit: config.requests,
    remaining: result.remaining,
    reset: result.reset,
    tier,
  };
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    'X-RateLimit-Tier': result.tier,
  };
}

/**
 * Determine rate limit tier based on request path
 */
export function getTierForPath(pathname: string): RateLimitTier {
  // Auth endpoints - strictest limits
  if (
    pathname.startsWith('/api/auth') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/password')
  ) {
    return 'auth';
  }

  // Search endpoints
  if (pathname.includes('/search') || pathname.includes('/matches')) {
    return 'search';
  }

  // Tree endpoints - expensive queries
  if (pathname.startsWith('/api/tree') || pathname.includes('/relationships')) {
    return 'tree';
  }

  // Upload endpoints
  if (
    pathname.includes('/upload') ||
    pathname.includes('/photo') ||
    pathname.includes('/media')
  ) {
    return 'upload';
  }

  // Default API tier
  return 'api';
}

/**
 * Extract client identifier from request
 * Prefers user ID if authenticated, falls back to IP
 */
export function getClientIdentifier(
  request: Request,
  userId?: string | null
): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP from various headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback to a default (shouldn't happen in production)
  return 'ip:unknown';
}
