/**
 * Next.js Middleware for Gene-Tree
 *
 * Handles:
 * - Rate limiting for API endpoints
 * - Security headers
 * - Request logging
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  checkRateLimit,
  getRateLimitHeaders,
  getTierForPath,
  getClientIdentifier,
} from '@/lib/rate-limit';

// Paths that should skip rate limiting
const SKIP_RATE_LIMIT_PATHS = [
  '/_next',
  '/favicon.ico',
  '/api/health',
  '/static',
  '/images',
];

// Security headers to add to all responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
};

/**
 * Check if path should skip rate limiting
 */
function shouldSkipRateLimit(pathname: string): boolean {
  return SKIP_RATE_LIMIT_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for static assets and health checks
  if (shouldSkipRateLimit(pathname)) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Only rate limit API routes
  if (pathname.startsWith('/api')) {
    const tier = getTierForPath(pathname);
    const identifier = getClientIdentifier(request);

    const rateLimitResult = await checkRateLimit(identifier, tier);

    // If rate limited, return 429
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again later.`,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );

      // Add rate limit headers
      const headers = getRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      response.headers.set(
        'Retry-After',
        String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
      );

      return addSecurityHeaders(response);
    }

    // Continue with rate limit headers
    const response = NextResponse.next();
    const headers = getRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return addSecurityHeaders(response);
  }

  // For non-API routes, just add security headers
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
