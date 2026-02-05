/**
 * CSRF Protection for Gene-Tree
 *
 * Implements CSRF token generation and validation for form submissions.
 * Uses double-submit cookie pattern.
 */

import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate and set CSRF token cookie
 * Call this when rendering forms
 */
export async function generateCsrfToken(): Promise<string> {
  const token = generateToken();

  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  return token;
}

/**
 * Validate CSRF token from request
 * Compares token in header/body with token in cookie
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken && timingSafeEqual(cookieToken, headerToken)) {
    return true;
  }

  // Check body for form submissions
  const contentType = request.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      const body = await request.clone().json();
      if (body._csrf && timingSafeEqual(cookieToken, body._csrf)) {
        return true;
      }
    } catch {
      // Invalid JSON, CSRF validation fails
    }
  }

  if (contentType?.includes('application/x-www-form-urlencoded')) {
    try {
      const body = await request.clone().formData();
      const formToken = body.get('_csrf');
      if (formToken && typeof formToken === 'string' && timingSafeEqual(cookieToken, formToken)) {
        return true;
      }
    } catch {
      // Invalid form data, CSRF validation fails
    }
  }

  return false;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * CSRF validation middleware for API routes
 * Wrap your API handler with this for CSRF protection
 */
export function withCsrfProtection<T>(
  handler: (request: Request, context?: T) => Promise<Response>
): (request: Request, context?: T) => Promise<Response> {
  return async (request: Request, context?: T): Promise<Response> => {
    // Only validate for state-changing methods
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const isValid = await validateCsrfToken(request);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return handler(request, context);
  };
}

/**
 * Get current CSRF token from cookie (for client-side use)
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}
