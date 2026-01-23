#!/usr/bin/env npx tsx

/**
 * Library Bootstrap Script
 *
 * Scans the repository and initializes/updates the library knowledge base.
 *
 * Usage:
 *   npx tsx scripts/library_bootstrap.ts
 *   # or
 *   npm run library:bootstrap
 */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const LIBRARY_DIR = path.join(ROOT_DIR, 'docs', '_library');
const SOURCES_PATH = path.join(LIBRARY_DIR, 'SOURCES.md');

// Directories/files to skip
const SKIP_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.vercel',
  '.netlify',
];

const SKIP_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp3', '.mp4', '.wav', '.webm',
  '.pdf', '.zip', '.tar', '.gz',
  '.lock', '.log',
];

interface ScanResult {
  apiRoutes: string[];
  migrations: string[];
  components: string[];
  configs: string[];
  envFiles: string[];
  libFiles: string[];
}

function shouldSkip(name: string): boolean {
  if (SKIP_DIRS.includes(name)) return true;
  return SKIP_EXTENSIONS.some(ext => name.endsWith(ext));
}

function scanDir(dir: string, result: ScanResult, depth: number = 0): void {
  if (depth > 6) return;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (shouldSkip(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        scanDir(fullPath, result, depth + 1);
      } else if (entry.isFile()) {
        // Categorize files
        if (relativePath.includes('app/api/') && entry.name === 'route.ts') {
          const routePath = relativePath
            .replace('src/app/api/', '/api/')
            .replace('/route.ts', '');
          result.apiRoutes.push(routePath);
        } else if (relativePath.includes('migrations/') && entry.name.endsWith('.sql')) {
          result.migrations.push(relativePath);
        } else if (
          relativePath.includes('components/') &&
          (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))
        ) {
          result.components.push(relativePath);
        } else if (relativePath.startsWith('src/lib/') && entry.name.endsWith('.ts')) {
          result.libFiles.push(relativePath);
        } else if (
          entry.name === 'Dockerfile' ||
          entry.name === 'docker-compose.yml' ||
          entry.name === 'railway.json' ||
          entry.name === 'vercel.json' ||
          entry.name === 'netlify.toml' ||
          entry.name.includes('config.')
        ) {
          result.configs.push(relativePath);
        } else if (entry.name.startsWith('.env')) {
          result.envFiles.push(relativePath);
        }
      }
    }
  } catch {
    // Ignore permission errors
  }
}

function appendToFile(filePath: string, content: string): void {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  fs.writeFileSync(filePath, existing + '\n\n' + content);
}

function main(): void {
  console.log('🔍 Library Bootstrap - Scanning repository...\n');

  const result: ScanResult = {
    apiRoutes: [],
    migrations: [],
    components: [],
    configs: [],
    envFiles: [],
    libFiles: [],
  };

  scanDir(ROOT_DIR, result);

  // Sort results
  result.apiRoutes.sort();
  result.migrations.sort();
  result.components.sort();
  result.configs.sort();
  result.libFiles.sort();

  console.log(`📊 Scan Results:`);
  console.log(`   - API Routes: ${result.apiRoutes.length}`);
  console.log(`   - Migrations: ${result.migrations.length}`);
  console.log(`   - Components: ${result.components.length}`);
  console.log(`   - Config Files: ${result.configs.length}`);
  console.log(`   - Lib Files: ${result.libFiles.length}`);
  console.log(`   - Env Files: ${result.envFiles.length}`);
  console.log('');

  // Generate scan entry
  const timestamp = new Date().toISOString();
  const scanId = `SCAN-${Date.now()}`;

  const scanEntry = `### [${scanId}] ${timestamp.split('T')[0]} - Bootstrap Scan

**Scan Timestamp**: ${timestamp}

**API Routes Found**: ${result.apiRoutes.length}
${result.apiRoutes.slice(0, 30).map(r => `- \`${r}\``).join('\n')}
${result.apiRoutes.length > 30 ? `\n*... and ${result.apiRoutes.length - 30} more*` : ''}

**Migrations Found**: ${result.migrations.length}
${result.migrations.slice(0, 15).map(m => `- \`${m}\``).join('\n')}
${result.migrations.length > 15 ? `\n*... and ${result.migrations.length - 15} more*` : ''}

**Library Files** (src/lib/): ${result.libFiles.length}
${result.libFiles.slice(0, 20).map(f => `- \`${f}\``).join('\n')}
${result.libFiles.length > 20 ? `\n*... and ${result.libFiles.length - 20} more*` : ''}

**Config Files Found**:
${result.configs.map(c => `- \`${c}\``).join('\n') || '- None'}

**Environment Files**:
${result.envFiles.map(e => `- \`${e}\``).join('\n') || '- None'}

---`;

  // Ensure library directory exists
  if (!fs.existsSync(LIBRARY_DIR)) {
    fs.mkdirSync(LIBRARY_DIR, { recursive: true });
  }

  // Append to SOURCES.md
  appendToFile(SOURCES_PATH, scanEntry);

  console.log(`✅ Scan complete! Results appended to docs/_library/SOURCES.md`);
  console.log(`\n📁 Library location: ${LIBRARY_DIR}`);
}

main();
