/**
 * Library (Knowledge Base) Module
 *
 * Provides functions for:
 * - Querying the knowledge base
 * - Ingesting new knowledge
 * - Scanning the repository structure
 */

import fs from 'fs';
import path from 'path';

// Paths to library files
const LIBRARY_DIR = path.join(process.cwd(), 'docs', '_library');
const INDEX_PATH = path.join(LIBRARY_DIR, 'INDEX.json');
const KB_PATH = path.join(LIBRARY_DIR, 'KB.md');
const INGEST_LOG_PATH = path.join(LIBRARY_DIR, 'INGEST_LOG.md');
const SOURCES_PATH = path.join(LIBRARY_DIR, 'SOURCES.md');
const SCHEMA_PATH = path.join(LIBRARY_DIR, 'SCHEMA.md');
const API_PATH = path.join(LIBRARY_DIR, 'API.md');
const FLOWS_PATH = path.join(LIBRARY_DIR, 'FLOWS.md');

// Types
export interface IndexTopic {
  keywords: string[];
  files: string[];
  anchors: string[];
}

export interface LibraryIndex {
  version: string;
  created_at: string;
  last_updated: string;
  topics: Record<string, IndexTopic>;
  ingest_count: number;
  total_entries: number;
}

export interface QueryMatch {
  topic: string;
  score: number;
  excerpt: string;
  file: string;
  anchor: string;
}

export interface QueryResult {
  matches: QueryMatch[];
  suggested_keywords: string[];
}

export interface IngestSource {
  agent: string;
  repo: string;
  branch: string;
  commit: string;
  timestamp: string;
}

export interface IngestEndpoint {
  method: string;
  path: string;
  purpose: string;
  inputs?: string;
  outputs?: string;
}

export interface IngestDbChange {
  type: string;
  id: string;
  tables: string[];
  notes?: string;
}

export interface IngestFlow {
  name: string;
  trigger: string;
  notes?: string;
}

export interface IngestArtifacts {
  files_changed?: string[];
  endpoints_added?: IngestEndpoint[];
  db_changes?: IngestDbChange[];
  flows?: IngestFlow[];
}

export interface IngestKnowledge {
  summary: string;
  details_md: string;
}

export interface IngestPayload {
  source: IngestSource;
  keywords: string[];
  artifacts: IngestArtifacts;
  knowledge: IngestKnowledge;
  tags: string[];
}

export interface IngestResult {
  ok: boolean;
  ingested_id: string;
  topics_added: string[];
  files_updated: string[];
  error?: string;
}

// Helper functions
function ensureLibraryDir(): void {
  if (!fs.existsSync(LIBRARY_DIR)) {
    fs.mkdirSync(LIBRARY_DIR, { recursive: true });
  }
}

function readIndex(): LibraryIndex {
  ensureLibraryDir();
  if (!fs.existsSync(INDEX_PATH)) {
    return {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      topics: {},
      ingest_count: 0,
      total_entries: 0,
    };
  }
  return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
}

