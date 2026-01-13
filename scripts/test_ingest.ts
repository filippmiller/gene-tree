#!/usr/bin/env npx tsx

/**
 * Test script to ingest knowledge about the Librarian implementation
 */

import { ingestKnowledge, IngestPayload } from '../src/lib/library';

const payload: IngestPayload = {
  source: {
    agent: "cloudcode-opus",
    repo: "gene-tree",
    branch: "main",
    commit: "0e07b11",
    timestamp: "2026-01-13T11:30:00Z"
  },
  keywords: [
    "librarian", "knowledge-base", "library", "agent", "documentation",
    "api", "ingest", "query", "admin-ui", "dashboard", "append-only",
    "pull", "push", "sessions", "domains", "bootstrap", "scanner"
  ],
  artifacts: {
    files_changed: [
      "src/lib/library/index.ts",
      "src/app/api/library/query/route.ts",
      "src/app/api/library/ingest/route.ts",
      "src/app/api/library/index/route.ts",
      "src/app/api/library/domain/[name]/route.ts",
      "src/app/api/library/sessions/route.ts",
      "src/app/[locale]/(protected)/admin/librarian/page.tsx",
      "src/app/[locale]/(protected)/admin/librarian/LibrarianDashboard.tsx",
      "docs/_library/KB.md",
      "docs/_library/INDEX.json",
      "docs/_library/INGEST_LOG.md",
      "docs/_library/SOURCES.md",
      "docs/_library/SCHEMA.md",
      "docs/_library/API.md",
      "docs/_library/FLOWS.md",
      "docs/AGENT_RULES_LIBRARY.md",
      "docs/library_endpoint.md",
      "scripts/library_bootstrap.ts",
      "package.json"
    ],
    endpoints_added: [
      {
        method: "GET",
        path: "/api/library/query",
        purpose: "Search knowledge base by keywords (PULL operation for agents)",
        inputs: "keywords (comma-separated), top_k (optional, default 8)",
        outputs: "{ matches: [{topic, score, excerpt, file, anchor}], suggested_keywords }"
      },
      {
        method: "POST",
        path: "/api/library/ingest",
        purpose: "Add new knowledge to library (PUSH operation for agents)",
        inputs: "IngestPayload JSON with source, keywords, artifacts, knowledge, tags",
        outputs: "{ ok, ingested_id, topics_added, files_updated }"
      },
      {
        method: "GET",
        path: "/api/library/index",
        purpose: "List all knowledge domain files with metadata",
        outputs: "{ domains: [{name, filename, type, size, sizeKB, lastModified, description}] }"
      },
      {
        method: "GET",
        path: "/api/library/domain/[name]",
        purpose: "Get content of a specific knowledge domain file",
        outputs: "{ name, filename, type, content, size, lastModified }"
      },
      {
        method: "GET",
        path: "/api/library/sessions",
        purpose: "List agent activity sessions from ingest log",
        outputs: "{ sessions: [{id, timestamp, agent, commit, branch, keywords, summary, filesChanged, topicsUpdated}] }"
      }
    ],
    flows: [
      {
        name: "Agent PULL Flow",
        trigger: "Agent session start (after first user prompt)",
        notes: "Agent extracts 3-15 keywords from prompt, calls GET /api/library/query, reads returned matches and referenced files before working"
      },
      {
        name: "Agent PUSH Flow",
        trigger: "After git commit+push",
        notes: "Agent prepares ingest payload with files_changed, endpoints_added, db_changes, knowledge summary, calls POST /api/library/ingest"
      },
      {
        name: "Library Bootstrap Flow",
        trigger: "Manual via npm run library:bootstrap",
        notes: "Scans repository for API routes, migrations, components, configs, env files. Appends results to SOURCES.md"
      }
    ]
  },
  knowledge: {
    summary: "Implemented complete Librarian knowledge base system with API endpoints, admin UI dashboard, and agent integration rules",
    details_md: `## Librarian System Implementation

### Overview
The Librarian is a knowledge management system that enables AI agents to share institutional knowledge across sessions. It follows an **append-only** architecture to preserve history.

### Architecture

#### 4-Layer Design:
1. **Local Knowledge Store** (\`docs/_library/\`)
   - KB.md - Main knowledge base (new entries prepended)
   - INDEX.json - Topic index for keyword search
   - INGEST_LOG.md - Audit trail of all ingestions
   - SOURCES.md - Sources of truth (DB, env, configs)
   - SCHEMA.md - Database schema documentation
   - API.md - API endpoints reference
   - FLOWS.md - Data flows and background processes

2. **API Layer** (\`src/app/api/library/\`)
   - query/route.ts - Keyword search with scoring
   - ingest/route.ts - Knowledge ingestion with validation
   - index/route.ts - Domain listing
   - domain/[name]/route.ts - Domain content retrieval
   - sessions/route.ts - Session history parsing

3. **Core Library** (\`src/lib/library/index.ts\`)
   - queryLibrary() - Search with relevance scoring
   - ingestKnowledge() - Append to all relevant files
   - scanRepository() - Find API routes, migrations, configs
   - bootstrapLibrary() - Initial repo scan

4. **Admin UI** (\`/admin/librarian\`)
   - Tabs: Knowledge Base | Agent Sessions
   - Domain viewer with syntax highlighting
   - Session details with metadata display

### Key Design Decisions

1. **Append-Only Storage**: Never delete or overwrite - mark as DEPRECATED instead
2. **File-Based**: No database dependency, works in any environment
3. **Token Protection**: Optional LIBRARY_TOKEN for production ingestion
4. **Relevance Scoring**: Keywords matched against topic index with partial matching

### Agent Protocol

**PULL** (session start):
\`\`\`
1. Extract keywords from user prompt
2. GET /api/library/query?keywords=...
3. Read matches and suggested_keywords
4. Load referenced files if needed
\`\`\`

**PUSH** (after commit):
\`\`\`
1. Prepare IngestPayload with:
   - source: {agent, repo, branch, commit}
   - keywords: relevant terms
   - artifacts: {files_changed, endpoints_added, db_changes, flows}
   - knowledge: {summary, details_md}
   - tags: category labels
2. POST /api/library/ingest
3. Verify response shows files_updated
\`\`\`

### Files Created
- 19 files, +3194 lines of code
- Commit: 0e07b11

### Testing Commands
\`\`\`bash
# Query the library
curl 'http://localhost:3000/api/library/query?keywords=auth,login'

# List domains
curl 'http://localhost:3000/api/library/index'

# Get domain content
curl 'http://localhost:3000/api/library/domain/KB'

# View sessions
curl 'http://localhost:3000/api/library/sessions'
\`\`\`

### UI Access
Admin dashboard: \`/{locale}/admin/librarian\`

### Bootstrap
\`\`\`bash
npm run library:bootstrap
\`\`\`
Scans repo and updates SOURCES.md with discovered components.`
  },
  tags: ["librarian", "api", "admin-ui", "documentation", "feature", "infrastructure"]
};

console.log('🚀 Ingesting Librarian implementation knowledge...\n');

const result = ingestKnowledge(payload);

console.log('📋 Ingest Result:');
console.log(JSON.stringify(result, null, 2));
