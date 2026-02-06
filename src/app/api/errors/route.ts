/**
 * POST /api/errors
 *
 * Client-side error reporting endpoint.
 * Accepts error details from the browser and stores them in audit_logs.
 *
 * Rate limited in middleware via the standard API tier.
 * Additional per-IP soft limit (20 reports per minute) to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limit for error reports specifically
const errorReportCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_REPORTS_PER_MINUTE = 20;

function isAbusiveRate(ip: string): boolean {
  const now = Date.now();
  const entry = errorReportCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    errorReportCounts.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REPORTS_PER_MINUTE;
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of errorReportCounts.entries()) {
      if (now > entry.resetAt) {
        errorReportCounts.delete(key);
      }
    }
  }, 5 * 60_000);
}

/** Accepted request body shape */
interface ClientErrorReport {
  message: string;
  stack?: string;
  componentName?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = extractRequestMeta(request);

  // Abuse protection
  if (isAbusiveRate(ipAddress)) {
    return NextResponse.json(
      { error: 'Too many error reports' },
      { status: 429 },
    );
  }

  let body: ClientErrorReport;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!body.message || typeof body.message !== 'string') {
    return NextResponse.json(
      { error: 'message is required and must be a string' },
      { status: 400 },
    );
  }

  // Truncate to prevent storage abuse
  const message = body.message.slice(0, 2000);
  const stack = body.stack?.slice(0, 5000) || null;
  const componentName = body.componentName?.slice(0, 200) || null;
  const pageUrl = body.url?.slice(0, 500) || null;

  apiLogger.warn(
    {
      clientError: true,
      message,
      componentName,
      pageUrl,
      ip: ipAddress,
    },
    'Client error reported',
  );

  // Store in audit_logs as a CLIENT_ERROR action
  try {
    await logAudit({
      action: 'CLIENT_ERROR',
      entityType: 'client_error',
      entityId: componentName || undefined,
      method: 'POST',
      path: pageUrl || '/api/errors',
      requestBody: {
        message,
        componentName,
        url: pageUrl,
        timestamp: body.timestamp,
        metadata: body.metadata,
      },
      errorMessage: message,
      errorStack: stack || undefined,
      ipAddress,
      userAgent: body.userAgent || userAgent,
    });
  } catch (auditError) {
    // Logging should never break the error reporting flow
    apiLogger.error(
      { error: auditError instanceof Error ? auditError.message : 'unknown' },
      'Failed to write client error to audit_logs',
    );
  }

  return NextResponse.json({ received: true }, { status: 202 });
}
