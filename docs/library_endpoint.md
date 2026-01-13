# Library Endpoint Documentation

The Library Endpoint provides a knowledge management system for the Gene-Tree repository. It enables AI agents and developers to query and contribute to a shared knowledge base.

## Quick Start

### Query the Library (PULL)

```bash
# Search for authentication-related knowledge
curl "http://localhost:3000/api/library/query?keywords=auth,login,session"

# With custom result limit
curl "http://localhost:3000/api/library/query?keywords=database,schema&top_k=5"
```

### Add Knowledge (PUSH)

```bash
# In development (no auth required)
curl -X POST http://localhost:3000/api/library/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "source": {
      "agent": "developer",
      "branch": "main",
      "commit": "abc1234"
    },
    "keywords": ["feature", "example"],
    "artifacts": {
      "files_changed": ["src/example.ts"]
    },
    "knowledge": {
      "summary": "Added example feature",
      "details_md": "## Details\n\nFull description here."
    },
    "tags": ["feature"]
  }'

# In production (with auth)
curl -X POST http://localhost:3000/api/library/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_LIBRARY_TOKEN" \
  -d '{...}'
```

---

## API Reference

### GET /api/library/query

Search the knowledge base.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keywords` | string | Yes | Comma or space separated search terms (3-30 keywords) |
| `top_k` | number | No | Maximum results to return (default: 8, max: 50) |

**Response:**

```json
{
  "keywords_received": ["auth", "login"],
  "top_k": 8,
  "matches": [
    {
      "topic": "authentication",
      "score": 0.85,
      "excerpt": "Supabase Auth with email/password...",
      "file": "docs/AUTH_FLOW.md",
      "anchor": "KB.md#authentication"
    }
  ],
  "suggested_keywords": ["supabase", "session", "cookies"]
}
```

**Example:**

```bash
curl "http://localhost:3000/api/library/query?keywords=photo,upload,storage"
```

---

### POST /api/library/ingest

Add new knowledge to the library.

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `Authorization` | Conditional | `Bearer {token}` - Required if `LIBRARY_TOKEN` is set |
| `X-Library-Dev-Mode` | No | Set to `true` to bypass auth in development |

**Request Body:**

See [AGENT_RULES_LIBRARY.md](./AGENT_RULES_LIBRARY.md) for the full contract.

Minimal example:

```json
{
  "source": {
    "agent": "cloudcode",
    "branch": "main",
    "commit": "abc1234"
  },
  "keywords": ["api", "feature"],
  "artifacts": {
    "files_changed": ["src/app/api/example/route.ts"]
  },
  "knowledge": {
    "summary": "Added example endpoint",
    "details_md": "## Details\n\nDescription of changes."
  },
  "tags": ["api"]
}
```

**Response:**

```json
{
  "ok": true,
  "ingested_id": "INGEST-001",
  "topics_added": ["api"],
  "files_updated": [
    "docs/_library/INGEST_LOG.md",
    "docs/_library/KB.md",
    "docs/_library/INDEX.json"
  ]
}
```

---

### GET /api/library/ingest

Get documentation for the ingest endpoint.

**Response:**

Returns usage information and example payload.

---

## Library Files

The knowledge base is stored in `docs/_library/`:

| File | Purpose | Update Method |
|------|---------|---------------|
| `KB.md` | Main knowledge base | Prepend new sections |
| `INDEX.json` | Topic index for search | Auto-updated on ingest |
| `INGEST_LOG.md` | Audit log | Append new entries |
| `SOURCES.md` | Sources of truth | Append scan results |
| `SCHEMA.md` | Database schema | Append new discoveries |
| `API.md` | API documentation | Prepend new endpoints |
| `FLOWS.md` | Data flows | Prepend new flows |

**Important:** All files are **append-only**. Never delete content - mark as `[DEPRECATED]` instead.

---

## Authentication

### Development Mode

- No authentication required
- Works automatically when `NODE_ENV=development`
- Or use header: `X-Library-Dev-Mode: true`

### Production Mode

1. Set environment variable: `LIBRARY_TOKEN=your-secret-token`
2. Include header: `Authorization: Bearer your-secret-token`

Without a token in production, the library operates in **read-only mode** (query works, ingest returns 403).

---

## For AI Agents

AI agents working on this repository should follow the protocol in [AGENT_RULES_LIBRARY.md](./AGENT_RULES_LIBRARY.md):

1. **PULL** at session start: Query library with keywords from user prompt
2. **READ** relevant matches before making changes
3. **PUSH** after commit: Ingest summary of changes

### Agent Quick Reference

```bash
# Start of session
curl "http://localhost:3000/api/library/query?keywords=YOUR,KEYWORDS,HERE"

# After commit+push
curl -X POST http://localhost:3000/api/library/ingest \
  -H "Content-Type: application/json" \
  -d '{"source":{"agent":"NAME","branch":"BRANCH","commit":"HASH"},...}'
```

---

## Troubleshooting

### Query returns no matches

- Use broader keywords
- Try related terms from `suggested_keywords`
- Check if library files exist in `docs/_library/`

### Ingest fails with 403

- In development: Ensure `NODE_ENV=development` or add `X-Library-Dev-Mode: true` header
- In production: Set `LIBRARY_TOKEN` and use `Authorization: Bearer {token}` header

### Ingest fails with 400

- Check all required fields are present
- Ensure `keywords` and `tags` arrays are not empty
- Validate JSON syntax

### Files not updating

- Check file permissions in `docs/_library/`
- Ensure the application has write access
- Check server logs for errors

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     /api/library/query                       │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │  INDEX.json │ ◄── Topic lookup        │
│                     └──────┬──────┘                         │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │    KB.md    │ ◄── Extract excerpts    │
│                     └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    /api/library/ingest                       │
│                            │                                 │
│              ┌─────────────┼─────────────┐                  │
│              │             │             │                  │
│       ┌──────▼──────┐ ┌────▼────┐ ┌─────▼─────┐            │
│       │INGEST_LOG.md│ │  KB.md  │ │INDEX.json │            │
│       └─────────────┘ └─────────┘ └───────────┘            │
│                                                             │
│       (Also updates API.md, FLOWS.md, SCHEMA.md            │
│        based on artifacts in payload)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [AGENT_RULES_LIBRARY.md](./AGENT_RULES_LIBRARY.md) - Rules for AI agents
- [docs/_library/KB.md](./\_library/KB.md) - Main knowledge base
- [docs/_library/API.md](./\_library/API.md) - API endpoints reference

---

*Last updated: 2026-01-13*
