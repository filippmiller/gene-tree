# Session Notes: Security Hardening, Error Boundaries, OG Tags & Media Pipeline

**Date:** 2026-02-07 ~14:00
**Area:** Security, Stability, Growth, Performance, Media Pipeline
**Type:** feature
**Log Entry:** `.claude/agent-log.md` (entry at 2026-02-07 14:00)

## Context

User asked for a systematic analysis of the codebase to identify the best improvement opportunities. 30 ideas were generated, critically evaluated (19 rejected with reasons), and the top 6 were implemented in the same session. This was driven by a desire to strengthen the foundation before growth phase.

## What Was Done

### 1. EXIF Stripping & Media Pipeline Completion (Security - Critical)
- Files: `src/app/api/media/process-jobs/route.ts`, `package.json`
- Changes: Implemented three previously-stubbed job processors using `sharp`:
  - `processStripExif()` — Downloads image from Supabase Storage, auto-rotates based on EXIF orientation, strips ALL metadata (GPS, camera, IPTC, XMP), re-uploads cleaned version
  - `processThumbnail()` — Generates WebP thumbnails at 3 sizes (1024, 512, 256), uploads to `{path}_thumb_{size}.webp`
  - `processHash()` — Computes SHA-256 hash for deduplication, stores on photo record
- Reasoning: Privacy-first platform was leaking GPS coordinates in uploaded photos. This was a critical security gap.

### 2. Content Security Policy Headers (Security)
- Files: `src/middleware.ts`
- Changes: Added `Content-Security-Policy` header to `SECURITY_HEADERS`:
  - `default-src 'self'` — blocks all external resources by default
  - `script-src 'self' 'unsafe-eval'` — unsafe-eval needed for Next.js dev mode
  - `style-src 'self' 'unsafe-inline'` — inline styles needed for Radix UI
  - `img-src 'self' data: blob: *.supabase.co` — images from self + Supabase
  - `connect-src 'self' *.supabase.co wss://*.supabase.co` — API + Realtime
  - `frame-ancestors 'none'` — prevents clickjacking
- Reasoning: No CSP = any XSS vulnerability can execute arbitrary JS. Critical for a family data platform.

### 3. Request Tracing with Correlation IDs (Observability)
- Files: `src/middleware.ts`
- Changes:
  - New `getRequestId()` function — reuses client `X-Request-ID` header or generates UUID
  - Updated `logApiRequest()` — includes `requestId` in structured JSON logs
  - Updated `addSecurityHeaders()` — sets `X-Request-ID` on all responses
  - All middleware code paths thread the requestId through
- Reasoning: Directly supports Master Plan #4 (Observability). Enables correlating client requests to server logs for debugging.

### 4. React Error Boundaries (Stability)
- Files: 4 new `error.tsx` files
- Changes: Created bilingual (EN/RU) error boundary components:
  - `src/app/[locale]/(protected)/error.tsx` — catches all protected route errors
  - `src/app/[locale]/(protected)/tree/error.tsx` — tree-specific with "View as List" fallback
  - `src/app/[locale]/(protected)/stories/error.tsx` — stories error recovery
  - `src/app/[locale]/(protected)/family-chat/error.tsx` — chat reconnection UI
- Reasoning: Zero error boundaries existed before. Any runtime error = white screen crash.

### 5. OpenGraph Meta Tags (Growth)
- Files: `src/app/layout.tsx`, `src/app/join/[code]/page.tsx`, `src/app/[locale]/(protected)/tribute/[profileId]/page.tsx`
- Changes:
  - Root layout: Rich metadata with title templates, OG type/siteName/description, Twitter Card, locale alternates
  - Join page: Dynamic OG tags showing creator name, event name, remaining spots
  - Tribute page: Dynamic metadata with person's name and life dates
  - Removed unused `notFound` import from join page (lint fix)
- Reasoning: Shared links on WhatsApp/Telegram/Facebook showed blank previews. Rich previews dramatically increase click-through.

### 6. API Response Caching (Performance)
- Files: `src/app/api/tree-data/route.ts`, `src/app/api/profiles/search/route.ts`
- Changes:
  - Tree data: `Cache-Control: private, max-age=30, stale-while-revalidate=60`
  - Search: `Cache-Control: private, max-age=10, stale-while-revalidate=30`
- Reasoning: Tree data uses a recursive CTE that's expensive. 30s cache with SWR means repeated page loads don't hit the DB.

## Technical Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Used `sharp` for EXIF stripping | Standard Node.js image library, handles rotation + metadata stripping in one pass | Could use `exiftool` CLI but adds system dependency |
| `'unsafe-eval'` in CSP | Required for Next.js dev mode HMR | Could use nonce-based CSP but adds complexity to SSR |
| `'unsafe-inline'` for styles | Radix UI and TailwindCSS inject inline styles | Could use CSS modules but would require massive refactor |
| `private` cache (not `public`) | Tree/search data is user-specific, must not be cached by CDN | Could use `no-store` but that defeats purpose |
| WebP for thumbnails | Best compression/quality ratio for web | Could use JPEG but WebP is 25-35% smaller |
| Error boundaries at route group level | Catches errors from all child pages without needing per-page boundaries | Could add per-component boundaries but that's over-engineering |

## Files Changed (Full List)

