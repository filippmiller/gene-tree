import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/library/domain/[name]
 *
 * Returns the content of a specific knowledge domain file.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const libraryDir = path.join(process.cwd(), 'docs', '_library');

    // Try both .md and .json extensions
    let filePath = path.join(libraryDir, `${name}.md`);
    let fileType = 'markdown';

    if (!fs.existsSync(filePath)) {
      filePath = path.join(libraryDir, `${name}.json`);
      fileType = 'json';
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Domain not found', name },
        { status: 404 }
      );
    }

    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    return NextResponse.json({
      name,
      filename: path.basename(filePath),
      type: fileType,
      content,
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024 * 10) / 10,
      lastModified: stats.mtime.toISOString(),
    });
  } catch (error: any) {
    console.error('[Library Domain Error]', error);
    return NextResponse.json(
      { error: 'Failed to read domain', details: error.message },
      { status: 500 }
    );
  }
}