function writeIndex(index: LibraryIndex): void {
  ensureLibraryDir();
  index.last_updated = new Date().toISOString();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function prependToFile(filePath: string, content: string, marker: string): void {
  const existing = readFile(filePath);
  const markerIndex = existing.indexOf(marker);

  if (markerIndex !== -1) {
    // Insert before the marker
    const before = existing.substring(0, markerIndex);
    const after = existing.substring(markerIndex);
    fs.writeFileSync(filePath, before + content + '\n\n' + after);
  } else {
    // Append to the end if marker not found
    fs.writeFileSync(filePath, existing + '\n\n' + content);
  }
}

function appendToFile(filePath: string, content: string): void {
  const existing = readFile(filePath);
  fs.writeFileSync(filePath, existing + '\n\n' + content);
}

// Calculate relevance score between keywords and topic
function calculateScore(keywords: string[], topic: IndexTopic): number {
  const normalizedKeywords = keywords.map(k => k.toLowerCase().trim());
  const topicKeywords = topic.keywords.map(k => k.toLowerCase().trim());

  let matches = 0;
  let partialMatches = 0;

  for (const keyword of normalizedKeywords) {
    for (const topicKeyword of topicKeywords) {
      if (keyword === topicKeyword) {
        matches += 1;
      } else if (topicKeyword.includes(keyword) || keyword.includes(topicKeyword)) {
        partialMatches += 0.5;
      }
    }
  }

  const totalPossible = Math.max(normalizedKeywords.length, 1);
  return Math.min((matches + partialMatches) / totalPossible, 1);
}

// Get excerpt from KB.md for a topic
function getExcerpt(topic: string): string {
  const kb = readFile(KB_PATH);
  const topicLower = topic.toLowerCase().replace(/-/g, ' ');

  // Look for section headers
  const lines = kb.split('\n');
  let capturing = false;
  const excerpt: string[] = [];

  for (const line of lines) {
    if (line.startsWith('###') && line.toLowerCase().includes(topicLower)) {
      capturing = true;
      continue;
    }
    if (capturing) {
      if (line.startsWith('###') || line.startsWith('## [')) {
        break;
      }
      if (line.trim()) {
        excerpt.push(line.trim());
      }
      if (excerpt.length >= 3) {
        break;
      }
    }
  }

  return excerpt.join(' ').substring(0, 300) || `Information about ${topic}`;
}

/**
 * Query the knowledge base for relevant information
 */
export function queryLibrary(keywords: string[], topK: number = 8): QueryResult {
  const index = readIndex();
  const results: QueryMatch[] = [];

  for (const [topicName, topic] of Object.entries(index.topics)) {
    const score = calculateScore(keywords, topic);
    if (score > 0.1) {
      results.push({
        topic: topicName,
        score: Math.round(score * 100) / 100,
        excerpt: getExcerpt(topicName),
        file: topic.files[0] || '',
        anchor: topic.anchors[0] || '',
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Generate suggested keywords from top matches
  const suggested = new Set<string>();
  for (const match of results.slice(0, 3)) {
    const topic = index.topics[match.topic];
    if (topic) {
      topic.keywords.slice(0, 3).forEach(k => suggested.add(k));
    }
  }

  return {
    matches: results.slice(0, topK),
    suggested_keywords: Array.from(suggested).slice(0, 10),
  };
}

/**
 * Ingest new knowledge into the library
 */
export function ingestKnowledge(payload: IngestPayload): IngestResult {
  try {
    const index = readIndex();
    const ingestId = `INGEST-${String(index.ingest_count + 1).padStart(3, '0')}`;
    const timestamp = payload.source.timestamp || new Date().toISOString();

    // 1. Update INGEST_LOG.md (append new entry at the section marker)
    const logEntry = `### [${ingestId}] ${timestamp}

- **Agent**: ${payload.source.agent}
- **Commit**: ${payload.source.commit}
- **Branch**: ${payload.source.branch}
- **Keywords**: ${payload.keywords.join(', ')}
- **Summary**: ${payload.knowledge.summary}
- **Files Changed**: ${payload.artifacts.files_changed?.join(', ') || 'none'}
- **Topics Updated**: ${payload.tags.join(', ')}

---`;

    prependToFile(INGEST_LOG_PATH, logEntry, '<!-- New entries will be prepended above this line -->');

    // 2. Update KB.md (add new section at top, after header)
    const kbEntry = `## [${timestamp.split('T')[0]}] ${payload.knowledge.summary}

**Ingest ID**: ${ingestId}
**Commit**: \`${payload.source.commit}\`
**Tags**: ${payload.tags.map(t => `\`${t}\``).join(', ')}

${payload.knowledge.details_md}

### Files Changed
${payload.artifacts.files_changed?.map(f => `- \`${f}\``).join('\n') || '- None'}

${payload.artifacts.endpoints_added?.length ? `### Endpoints Added
${payload.artifacts.endpoints_added.map(e => `- **${e.method} ${e.path}**: ${e.purpose}`).join('\n')}` : ''}

${payload.artifacts.db_changes?.length ? `### Database Changes
${payload.artifacts.db_changes.map(d => `- **${d.type}** ${d.id}: ${d.notes || d.tables.join(', ')}`).join('\n')}` : ''}

${payload.artifacts.flows?.length ? `### Flows Added/Modified
${payload.artifacts.flows.map(f => `- **${f.name}** (${f.trigger}): ${f.notes || ''}`).join('\n')}` : ''}

---`;

    prependToFile(KB_PATH, kbEntry, '## [2026-01-13] Initial Knowledge Base Setup');

    // 3. Update INDEX.json
    const topicsAdded: string[] = [];
    for (const tag of payload.tags) {
      const topicKey = tag.toLowerCase().replace(/\s+/g, '-');
      if (!index.topics[topicKey]) {
        index.topics[topicKey] = {
          keywords: payload.keywords.filter(k => k.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(k.toLowerCase())),
          files: payload.artifacts.files_changed || [],
          anchors: [`KB.md#${ingestId.toLowerCase()}`],
        };
        topicsAdded.push(topicKey);
      } else {
        // Update existing topic
        const topic = index.topics[topicKey];
        for (const keyword of payload.keywords) {
          if (!topic.keywords.includes(keyword.toLowerCase())) {
            topic.keywords.push(keyword.toLowerCase());
          }
        }
        for (const file of payload.artifacts.files_changed || []) {
          if (!topic.files.includes(file)) {
            topic.files.push(file);
          }
        }
      }
    }

    index.ingest_count += 1;
    index.total_entries = Object.keys(index.topics).length;
    writeIndex(index);

    // 4. Update API.md if endpoints were added
    const filesUpdated = ['docs/_library/INGEST_LOG.md', 'docs/_library/KB.md', 'docs/_library/INDEX.json'];

    if (payload.artifacts.endpoints_added?.length) {
      const apiEntry = `### [${timestamp.split('T')[0]}] ${ingestId}

${payload.artifacts.endpoints_added.map(e => `#### ${e.method} ${e.path}
${e.purpose}
${e.inputs ? `\n**Input**: ${e.inputs}` : ''}
${e.outputs ? `\n**Output**: ${e.outputs}` : ''}`).join('\n\n')}

---`;

      prependToFile(API_PATH, apiEntry, '## API Additions Log');
      filesUpdated.push('docs/_library/API.md');
    }

    // 5. Update FLOWS.md if flows were added
    if (payload.artifacts.flows?.length) {
      const flowsEntry = `### [${timestamp.split('T')[0]}] ${ingestId}

${payload.artifacts.flows.map(f => `#### ${f.name}
- **Trigger**: ${f.trigger}
- **Notes**: ${f.notes || 'N/A'}`).join('\n\n')}

---`;

      prependToFile(FLOWS_PATH, flowsEntry, '## Flow Updates Log');
      filesUpdated.push('docs/_library/FLOWS.md');
    }

    // 6. Update SCHEMA.md if db changes were added
    if (payload.artifacts.db_changes?.length) {
      const schemaEntry = `### [${timestamp.split('T')[0]}] ${ingestId}

${payload.artifacts.db_changes.map(d => `- **${d.type}** \`${d.id}\`: Tables affected: ${d.tables.join(', ')}${d.notes ? ` - ${d.notes}` : ''}`).join('\n')}

---`;

      prependToFile(SCHEMA_PATH, schemaEntry, '## Schema Updates');
      filesUpdated.push('docs/_library/SCHEMA.md');
    }

    return {
      ok: true,
      ingested_id: ingestId,
      topics_added: topicsAdded,
      files_updated: filesUpdated,
    };
  } catch (error: any) {
    return {
      ok: false,
      ingested_id: '',
      topics_added: [],
      files_updated: [],
      error: error.message || 'Unknown error during ingest',
    };
  }
}

// Directories/files to skip when scanning
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

/**
 * Scan the repository structure and return discovered components
 */
export function scanRepository(): {
  apiRoutes: string[];
  migrations: string[];
  components: string[];
  configs: string[];
  envFiles: string[];
} {
  const result = {
    apiRoutes: [] as string[],
    migrations: [] as string[],
    components: [] as string[],
    configs: [] as string[],
    envFiles: [] as string[],
  };

  const rootDir = process.cwd();

  function shouldSkip(name: string): boolean {
    if (SKIP_DIRS.includes(name)) return true;
    return SKIP_EXTENSIONS.some(ext => name.endsWith(ext));
  }

  function scanDir(dir: string, depth: number = 0): void {
    if (depth > 6) return; // Max depth limit

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (shouldSkip(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          // Check for API routes directory
          if (relativePath.includes('app/api/') || relativePath.includes('pages/api/')) {
            // This is an API route directory
          }
          scanDir(fullPath, depth + 1);
        } else if (entry.isFile()) {
          // Categorize files
          if (relativePath.includes('app/api/') && entry.name === 'route.ts') {
            const routePath = relativePath.replace('src/app/api/', '/api/').replace('/route.ts', '');
            result.apiRoutes.push(routePath);
          } else if (relativePath.includes('migrations/') && entry.name.endsWith('.sql')) {
            result.migrations.push(relativePath);
          } else if (relativePath.includes('components/') && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
            result.components.push(relativePath);
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
    } catch (error) {
      // Ignore permission errors
    }
  }

  scanDir(rootDir);

  return result;
}

/**
 * Run initial bootstrap scan and update SOURCES.md
 */
export function bootstrapLibrary(): { success: boolean; summary: string } {
  try {
    const scan = scanRepository();

    const scanEntry = `### [SCAN-${Date.now()}] ${new Date().toISOString().split('T')[0]} - Repository Scan

**API Routes Found**: ${scan.apiRoutes.length}
${scan.apiRoutes.slice(0, 20).map(r => `- \`${r}\``).join('\n')}
${scan.apiRoutes.length > 20 ? `- ... and ${scan.apiRoutes.length - 20} more` : ''}

**Migrations Found**: ${scan.migrations.length}
${scan.migrations.slice(0, 10).map(m => `- \`${m}\``).join('\n')}
${scan.migrations.length > 10 ? `- ... and ${scan.migrations.length - 10} more` : ''}

**Config Files Found**:
${scan.configs.map(c => `- \`${c}\``).join('\n')}

**Environment Files**:
${scan.envFiles.map(e => `- \`${e}\``).join('\n')}

---`;

    appendToFile(SOURCES_PATH, scanEntry);

    return {
      success: true,
      summary: `Scanned repository: ${scan.apiRoutes.length} API routes, ${scan.migrations.length} migrations, ${scan.configs.length} configs`,
    };
  } catch (error: any) {
    return {
      success: false,
      summary: `Scan failed: ${error.message}`,
    };
  }
}
