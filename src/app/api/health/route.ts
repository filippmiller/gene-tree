import { BUILD_NUMBER, BUILD_LABEL, GIT_COMMIT_HASH, GIT_COMMIT_TIMESTAMP } from '@/lib/build-info';

const startedAt = Date.now();

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  durationMs: number;
  detail?: string;
}

/**
 * GET /api/health
 * Enhanced health check endpoint returning structured status,
 * database connectivity, memory, uptime, and build info.
 */
export async function GET() {
  const requestStart = performance.now();
  const checks: HealthCheck[] = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check 1: Supabase Auth reachability
  const authCheck = await runCheck('supabase_auth', async () => {
    if (!url || !anon) throw new Error('Missing Supabase env vars');
    const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      headers: { apikey: anon, authorization: `Bearer ${anon}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Auth health returned ${res.status}`);
  });
  checks.push(authCheck);

  // Check 2: Supabase REST / DB reachability
  const dbCheck = await runCheck('supabase_db', async () => {
    if (!url || !anon) throw new Error('Missing Supabase env vars');
    const res = await fetch(
      `${url.replace(/\/$/, '')}/rest/v1/user_profiles?select=id&limit=1`,
      {
        headers: {
          apikey: anon,
          authorization: `Bearer ${anon}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) throw new Error(`DB query returned ${res.status}`);
  });
  checks.push(dbCheck);

  // Determine overall status
  const allPass = checks.every((c) => c.status === 'pass');
  const allFail = checks.every((c) => c.status === 'fail');
  const overallStatus = allPass ? 'healthy' : allFail ? 'unhealthy' : 'degraded';

  const memUsage = process.memoryUsage?.();

  const body = {
    status: overallStatus,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    totalDurationMs: Math.round(performance.now() - requestStart),
    build: {
      number: BUILD_NUMBER,
      label: BUILD_LABEL,
      commit: GIT_COMMIT_HASH,
      commitTimestamp: GIT_COMMIT_TIMESTAMP,
    },
    memory: memUsage
      ? {
          rssBytes: memUsage.rss,
          heapUsedBytes: memUsage.heapUsed,
          heapTotalBytes: memUsage.heapTotal,
        }
      : null,
    checks,
  };

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;
  return new Response(JSON.stringify(body), {
    status: httpStatus,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Run a named health check and capture timing + errors
 */
async function runCheck(name: string, fn: () => Promise<void>): Promise<HealthCheck> {
  const t0 = performance.now();
  try {
    await fn();
    return { name, status: 'pass', durationMs: Math.round(performance.now() - t0) };
  } catch (err) {
    return {
      name,
      status: 'fail',
      durationMs: Math.round(performance.now() - t0),
      detail: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
