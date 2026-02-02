# Gene-Tree Feature Brainstorm Results

> **Date:** 2026-02-02
> **Participants:** 10-member virtual team (40 iterations)
> **Based on:** Competitor research + Gene-Tree system analysis

---

## Executive Summary

A 40-iteration brainstorming session identified **17 high-priority features** across 4 categories:
1. **Invite Flow Safety** - Critical bug fixes and error handling
2. **Onboarding & Activation** - First-time user experience
3. **Content Engagement** - User activation and retention
4. **Growth & Differentiation** - Viral features and unique value

**Key Finding:** The #1 priority is fixing edge cases in the invitation flow where users try to invite someone already in the family tree.

---

## Critical Edge Cases Identified

### Problem 1: Duplicate Invite Attempts

**Scenario:** User B tries to invite someone (cousin@email.com) who is already a family member through User A.

**Current Behavior:** No detection, confusing experience

**Required Fix: Smart Invite Guard**
```
Before sending any invitation:
1. Check if email/phone exists in family circle → Show profile
2. Check if pending invitation exists → Show who sent it
3. Check if user exists outside family → Offer Bridge Request
4. Only if all clear → Allow new invite
```

### Problem 2: Duplicate Deceased Profiles

**Scenario:** User A creates "Grandma Maria" (deceased). User B, not knowing, creates "Grandmother Maria Ivanovna" for the same person.

**Required Fix: Fuzzy Matching Detection**
- Compare name variants (Maria = Мария = Mary)
- Check overlapping birth/death year ranges
- Check relationships to common family members
- Prompt: "We found a similar person. Is this the same?" → Merge or keep separate

### Problem 3: Wrong Person Claims Invite

**Scenario:** Invite forwarded to wrong person, they claim the profile.

**Required Fix: Claim Verification Flow**
- Show placeholder info during claim
- Ask: "Is this information correct?"
- Allow corrections with inviter notification
- Option: "This isn't me" → Contact inviter

---

## Feature Priorities by Sprint

### SPRINT 1: Critical Safety (This Week)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | **Smart Invite Guard** | 1 day | Prevents confusion |
| 2 | **Pending Invite Detection** | 2 hrs | Avoids duplicates |
| 3 | **Self-Invite Prevention** | 1 hr | Bug fix |
| 4 | **Claim Verification Flow** | 3 days | Data integrity |

**Technical Spec:**
```typescript
// New API: POST /api/invitations/check
interface InviteCheckResult {
  status: 'OK_TO_INVITE' | 'EXISTING_MEMBER' | 'PENDING_INVITE' | 'POTENTIAL_BRIDGE';
  profile?: UserProfile;  // If existing member
  invitation?: Invitation; // If pending
  bridgeCandidate?: UserProfile; // If potential bridge
}
```

### SPRINT 2: Onboarding (Week 2)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 5 | **4-Step Onboarding Wizard** | 4 days | +30% completion |
| 6 | **Welcome Screen (Invited)** | 2 days | Better first impression |
| 7 | **Profile Completion Widget** | 1 day | Drives completion |

**Onboarding Wizard Flow:**
1. "Tell us about yourself" (name, birth date, photo) - 30 sec
2. "Add your parents" (2 cards: Mother/Father) - 60 sec
3. "Add siblings or spouse" (quick add) - 60 sec
4. "Invite one family member" (pre-filled) - 60 sec

**Result:** User has complete profile + 2-4 placeholders + 1 invite sent in 4 minutes

### SPRINT 3: Engagement (Week 3)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 8 | **Memory Prompts** | 3 days | +50% stories |
| 9 | **Quick Voice Memory** | 2 days | Lower barrier |
| 10 | **Dashboard Widget Toggles** | 1 day | Personalization |

**Memory Prompts Examples:**
- "What's your first memory of [child name]?"
- "What did grandma always cook for you?"
- "What's the funniest thing you did together as kids?"
- Seasonal: "How did your family celebrate New Year's?"

**Quick Voice Memory:**
- Single "Record" button
- Max 60 seconds
- No editing needed
- Auto-attached to relevant profile

### SPRINT 4-5: Growth (Weeks 4-5)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 11 | **Quick Invite Link + QR** | 1 week | Bulk growth |
| 12 | **Family Bridge Requests** | 1 week | Branch merging |
| 13 | **Duplicate Deceased Detection** | 1 week | Data quality |

**Quick Invite Link (Reunion Mode MVP):**
```
1. User generates shareable link (expires in 24h)
2. Shares via WhatsApp/text/QR code
3. Anyone with link signs up
4. Creator approves each person
5. Tree expands rapidly at family events!
```

**Family Bridge Requests:**
When User B discovers someone exists in tree but isn't connected:
1. Send "Bridge Request" with relationship explanation
2. Both parties verify
3. Branches merge with celebration notification

### SPRINT 6-8: Differentiation (Weeks 6-8)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 14 | **Name Variants (AKA)** | 1 week | Diaspora support |
| 15 | **Cultural Story Kits** | 1 week | Unique value |
| 16 | **Family Health Score** | 3 days | Engagement |
| 17 | **Weekly Digest Emails** | 3 days | Retention |

