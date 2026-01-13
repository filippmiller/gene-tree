import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/library/index
 *
 * Returns a list of all knowledge base files with metadata.
 */
export async function GET() {
  try {
    const libraryDir = path.join(process.cwd(), 'docs', '_library');

    if (!fs.existsSync(libraryDir)) {
      return NextResponse.json({
        domains: [],
        error: 'Library directory not found',
      });
    }

    const files = fs.readdirSync(libraryDir);
    const domains = files
      .filter(file => file.endsWith('.md') || file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(libraryDir, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract first heading or description
        let description = '';
        if (file.endsWith('.md')) {
          const firstLine = content.split('\n').find(line => line.startsWith('#'));
          description = firstLine?.replace(/^#+\s*/, '') || file;
        } else if (file.endsWith('.json')) {
          try {
            const json = JSON.parse(content);
            description = json.version ? `Index v${json.version}` : 'JSON data';
          } catch {
            description = 'JSON data';
          }
        }

        return {
          name: file.replace(/\.(md|json)$/, ''),
          filename: file,
          type: file.endsWith('.md') ? 'markdown' : 'json',
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 10) / 10,
          lastModified: stats.mtime.toISOString(),
          description,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      domains,
      count: domains.length,
      libraryPath: 'docs/_library',
    });
  } catch (error: any) {
    console.error('[Library Index Error]', error);
    return NextResponse.json(
      { error: 'Failed to read library index', details: error.message },
      { status: 500 }
    );
  }
}
