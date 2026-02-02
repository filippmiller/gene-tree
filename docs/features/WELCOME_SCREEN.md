# Welcome Screen for Invited Users

> **Feature ID:** Sprint3-A1
> **Status:** Complete
> **Added:** February 2, 2026

## Overview

The Welcome Screen is a beautifully animated landing experience for users who receive an invitation to join a family tree. It displays the inviter's name, the relationship context, family statistics (members, generations, stories), and provides clear actions to accept or dispute the invitation.

The flow is designed to create emotional connection by showing the family's existing activity and making the invitation feel personal and meaningful.

## Architecture

```
+------------------------------------------------------------------+
|                         InviteFlow                                |
|                  (State machine controller)                       |
|                                                                   |
|   +----------------------------------------------------------+   |
|   |                    WelcomeScreen                          |   |
|   |   +--------------------------------------------------+   |   |
|   |   |              TreeIllustration                     |   |   |
|   |   |   - Animated tree with CSS transitions           |   |   |
|   |   |   - 6 decorative nodes (family members)          |   |   |
|   |   |   - SVG connection lines                         |   |   |
|   |   +--------------------------------------------------+   |   |
|   |                                                           |   |
|   |   +--------------------------------------------------+   |   |
|   |   |              Invitation Message                   |   |   |
|   |   |   - "{inviter} invited you..."                   |   |   |
|   |   |   - "as their {relationship}"                    |   |   |
|   |   +--------------------------------------------------+   |   |
|   |                                                           |   |
|   |   +--------------------------------------------------+   |   |
|   |   |              Family Stats Grid                    |   |   |
|   |   |   [Members]  |  [Generations]  |  [Stories]      |   |   |
|   |   +--------------------------------------------------+   |   |
|   |                                                           |   |
|   |   +--------------------------------------------------+   |   |
|   |   |              Action Buttons                       |   |   |
|   |   |   [Accept Invitation]  [Not me? Let us know]     |   |   |
|   |   +--------------------------------------------------+   |   |
|   +----------------------------------------------------------+   |
|                              |                                    |
|                              v                                    |
|   +----------------------------------------------------------+   |
|   |              ClaimVerificationForm                        |   |
|   |   (Triggered on Accept or Dispute)                       |   |
|   +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

## User Flow

```
                    Invitation Link
                         |
                         v
               +------------------+
               |  WelcomeScreen   |
               |                  |
               |  - See inviter   |
               |  - See family    |
               |  - See stats     |
               +--------+---------+
                        |
          +-------------+-------------+
          |                           |
          v                           v
   [Accept Invitation]          [Not Me?]
          |                           |
          v                           v
   +------+------+            +-------+-------+
   |ClaimVerify  |            |ClaimVerify    |
   |(view mode)  |            |(dispute mode) |
   +-------------+            +---------------+
