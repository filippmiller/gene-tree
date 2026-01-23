# GENE-TREE: Agent Session Start Guide

> **Purpose:** This document orients any agent or developer starting a new session on Gene-Tree.

**Last Updated:** 2026-01-22

---

## STEP 1: Read the Master Plan

**Before doing anything else, read:**

```
docs/MASTER_PLAN.md
```

This contains:
- Project identity and philosophy
- Current state of what's built
- The 20-point success plan with priorities
- Future outlook (2026-2030)
- Success metrics
- Session checklist

**The Master Plan is the strategic north star. All work should align with it.**

---

## STEP 2: Understand Current Phase

As of January 2026, we are in **Phase 1: Foundation**

Current priorities:
1. Privacy-first positioning
2. PostgreSQL recursive CTEs (performance)
3. Guided onboarding wizard
4. Observability infrastructure

Check the Master Plan for the full 20-point roadmap.

---

## STEP 3: Quick Technical Context

### Tech Stack
```
Frontend:    Next.js 15 + React 18 + TypeScript
Database:    PostgreSQL (Supabase) with RLS
Auth:        Supabase Auth
Storage:     Supabase Storage
Viz:         D3.js + ELK.js
i18n:        next-intl (EN, RU)
Deploy:      Railway
```

### Key Directories
```
src/
├── app/              # Next.js App Router (pages + API routes)
├── components/       # React components
├── lib/              # Utilities and business logic
├── types/            # TypeScript definitions
└── messages/         # i18n translations

docs/
├── MASTER_PLAN.md    # Strategic north star (READ THIS)
├── arch/             # Architecture documentation
├── ops/              # Operational runbooks
└── _library/         # Knowledge base (auto-generated)

supabase/
└── migrations/       # Database migrations
```

### Essential Commands
```powershell
npm install           # Install dependencies
npm run dev           # Start dev server (localhost:3000)
npm run typecheck     # TypeScript check
npm run lint          # ESLint
npm run build         # Production build
```

---

## STEP 4: Core Philosophy (Never Compromise)

1. **Privacy-first** — Every data field has privacy controls
2. **Cultural awareness** — Respect kinship complexity across cultures
3. **Verification-based trust** — Two-way relationship confirmation
4. **Preservation over perfection** — Handle uncertain/incomplete data
5. **Stories matter** — Not just names and dates

---

## STEP 5: Knowledge Base

Query existing knowledge:
```
GET /api/library/query?q=<search term>
```

Add new knowledge after completing work:
```
POST /api/library/ingest
```

Admin dashboard: `/admin/librarian`

---

## STEP 6: Session End Checklist

After completing any session:

```
□ Update relevant documentation
□ Log learnings to knowledge base
□ Note any blockers for next session
□ Verify work aligns with Master Plan
□ Update MASTER_PLAN.md if priorities changed
```

---

## Quick Links

| Resource | Location |
|----------|----------|
| Master Plan | `docs/MASTER_PLAN.md` |
| Architecture | `docs/arch/overview.md` |
| Decisions (ADRs) | `docs/DECISIONS.md` |
| Kinship System | `docs/KINSHIP.md` |
| Media System | `docs/MEDIA_SYSTEM.md` |
| Deployment | `docs/ops/runbook.md` |
| Knowledge Base | `docs/_library/KB.md` |

---

## Current Blockers / Notes

*Update this section with any blockers or important context for the next session.*

- None currently documented

---

## North Star Metric

> **Families with 10+ verified profiles and 5+ stories**

All work should ultimately drive this metric.

---

*Questions? Check the Master Plan first. If not covered, document the answer for future sessions.*
