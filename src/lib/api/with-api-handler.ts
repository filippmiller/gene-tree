/**
 * Unified API Handler Wrapper for Gene-Tree
 *
 * Provides consistent request/response logging, error handling,
 * and request context for all API routes.
 *
 * Usage:
 *   import { withApiHandler } from '@/lib/api/with-api-handler';
 *   import { apiLogger } from '@/lib/logger';
 *
 *   export const GET = withApiHandler(async (req, ctx) => {
 *     // ... handler code
 *     return NextResponse.json({ data });
 *   }, { logger: apiLogger });
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger, type Logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Categories for classifying errors consistently */
export type ErrorCategory = 'auth' | 'validation' | 'not_found' | 'forbidden' | 'business' | 'infrastructure';

/**
 * Extended context passed to the handler function.
 * Includes the original Next.js route params plus observability helpers.
 */
export interface ApiHandlerContext {
  params: Promise<Record<string, string>>;
  requestId: string;
  logger: Logger;
}

/** Options for configuring the wrapper */
export interface WithApiHandlerOptions {
  /** Logger instance to use (default: apiLogger) */
  logger?: Logger;
  /** Maximum body size to log in bytes (default: 0 = don't log body) */
  maxBodyLog?: number;
}

/** The shape of an API route handler that withApiHandler wraps */
type ApiRouteHandler = (
  request: NextRequest,
  context: ApiHandlerContext,
) => Promise<NextResponse | Response>;

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/** Classify an error into a consistent category */
function classifyError(error: unknown): { category: ErrorCategory; statusCode: number; message: string } {
  if (error instanceof ApiError) {
    return {
      category: error.category,
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Auth errors
    if (msg.includes('unauthorized') || msg.includes('unauthenticated') || msg.includes('jwt') || msg.includes('token')) {
      return { category: 'auth', statusCode: 401, message: 'Unauthorized' };
    }

    // Forbidden
    if (msg.includes('forbidden') || msg.includes('permission')) {
      return { category: 'forbidden', statusCode: 403, message: 'Forbidden' };
    }

    // Validation
    if (msg.includes('invalid') || msg.includes('required') || msg.includes('validation')) {
      return { category: 'validation', statusCode: 400, message: error.message };
    }

    // Not found
    if (msg.includes('not found') || msg.includes('no rows')) {
      return { category: 'not_found', statusCode: 404, message: 'Not found' };
    }
  }

  // Default: infrastructure error
  return {
    category: 'infrastructure',
    statusCode: 500,
    message: 'Internal server error',
  };
}

// ---------------------------------------------------------------------------
// ApiError - throwable typed error for handlers
// ---------------------------------------------------------------------------

/**
 * Typed error that handlers can throw for structured error responses.
 *
 * Usage:
 *   throw new ApiError('validation', 400, 'Email is required');
 */
export class ApiError extends Error {
  constructor(
    public readonly category: ErrorCategory,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// withApiHandler
// ---------------------------------------------------------------------------

/**
 * Higher-order function that wraps an API route handler with:
 * - Request ID generation (UUID)
 * - Structured request logging (method, path, user agent, IP)
 * - Response logging (status code, duration)
 * - Error catching and classification
 * - Consistent error response format
 */
export function withApiHandler(
  handler: ApiRouteHandler,
  options: WithApiHandlerOptions = {},
) {
  const baseLogger = options.logger ?? apiLogger;

  return async (
    request: NextRequest,
    routeContext?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse | Response> => {
    const requestId = crypto.randomUUID();
    const startTime = performance.now();

    // Extract request metadata
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create request-scoped logger
    const reqLogger = baseLogger.child({ requestId, method, path });

    reqLogger.info({ ip, userAgent }, 'Request started');

    try {
      const ctx: ApiHandlerContext = {
        params: routeContext?.params ?? Promise.resolve({}),
        requestId,
        logger: reqLogger,
      };

      const response = await handler(request, ctx);

      const durationMs = Math.round(performance.now() - startTime);
      const status = response instanceof NextResponse ? response.status : (response as Response).status;

      reqLogger.info({ statusCode: status, durationMs }, 'Request completed');

      // Attach request ID header to response for client-side correlation
      if (response instanceof NextResponse) {
        response.headers.set('x-request-id', requestId);
      }

      return response;
    } catch (error: unknown) {
      const durationMs = Math.round(performance.now() - startTime);
      const classified = classifyError(error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      reqLogger.error(
        {
          statusCode: classified.statusCode,
          durationMs,
          errorCategory: classified.category,
          error: errorMessage,
          stack: errorStack,
        },
        'Request failed',
      );

      const body: Record<string, unknown> = {
        error: classified.message,
        requestId,
      };

      // In development, include more details
      if (process.env.NODE_ENV === 'development') {
        body.detail = errorMessage;
        body.category = classified.category;
      }

      const response = NextResponse.json(body, { status: classified.statusCode });
      response.headers.set('x-request-id', requestId);
      return response;
    }
  };
}