**Name Variants System:**
```sql
CREATE TABLE profile_name_variants (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id),
  name_type TEXT CHECK (name_type IN ('legal', 'maiden', 'nickname', 'transliteration')),
  first_name TEXT,
  last_name TEXT,
  script TEXT CHECK (script IN ('latin', 'cyrillic', 'hebrew'))
);
```

**Cultural Story Kits:**
- Russian Heritage Kit (5 prompts about Soviet era, emigration)
- Jewish Heritage Kit (5 prompts about traditions, immigration)
- General Heritage Kit (childhood, family traditions)

---

## User Personas Identified

| Persona | Description | Key Features |
|---------|-------------|--------------|
| **The Organizer** | Creates tree, invites everyone | Quick Invite Link, Family Health Score |
| **The Invited** | Joins passively via invite | Welcome screen, Onboarding wizard |
| **The Storyteller** | Loves sharing memories | Voice notes, Story prompts |
| **The Archivist** | Cares about accuracy | Duplicate detection, Merge tools |
| **The Diaspora Bridge** | Connects family across countries | Name variants, Multi-language |

---

## Error Messages Improvement

### Current (Vague)
- "Error: Could not send invitation"
- "Something went wrong"

### Proposed (Helpful)

**Existing Member:**
> "Good news! Maria Miller is already in your family tree. She was added by Cousin Anna on Jan 15. [View Profile] [See How You're Related]"

**Pending Invite:**
> "Aunt Lisa was already invited by Uncle Peter on Jan 20. Would you like to send a reminder? [Remind Them] [Cancel]"

**Potential Bridge:**
> "Someone with this email exists in the Gene-Tree network, but you're not connected yet. Would you like to send a connection request? [Send Request] [Cancel]"

**Self-Invite:**
> "You cannot invite yourself. Looking for someone with the same email? [Contact Support]"

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Invite Guard catches | N/A | 20%+ of attempts | Week 1 |
| Onboarding completion | ~40% | 70%+ | Week 2 |
| Stories per family | ~3 | 8+ | Month 1 |
| K-factor (viral) | ~1.0 | 2.0+ | Month 2 |
| Profile completion | ~50% | 80%+ | Month 2 |

---

## Implementation Order

```
Week 1: Critical Safety
├── Smart Invite Guard
├── Pending Invite Detection
├── Self-Invite Prevention
└── Claim Verification

Week 2: Onboarding
├── 4-Step Wizard
├── Welcome Screen
└── Profile Completion Widget

Week 3: Engagement
├── Memory Prompts (20)
├── Quick Voice Memory
└── Dashboard Widgets

Week 4-5: Growth
├── Quick Invite Link + QR
├── Family Bridge Requests
└── Duplicate Detection

Week 6-8: Differentiation
├── Name Variants
├── Cultural Kits
├── Health Score
└── Weekly Digest
```

---

## FUTURE SPRINT: Real-Time Social Features

### Feature 18: Online Presence Indicators
**Added:** 2026-02-02 (User request)

**Concept:**
- Show when family members are currently online on the site
- Green dot indicator on profile avatars
- "Last seen" timestamp for offline users
- Privacy toggle: "Show my online status" (opt-in)

**Technical Approach:**
```typescript
// Supabase Realtime Presence
const channel = supabase.channel('online-users')
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({ user_id: user.id, online_at: new Date() })
  }
})
```

### Feature 19: Internal Family Messaging
**Added:** 2026-02-02 (User request)

**Concept:**
- Private messaging between connected family members
- Inbox with unread count badge
- Thread-based conversations
- Real-time message delivery via Supabase Realtime
- Push notifications for new messages

**Database Schema:**
```sql
CREATE TABLE family_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id),
  thread_id UUID, -- For grouping conversations
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_to_user ON family_messages(to_user_id, read_at);
CREATE INDEX idx_messages_thread ON family_messages(thread_id, created_at);
```

**Privacy Controls:**
- Only message verified connections
- Block/mute specific users
- Delete conversation history

**Estimated Effort:** 1-2 weeks (Sprint 9-10)

---

## NOT Implementing (Per Requirements)

- DNA Testing integration
- Historical records search
- GEDCOM import (future phase)

---

## Next Steps

1. **Immediately:** Implement Smart Invite Guard (Sprint 1, Item 1)
2. **This Week:** Complete Sprint 1 safety fixes
3. **Review:** Weekly progress against metrics
4. **Iterate:** Adjust priorities based on user feedback

---

## Team Acknowledgments

This brainstorm synthesized input from:
- Product Lead (Alex) - Prioritization
- UX Designer (Maria) - User flows
- Senior Engineer (Dev) - Technical specs
- Growth Hacker (Sara) - Viral mechanics
- Russian Market (Viktor) - Cultural needs
- Community Manager (Nina) - Engagement
- Data Analyst (Tom) - Metrics
- QA Lead (Lisa) - Edge cases
- Frontend Dev (Chen) - Implementation
- Content Strategist (Emma) - Content features