```

## Files

### Components

| File | Purpose |
|------|---------|
| `src/components/invite/WelcomeScreen.tsx` | Main welcome screen component with animations |
| `src/components/invite/InviteFlow.tsx` | State machine managing the flow between screens |
| `src/components/invite/ClaimVerificationForm.tsx` | Form for verifying identity or disputing |

### Supporting Files

| File | Purpose |
|------|---------|
| `src/lib/invitations/family-stats.ts` | Type definitions for FamilyStats |

## Component Props

### WelcomeScreen

```typescript
interface WelcomeScreenProps {
  inviterName: string;           // Name of person who sent invitation
  inviteeName: string;           // Name of the invited person
  relationshipType: string;      // e.g., 'parent', 'child', 'spouse'
  familyStats: FamilyStats;      // { memberCount, generationCount, storyCount }
  locale: string;                // 'en' or 'ru'
  onAccept: () => void;          // Called when user accepts invitation
  onNotMe: () => void;           // Called when user disputes identity
}
```

### InviteFlow

```typescript
interface InviteFlowProps {
  invitation: PendingRelative;   // Full invitation data with token
  inviterName: string;           // Inviter's display name
  familyStats: FamilyStats;      // Family statistics
  locale: string;                // Current locale
}
```

### FamilyStats

```typescript
interface FamilyStats {
  memberCount: number;           // Total family members
  generationCount: number;       // Number of generations
  storyCount: number;            // Number of shared stories
}
```

## Features

### Animated Tree Illustration

- Emerald gradient circular background with glow effect
- Central tree icon with drop shadow
- 6 decorative nodes positioned radially (representing family members)
- SVG connection lines with animated stroke-dasharray
- Staggered animation delays for smooth entrance

### Stats Display

- Three-column grid with dividers
- Icons for each stat (Users, Layers, BookOpen)
- Animated entrance with staggered delays
- Responsive text sizing

### Relationship Mapping

The relationship type is inverted from the inviter's perspective to the invitee's perspective:

| Inviter Added As | Shows To Invitee As |
|------------------|---------------------|
| parent | Child |
| child | Parent |
| spouse | Spouse |
| sibling | Sibling |
| grandparent | Grandchild |
| grandchild | Grandparent |
| aunt_uncle | Niece/Nephew |
| niece_nephew | Aunt/Uncle |
| cousin | Cousin |

## Localization

### English

```typescript
const en = {
  invitedYou: '{inviter} invited you to join their family tree',
  asRelationship: 'as their {relationship}',
  joinFamily: 'Join a family of {count} members',
  acrossGenerations: 'across {count} generations',
  storiesShared: '{count} stories shared',
  acceptInvitation: 'Accept Invitation',
  notMe: 'Not {name}? Let us know',
  yourFamilyAwaits: 'Your family story awaits',
  preserveMemories: 'Preserve memories, connect across generations, and build your legacy together.',
  members: 'Members',
  generations: 'Generations',
  stories: 'Stories',
};
```

### Russian

```typescript
const ru = {
  invitedYou: '{inviter} пригласил(а) вас в семейное древо',
  asRelationship: 'как {relationship}',
  joinFamily: 'Присоединяйтесь к семье из {count} человек',
  acrossGenerations: '{count} поколений',
  storiesShared: '{count} историй',
  acceptInvitation: 'Принять приглашение',
  notMe: 'Не {name}? Сообщите нам',
  yourFamilyAwaits: 'Ваша семейная история ждет',
  preserveMemories: 'Сохраняйте воспоминания, объединяйтесь поколениями и создавайте наследие вместе.',
  members: 'Членов',
  generations: 'Поколений',
  stories: 'Историй',
};
```

## Animation Timing

| Element | Duration | Delay | Effect |
|---------|----------|-------|--------|
| Card container | 600ms | 0ms | Fade + slide up |
| Tree illustration | 700ms | 100ms | Scale + rotate |
| Decorative nodes | 500ms | 400-880ms | Scale + translate |
| Connection lines | 500ms | 200-450ms | Stroke dashoffset |
| Invitation text | 500ms | 300-400ms | Fade |
| Stats container | 500ms | 500ms | Fade + scale |
| Stat items | 500ms | 600-800ms | Fade + slide up |
| Tagline | 500ms | 900ms | Fade |
| CTA buttons | 500ms | 1000ms | Fade + slide up |
| Branding | 500ms | 1200ms | Fade |

## Visual Design

### Colors

- Primary gradient: `from-emerald-500 via-teal-500 to-emerald-600`
- Background: `from-slate-50 via-white to-emerald-50/30` (light) / `from-slate-900 via-slate-900 to-emerald-950/30` (dark)
- Decorative nodes: White with 80% opacity
- Connection lines: White with 30% opacity

### Components Used

- `GlassCard` with frosted glass effect
- `Button` with gradient variant
- Lucide icons: Trees, Users, BookOpen, Layers, ArrowRight, AlertCircle

## Testing Checklist

### Visual Testing

- [ ] Tree animation plays smoothly on page load
- [ ] All 6 decorative nodes appear with staggered timing
- [ ] Connection lines animate from center outward
- [ ] Stats display correctly formatted numbers
- [ ] Dark mode colors are correct
- [ ] Mobile layout is responsive

### Functional Testing

- [ ] Accept button triggers onAccept callback
- [ ] Not me link triggers onNotMe callback
- [ ] Loading state shows on Accept button during transition
- [ ] Back button from verification returns to welcome screen
- [ ] Locale changes update all text correctly

### Edge Cases

- [ ] Very long inviter names truncate properly
- [ ] Zero stats display correctly
- [ ] Missing relationship type falls back gracefully
- [ ] Deep linking with invalid token shows error

## Future Improvements

1. **Personalized Preview** - Show inviter's avatar or family photo
2. **Recent Activity Feed** - Display recent stories or additions
3. **Video Message** - Allow inviter to record a personal welcome
4. **Social Proof** - "X people joined this family tree this month"
5. **Celebration Animation** - Confetti on successful acceptance
6. **Progress Indicator** - Show steps remaining in onboarding
7. **Quick Profile Setup** - Pre-fill invitee info from invitation data
