# GENE-TREE: Viral Growth & Social System Design

> **Document Purpose:** Detailed design for the viral invitation system, deceased verification, content sharing, and social features. This is the operational expansion of the Master Plan.

**Last Updated:** 2026-01-22
**Version:** 1.0

---

## TABLE OF CONTENTS

1. [The Core Growth Engine](#1-the-core-growth-engine)
2. [Profile States & Verification](#2-profile-states--verification)
3. [Invitation System (Email + SMS)](#3-invitation-system-email--sms)
4. [Content Sharing Workflows](#4-content-sharing-workflows)
5. [Birthday & Commemoration System](#5-birthday--commemoration-system)
6. [Social Features](#6-social-features)
7. [Technical Implementation](#7-technical-implementation)

---

## 1. THE CORE GROWTH ENGINE

### The Viral Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    GENE-TREE VIRAL LOOP                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER SIGNS UP                                               │
│     └─▶ Completes own profile                                   │
│                                                                 │
│  2. MAPS FAMILY (Not inviting yet!)                             │
│     └─▶ Creates PLACEHOLDER accounts for relatives              │
│     └─▶ Parents, grandparents, siblings, spouse, children       │
│     └─▶ Target: 10+ placeholders in first session               │
│                                                                 │
│  3. SENDS INVITATIONS                                           │
│     └─▶ Email OR SMS OR WhatsApp                                │
│     └─▶ Personalized message + tree preview                     │
│     └─▶ Living relatives receive invite links                   │
│                                                                 │
│  4. RELATIVE CONFIRMS                                           │
│     └─▶ Clicks link → Mobile-friendly registration              │
│     └─▶ Claims their placeholder profile                        │
│     └─▶ Relationship auto-verified                              │
│                                                                 │
│  5. NEW USER REPEATS CYCLE                                      │
│     └─▶ They map THEIR relatives (spouse's family, etc.)        │
│     └─▶ Exponential growth within family networks               │
│                                                                 │
│  RESULT: Each user brings 3-10 new users                        │
│          K-factor > 1 = Viral growth                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Target Metrics

| Metric | Current | Target | Viral Threshold |
|--------|---------|--------|-----------------|
| Invites per user | ~3 | 8-12 | 5+ |
| Invite acceptance rate | ~25% | 40-50% | 30%+ |
| K-factor (invites × acceptance) | ~0.75 | 3.0+ | >1.0 |

### The "Empty Chair" Psychology

Users should see **incomplete** trees with labeled empty slots:

```
        [Empty]              [Empty]
        Grandfather          Grandmother
            │                    │
            └────────┬───────────┘
                     │
      [Empty]    [✓ Mom]    [Empty]
       Dad                   Uncle
                     │
                  [✓ YOU]

"Your tree is missing 4 close relatives"
[+ Add Father] [+ Add Grandparents]
```

**Key Insight:** Empty nodes with relationship labels create emotional discomfort. Seeing "Dad" as an empty slot feels wrong and motivates action.

---

## 2. PROFILE STATES & VERIFICATION

### Profile State Machine

| State | Description | Can Login? | Who Edits? |
|-------|-------------|------------|------------|
| `placeholder_living` | Created by family, awaiting claim | No | Creator only |
| `placeholder_deceased` | Created for deceased person | No | Creator only |
| `claimed_pending` | Living person claimed, verifying | Yes | Claimant |
| `claimed_verified` | Living person fully verified | Yes | Owner |
| `deceased_pending` | Deceased, < 3 verifications | No | Family (tracked) |
| `deceased_verified` | Deceased, 3+ verifications | No | Family (consensus) |

### Deceased Person Verification (3-Person Quorum)

**The Problem:** Dead people can't confirm their accounts.

**The Solution:** 3 family members must verify the profile.

```
┌─────────────────────────────────────────────────────────────────┐
│                DECEASED PROFILE VERIFICATION                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Profile: Maria Ivanovna Petrova (1922-2020)                    │
│  Status: ⏳ Pending Verification (2 of 3 required)              │
│                                                                 │
│  VERIFIED BY:                                                   │
│  ✓ Peter Petrov (son) — "This is my mother"                     │
│  ✓ Anna Petrova (daughter) — "Confirmed, this is mama"          │
│  ○ Waiting for 1 more verification                              │
│                                                                 │
│  WHO CAN VERIFY:                                                │
│  • Ivan Petrov (grandson)                                       │
│  • Maria Petrova Jr. (granddaughter)                            │
│  • Boris Petrov (brother)                                       │
│                                                                 │
│  RULES:                                                         │
│  • Creator cannot be sole verifier                              │
│  • Verifiers must be within 3 relationship hops                 │
│  • After 1 year: threshold drops to 2 if not enough family      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Content Rules by Profile State

| State | Who Can Add Content | Approval Required |
|-------|---------------------|-------------------|
| `placeholder_*` | Creator only | No |
| `claimed_verified` | Owner + family | Owner must approve |
| `deceased_pending` | Family members | 2 verifiers must approve |
| `deceased_verified` | Family members | Majority consensus |

### Handling Conflicts

When family members disagree on information (e.g., birth year):

1. **Field-level versioning** — Each value tracked with contributor
2. **Endorsement system** — Others can agree/disagree
3. **Consensus display** — Most-endorsed value shown
4. **Disputed flag** — If no consensus, show "Family reports vary"

---

## 3. INVITATION SYSTEM (EMAIL + SMS)

### Multi-Channel Invitations

| Channel | Open Rate | Best For | Service |
|---------|-----------|----------|---------|
| **Email** | 20-25% | Tech-savvy, younger | Supabase/Resend |
| **SMS** | 98% | Everyone, especially 50+ | **Twilio** |
| **WhatsApp** | 95% | International families | Twilio WhatsApp API |

### SMS Implementation (Twilio)

**Why Twilio:**
- Best delivery rates globally
- Supports Russian diaspora countries
- Phone verification built-in
- Good GDPR/TCPA compliance
- Cost: ~$0.008/SMS (US)

**SMS Invitation Message (160 chars max):**
```
Hi [Name]! [Inviter] is building your family tree
on Gene-Tree. Join to share memories:
https://gene.tree/j/abc123
```

**Russian version:**
```
Привет, [Name]! [Inviter] создаёт семейное древо
на Gene-Tree. Присоединяйся:
https://gene.tree/j/abc123
```

### Operational Safeguards (MVP)

- **SMS consent required**: if phone is the only contact, the inviter must explicitly confirm permission to send SMS.
- **Email fallback**: if SMS fails and an email exists, the system sends the email invite instead.
- **Rate limiting**: per-inviter cap enforced (`INVITES_MAX_PER_DAY`, default 25/24h).
- **Audit logging**: successful/failed sends are logged for visibility and compliance.

### Mobile Registration Flow

When recipient taps SMS link on phone:

```
┌─────────────────────────────────────────┐
│ ≡                        Gene-Tree  🌳 │
├─────────────────────────────────────────┤
│                                         │
│      👋 Welcome to the family!          │
│                                         │
│   Peter invited you to join the         │
│   Petrov Family Tree                    │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │   [Mini tree showing where      │  │
│   │    you fit in the family]       │  │
│   └─────────────────────────────────┘  │
│                                         │
│   12 family members already joined      │
│                                         │
│   Your phone: +1 555 123 4567           │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │   [ Send verification code ]    │  │
│   └─────────────────────────────────┘  │
│                                         │
│   Or sign in with:                      │
│   [G Google]  [  Apple]                │
│                                         │
└─────────────────────────────────────────┘
```

**Key UX Principles:**
- Phone number = identity (email optional)
- Pre-fill name from invitation data
- Big buttons for older users
- One-tap social login option
- Show tree preview (social proof)

### Invitation Lifecycle

| Day | Action |
|-----|--------|
| 0 | Invitation sent |
| 3 | Reminder: "Haven't seen your invite? Check spam or try SMS" |
| 7 | "3 relatives waiting for you" |
| 14 | "Invite expires in 16 days. Resend?" |
| 30 | Invitation expires, prompt to resend |

---

## 4. CONTENT SHARING WORKFLOWS

### Audio Stories

**Recording Flow:**
1. User taps "Record Memory" on any profile
2. Records up to 10 minutes (mobile-friendly)
3. Tags people mentioned in the story
4. Story queued for family notification

**Storage:**
- Format: WebM Opus (compressed)
- Limit: 10 min/story (free), 30 min (premium)
- Auto-transcription via Whisper API
- Searchable by transcript content

**Example Use Case:**
> "Yesterday was grandmother's 102nd birthday commemoration. Family recorded memories about her. These audio clips attach to her profile and notify all relatives."

### Photo Push Workflow

**Pushing photos to someone else's profile:**

```
LIVING PERSON:
Photo pushed → Owner notified → Owner approves/rejects → Appears on profile

DECEASED PERSON:
Photo pushed → Family notified → Any close relative approves → Appears on profile
                                 (Children/spouse = 1 approval needed)
                                 (Extended family = 2 approvals needed)
```

**Clear Instructions (Critical UX):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ⏳ PHOTO PENDING APPROVAL                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This photo was shared by Cousin Anna                           │
│                                                                 │
│  [=========PHOTO=========]                                      │
│                                                                 │
│  WHAT HAPPENS NEXT:                                             │
│  ─────────────────────────────────────────────────────────────  │
│  ✓ You'll see this photo here until you decide                  │
│  ✓ It will NOT appear on your profile yet                       │
│  ✓ Only you can approve it                                      │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │  ✓ Approve      │  │  ✗ Reject       │                      │
│  │  Add to profile │  │  Remove         │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. BIRTHDAY & COMMEMORATION SYSTEM

### Living Person Birthday

**7 days before:**
- Notification to family: "Anna's 30th birthday in 7 days"
- Prompt: "Start a group card?"

**On birthday:**
- Pop-up celebration for recipient
- "You received 12 birthday wishes!"
- Birthday wall with all messages

**Congratulation Constructor:**
- Card templates (elegant, age-appropriate)
- Personal message
- Option to attach photo
- Group signing (multiple family members on one card)

### Deceased Person Commemoration

**"Today would have been..."**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        🕯️                                      │
│                                                                 │
│                 In Loving Memory                                │
│                                                                 │
│              MARIA IVANOVNA PETROVA                             │
│                   1922 — 2020                                   │
│                                                                 │
│      Today would have been her 104th birthday                   │
│                                                                 │
│      "She always said family is everything"                     │
│                        — Peter (son)                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [🕯️ Light a candle]  [📝 Share memory]  [📷 Add photo]       │
│                                                                 │
│   5 family members lit candles today                            │
│                                                                 │
│   MEMORIES:                                                     │
│   🎙️ Audio from Anna: "I remember her cookies..."              │
│   📷 Photo from Peter: "Mom at Easter, 1985"                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. SOCIAL FEATURES

### Design Principle

> Social features SERVE the genealogy mission. This is NOT Facebook.

### What We Build

| Feature | Purpose | Priority |
|---------|---------|----------|
| Profile discussions | Comments on photos/stories | HIGH |
| Birthday wishes | Celebration system | HIGH |
| Activity feed | Family updates | MEDIUM |
| Direct messages | 1:1 family chat | MEDIUM |
| Memorial wall | Deceased tributes | MEDIUM |

### What We Avoid

| Anti-Pattern | Why |
|--------------|-----|
| Endless scroll chat | Distracts from tree building |
| "Likes" on everything | Too shallow |
| Public sharing | Privacy violation |
| Real-time presence | Unnecessary complexity |
| Stories (24h disappearing) | We do permanent stories |

### Activity Feed Content

```
TODAY
├── Maria added a photo of Uncle Boris (1967)
├── Your birthday card for Grandma was delivered!
├── Father confirmed his birthplace: Kyiv

THIS WEEK
├── 3 new stories added to the family
├── Aunt Elena joined your family tree

PROMPTS
├── "Your tree is missing 4 grandparents"
├── "Add a story about Grandfather Ivan"
```

---

## 7. TECHNICAL IMPLEMENTATION

### New Database Tables

```sql
-- SMS invitations
ALTER TABLE invitations ADD COLUMN invitee_phone TEXT;
ALTER TABLE invitations ADD COLUMN invite_channel TEXT
  DEFAULT 'email' CHECK (invite_channel IN ('email', 'sms', 'whatsapp', 'link_only'));
ALTER TABLE invitations ADD COLUMN sms_status TEXT;
ALTER TABLE invitations ADD COLUMN sms_provider_id TEXT;

-- Profile verification (deceased)
CREATE TABLE profile_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES user_profiles(id),
  verifier_id UUID NOT NULL REFERENCES auth.users(id),
  confidence TEXT CHECK (confidence IN ('certain', 'probable', 'uncertain')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, verifier_id)
);

-- Birthday wishes
CREATE TABLE birthday_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES user_profiles(id),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  birthday_year INTEGER NOT NULL,
  template TEXT DEFAULT 'classic',
  message TEXT NOT NULL,
  attached_photo_id UUID REFERENCES photos(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memorial candles
CREATE TABLE memorial_candles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deceased_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  lit_by UUID NOT NULL REFERENCES auth.users(id),
  memorial_date DATE NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile discussions
CREATE TABLE profile_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES user_profiles(id),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  parent_id UUID REFERENCES profile_discussions(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Required Services

| Service | Purpose | Cost |
|---------|---------|------|
| **Twilio** | SMS + WhatsApp invitations | ~$0.008/SMS |
| **Twilio Verify** | Phone number verification | ~$0.05/verification |
| **OpenAI Whisper** | Audio transcription | ~$0.006/minute |
| **Resend/Postmark** | Email delivery | ~$0.001/email |

### Environment Variables

```env
# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_WHATSAPP_NUMBER=+1...

# Whisper (for transcription)
OPENAI_API_KEY=sk-...
```

---

## IMPLEMENTATION PRIORITY

| Phase | Features | Timeline |
|-------|----------|----------|
| **1** | SMS invitations (Twilio), mobile registration | Week 1-2 |
| **1** | Empty chair visualization, batch invite flow | Week 2-3 |
| **2** | Deceased verification system (3-person quorum) | Week 4-5 |
| **2** | Photo push workflow with clear approval UX | Week 5-6 |
| **3** | Birthday notifications + congratulation cards | Week 7-8 |
| **3** | Audio stories completion + transcription | Week 8-9 |
| **4** | Activity feed, profile discussions | Week 10-12 |
| **4** | Memorial mode, candle lighting | Week 12+ |

---

## VERIFICATION

**Documents created/updated:**
- `docs/MASTER_PLAN.md` (v1.1)
- `docs/VIRAL_GROWTH_SYSTEM.md` (v1.0)
- `docs/DECISIONS.md` (ADR-002)
- `docs/implementation/invite-delivery.md` (new)
- `docs/_library/API.md` (invite delivery appendix)
- `.env.example` (Twilio/Resend/invite throttling)

---

## NEXT STEPS

Based on the brainstorming, the immediate implementation priorities are:

│ Priority │                    Feature                     │ Effort │
├──────────┼────────────────────────────────────────────────┼────────┤
│ P0       │ SMS invitations (Twilio integration)           │ 1 week │
├──────────┼────────────────────────────────────────────────┼────────┤
│ P0       │ Mobile-optimized registration page             │ 1 week │
├──────────┼────────────────────────────────────────────────┼────────┤
│ P1       │ Empty chair visualization in tree              │ 3 days │
├──────────┼────────────────────────────────────────────────┼────────┤
│ P1       │ Batch invite flow ("Map your family" wizard)   │ 1 week │
├──────────┼────────────────────────────────────────────────┼────────┤
│ P2       │ Deceased verification system (3-person quorum) │ 1 week │
├──────────┼────────────────────────────────────────────────┼────────┤
│ P2       │ Photo approval workflow with clear UX          │ 1 week │
├──────────┼────────────────────────────────────────────────┼────────┤
│ P3       │ Birthday notifications                         │ 3 days │
├──────────┼────────────────────────────────────────────────┼────────┤
│ P3       │ Audio story completion                         │ 1 week │
├──────────┼────────────────────────────────────────────────┼────────┤
└──────────┴────────────────────────────────────────────────┴────────┘

Note on UI: You mentioned being unhappy with current design. A UI overhaul should be planned as a parallel track, but
these features can be built first with improved UX patterns, then reskinned later.
---

## SUCCESS CRITERIA

| Metric | Target |
|--------|--------|
| Invites per new user | 8+ |
| SMS acceptance rate | 45%+ |
| K-factor | >2.0 |
| Deceased profiles verified | 80% within 30 days |
| Birthday card participation | 40%+ of family |
| Audio stories per family | 5+ |

---

*This document expands on the Master Plan. For strategic priorities, see `docs/MASTER_PLAN.md`.*
