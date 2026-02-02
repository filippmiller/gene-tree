# Session Notes: Honor Tags & Personal Credo Implementation

**Date:** February 2, 2026
**Status:** Complete - Build passing, migrations applied
**Next Agent:** Can continue with frontend integration, testing, or UI refinements

---

## 1. Features Implemented

### A. Honor Tags (Теги Почёта)

A dignified, memorial-appropriate tagging system for marking special life statuses on profiles. Designed specifically for genealogy context, NOT gamification badges.

**Core Concept:**
- Commemorative tags like "Блокадник" (Siege Survivor), "Ветеран ВОВ" (WWII Veteran), "Ветеран Труда" (Labor Veteran)
- Can be assigned by profile owner OR by family members on deceased profiles
- Three-tier verification system for credibility

**Categories (7 total):**
1. `military_wwii` - WWII-specific honors (10 tags)
2. `military_other` - Other military service (6 tags)
3. `civil_honors` - Civil achievements (6 tags)
4. `labor` - Work/labor honors (6 tags)
5. `family` - Family role recognitions (8 tags)
6. `persecution` - Historical persecution survivors (6 tags)
7. `academic` - Educational achievements (5 tags)

**Verification Levels:**
1. `self_declared` - Added by user, no verification (gray indicator)
2. `family_verified` - 3+ family members confirmed (blue indicator)
3. `documented` - Supporting document uploaded (gold indicator)

### B. Personal Credo (Личное Кредо)

A short personal statement system similar to social media bios, with special memorial mode for deceased profiles.

**Fields:**
1. **Life Motto** (150 chars max) - Short inspirational phrase
2. **Personal Statement** (500 chars max) - Longer description of values/philosophy
3. **Memorial Quote** (for deceased profiles only) - Quote added by family members

**Privacy Controls:**
- Each field has separate privacy: `public`, `family`, `private`
- Memorial quotes visible to all (no privacy setting)

---

## 2. Database Schema

### New Tables

```sql
-- Master list of available honor tags
honor_tags (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,           -- 'siege_survivor', 'wwii_veteran', etc.
  name TEXT,                  -- English name
  name_ru TEXT,               -- Russian name
  description TEXT,
  description_ru TEXT,
  category honor_tag_category,
  icon TEXT,                  -- Lucide icon name
  color TEXT,                 -- Hex color
  background_color TEXT,
  is_official BOOLEAN,
  requires_verification BOOLEAN,
  created_at TIMESTAMPTZ
)

-- Profile-to-tag assignments
profile_honor_tags (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id),
  honor_tag_id UUID REFERENCES honor_tags(id),
  verification_level verification_level,
  verified_by UUID[],         -- Array of verifier IDs
  document_url TEXT,          -- For 'documented' level
  notes TEXT,
  display_order INTEGER,
  is_featured BOOLEAN,
  added_by UUID,
  added_at TIMESTAMPTZ,
  UNIQUE(profile_id, honor_tag_id)
)

-- Individual verifications
honor_tag_verifications (
  id UUID PRIMARY KEY,
  profile_honor_tag_id UUID REFERENCES profile_honor_tags(id),
  verifier_id UUID,
  verified BOOLEAN,
  comment TEXT,
  created_at TIMESTAMPTZ,
  UNIQUE(profile_honor_tag_id, verifier_id)
)
```

### Extended user_profiles

```sql
ALTER TABLE user_profiles ADD COLUMN
  life_motto TEXT,
  life_motto_privacy privacy_setting DEFAULT 'family',
  personal_statement TEXT,
  personal_statement_privacy privacy_setting DEFAULT 'family',
  memorial_quote TEXT,
  memorial_quote_author UUID,
  memorial_quote_added_at TIMESTAMPTZ;
```

### Enums

```sql
CREATE TYPE honor_tag_category AS ENUM (
  'military_wwii', 'military_other', 'civil_honors',
  'labor', 'family', 'persecution', 'academic', 'custom'
);

CREATE TYPE verification_level AS ENUM (
  'self_declared', 'family_verified', 'documented'
);
```

