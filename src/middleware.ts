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
import { detectLocaleFromHeader } from '@/lib/locale-detection';

/**
 * Lightweight structured log for API requests.
 * Uses console.log with JSON because Edge Runtime cannot use Pino (Node.js only).
 * Numeric levels match Pino conventions so log aggregators parse uniformly.
 */
function logApiRequest(
  request: NextRequest,
  statusCode: number,
  durationMs: number,
  extra?: Record<string, unknown>,
) {
  const entry = {
    level: statusCode >= 500 ? 50 : statusCode >= 400 ? 40 : 30,
    time: Date.now(),
    msg: 'api_request',
    method: request.method,
    path: request.nextUrl.pathname,
    status: statusCode,
    durationMs,
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown',
    ...extra,
  };
  console.log(JSON.stringify(entry));
}

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
  const startTime = Date.now();

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

      logApiRequest(request, 429, Date.now() - startTime, { rateLimited: true });
      return addSecurityHeaders(response);
    }

    // Continue with rate limit headers
    const response = NextResponse.next();
    const headers = getRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    logApiRequest(request, 200, Date.now() - startTime);
    return addSecurityHeaders(response);
  }

  // For non-API routes, auto-set locale cookie for first-time visitors
  const response = NextResponse.next();
  if (!request.cookies.get('NEXT_LOCALE')) {
    const detected = detectLocaleFromHeader(request.headers.get('accept-language'));
    response.cookies.set('NEXT_LOCALE', detected, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
    });
  }
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
