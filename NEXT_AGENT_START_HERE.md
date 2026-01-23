# GENE-TREE: Agent Session Start Guide

> **Purpose:** This document orients any agent or developer starting a new session on Gene-Tree.

**Last Updated:** 2026-01-23

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

### Completed 2026-01-23
- **10 Engagement Features deployed to production** (see `docs/implementation/ENGAGEMENT_FEATURES.md`)
  - Emotional reactions on stories/photos
  - Threaded comments with @mentions
  - Family activity feed
  - "This Day in Your Family" widget
  - Weekly digest infrastructure
  - Photo face tagging
  - Memorial tribute pages
  - "Ask the Elder" queue
  - "How Are We Related" path finder
- All 5 migrations applied (0031-0035)
- CI passed, deployed to Railway

### Security Hardening (2026-01-23)
- **API routes hardened:** Now use SSR clients, validate ownership, deduplicate notifications
- **RLS helpers added:** `can_view_story()`, `can_view_photo()`, `can_view_story_comment()`
- **Family circle locked down:** `get_family_circle_profile_ids()` now only returns data for caller's own profile or service_role
- **Activity events protected:** `record_activity_event()` restricted to service_role only
- **Session notes:** `docs/sessions/2026-01-23_engagement-security-hardening-and-migration-completion.md`

### Important Context
- **Supabase DB password changed:** `P6CQoeMfPyrdwQvc`
- **Docker issues:** If local Supabase fails, push directly to remote with `supabase db push --password <password>`

### Pages Built (2026-01-23)
- `/[locale]/relationship-finder` - "How Are We Related?" connection finder
- `/[locale]/elder-questions` - Ask the Elder Q&A interface
- `/[locale]/tribute/[profileId]` - Memorial tribute pages for deceased members
- Dashboard now shows real ActivityFeed instead of "Coming Soon"
- Dashboard has "Explore Your Family" section with links to new features

### Next Session Priorities
- Manual testing of engagement features in browser
- Add E2E tests for critical paths
- Voice message stories (enhancement to existing media system)

---

## North Star Metric

> **Families with 10+ verified profiles and 5+ stories**

All work should ultimately drive this metric.

---

*Questions? Check the Master Plan first. If not covered, document the answer for future sessions.*