---

## 3. API Endpoints

### Honor Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/honor-tags` | List all available honor tags |
| GET | `/api/honor-tags/categories` | List categories with counts |
| GET | `/api/profiles/[id]/honor-tags` | Get tags for a profile |
| POST | `/api/profiles/[id]/honor-tags` | Add tag to profile |
| PATCH | `/api/profiles/[id]/honor-tags/[tagId]` | Update tag (featured, order) |
| DELETE | `/api/profiles/[id]/honor-tags/[tagId]` | Remove tag from profile |
| GET | `/api/profiles/[id]/honor-tags/[tagId]/verify` | Get verification status |
| POST | `/api/profiles/[id]/honor-tags/[tagId]/verify` | Submit verification |

### Personal Credo

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles/[id]/credo` | Get life motto, statement, memorial |
| PATCH | `/api/profiles/[id]/credo` | Update credo fields |

---

## 4. Files Created

### API Routes
```
src/app/api/honor-tags/
├── route.ts                           # GET all tags
└── categories/
    └── route.ts                       # GET categories

src/app/api/profiles/[id]/honor-tags/
├── route.ts                           # GET/POST profile tags
└── [tagId]/
    ├── route.ts                       # PATCH/DELETE tag
    └── verify/
        └── route.ts                   # GET/POST verification

src/app/api/profiles/[id]/credo/
└── route.ts                           # GET/PATCH credo
```

### Components
```
src/components/honor-tags/
├── HonorTag.tsx                       # Single tag display
├── HonorTagsSection.tsx               # Section for profile page
└── HonorTagSelector.tsx               # Modal for adding tags

src/components/profile/
└── PersonalCredo.tsx                  # Life motto & statement display/edit
```

### Types
```
src/types/honor-tags.ts                # TypeScript interfaces & metadata
```

### Hooks
```
src/hooks/useHonorTags.ts              # useHonorTags, useCredo hooks
```

### Migrations
```
supabase/migrations/
├── 20260202000000_honor_tags_and_credo.sql    # Schema
└── 20260202000001_seed_honor_tags.sql         # 50+ pre-seeded tags
```

### Documentation
```
docs/analysis/BRAINSTORM_HONOR_TAGS_AND_CREDO.md   # 30-iteration design brainstorm
```

---

## 5. How Users Interact

### Adding Honor Tags to Own Profile

1. User navigates to their profile
2. Finds "Honor Tags" section (or equivalent UI component)
3. Clicks "Add Honor Tag"
4. Modal opens with searchable/filterable list by category
5. User selects tag → saves with `self_declared` status
6. Tag appears on profile with gray verification indicator

### Family Verifying Tags

1. Family member views relative's profile
2. Sees honor tag with option to "Verify"
3. Clicks verify → confirms or denies (can add comment)
4. After 3+ positive verifications → auto-upgrades to `family_verified`
5. Badge indicator changes to blue checkmark

### Adding Tags to Deceased Relatives

1. Family member views deceased relative's profile
2. Can add honor tags on behalf of deceased
3. Tags start as `self_declared`, others can verify

### Document Verification (for `documented` level)

1. Profile owner/family uploads supporting document
2. Tag upgrades to `documented` level (gold star indicator)
3. Most credible verification status

### Personal Credo

1. User visits profile settings or directly on profile page
2. Fills in Life Motto (150 chars) and/or Personal Statement (500 chars)
3. Sets privacy for each field
4. For deceased profiles: family can add Memorial Quote

---

## 6. How to Test

### Database Verification

```sql
-- Check tables exist
SELECT * FROM honor_tags LIMIT 5;
SELECT * FROM profile_honor_tags LIMIT 5;
SELECT * FROM honor_tag_verifications LIMIT 5;

