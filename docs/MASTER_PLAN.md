# GENE-TREE MASTER PLAN

> **Document Purpose:** This is the strategic north star for Gene-Tree development. Every session should begin by reviewing this document to ensure alignment with the project vision, priorities, and philosophy.

**Last Updated:** 2026-02-06
**Version:** 1.3

---

## TABLE OF CONTENTS

1. [Project Identity](#1-project-identity)
2. [Core Philosophy](#2-core-philosophy)
3. [The Viral Growth Engine](#3-the-viral-growth-engine)
4. [Current State](#4-current-state)
5. [The 20-Point Success Plan](#5-the-20-point-success-plan)
6. [Technical Architecture Vision](#6-technical-architecture-vision)
7. [Future Outlook (2026-2030)](#7-future-outlook-2026-2030)
8. [Success Metrics](#8-success-metrics)
9. [Session Checklist](#9-session-checklist)

**Related Documents:**
- `docs/VIRAL_GROWTH_SYSTEM.md` — Detailed viral mechanics, SMS invitations, verification system

---

## 1. PROJECT IDENTITY

### What Is Gene-Tree?

Gene-Tree is a **privacy-first digital genealogy platform** that enables families to:
- Build verified family trees with cultural awareness
- Preserve stories, photos, and voice recordings
- Visualize connections across generations
- Control exactly who sees what

### The One-Liner

> *"Your family story stays in your family."*

### Target Users

| Segment | Description | Priority |
|---------|-------------|----------|
| **Primary** | Russian-speaking diaspora (US, Germany, Israel) | HIGH |
| **Secondary** | Privacy-conscious families in English-speaking markets | HIGH |
| **Tertiary** | Multi-generational families documenting heritage | MEDIUM |
| **Future** | Wealth management / family offices | LOW (Year 2+) |

---

## 2. CORE PHILOSOPHY

### The Five Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                    GENE-TREE PHILOSOPHY                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PRIVACY-FIRST                                           │
│     Every piece of data has explicit privacy controls.      │
│     We never sell, share, or monetize family data.          │
│                                                             │
│  2. CULTURAL AWARENESS                                      │
│     Kinship terminology respects cultural complexity.       │
│     "Cousin" in English ≠ the 15 Russian cousin terms.      │
│                                                             │
│  3. VERIFICATION-BASED TRUST                                │
│     Relationships require two-way confirmation.             │
│     No one can unilaterally claim kinship.                  │
│                                                             │
│  4. PRESERVATION OVER PERFECTION                            │
│     Support uncertain dates, approximate data, gaps.        │
│     Real family history is messy — we embrace that.         │
│                                                             │
│  5. STORIES MATTER                                          │
│     Not just names and dates — living narratives.           │
│     Photos, voice recordings, memories, traditions.         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### How We're Different

| Competitors Do... | Gene-Tree Does... |
|-------------------|-------------------|
| Monetize DNA data | Never touch genetic data |
| Sell to advertisers | Zero third-party sharing |
| English-first design | Cultural kinship awareness |
| Data warehouse approach | Stories & emotions first |
| Extract value from users | Preserve value for families |

---

## 3. THE VIRAL GROWTH ENGINE

### The Core Mechanic

Gene-Tree's primary growth driver is **exponential family expansion**:

```
USER SIGNS UP
     │
     ▼
MAPS FAMILY (creates placeholders for 10+ relatives)
     │
     ▼
SENDS INVITATIONS (Email, SMS, or WhatsApp)
     │
     ▼
RELATIVES CONFIRM (claim their placeholder profiles)
     │
     ▼
NEW USERS REPEAT THE CYCLE (invite THEIR relatives)
     │
     ▼
EXPONENTIAL GROWTH (K-factor > 1)
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Placeholder Accounts** | User creates profiles for relatives before inviting them |
| **Empty Chair Psychology** | Empty nodes with labels ("Dad", "Grandmother") motivate completion |
| **Multi-Channel Invites** | Email + **SMS (Twilio)** + WhatsApp for maximum reach |
| **Phone-First Registration** | Mobile-optimized, phone verification, minimal typing |
| **3-Person Deceased Verification** | Dead relatives verified by 3 family members |

### Invitation Channels

| Channel | Service | Open Rate | Best For |
|---------|---------|-----------|----------|
| Email | Supabase/Resend | 20-25% | Tech-savvy users |
| **SMS** | **Twilio** | 98% | Older relatives, universal |
| WhatsApp | Twilio API | 95% | International (diaspora) |

### Target Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Invites per user | 8-12 | More seeds = faster growth |
| Acceptance rate | 40-50% | Quality of invite experience |
| K-factor | >2.0 | Each user brings 2+ new users |
| First-session placeholders | 10+ | Initial tree completeness |

### Deceased Profile Verification

Since deceased people cannot confirm their accounts:

1. **Creator** adds deceased relative with available information
2. **3 family members** must verify the profile is accurate
3. **Any family member** can add content (photos, stories, info)
4. **Content requires approval** from verifiers or consensus

> **Full details:** See `docs/VIRAL_GROWTH_SYSTEM.md`

---

## 4. CURRENT STATE

### What's Built & Working (February 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Working | Supabase Auth (email/password) |
| User Profiles | ✅ Working | Full profile with privacy settings |
| Avatar System | ✅ Working | Direct upload, size limits |
| Relationships | ✅ Working | Parent/child/spouse/sibling + qualifiers |
| Kinship Computation | ✅ Working | Complex relationship labels |
| Tree Visualization | ✅ Working | D3.js + ELK.js interactive tree |
| Invitation System | ✅ Working | Token-based email invites |
| Stories (Text/Photo) | ✅ Working | With moderation workflow |
| Media Moderation | ✅ Working | Two-zone architecture |
| Internationalization | ✅ Working | English + Russian |
| Knowledge Base | ✅ Working | Librarian system for docs |
| Deployment | ✅ Working | Railway with CI/CD |
| Reactions System | ✅ Working | Emoji reactions on stories/photos/comments |
| Threaded Comments | ✅ Working | @mentions, nested replies |
| Activity Feed | ✅ Working | Family-scoped engagement tracking |
| "This Day" Widget | ✅ Working | Birthdays, anniversaries, commemorations |
| Photo Tagging | ✅ Working | Face tagging with coordinates |
| Memorial Tributes | ✅ Working | Tribute pages for deceased members |
| Relationship Finder | ✅ Working | "How are we related?" path finder |
| Ask the Elder | ✅ Working | Q&A queue for family wisdom |
| Honor Tags | ✅ Working | Commemorative profile tags with verification |
| Personal Credo | ✅ Working | Life motto / short biography field |
| Voice Stories | ✅ Working | 5-min recording, Whisper transcription, visibility controls |
| Family Group Chat | ✅ Working | Real-time messaging with system reminders |
| Time Capsules | ✅ Working | Scheduled delivery, family broadcast, after-passing trigger |
| Quick Invite Links | ✅ Working | QR codes, multi-channel sharing |

### What's Partially Built

| Feature | Status | Gap |
|---------|--------|-----|
| Education History | Schema ready | UI incomplete |
| Residence History | Schema ready | UI incomplete |
| Voice Stories | ✅ Working | Record up to 5min, AI transcription (Whisper), visibility controls |
| Background Jobs | Infrastructure ready | Processing incomplete |
| Notifications | Basic working | UI integration partial |

### Tech Stack

```
Frontend:    Next.js 15 + React 18 + TypeScript 5
Styling:     TailwindCSS + shadcn/ui + Radix UI
Backend:     Next.js API Routes + Supabase
Database:    PostgreSQL (Supabase) with RLS
Auth:        Supabase Auth (JWT)
Storage:     Supabase Storage (avatars + media buckets)
Viz:         D3.js + ELK.js + XYFlow React
i18n:        next-intl (EN, RU)
Deploy:      Railway (primary)
```

---

## 5. THE 20-POINT SUCCESS PLAN

### Phase 1: FOUNDATION (Weeks 1-4)

| # | Initiative | Category | Impact | Effort |
|---|------------|----------|--------|--------|
| 1 | **Privacy-First Positioning** | Business | HIGH | LOW |
|   | Lead all marketing with "Your family story stays in your family" | | | |
| 2 | **PostgreSQL Recursive CTEs** | Technical | HIGH | LOW |
|   | Replace N-query traversal with single recursive query (10-50x faster) | | | |
| 3 | **Guided Onboarding Wizard** | Product | HIGH | MEDIUM |
|   | "First Five Minutes" — guide users to add 5 family members immediately | | | |
| 4 | **Observability Infrastructure** | Technical | HIGH | MEDIUM |
|   | Structured logging, distributed tracing, alerting | | | |

### Phase 2: ENGAGEMENT (Weeks 5-12)

| # | Initiative | Category | Impact | Effort |
|---|------------|----------|--------|--------|
| 5 | **"This Day in Family History"** | Product | HIGH | MEDIUM |
|   | Daily digest of anniversaries, birthdays, death dates | | | |
| 6 | **Quick-Add from Tree View** | Product | HIGH | LOW |
|   | Click person → "+" buttons for add parent/child/spouse/sibling | | | |
| 7 | **Voice Story Recording** | Product | MEDIUM | LOW |
|   | ~~Complete pending refactor, one-tap recording, AI transcription~~ ✅ DONE (2026-02-06) | | | |
| 8 | **Freemium Pricing Model** | Business | HIGH | MEDIUM |
|   | Free (50 profiles) → Premium ($7.99/mo) → Family ($14.99/mo) | | | |
| 9 | **Search Infrastructure** | Technical | HIGH | MEDIUM |
|   | Full-text search + trigram fuzzy matching | | | |

### Phase 3: GROWTH (Weeks 13-24)

| # | Initiative | Category | Impact | Effort |
|---|------------|----------|--------|--------|
| 10 | **Russian Diaspora Market Entry** | Business | HIGH | MEDIUM |
|    | Target US/Germany/Israel communities, influencer partnerships | | | |
| 11 | **Invite Link with Preview** | Product | MEDIUM | LOW |
|    | Tree preview, social proof, personal message display | | | |
| 12 | **Family Achievements System** | Product | MEDIUM | MEDIUM |
|    | Badges for milestones, progress tracking, gamification | | | |
| 13 | **Memorial Mode** | Business | MEDIUM | LOW |
|    | Tribute pages, funeral home partnerships, guest books | | | |
| 14 | **Media Pipeline Completion** | Technical | HIGH | MEDIUM |
|    | Thumbnails, EXIF stripping, perceptual hashing | | | |

### Phase 4: SCALE (Months 6-12)

| # | Initiative | Category | Impact | Effort |
|---|------------|----------|--------|--------|
| 15 | **Virtual Viewport Rendering** | Technical | HIGH | HIGH |
|    | Render only visible nodes, Web Worker layout, caching | | | |
| 16 | **Real-time Collaboration** | Technical | HIGH | HIGH |
|    | Supabase Realtime, presence indicators, optimistic UI | | | |
| 17 | **Mobile-First PWA** | Product | HIGH | HIGH |
|    | Offline support, camera integration, "Reunion Mode" | | | |
| 18 | **Family Timeline View** | Product | HIGH | HIGH |
|    | Chronological visualization, event filtering, historical context | | | |
| 19 | **DNA Partnership** | Business | MEDIUM | HIGH |
|    | Privacy-preserving integration with ethical lab partner | | | |
| 20 | **Family Time Capsule** | Business | MEDIUM | MEDIUM |
|    | Time-locked content, viral unlock moments, sharing triggers | | | |

### Priority Matrix

```
              HIGH IMPACT
                   │
       ┌───────────┼───────────┐
       │ DO FIRST  │ PLAN FOR  │
       │           │           │
       │ • CTEs    │ • Timeline│
       │ • Onboard │ • Realtime│
       │ • Privacy │ • PWA     │
       │ • Search  │ • Viewport│
  LOW  ├───────────┼───────────┤ HIGH
EFFORT │ QUICK WIN │ STRATEGIC │ EFFORT
       │           │           │
       │ • Voice   │ • DNA     │
       │ • QuickAdd│ • Capsule │
       │ • Invite  │ • B2B     │
       │ • Badges  │           │
       └───────────┼───────────┘
                   │
              LOW IMPACT
```

---

## 6. TECHNICAL ARCHITECTURE VISION

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Dashboard│ │  Tree   │ │ Profile │ │ Stories │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └───────────┴───────────┴───────────┘                │
│                         │                                   │
│             Next.js API Routes (REST)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                       SUPABASE                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │PostgreSQL│ │   Auth   │ │ Storage  │ │ Realtime │       │
│  │  + RLS   │ │  (JWT)   │ │(Buckets) │ │ (future) │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture (2027)

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   PWA   │ │ Mobile  │ │ Desktop │ │  Embed  │           │
│  │  (Web)  │ │  (RN?)  │ │(Electron│ │ Widget  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └───────────┴───────────┴───────────┘                │
│                         │                                   │
│              GraphQL Gateway + REST API                     │
│                         │                                   │
│  ┌──────────────────────┴──────────────────────┐           │
│  │              SERVICE LAYER                   │           │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐ │           │
│  │  │  Tree  │ │ Media  │ │ Search │ │Notify │ │           │
│  │  │ Engine │ │Pipeline│ │ Index  │ │ Queue │ │           │
│  │  └────────┘ └────────┘ └────────┘ └───────┘ │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                     DATA LAYER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │PostgreSQL│ │   R2    │ │  Redis   │ │ Typesense│       │
│  │ (Primary)│ │ (Media) │ │ (Cache)  │ │ (Search) │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | PostgreSQL + RLS | Fine-grained security at data layer |
| Auth | Supabase Auth | Integrated, handles edge cases |
| Storage | Supabase → R2 migration | Cost efficiency at scale |
| Search | PostgreSQL FTS → Typesense | Better fuzzy matching, performance |
| Realtime | Supabase Realtime | Already integrated, sufficient |
| Caching | None → Redis | Session data, computed kinship |
| API | REST → GraphQL gateway | Reduce round-trips, type safety |

---

## 7. FUTURE OUTLOOK (2026-2030)

### Vision Statement

> By 2030, Gene-Tree will be the trusted home for 1 million families to preserve their heritage, with industry-leading privacy standards and deep cultural awareness across 20+ languages.

### Year-by-Year Roadmap

#### 2026: Foundation Year
**Theme:** *"Get the basics right"*

- Q1: Launch freemium model, complete onboarding wizard
- Q2: Russian diaspora market entry, voice stories complete
- Q3: Search infrastructure, media pipeline
- Q4: Real-time collaboration, PWA release

**Target:** 10,000 MAU, $50K MRR, 2 languages

#### 2027: Growth Year
**Theme:** *"Expand reach"*

- Q1: DNA partnership launch (privacy-preserving)
- Q2: Timeline view, family achievements
- Q3: Community localization (5 new languages)
- Q4: Memorial mode, funeral home partnerships

**Target:** 50,000 MAU, $250K MRR, 7 languages

#### 2028: Platform Year
**Theme:** *"Become the ecosystem"*

- Q1: Family Historian marketplace launch
- Q2: API for third-party integrations
- Q3: Mobile native apps (iOS/Android)
- Q4: Enterprise/B2B tier for wealth management

**Target:** 200,000 MAU, $1M MRR, 12 languages

#### 2029: AI Year
**Theme:** *"Intelligent preservation"*

- Q1: AI-powered story transcription and translation
- Q2: Photo enhancement and colorization
- Q3: Relationship suggestion engine
- Q4: Voice cloning for ancestor stories (ethical framework)

**Target:** 500,000 MAU, $3M MRR, 18 languages

#### 2030: Legacy Year
**Theme:** *"Generational impact"*

- Q1: Physical book printing service
- Q2: VR/AR family tree exploration
- Q3: Institutional partnerships (archives, libraries)
- Q4: Non-profit arm for at-risk heritage preservation

**Target:** 1,000,000 MAU, $8M MRR, 25 languages

### Future Feature Concepts

#### Near-Term (2026-2027)

| Feature | Description | Status |
|---------|-------------|--------|
| **Smart Prompts** | "Your grandmother has no photo. Add one?" | Planned |
| **Family Search** | "How is Maria related to Ivan?" with path visualization | Planned |
| **Import/Export** | GEDCOM support for migration from other platforms | Planned |
| **Collaboration Roles** | Admin, Editor, Viewer permissions per family | Planned |
| **Annual Memory Book** | PDF generation from year's stories | Planned |

#### Mid-Term (2028-2029)

| Feature | Description | Status |
|---------|-------------|--------|
| **AI Transcription** | Automatic transcription of voice stories | ✅ Built (OpenAI Whisper, 2026-02-06) |
| **Photo Restoration** | AI-powered enhancement of old photos | Concept |
| **Translation Layer** | Auto-translate stories between family languages | Concept |
| **Relationship Suggestions** | "Based on ages, Maria might be Ivan's mother" | Concept |
| **Document OCR** | Extract data from certificates, records | Concept |

#### Long-Term (2030+)

| Feature | Description | Status |
|---------|-------------|--------|
| **Heritage VR** | Walk through family home reconstructions | Vision |
| **Voice Synthesis** | Hear ancestors tell their stories in their voice | Vision |
| **Archive Integration** | Connect to national archives, church records | Vision |
| **Genetic Traits** | Non-DNA trait tracking (eye color, height patterns) | Vision |
| **Family AI** | Conversational interface to explore family history | Vision |

### Market Expansion Strategy

```
2026: English + Russian (core)
      │
      ├── 2027: Ukrainian, Hebrew, German (diaspora adjacent)
      │
      ├── 2028: Spanish, Portuguese (large markets)
      │
      ├── 2029: Chinese, Arabic, Hindi (massive TAM)
      │
      └── 2030: 25 languages via community localization
```

### Revenue Model Evolution

```
2026: Freemium SaaS
      ├── Free tier (50 profiles)
      ├── Premium ($7.99/mo)
      └── Family ($14.99/mo)

2027: + Marketplace
      └── Family Historian services (15% commission)

2028: + Enterprise
      ├── B2B wealth management ($5K-50K/year)
      └── White-label licensing

2029: + AI Services
      ├── Premium AI features ($4.99/mo add-on)
      └── Professional restoration services

2030: + Physical Products
      ├── Printed memory books
      └── Heritage preservation packages
```

---

## 8. SUCCESS METRICS

### North Star Metric

> **Families with 10+ verified profiles and 5+ stories**

This measures real engagement, not vanity signups.

### Key Performance Indicators

| Category | Metric | 2026 Target | 2027 Target | 2028 Target |
|----------|--------|-------------|-------------|-------------|
| **Acquisition** | Monthly Active Users | 10,000 | 50,000 | 200,000 |
| **Activation** | Complete onboarding | 60% | 65% | 70% |
| **Retention** | Month 3 retention | 40% | 45% | 50% |
| **Revenue** | Paid conversion | 7% | 8% | 10% |
| **Revenue** | Monthly Recurring Revenue | $50K | $250K | $1M |
| **Engagement** | Stories per active user/mo | 5 | 8 | 12 |
| **Growth** | Viral coefficient | 1.3 | 1.5 | 1.8 |
| **Satisfaction** | Net Promoter Score | 60 | 65 | 70 |

### Health Metrics (Monitor Weekly)

- **Tree depth**: Average generations per family
- **Invite acceptance rate**: % of invites that convert
- **Story completion rate**: Started vs published stories
- **Photo upload success**: Uploads vs moderation passes
- **Error rate**: API 5xx responses
- **Performance**: Tree load p95 latency

---

## 9. SESSION CHECKLIST

### Before Starting Any Session

Use this checklist to ensure alignment:

```
□ Review current phase in 20-Point Plan
□ Check which initiatives are in progress
□ Verify no conflicts with Core Philosophy
□ Understand target metrics for current quarter
□ Review any blockers from previous sessions
```

### Questions to Ask

1. **Does this align with privacy-first philosophy?**
2. **Does this serve the current phase priorities?**
3. **What's the impact vs effort trade-off?**
4. **Are we building for the target user segments?**
5. **Does this create technical debt we'll regret?**

### Session End Checklist

```
□ Update relevant documentation
□ Log learnings in knowledge base (/api/library/ingest)
□ Note any blockers for next session
□ Verify alignment with Master Plan maintained
```

---

## DOCUMENT HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.3 | 2026-02-06 | Voice Story Recording complete (#7), AI Transcription built, consolidated voice systems |
| 1.2 | 2026-01-23 | Added engagement features status, UI overhaul design docs |
| 1.1 | 2026-01-23 | Engagement features deployed (reactions, comments, activity feed, memorial tributes) |
| 1.0 | 2026-01-22 | Initial master plan created from brain session |

---

## QUICK REFERENCE

### Current Priority (Phase 1)

1. Privacy-first positioning
2. PostgreSQL recursive CTEs
3. Guided onboarding wizard
4. Observability infrastructure

### Core Philosophy (Never Compromise)

1. Privacy-first
2. Cultural awareness
3. Verification-based trust
4. Preservation over perfection
5. Stories matter

### North Star Metric

> **Families with 10+ verified profiles and 5+ stories**

---

*This document is the source of truth for Gene-Tree strategy. All development decisions should reference and align with this plan.*
