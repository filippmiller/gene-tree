# Agent Rules: Library Integration

> **CRITICAL**: Every AI agent working on this repository MUST follow these rules to maintain knowledge continuity.

---

## Overview

This repository includes a **Library Endpoint** (`/api/library/*`) that serves as a shared knowledge base. All agents must:

1. **PULL** knowledge at the start of every session
2. **PUSH** new knowledge after every commit

This ensures institutional knowledge is preserved and shared across all agent sessions.

---

## Rule 1: PULL Before Work (Mandatory)

**When**: Immediately after receiving the first user prompt

**How**:
```bash
# 1. Extract 3-15 keywords from the user's request
# 2. Make a GET request to query the library

curl "http://localhost:3000/api/library/query?keywords=auth,login,session,bug"
```

**What to do with the response**:
- Read the `matches` array for relevant knowledge
- Check referenced files in `file` fields
- Use `suggested_keywords` to refine your search if needed

**Example workflow**:
```
User prompt: "Fix the login bug where users get logged out"

Agent extracts keywords: login, logout, auth, session, bug, users

Agent calls: GET /api/library/query?keywords=login,logout,auth,session,bug

Agent receives:
{
  "matches": [
    {
      "topic": "authentication",
      "score": 0.85,
      "excerpt": "Supabase Auth with email/password. Session stored in cookies...",
      "file": "docs/AUTH_FLOW.md",
      "anchor": "KB.md#authentication"
    }
  ],
  "suggested_keywords": ["supabase", "cookies", "session"]
}

Agent reads AUTH_FLOW.md and relevant KB sections before making changes.
```

---

## Rule 2: PUSH After Commit (Mandatory)

**When**: After every `git commit && git push`

**How**:
```bash
# POST to ingest endpoint with knowledge payload
curl -X POST http://localhost:3000/api/library/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${LIBRARY_TOKEN}" \
  -d '{...payload...}'
```

**Authentication**:
- In development: No token required (or use header `X-Library-Dev-Mode: true`)
- In production: Set `LIBRARY_TOKEN` environment variable and use Bearer auth

---

## Ingest Payload Contract

```json
{
  "source": {
    "agent": "string (agent name, e.g., 'cloudcode', 'cursor', 'copilot')",
    "repo": "string (repository name, default: 'gene-tree')",
    "branch": "string (git branch name)",
    "commit": "string (git commit hash - short or full)",
    "timestamp": "string (ISO-8601 format, optional - auto-generated if missing)"
  },
  "keywords": [
    "string (3-15 keywords describing changes)"
  ],
  "artifacts": {
    "files_changed": ["string (relative paths to changed files)"],
    "endpoints_added": [
      {
        "method": "GET|POST|PUT|DELETE|PATCH",
        "path": "/api/...",
        "purpose": "string (what this endpoint does)",
        "inputs": "string (optional - input format)",
        "outputs": "string (optional - output format)"
      }
    ],
    "db_changes": [
      {
        "type": "migration|schema|seed",
        "id": "string (migration id or description)",
        "tables": ["string (affected table names)"],
        "notes": "string (optional - additional notes)"
      }
    ],
    "flows": [
      {
        "name": "string (flow/process name)",
        "trigger": "string (how it's triggered: cron, event, manual, etc.)",
        "notes": "string (optional - additional notes)"
      }
    ]
  },
  "knowledge": {
    "summary": "string (1-2 sentences: what was done)",
    "details_md": "string (markdown block with full details, risks, verification steps)"
  },
  "tags": [
    "string (1-5 category tags: api, schema, deploy, fix, feature, etc.)"
  ]
}
```

---

## Example Ingest Payload

