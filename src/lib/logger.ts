import pino from 'pino';

/**
 * Structured logging for Gene-Tree
 *
 * Usage:
 *   import { logger, apiLogger, treeLogger } from '@/lib/logger';
 *
 *   // Structured logging (recommended)
 *   logger.info({ userId }, 'User logged in');
 *   logger.error({ error, userId }, 'Failed to fetch tree');
 *
 *   // Legacy console-style (still supported)
 *   logger.info('Message', data);
 *
 *   // Module-specific logging
 *   apiLogger.info({ route: '/api/tree', method: 'GET' }, 'Request started');
 *   treeLogger.info({ nodeCount: 50 }, 'Tree rendered');
 */

// Determine if we're in development
const isDevelopment = process.env.NODE_ENV === 'development';

// Base pino logger configuration
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  base: {
    service: 'gene-tree',
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive fields from logs
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'api_key',
      'apiKey',
      'secret',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,service,env',
        },
      }
    : undefined,
  // Format timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Backward-compatible logger wrapper
 * Supports both console-style (msg, ...args) and Pino-style (obj, msg) logging
 */
function createCompatibleLogger(pinoInstance: pino.Logger) {
  const wrapLogMethod = (method: 'info' | 'error' | 'warn' | 'debug' | 'trace' | 'fatal') => {
    return (...args: unknown[]) => {
      if (args.length === 0) {
        pinoInstance[method]('');
        return;
      }

      // If first arg is a plain object (not null, array, or Error), use Pino style
      if (
        args.length >= 1 &&
        typeof args[0] === 'object' &&
        args[0] !== null &&
        !Array.isArray(args[0]) &&
        !(args[0] instanceof Error)
      ) {
        // Pino style: logger.info({ key: value }, 'message')
        const [obj, ...rest] = args;
        const message = rest.length > 0 ? String(rest[0]) : '';
        pinoInstance[method](obj as object, message);
      } else {
        // Console style: logger.info('message', data1, data2)
        // Convert to Pino style by joining all args into message
        const message = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        pinoInstance[method](message);
      }
    };
  };

  return {
    info: wrapLogMethod('info'),
    error: wrapLogMethod('error'),
    warn: wrapLogMethod('warn'),
    debug: wrapLogMethod('debug'),
    trace: wrapLogMethod('trace'),
    fatal: wrapLogMethod('fatal'),
    // Expose child logger creation
    child: (bindings: pino.Bindings) => createCompatibleLogger(pinoInstance.child(bindings)),
    // Expose the raw pino instance for advanced usage
    _pino: pinoInstance,
  };
}

// Main logger
export const logger = createCompatibleLogger(pinoLogger);

// Module-specific child loggers
export const apiLogger = createCompatibleLogger(pinoLogger.child({ module: 'api' }));
export const authLogger = createCompatibleLogger(pinoLogger.child({ module: 'auth' }));
export const treeLogger = createCompatibleLogger(pinoLogger.child({ module: 'tree' }));
export const mediaLogger = createCompatibleLogger(pinoLogger.child({ module: 'media' }));
export const inviteLogger = createCompatibleLogger(pinoLogger.child({ module: 'invite' }));
export const kinshipLogger = createCompatibleLogger(pinoLogger.child({ module: 'kinship' }));
export const chatLogger = createCompatibleLogger(pinoLogger.child({ module: 'chat' }));

/**
 * Create a request-scoped logger with request ID for tracing
 *
 * Usage in API routes:
 *   const reqLogger = createRequestLogger(request);
 *   reqLogger.info('Processing request');
 */
export function createRequestLogger(request: Request) {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);

  return createCompatibleLogger(apiLogger._pino.child({
    requestId,
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
  }));
}

/**
 * Log and measure async operation duration
 *
 * Usage:
 *   const result = await withTiming(
 *     () => fetchTreeData(userId),
 *     treeLogger,
 *     'fetch_tree_data'
 *   );
 */
export async function withTiming<T>(
  fn: () => Promise<T>,
  log: ReturnType<typeof createCompatibleLogger>,
  operationName: string,
  context: Record<string, unknown> = {}
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;

    log._pino.info({ ...context, operationName, durationMs }, `${operationName} completed`);
    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;

    log._pino.error(
      {
        ...context,
        operationName,
        durationMs,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      `${operationName} failed`
    );

    throw error;
  }
}

/**
 * Wrap an API handler with request logging
 *
 * Usage:
 *   export const GET = withRequestLogging(async (request) => {
 *     // ... handler code
 *   });
 */
export function withRequestLogging(
  handler: (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<Response>
) {
  return async (request: Request, context?: { params: Promise<Record<string, string>> }): Promise<Response> => {
    const reqLogger = createRequestLogger(request);
    const startTime = Date.now();

    reqLogger.info('Request started');

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - startTime;

      reqLogger._pino.info(
        { statusCode: response.status, durationMs },
        'Request completed'
      );

      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      reqLogger._pino.error(
        {
          durationMs,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Request failed'
      );

      throw error;
    }
  };
}

// Export types for external use
export type Logger = ReturnType<typeof createCompatibleLogger>;
