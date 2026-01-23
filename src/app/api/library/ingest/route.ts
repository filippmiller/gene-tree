import { NextRequest, NextResponse } from 'next/server';
import { ingestKnowledge, IngestPayload } from '@/lib/library';

/**
 * POST /api/library/ingest
 *
 * Ingest new knowledge into the library.
 * Requires LIBRARY_TOKEN for authentication (if set), otherwise works in dev mode.
 *
 * Headers:
 *   - Authorization: Bearer {LIBRARY_TOKEN} (optional, required if LIBRARY_TOKEN is set)
 *
 * Body: IngestPayload (see docs/AGENT_RULES_LIBRARY.md for full contract)
 *
 * Response:
 *   {
 *     ok: boolean,
 *     ingested_id: string,
 *     topics_added: string[],
 *     files_updated: string[]
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const libraryToken = process.env.LIBRARY_TOKEN;
    const authHeader = request.headers.get('authorization');

    if (libraryToken) {
      // Token is configured, require it
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authorization header required', hint: 'Use Bearer token' },
          { status: 401 }
        );
      }

      const providedToken = authHeader.substring(7); // Remove 'Bearer '
      if (providedToken !== libraryToken) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 403 }
        );
      }
    } else {
      // No token configured - check if we're in development or if a special header is present
      const isDev = process.env.NODE_ENV === 'development';
      const hasDevBypass = request.headers.get('x-library-dev-mode') === 'true';

      if (!isDev && !hasDevBypass) {
        // In production without token, return read-only message
        return NextResponse.json(
          {
            error: 'Library is in read-only mode',
            hint: 'Set LIBRARY_TOKEN environment variable to enable ingestion',
          },
          { status: 403 }
        );
      }
    }

    // Parse body
    let payload: IngestPayload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const errors: string[] = [];

    if (!payload.source) {
      errors.push('Missing required field: source');
    } else {
      if (!payload.source.agent) errors.push('Missing source.agent');
      if (!payload.source.commit) errors.push('Missing source.commit');
      if (!payload.source.branch) errors.push('Missing source.branch');
    }

    if (!payload.keywords || !Array.isArray(payload.keywords) || payload.keywords.length === 0) {
      errors.push('Missing or empty: keywords array');
    }

    if (!payload.artifacts) {
      errors.push('Missing required field: artifacts');
    }

    if (!payload.knowledge) {
      errors.push('Missing required field: knowledge');
    } else {
      if (!payload.knowledge.summary) errors.push('Missing knowledge.summary');
      if (!payload.knowledge.details_md) errors.push('Missing knowledge.details_md');
    }

    if (!payload.tags || !Array.isArray(payload.tags) || payload.tags.length === 0) {
      errors.push('Missing or empty: tags array');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
          hint: 'See docs/AGENT_RULES_LIBRARY.md for the full ingest contract',
        },
        { status: 400 }
      );
    }

    // Set timestamp if not provided
    if (!payload.source.timestamp) {
      payload.source.timestamp = new Date().toISOString();
    }

    // Set repo if not provided
    if (!payload.source.repo) {
      payload.source.repo = 'gene-tree';
    }

    // Perform ingestion
    const result = ingestKnowledge(payload);

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Ingestion failed', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Library Ingest Error]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/library/ingest
 *
 * Returns usage information for the ingest endpoint.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/library/ingest',
    description: 'Ingest new knowledge into the library',
    authentication: process.env.LIBRARY_TOKEN
      ? 'Bearer token required (LIBRARY_TOKEN is configured)'
      : 'Open in development mode (set LIBRARY_TOKEN for production)',
    contract: 'See docs/AGENT_RULES_LIBRARY.md for the full ingest payload contract',
    example: {
      source: {
        agent: 'cloudcode',
        repo: 'gene-tree',
        branch: 'main',
        commit: 'abc1234',
        timestamp: '2026-01-13T12:00:00Z',
      },
      keywords: ['api', 'endpoint', 'feature'],
      artifacts: {
        files_changed: ['src/app/api/example/route.ts'],
        endpoints_added: [
          {
            method: 'GET',
            path: '/api/example',
            purpose: 'Example endpoint',
          },
        ],
      },
      knowledge: {
        summary: 'Added example endpoint',
        details_md: '## Details\n\nFull description here...',
      },
      tags: ['api', 'feature'],
    },
  });
}
