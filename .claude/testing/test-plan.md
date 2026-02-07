# Test Plan

**Generated:** 2026-02-07
**App URL:** http://localhost:3001
**Framework:** Next.js 15.5.9 (App Router)
**Auth System:** Supabase Auth (Email/Password, Magic Link, Invitation Tokens)
**Locale:** `en` (default)

## Routes Discovered

| Route | Type | Auth Required | Forms | CRUD | Priority |
|-------|------|---------------|-------|------|----------|
| `/en/sign-in` | Page | No | Login form | READ user | P0 |
| `/en/sign-up` | Page | No | Registration form | CREATE user | P0 |
| `/en/magic-link` | Page | No | Magic link form | - | P1 |
| `/en/app` | Page | Yes | - | READ dashboard | P0 |
| `/en/tree` | Page | Yes | - | READ tree | P0 |
| `/en/my-profile` | Page | Yes | Profile form | CRUD profile | P1 |
| `/en/people` | Page | Yes | - | READ list | P1 |
| `/en/people/new` | Page | Yes | AddRelativeForm | CREATE relative | P1 |
| `/en/stories` | Page | Yes | - | READ stories | P1 |
| `/en/stories/pending` | Page | Yes | - | READ pending | P2 |
| `/en/photos` | Page | Yes | - | READ gallery | P2 |
| `/en/family-chat` | Page | Yes | Chat input | CREATE message | P1 |
| `/en/family-profile` | Page | Yes | - | READ family | P2 |
| `/en/milestones` | Page | Yes | MilestoneForm | CRUD milestones | P2 |
| `/en/elder-questions` | Page | Yes | AskElderForm | CRUD Q&A | P2 |
| `/en/time-capsules` | Page | Yes | TimeCapsuleForm | CREATE capsule | P2 |
| `/en/achievements` | Page | Yes | - | READ badges | P3 |
| `/en/connections` | Page | Yes | - | READ connections | P3 |
| `/en/trust-center` | Page | Yes | - | READ/UPDATE privacy | P2 |
| `/en/prompts` | Page | Yes | - | READ prompts | P3 |
| `/en/migration-map` | Page | Yes | - | READ map | P3 |
| `/en/memory-book` | Page | Yes | - | READ/CREATE book | P3 |
| `/en/onboarding/wizard` | Page | Yes | Wizard steps | CREATE profile | P0 |
| `/en/admin` | Page | Yes (Admin) | - | READ admin | P2 |
| `/en/profile/[id]` | Page | No | - | READ profile | P2 |

## API Endpoints (Key Subset for Testing)

| Endpoint | Method | Auth | Priority |
|----------|--------|------|----------|
| `/api/auth/session` | POST, DELETE | Session | P0 |
| `/api/relatives` | GET, POST | YES | P1 |
| `/api/relationships` | GET, POST | YES | P1 |
| `/api/stories/pending` | GET | YES | P2 |
| `/api/notifications` | GET, POST | YES | P2 |
| `/api/messages/unread-count` | GET | YES | P2 |
| `/api/health/db` | GET | NO | P0 |
| `/api/prompts` | GET, POST | YES | P3 |
| `/api/milestones` | GET, POST | YES | P2 |
| `/api/elder-questions` | GET, POST | YES | P2 |

## Test Execution Order

1. **P0 — Auth flows** (sign-up, sign-in, session, sign-out, protected route guard)
2. **P0 — Core navigation** (dashboard loads, tree loads, onboarding redirect)
3. **P1 — People & Relatives** (list, add relative form)
4. **P1 — Profile** (my-profile loads, edit fields)
5. **P1 — Stories** (stories feed loads)
6. **P1 — Family Chat** (chat page loads, send message)
7. **P2 — Secondary pages** (milestones, elder questions, photos, trust center, family profile)
8. **P3 — Tertiary pages** (achievements, prompts, migration map, memory book)
9. **Error handling** (404, protected route redirect, invalid data)

## Test Users

| Email | Role | Purpose |
|-------|------|---------|
| `filippmiller@gmail.com` | user (existing) | Primary flow testing |
| `e2e-test-{timestamp}@test.gene-tree.app` | user (new) | Registration testing |