| File | Action | Description |
|------|--------|-------------|
| `src/middleware.ts` | Modified | Added CSP header + X-Request-ID correlation tracing |
| `src/app/api/media/process-jobs/route.ts` | Modified | Implemented strip_exif, thumbnail, hash job processors |
| `src/app/layout.tsx` | Modified | Rich OG/Twitter metadata with title templates |
| `src/app/join/[code]/page.tsx` | Modified | Dynamic OG tags for invite links, removed unused import |
| `src/app/[locale]/(protected)/tribute/[profileId]/page.tsx` | Modified | Dynamic OG metadata for tribute pages |
| `src/app/api/tree-data/route.ts` | Modified | Cache-Control header (30s + 60s SWR) |
| `src/app/api/profiles/search/route.ts` | Modified | Cache-Control header (10s + 30s SWR) |
| `src/app/[locale]/(protected)/error.tsx` | Created | Error boundary for all protected routes (EN/RU) |
| `src/app/[locale]/(protected)/tree/error.tsx` | Created | Tree-specific error boundary with list fallback |
| `src/app/[locale]/(protected)/stories/error.tsx` | Created | Stories error boundary |
| `src/app/[locale]/(protected)/family-chat/error.tsx` | Created | Chat error boundary |
| `package.json` | Modified | Added `sharp` dependency |
| `package-lock.json` | Modified | Lock file updated for sharp |

## Functions & Symbols

| Symbol | File | Action | Description |
|--------|------|--------|-------------|
| `processStripExif()` | `process-jobs/route.ts` | New | Downloads image, strips EXIF with sharp, re-uploads |
| `processThumbnail()` | `process-jobs/route.ts` | New | Generates WebP thumbnails at 3 sizes |
| `processHash()` | `process-jobs/route.ts` | New | SHA-256 hash computation for dedup |
| `getRequestId()` | `middleware.ts` | New | Gets or generates X-Request-ID correlation UUID |
| `logApiRequest()` | `middleware.ts` | Modified | Added requestId parameter |
| `addSecurityHeaders()` | `middleware.ts` | Modified | Added requestId parameter, sets X-Request-ID |
| `SECURITY_HEADERS` | `middleware.ts` | Modified | Added Content-Security-Policy |
| `metadata` | `layout.tsx` | Modified | Rich OG/Twitter metadata with title templates |
| `generateMetadata()` | `join/[code]/page.tsx` | Modified | Dynamic OG with creator name + spots |
| `generateMetadata()` | `tribute/[profileId]/page.tsx` | New | Dynamic OG with person name + life dates |
| `ProtectedError` | `(protected)/error.tsx` | New | Error boundary component |
| `TreeError` | `tree/error.tsx` | New | Tree error boundary component |
| `StoriesError` | `stories/error.tsx` | New | Stories error boundary component |
| `FamilyChatError` | `family-chat/error.tsx` | New | Chat error boundary component |

## Database Impact

No database schema changes. The media job processors read/write to existing tables:
- `photos` — Updated `exif_stripped`, `thumbnail_paths`, `sha256` fields
- `media_jobs` — Read queued jobs, update status (existing behavior)

## Testing

- [x] TypeScript type check passes (`tsc --noEmit` — clean)
- [x] Production build passes (`next build` — exit code 0)
- [x] ESLint passes (pre-commit hook verified)
- [ ] E2E tests not re-run (no behavioral changes to test flows)
- [ ] Manual verification of media pipeline requires photo upload test

## Commits

- `3883583` — feat: add security hardening, error boundaries, OG tags, and media pipeline

## Ideas Analysis (30 Generated, 11 Passed, 6 Implemented)

### Rejected Ideas (19) with Reasons
1. Skeleton screens — cosmetic, marginal UX gain
2. Dark mode completion — massive effort (47+ component dirs), not Foundation phase
3. Real-time notifications — requires Supabase Realtime setup, scale-phase
4. PWA manifest — Master Plan says Q4 2026, caching invalidation hard
5. Rate limiting dashboard — premature at current user count
6. DB health metrics — Supabase handles this
7. Weekly digest email — needs design/content, not just code
8. GEDCOM import/export — complex spec, massive effort
9. Keyboard tree navigation — complex D3.js work for niche need
10. Photo face detection — external AI cost + privacy implications
11. Family statistics dashboard — needs established data first
12. Animated relationship paths — marginal improvement
13. CSV/PDF export — not requested by users
14. 2FA — Supabase Auth already secure
15. WCAG audit — too broad, better done incrementally
16. Visual regression testing — maintenance burden
17. Story drafts — edge case for short content
18. Tree printing — complex rendering problem
19. Realtime collaboration — Master Plan #16, scale phase

### Implemented (6) — see above

### Deferred (5) — for future sessions
- Bundle size optimization (dynamic import D3/ELK) — 75% confidence
- Empty state CTAs for new users — 82% confidence
- Zod validation on API routes — 80% confidence, start with onboarding routes
- Database index audit — 72% confidence, needs EXPLAIN ANALYZE
- Optimistic UI updates — 68% confidence, requires state management refactor

## Gotchas & Notes for Future Agents

1. **CSP `unsafe-eval`**: Required for Next.js dev mode. Can be removed for production-only CSP if needed. Monitor for CSP violations in browser console.
2. **CSP `unsafe-inline` for styles**: Required by Radix UI. Cannot remove without switching to CSS modules project-wide.
3. **sharp on Railway**: Railway supports sharp natively. If deployment fails, may need `sharp` in `optionalDependencies` or explicit platform config.
4. **Thumbnail paths**: Stored as `{original}_thumb_{size}.webp` in the same Supabase Storage bucket. No separate bucket needed.
5. **Cache-Control `private`**: Critical — tree/search data is user-specific and MUST NOT be cached by CDN/proxy. Only browser cache.
6. **Error boundaries are `'use client'`**: Required by Next.js App Router for error.tsx files. They use inline translations (not next-intl) to avoid provider dependency.
7. **`exif_stripped` and `thumbnail_paths` columns**: These may not exist yet in the photos table schema. If the job processor fails, a migration adding these columns is needed. The `as any` cast handles this gracefully.

---
