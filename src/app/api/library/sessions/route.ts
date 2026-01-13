import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Session {
  id: string;
  timestamp: string;
  agent: string;
  commit: string;
  branch: string;
  keywords: string[];
  summary: string;
  filesChanged: string[];
  topicsUpdated: string[];
}

/**
 * GET /api/library/sessions
 *
 * Returns a list of agent sessions (ingest log entries).
 */
export async function GET() {
  try {
    const libraryDir = path.join(process.cwd(), 'docs', '_library');
    const ingestLogPath = path.join(libraryDir, 'INGEST_LOG.md');

    if (!fs.existsSync(ingestLogPath)) {
      return NextResponse.json({
        sessions: [],
        count: 0,
      });
    }

    const content = fs.readFileSync(ingestLogPath, 'utf-8');
    const sessions: Session[] = [];

    // Parse the ingest log to extract sessions
    // Format: ### [INGEST-XXX] TIMESTAMP
    const sessionRegex = /### \[([^\]]+)\] ([^\n]+)\n([\s\S]*?)(?=### \[|<!-- New entries|$)/g;
    let match;

    while ((match = sessionRegex.exec(content)) !== null) {
      const [, id, timestamp, body] = match;

      // Parse body fields
      const agentMatch = body.match(/\*\*Agent\*\*:\s*([^\n]+)/);
      const commitMatch = body.match(/\*\*Commit\*\*:\s*([^\n]+)/);
      const branchMatch = body.match(/\*\*Branch\*\*:\s*([^\n]+)/);
      const keywordsMatch = body.match(/\*\*Keywords\*\*:\s*([^\n]+)/);
      const summaryMatch = body.match(/\*\*Summary\*\*:\s*([^\n]+)/);
      const filesMatch = body.match(/\*\*Files Changed\*\*:\s*([^\n]+)/);
      const topicsMatch = body.match(/\*\*Topics Updated\*\*:\s*([^\n]+)/);

      sessions.push({
        id,
        timestamp: timestamp.trim(),
        agent: agentMatch?.[1]?.trim() || 'unknown',
        commit: commitMatch?.[1]?.trim() || '',
        branch: branchMatch?.[1]?.trim() || '',
        keywords: keywordsMatch?.[1]?.split(',').map(k => k.trim()) || [],
        summary: summaryMatch?.[1]?.trim() || '',
        filesChanged: filesMatch?.[1]?.split(',').map(f => f.trim()) || [],
        topicsUpdated: topicsMatch?.[1]?.split(',').map(t => t.trim()) || [],
      });
    }

    // Sort by timestamp descending (newest first)
    sessions.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime() || 0;
      const dateB = new Date(b.timestamp).getTime() || 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    console.error('[Library Sessions Error]', error);
    return NextResponse.json(
      { error: 'Failed to read sessions', details: error.message },
      { status: 500 }
    );
  }
}
