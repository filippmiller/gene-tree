# 4-Step Onboarding Wizard

> **Feature ID:** Sprint2-B
> **Status:** ✅ Complete
> **Added:** February 2, 2026

## Overview

The Onboarding Wizard guides new users through initial profile setup and family tree creation in 4 simple steps. It persists progress locally and saves data to the server at each step.

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        New User Signs Up                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │      OnboardingChecker       │
              │   (in protected layout)      │
              │                              │
              │   if (!onboarding_completed) │
              │     redirect to wizard       │
              └──────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /onboarding/wizard                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Step 1    Step 2    Step 3    Step 4                     │  │
│  │  [●]───────[○]───────[○]───────[○]                        │  │
│  │  About You  Parents   Siblings  Invite                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Step Content                           │  │
│  │                                                           │  │
│  │    Step 1: Photo, Name, Birthdate, Gender                │  │
│  │    Step 2: Mother info, Father info                      │  │
│  │    Step 3: Siblings, Spouse                              │  │
│  │    Step 4: Select relative, Send invite                  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [← Back]                          [Skip] [Next →]        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (After Step 4)
              ┌──────────────────────────────┐
              │    POST /api/onboarding/     │
              │        complete              │
              │                              │
              │  • Set onboarding_completed  │
              │  • Clear localStorage        │
              │  • Redirect to /app          │
              └──────────────────────────────┘
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      OnboardingWizard                           │
│                                                                  │
│  State:                                                         │
│  - currentStep: 1-4                                             │
│  - aboutYou: AboutYouData                                       │
│  - parents: ParentsData                                         │
│  - siblings: SiblingsData                                       │
│  - invite: InviteData                                           │
│  - createdRelativeIds: string[]                                 │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │Step1AboutYou│ │Step2Parents │ │Step3Siblings│ │Step4Invite│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
        │                 │                 │                │
        ▼                 ▼                 ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ /api/onboard │ │ /api/onboard │ │ /api/onboard │ │ /api/onboard │
│   /step1     │ │   /step2     │ │   /step3     │ │   /invite    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐ ┌──────────────────────────────────────────────┐
│ user_profiles│ │              pending_relatives               │
└──────────────┘ └──────────────────────────────────────────────┘
```

## Database Schema

### Fields Added to `user_profiles`

```sql
ALTER TABLE user_profiles ADD COLUMN
  onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE user_profiles ADD COLUMN
  onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE user_profiles ADD COLUMN
  onboarding_step INTEGER DEFAULT 1;

CREATE INDEX idx_user_profiles_onboarding
  ON user_profiles(onboarding_completed)
  WHERE onboarding_completed = false;
```

## Files

### State Management

**`src/lib/onboarding/wizard-state.ts`**

```typescript
export interface WizardState {
  currentStep: number;
  aboutYou: AboutYouData;
  parents: ParentsData;
  siblings: SiblingsData;
  invite: InviteData;
  createdRelativeIds: string[];
}

export function loadWizardState(): WizardState;
export function saveWizardState(state: WizardState): void;
export function clearWizardState(): void;
```

### Components

**`src/components/onboarding/OnboardingWizard.tsx`**

Main wizard container with:
- Progress bar
- Step navigation
- Server-side saving
- Error handling
- Animation between steps

**`src/components/onboarding/OnboardingChecker.tsx`**

Client component for redirect logic:
```typescript
'use client';

export default function OnboardingChecker({
  onboardingCompleted,
  children,
}: {
  onboardingCompleted: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!onboardingCompleted && !pathname.includes('/onboarding')) {
      router.push(`/${locale}/onboarding/wizard`);
    }
  }, [onboardingCompleted, pathname]);

  return <>{children}</>;
}
```

### Step Components

**`src/components/onboarding/steps/Step1AboutYou.tsx`**
- Profile photo upload with preview
- First name (required)
- Last name (required)
- Birth date (optional)
- Gender select (optional)

**`src/components/onboarding/steps/Step2Parents.tsx`**
- Mother card (name, birth year, deceased)
- Father card (name, birth year, deceased)
- "Skip/Unknown" option

**`src/components/onboarding/steps/Step3Siblings.tsx`**
- Dynamic sibling list
- Add/remove siblings
- Gender selection
- Optional spouse section

**`src/components/onboarding/steps/Step4Invite.tsx`**
- Dropdown of created relatives
- Email input
- Optional phone
- Send invitation

### API Routes

**`src/app/api/onboarding/step1/route.ts`**

Saves profile info and handles avatar upload.

```typescript
// Request: FormData
// - firstName: string
// - lastName: string
// - birthDate?: string
// - gender?: string
// - avatar?: File
```

**`src/app/api/onboarding/step2/route.ts`**

Creates parent records in `pending_relatives`.

```typescript
// Request: JSON
{
  "mother": {
    "firstName": "Mary",
    "lastName": "Smith",
    "birthYear": "1960",
    "isDeceased": false,
    "skip": false
  },
  "father": {
    "firstName": "John",
    "lastName": "Smith",
    "birthYear": "1958",
    "isDeceased": true,
    "skip": false
  }
}

