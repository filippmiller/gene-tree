# Session 2: Complete the Guided Onboarding Wizard

**Master Plan Item:** #3 — HIGH impact, MEDIUM effort
**Goal:** Polish and complete the "First Five Minutes" onboarding experience so new users add 5+ family members immediately after signup.

---

## Context

The onboarding wizard has a 4-step UI and API routes, but needs polish, gap-filling, and flow optimization. This is critical for the viral growth engine — every user who completes onboarding creates 5+ placeholder profiles that become future invitations.

## Current State

### Wizard Components
| File | Purpose |
|------|---------|
| `src/components/onboarding/OnboardingWizard.tsx` | Main 4-step wizard with animation, progress bar |
| `src/components/onboarding/steps/Step1AboutYou.tsx` | Profile: name, birth date, gender, avatar |
| `src/components/onboarding/steps/Step2Parents.tsx` | Parents: mother + father (optional skip) |
| `src/components/onboarding/steps/Step3Siblings.tsx` | Siblings + spouse (variable count) |
| `src/components/onboarding/steps/Step4Invite.tsx` | Send invite to one relative |
| `src/lib/onboarding/wizard-state.ts` | localStorage persistence |

### API Routes
| Endpoint | Purpose |
|----------|---------|
| `POST /api/onboarding/step1` | Save profile + avatar upload (FormData) |
| `POST /api/onboarding/step2` | Create parents as pending_relatives, returns `createdIds` |
| `POST /api/onboarding/step3` | Create siblings as pending_relatives, returns `createdIds` |
| `POST /api/onboarding/invite` | Send email invite to selected relative |
| `POST /api/onboarding/complete` | Mark onboarding done, set `onboarding_completed=true` |

### Database Schema (migration: 20260202300003)
- `onboarding_completed` BOOLEAN on user_profiles
- `onboarding_completed_at` TIMESTAMPTZ
- `onboarding_step` INTEGER (0-4)
- Index on `onboarding_completed`

### Wizard State Shape
```typescript
interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  aboutYou: { firstName, lastName, birthDate?, gender?, avatarPreview?, avatarFile? };
  parents: { mother: ParentData, father: ParentData };
  siblings: { siblings: SiblingData[], spouse?: SpouseData };
  invite: { relativeId?, email?, message? };
  step2CreatedIds: string[];
  step3CreatedIds: string[];
}
```

### Pages
- `/[locale]/(protected)/onboarding/wizard/page.tsx` — renders OnboardingWizard
- `/[locale]/(protected)/onboarding/invites/page.tsx` — manage pending invites

---

## What to Implement

### 1. Review and Fix All Steps
Read each step component and its corresponding API route. Fix any issues:
- **Step1**: Verify avatar upload works, error handling is complete
- **Step2**: Verify parent creation works, duplicate prevention
- **Step3**: Verify sibling + spouse creation, variable-count form works
- **Step4**: Verify invite sending works, email validation

### 2. Add "Grandparents" Step (Step 2b)
After parents, add an optional step to add grandparents. This pushes the "5 family members" goal further:
- Show maternal grandmother/grandfather, paternal grandmother/grandfather
- Pre-fill relationship context (e.g., "Your mother's parents")
- Use same `POST /api/relatives` endpoint with `isDirect: false, relatedToUserId: <parent_id>`
- Skip button available

### 3. Progress Motivation
The wizard should show encouraging progress:
- "3 of 5 family members added" with a progress ring
- Celebrate milestones (confetti or subtle animation at 5)
- Show the tree growing in a mini-preview

### 4. Post-Onboarding Redirect
After completing onboarding:
- Redirect to `/tree/{user_id}` (not dashboard)
- Show the tree with all added family members
- Display a "Your tree is growing!" message

### 5. Auto-Redirect New Users
Ensure new users who haven't completed onboarding get redirected:
- Check `onboarding_completed` in the layout or middleware
- If false, redirect to `/onboarding/wizard`
- Allow manual skip with a "Skip for now" link

### 6. Move Translations to common.json
Currently onboarding strings are hardcoded in components. Move them to `src/messages/en/common.json` and `src/messages/ru/common.json` under an `"onboarding"` namespace:
```json
"onboarding": {
  "stepAboutYou": "About You",
  "stepParents": "Your Parents",
  "stepGrandparents": "Grandparents",
  "stepSiblings": "Siblings & Spouse",
  "stepInvite": "Invite Family",
  "progressLabel": "{count} of {goal} family members",
  "skip": "Skip for now",
  "next": "Continue",
  "back": "Back",
  "complete": "View Your Tree",
  "grandmotherMaternal": "Maternal Grandmother",
  "grandfatherMaternal": "Maternal Grandfather",
  "grandmotherPaternal": "Paternal Grandmother",
  "grandfatherPaternal": "Paternal Grandfather"
}
```
Plus Russian equivalents.

### 7. Mobile Optimization
The wizard must work great on phones (primary signup channel for diaspora):
- Large touch targets
- Single-column layout
- Avatar upload from camera
- Minimal scrolling per step

---

## Quality Bar

- Build passes (`npx next build`)
- New user signup -> onboarding wizard -> tree view flow works end-to-end
- All 4 (or 5) steps work correctly
- Progress tracking shows accurate count
- Works in both EN and RU
- Mobile-friendly
- localStorage persistence survives page refresh mid-wizard

---

## Test Credentials
- Email: filippmiller@gmail.com
- Password: Airbus380+
- Production: https://gene-tree-production.up.railway.app/

## Database
- Supabase project: axbotjtdnbefhfpgemex
- Push migrations: `npx supabase db push --password P6CQoeMfPyrdwQvc`
- Regen types: `npx supabase gen types typescript --linked > src/lib/types/supabase.ts` (remove first line)
