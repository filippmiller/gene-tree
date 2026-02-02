# Profile Completion Widget

> **Feature ID:** Sprint2-C1
> **Status:** ✅ Complete
> **Added:** February 2, 2026

## Overview

The Profile Completion Widget is a gamified progress indicator that encourages users to complete their profile. It displays a visual progress ring, lists missing fields with their completion value, and celebrates when users reach 100%.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Page                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              ProfileCompletionWidget                   │  │
│  │  ┌─────────────┐  ┌─────────────────────────────────┐ │  │
│  │  │ ProgressRing│  │  Missing Fields List            │ │  │
│  │  │    75%      │  │  ○ Add Profile Photo (+15%)     │ │  │
│  │  │             │  │  ○ Write Bio (+10%)             │ │  │
│  │  └─────────────┘  │  ○ Add First Story (+5%)        │ │  │
│  │                   └─────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │  completion-calculator │
                 │  (Server-side)         │
                 └────────────────────────┘
```

## Files

### Core Logic

**`src/lib/profile/completion-calculator.ts`**

```typescript
import { calculateProfileCompletion, type CompletionResult } from '@/lib/profile/completion-calculator';

// Usage in server component
const completion = calculateProfileCompletion(profile, locale);
// Returns: { percentage, message, fields, missingFields, completedFields }
```

### Component

**`src/components/dashboard/ProfileCompletionWidget.tsx`**

```typescript
import ProfileCompletionWidget from '@/components/dashboard/ProfileCompletionWidget';

<ProfileCompletionWidget
  completion={completion}
  locale="en"
/>
```

## Field Weights

| Field | Weight | Description |
|-------|--------|-------------|
| `avatar_url` | 15% | Profile photo |
| `bio` | 10% | Short biography |
| `birth_date` | 10% | Date of birth |
| `birth_place` | 10% | Place of birth |
| `occupation` | 5% | Current occupation |
| `current_city` | 5% | Current location |
| `phone` | 5% | Phone number |
| `has_story` | 15% | At least one story written |
| `has_relatives` | 15% | At least one family member added |
| `has_photo_album` | 10% | At least one photo uploaded |

**Total: 100%**

## Completion Messages

The widget displays contextual messages based on completion percentage:

| Percentage | English Message | Russian Message |
|------------|-----------------|-----------------|
| 0-25% | "Let's get started! Add some basic info." | "Давайте начнём! Добавьте базовую информацию." |
| 26-50% | "Good progress! Keep building your profile." | "Хороший прогресс! Продолжайте заполнять профиль." |
| 51-75% | "You're doing great! Almost halfway there." | "Отлично! Вы почти на полпути." |
| 76-99% | "Almost complete! Just a few more details." | "Почти готово! Осталось несколько деталей." |
| 100% | "Your profile is complete!" | "Ваш профиль полностью заполнен!" |

## Visual States

### Incomplete (< 100%)

- Progress ring with percentage
- List of missing fields as clickable cards
- Each card shows field name, description, and weight badge
- Hover effects and navigation arrows

### Complete (100%)

- Celebration animation with pulsing background
- "Profile Complete!" badge
- Sparkles icon
- Decorative gradient blurs

## Integration

### Dashboard Page

```typescript
// src/app/[locale]/(protected)/app/page.tsx
import ProfileCompletionWidget from '@/components/dashboard/ProfileCompletionWidget';
import { calculateProfileCompletion } from '@/lib/profile/completion-calculator';

export default async function DashboardPage({ params }) {
  const profile = await fetchUserProfile();
  const completion = calculateProfileCompletion(profile, params.locale);

  return (
    <div>
      {completion.percentage < 100 && (
        <ProfileCompletionWidget
          completion={completion}
          locale={params.locale}
        />
      )}
    </div>
  );
}
```

## Localization

All strings are embedded in the component with EN/RU support:

```typescript
const translations = {
  en: {
    title: 'Complete Your Profile',
    completeTitle: 'Profile Complete!',
    subtitle: 'Build a richer family story',
    allDone: "You're all set! Your profile helps family members connect with you.",
    tapToComplete: 'Tap to complete',
  },
  ru: {
    title: 'Заполните профиль',
    completeTitle: 'Профиль заполнен!',
    subtitle: 'Создайте более богатую семейную историю',
    allDone: 'Все готово! Ваш профиль помогает родственникам связаться с вами.',
    tapToComplete: 'Нажмите для заполнения',
  },
};
```

## Customization

### Changing Field Weights

Edit `PROFILE_FIELDS` array in `completion-calculator.ts`:

```typescript
const PROFILE_FIELDS: ProfileField[] = [
  {
    id: 'avatar',
    field: 'avatar_url',
    weight: 15, // Change weight here
    label: 'Add Profile Photo',
    labelRu: 'Добавить фото профиля',
    // ...
  },
];
```

### Adding New Fields

1. Add field to `PROFILE_FIELDS` array
2. Implement completion check in `calculateProfileCompletion`
3. Add icon to `iconMap` in widget component
4. Add translations

## Testing

### Manual Testing

1. Create a new user with empty profile
2. Verify widget shows 0% with all fields
3. Complete each field and verify percentage updates
4. Reach 100% and verify celebration state

### Unit Tests

```typescript
// tests/unit/completion-calculator.spec.ts
describe('calculateProfileCompletion', () => {
  it('returns 0% for empty profile', () => {
    const result = calculateProfileCompletion({}, 'en');
    expect(result.percentage).toBe(0);
  });

  it('returns 100% for complete profile', () => {
    const result = calculateProfileCompletion(completeProfile, 'en');
    expect(result.percentage).toBe(100);
  });
});
```

## Performance

- Calculation is server-side (no client computation)
- Component is client component for interactivity
- Progress ring uses CSS animations
- Minimal re-renders with proper memoization

## Accessibility

- Progress ring has ARIA labels
- Cards are keyboard navigable
- Color contrast meets WCAG AA
- Screen reader friendly messages