// Response: JSON
{
  "success": true,
  "createdIds": ["uuid1", "uuid2"]
}
```

**`src/app/api/onboarding/step3/route.ts`**

Creates sibling and spouse records.

```typescript
// Request: JSON
{
  "siblings": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "gender": "female",
      "birthYear": "1992"
    }
  ],
  "spouse": {
    "firstName": "Alex",
    "lastName": "Johnson",
    "marriageYear": "2020"
  }
}
```

**`src/app/api/onboarding/invite/route.ts`**

Sends invitation email.

```typescript
// Request: JSON
{
  "relativeId": "uuid",
  "email": "jane@example.com",
  "phone": "+1234567890"
}
```

**`src/app/api/onboarding/complete/route.ts`**

Marks onboarding as complete.

```typescript
// Request: empty
// Response: { success: true }
```

## Step Details

### Step 1: About You

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Avatar | File | No | Max 5MB, image/* |
| First Name | String | Yes | 1-100 chars |
| Last Name | String | Yes | 1-100 chars |
| Birth Date | Date | No | Valid date, not future |
| Gender | Select | No | male/female/other |

### Step 2: Parents

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Mother First Name | String | No | Can skip |
| Mother Last Name | String | No | Can skip |
| Mother Birth Year | Number | No | 1900-current |
| Mother Deceased | Boolean | No | Default: false |
| Father First Name | String | No | Can skip |
| Father Last Name | String | No | Can skip |
| Father Birth Year | Number | No | 1900-current |
| Father Deceased | Boolean | No | Default: false |

### Step 3: Siblings

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Sibling First Name | String | No | Per sibling |
| Sibling Last Name | String | No | Per sibling |
| Sibling Gender | Select | No | brother/sister |
| Sibling Birth Year | Number | No | 1900-current |
| Spouse First Name | String | No | Optional section |
| Spouse Last Name | String | No | |
| Marriage Year | Number | No | 1900-current |

### Step 4: Invite

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Relative | Select | No | From created relatives |
| Email | Email | No | Valid email format |
| Phone | Phone | No | International format |

## Localization

Translations are embedded in each component:

```typescript
const translations = {
  en: {
    step1: 'About You',
    step2: 'Parents',
    step3: 'Siblings',
    step4: 'Invite',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    finish: 'Finish Setup',
    // ...
  },
  ru: {
    step1: 'О вас',
    step2: 'Родители',
    step3: 'Братья/Сестры',
    step4: 'Приглашение',
    back: 'Назад',
    next: 'Далее',
    skip: 'Пропустить',
    finish: 'Завершить',
    // ...
  },
};
```

## State Persistence

Progress is saved to localStorage:

```typescript
const STORAGE_KEY = 'gene-tree-onboarding';

export function saveWizardState(state: WizardState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function loadWizardState(): WizardState {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return getDefaultState();
}
```

## Skip Behavior

- **Step 1**: Required (name is required)
- **Step 2-3**: Optional (can skip parents/siblings)
- **Step 4**: Optional (can skip invitation)

Skip navigates to next step without saving.

## Pre-filling Existing Data

If user already has profile data (e.g., from OAuth):

```typescript
useEffect(() => {
  const loaded = loadWizardState();

  if (existingProfile) {
    loaded.aboutYou = {
      ...loaded.aboutYou,
      firstName: loaded.aboutYou.firstName || existingProfile.first_name,
      lastName: loaded.aboutYou.lastName || existingProfile.last_name,
      // ...
    };
  }

  setState(loaded);
}, [existingProfile]);
```

## Testing

### Manual Testing Checklist

- [ ] New user is redirected to wizard
- [ ] Progress bar shows current step
- [ ] Can navigate back to previous steps
- [ ] Step 1: Can upload photo
- [ ] Step 1: Name validation works
- [ ] Step 2: Can add parents
- [ ] Step 2: Can mark as deceased
- [ ] Step 2: Can skip parents
- [ ] Step 3: Can add multiple siblings
- [ ] Step 3: Can add spouse
- [ ] Step 4: Dropdown shows created relatives
- [ ] Step 4: Can send invitation
- [ ] Completing wizard redirects to dashboard
- [ ] Progress persists on page refresh
- [ ] Works in both EN and RU

### E2E Tests

```typescript
// tests/e2e/onboarding-wizard.spec.ts
test('complete onboarding flow', async ({ page }) => {
  // Create new user
  await signUpNewUser(page);

  // Should redirect to wizard
  await expect(page).toHaveURL(/onboarding\/wizard/);

  // Step 1
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'User');
  await page.click('text=Next');

  // Step 2
  await page.fill('[name="motherFirstName"]', 'Mary');
  await page.click('text=Next');

  // Step 3
  await page.click('text=Skip');

  // Step 4
  await page.click('text=Finish Setup');

  // Should redirect to dashboard
  await expect(page).toHaveURL(/\/app/);
});
```

## Error Handling

```typescript
try {
  const response = await fetch('/api/onboarding/step1', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to save profile');
  }

  goToStep(state.currentStep + 1);
} catch (err) {
  console.error('Error saving step:', err);
  setError(t.errorSaving);
}
```

Error messages are displayed in a banner above navigation buttons.

## Future Improvements

1. **Photo cropping** - Allow cropping uploaded photos
2. **Import from social** - Import profile photo from OAuth
3. **GEDCOM import** - Import existing family tree
4. **Smart suggestions** - Suggest relatives based on common surnames
5. **Progress email** - Send email reminder if wizard abandoned
6. **A/B testing** - Test different step orders