```json
{
  "source": {
    "agent": "cloudcode",
    "repo": "gene-tree",
    "branch": "feature/photo-tags",
    "commit": "a1b2c3d",
    "timestamp": "2026-01-13T15:30:00Z"
  },
  "keywords": ["photos", "tags", "people", "moderation", "api", "storage"],
  "artifacts": {
    "files_changed": [
      "src/app/api/photos/tag/route.ts",
      "src/lib/photos/tagging.ts",
      "supabase/migrations/035_photo_tags.sql"
    ],
    "endpoints_added": [
      {
        "method": "POST",
        "path": "/api/photos/tag",
        "purpose": "Tag people in photos",
        "inputs": "{ photo_id: string, user_id: string, x: number, y: number }",
        "outputs": "{ tag_id: string, success: boolean }"
      }
    ],
    "db_changes": [
      {
        "type": "migration",
        "id": "035_photo_tags",
        "tables": ["photo_tags"],
        "notes": "Added photo_tags table for storing people tags with coordinates"
      }
    ]
  },
  "knowledge": {
    "summary": "Added photo tagging feature to tag people in uploaded photos",
    "details_md": "## Photo Tagging Feature\n\n### What was added\n- New `/api/photos/tag` endpoint\n- `photo_tags` table with coordinates\n- Tag validation logic\n\n### How to verify\n1. Upload a photo\n2. Call POST /api/photos/tag with photo_id and user_id\n3. Check photo_tags table for new record\n\n### Risks\n- None identified\n\n### Related files\n- See `src/lib/photos/tagging.ts` for validation logic"
  },
  "tags": ["api", "feature", "photos", "schema"]
}
```

---

## Rule 3: Never Overwrite, Only Append

The library files are **append-only**:

- `KB.md` - New sections added at the TOP
- `INGEST_LOG.md` - New entries appended
- `INDEX.json` - Topics added, never removed
- `SCHEMA.md` - New discoveries appended
- `API.md` - New endpoints documented
- `FLOWS.md` - New flows added

**To mark outdated information**:
```markdown
### [DEPRECATED] Old Feature Name
> Superseded by: [New Feature Name](#new-feature-name)
```

**Never delete entries** - this preserves history and allows rollback understanding.

---

## Rule 4: Check Before Major Changes

Before making significant changes, query the library:

```bash
# Example: Before refactoring auth
curl "http://localhost:3000/api/library/query?keywords=auth,refactor,session,breaking"
```

If relevant knowledge exists, read it first to avoid:
- Re-implementing solved problems
- Breaking existing contracts
- Duplicating effort

---

## Agent Session Template

Copy this template into your agent's context at the start of each session:

```
## Library Integration Protocol

1. PULL: Extract 3-15 keywords from user prompt
   → GET /api/library/query?keywords={keywords}
   → Read returned matches and referenced files

2. WORK: Complete the requested task

3. PUSH: After commit+push, call:
   → POST /api/library/ingest
   → Include: files_changed, endpoints_added, db_changes, knowledge summary

4. RULES:
   - Never overwrite library files, only append
   - Always include commit hash in ingest
   - Mark deprecated info, never delete
```

---

## Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/library/query` | GET | Search knowledge base by keywords |
| `/api/library/ingest` | POST | Add new knowledge to the library |
| `/api/library/ingest` | GET | Get ingest endpoint documentation |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LIBRARY_TOKEN` | Optional | Bearer token for ingest authentication. If not set, ingest works only in development mode. |

---

## Troubleshooting

### "Library is in read-only mode"
- Set `LIBRARY_TOKEN` environment variable
- Or add header `X-Library-Dev-Mode: true` in development

### No matches returned
- Try broader keywords
- Check `suggested_keywords` in response
- Use fewer, more general terms

### Ingest validation failed
- Check all required fields in payload
- Ensure arrays are not empty
- Verify JSON format is correct

---

## Files Reference

| File | Purpose |
|------|---------|
| `docs/_library/KB.md` | Main knowledge base (append-only) |
| `docs/_library/INDEX.json` | Topic index for search |
| `docs/_library/INGEST_LOG.md` | Audit log of all ingestions |
| `docs/_library/SOURCES.md` | Sources of truth in the repo |
| `docs/_library/SCHEMA.md` | Database schema documentation |
| `docs/_library/API.md` | API endpoints documentation |
| `docs/_library/FLOWS.md` | Data flows and background processes |

---

*Last updated: 2026-01-13*
