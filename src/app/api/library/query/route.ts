import { NextRequest, NextResponse } from 'next/server';
import { queryLibrary } from '@/lib/library';

/**
 * GET /api/library/query
 *
 * Query the knowledge base for relevant information.
 *
 * Query Parameters:
 *   - keywords (required): Comma-separated search terms
 *   - top_k (optional): Maximum number of results (default: 8, max: 50)
 *
 * Response:
 *   {
 *     matches: [{ topic, score, excerpt, file, anchor }],
 *     suggested_keywords: string[]
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keywordsParam = searchParams.get('keywords');
    const topKParam = searchParams.get('top_k');

    // Validate keywords
    if (!keywordsParam || keywordsParam.trim() === '') {
      return NextResponse.json(
        {
          error: 'Missing required parameter: keywords',
          usage: 'GET /api/library/query?keywords=auth,login,session&top_k=8',
        },
        { status: 400 }
      );
    }

    // Parse keywords (comma or space separated)
    const keywords = keywordsParam
      .split(/[,\s]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'No valid keywords provided' },
        { status: 400 }
      );
    }

    if (keywords.length > 30) {
      return NextResponse.json(
        { error: 'Too many keywords (max 30)' },
        { status: 400 }
      );
    }

    // Parse top_k
    let topK = 8;
    if (topKParam) {
      const parsed = parseInt(topKParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
        topK = parsed;
      }
    }

    // Query the library
    const result = queryLibrary(keywords, topK);

    return NextResponse.json({
      keywords_received: keywords,
      top_k: topK,
      ...result,
    });
  } catch (error: any) {
    console.error('[Library Query Error]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