-- Check credo fields on profiles
SELECT id, life_motto, personal_statement, memorial_quote
FROM user_profiles LIMIT 5;
```

### API Testing (curl/Postman)

```bash
# Get all honor tags
GET /api/honor-tags

# Get categories
GET /api/honor-tags/categories

# Add tag to profile (requires auth)
POST /api/profiles/{profileId}/honor-tags
Body: { "honor_tag_id": "uuid-of-tag", "notes": "optional note" }

# Update credo (requires auth)
PATCH /api/profiles/{profileId}/credo
Body: {
  "life_motto": "Live and let live",
  "life_motto_privacy": "public"
}

# Verify a tag
POST /api/profiles/{profileId}/honor-tags/{tagId}/verify
Body: { "verified": true, "comment": "I can confirm this" }
```

### Frontend Testing

1. Import `HonorTagsSection` into profile page
2. Pass `profileId` and optionally `editable={true}`
3. Test adding, viewing, deleting tags
4. Test verification flow from another user account

---

## 7. Known Limitations / Future Work

1. **Type Generation:** New tables use `as any` type assertions because Supabase type generation requires account permissions we don't have. Regenerate types when possible:
   ```bash
   npx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts
   ```

2. **Document Upload:** The `document_url` field exists but document upload UI is not implemented. Would need Supabase Storage integration.

3. **RLS Policies:** Basic RLS is in place but may need refinement for complex family permission scenarios.

4. **Admin Interface:** No admin UI for managing the master honor_tags list. Current tags are seeded via migration.

5. **Search/Filter:** The `HonorTagSelector` has basic filtering by category. Full-text search could be enhanced.

6. **Localization:** Russian translations (`name_ru`, `description_ru`) exist for all seeded tags. UI components use `next-intl` for switching.

---

## 8. Pre-seeded Honor Tags (50+)

### Military WWII (10)
- WWII Veteran, WWII Combat Veteran, WWII Rear Veteran
- Siege of Leningrad Survivor, Siege of Leningrad Child
- Partisan Fighter, Concentration Camp Survivor
- Home Front Worker, Occupation Survivor, Hero of Soviet Union

### Military Other (6)
- Military Veteran, Combat Veteran, Career Officer
- Naval Veteran, Air Force Veteran, Military Medic

### Civil Honors (6)
- Hero of Labor, State Award Recipient, Cultural Figure
- Public Service Honor, Humanitarian Award, Lifetime Achievement

### Labor (6)
- Labor Veteran, Honored Worker, Industry Pioneer
- Agricultural Veteran, Medical Worker, Educator

### Family (8)
- Family Matriarch, Family Patriarch, Family Historian
- Caregiver, Large Family Parent, Multiple Generations
- Last of Line, Family Founder

### Persecution (6)
- Political Persecution Survivor, Gulag Survivor
- Religious Persecution Survivor, Ethnic Persecution Survivor
- Forced Migration Survivor, Rehabilitation Recognized

### Academic (5)
- Honored Scientist, Academic Degree Holder, Professor
- Academic Mentor, Research Pioneer

---

## 9. Icon Mapping

Components use Lucide icons. Mapping in `HonorTag.tsx`:

```typescript
const iconMap = {
  medal: Medal,
  shield: Shield,
  award: Award,
  heart: Heart,
  star: Star,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  candle: Flame,
  dove: Bird,
  crown: Crown,
  // ... etc
};
```

---

## 10. Quick Integration Example

```tsx
import { HonorTagsSection } from '@/components/honor-tags/HonorTagsSection';
import { PersonalCredoDisplay, PersonalCredoEditor } from '@/components/profile/PersonalCredo';

// On profile page
<HonorTagsSection
  profileId={profile.id}
  editable={isOwnProfile}
/>

<PersonalCredoDisplay
  profileId={profile.id}
  isDeceased={!profile.is_living}
/>

// In settings
<PersonalCredoEditor profileId={user.id} />
```

---

**End of Session Notes**
