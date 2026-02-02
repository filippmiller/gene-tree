# Duplicate Deceased Detection

> **Feature ID:** Sprint5-C1
> **Status:** Complete
> **Added:** February 2, 2026

## Overview

The Duplicate Deceased Detection system identifies potential duplicate profiles, with special focus on deceased family members who are often entered multiple times by different relatives. The system uses fuzzy matching with multiple signals including name similarity, date matching, location matching, and shared relatives to calculate a confidence score for potential duplicates.

Key features:
- Fuzzy name matching with Levenshtein distance
- Cross-language name variant detection (English/Russian)
- Birth and death date matching with tolerance
- Shared relatives analysis
- Side-by-side profile comparison
- Merge workflow with data preservation
- Admin-only queue for review

## Architecture

```
+------------------------------------------------------------------+
|                        Admin Interface                            |
|                                                                   |
|  +---------------------------+    +----------------------------+  |
|  | Dashboard Widget          |    | Duplicate Queue Page       |  |
|  | DuplicateDetectionWidget  |    | /admin/duplicates          |  |
|  |                           |    |                            |  |
|  | - Pending count           |    | +------------------------+ |  |
|  | - High confidence count   |    | | DuplicateQueue         | |  |
|  | - Deceased pairs count    |    | | (sortable, filterable) | |  |
|  +---------------------------+    | +------------------------+ |  |
|              |                    | | DuplicateCard          | |  |
|              v                    | | (confidence badge)     | |  |
|  +---------------------------+    | +------------------------+ |  |
|  | Review Duplicates Button  |    +----------------------------+  |
|  +---------------------------+                |                   |
|                                              v                   |
|                               +----------------------------+     |
|                               | DuplicateComparisonModal   |     |
|                               | - Side-by-side view        |     |
|                               | - Match reasons            |     |
|                               | - Profile selection        |     |
|                               | - Merge / Dismiss buttons  |     |
|                               +----------------------------+     |
|                                              |                   |
|                                              v                   |
|                               +----------------------------+     |
|                               | MergeProfilesModal         |     |
|                               | - Field selection          |     |
|                               | - Preview merged result    |     |
|                               | - Confirm merge            |     |
|                               +----------------------------+     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                          API Layer                                |
|                                                                   |
|  GET  /api/duplicates/queue      - List pending duplicates       |
|  GET  /api/duplicates/[id]       - Get duplicate details         |
|  GET  /api/duplicates/scan       - Scan for new duplicates       |
|  POST /api/duplicates/scan       - Scan with options             |
|  POST /api/duplicates/merge      - Merge two profiles            |
|  POST /api/duplicates/dismiss    - Mark as not duplicate         |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                   Detection Algorithm                             |
|                                                                   |
|  +---------------------------+    +----------------------------+  |
|  | compareProfiles()         |    | compareDeceasedProfiles()  |  |
|  | Standard matching         |    | Enhanced for deceased      |  |
|  +---------------------------+    +----------------------------+  |
|              |                               |                    |
|              v                               v                    |
|  +---------------------------+    +----------------------------+  |
|  | scanForDuplicates()       |    | scanForDeceasedDuplicates()|  |
|  | Returns DuplicateScan     |    | Returns EnhancedScanResult |  |
|  | Result[]                  |    | - is_deceased_pair: true   |  |
|  +---------------------------+    | - shared_relatives_count   |  |
|                                   +----------------------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     Database (Supabase)                           |
|                                                                   |
|  +---------------------------+    +----------------------------+  |
|  | potential_duplicates      |    | merge_history              |  |
|  |---------------------------|    |----------------------------|  |
|  | id (UUID)                 |    | id (UUID)                  |  |
|  | profile_a_id (FK)         |    | kept_profile_id (FK)       |  |
|  | profile_b_id (FK)         |    | merged_profile_id (FK)     |  |
|  | confidence_score          |    | merged_by (FK)             |  |
|  | match_reasons (JSONB)     |    | merge_data (JSONB)         |  |
|  | status                    |    | relationships_transferred  |  |
|  | is_deceased_pair          |    | created_at                 |  |
|  | shared_relatives_count    |    +----------------------------+  |
|  | reviewed_by               |                                    |
|  | resolution_notes          |    +----------------------------+  |
|  +---------------------------+    | duplicate_scan_history     |  |
|                                   |----------------------------|  |
|                                   | scanned_by                 |  |
|                                   | profiles_scanned           |  |
|                                   | duplicates_found           |  |
|                                   | scan_type                  |  |
|                                   | duration_ms                |  |
|                                   +----------------------------+  |
+------------------------------------------------------------------+
```

## Database Schema

### `potential_duplicates` Table

```sql
CREATE TABLE IF NOT EXISTS public.potential_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_a_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  profile_b_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Matching data
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  match_reasons JSONB NOT NULL DEFAULT '{}',

  -- Enhanced fields for deceased detection
  is_deceased_pair BOOLEAN DEFAULT false,
  shared_relatives_count INTEGER DEFAULT 0,

  -- Resolution
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed_same', 'confirmed_different', 'merged', 'not_duplicate', 'dismissed'
  )),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  kept_profile_id UUID REFERENCES public.user_profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries
  CONSTRAINT unique_duplicate_pair UNIQUE (profile_a_id, profile_b_id)
);
```

### `merge_history` Table

```sql
CREATE TABLE IF NOT EXISTS public.merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kept_profile_id UUID NOT NULL REFERENCES public.user_profiles(id),
  merged_profile_id UUID NOT NULL, -- May be deleted after merge
  merged_by UUID NOT NULL REFERENCES auth.users(id),
  duplicate_record_id UUID REFERENCES public.potential_duplicates(id),

  -- Merge details
  merge_data JSONB NOT NULL DEFAULT '{}',
  -- {
  --   fields_from_merged: ['birth_date', 'occupation'],
  --   relationships_transferred: 5,
  --   original_merged_data: { ... }
  -- }
  relationships_transferred INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `duplicate_scan_history` Table

```sql
CREATE TABLE IF NOT EXISTS public.duplicate_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_by UUID REFERENCES auth.users(id),
  profiles_scanned INTEGER NOT NULL DEFAULT 0,
  duplicates_found INTEGER NOT NULL DEFAULT 0,
  duplicates_inserted INTEGER NOT NULL DEFAULT 0,
  scan_type TEXT NOT NULL DEFAULT 'full' CHECK (scan_type IN ('full', 'deceased_only', 'incremental')),
  min_confidence INTEGER NOT NULL DEFAULT 50,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Database Functions

```sql
-- Count shared relatives between two profiles
CREATE OR REPLACE FUNCTION fn_count_shared_relatives(
  p_profile_a_id UUID,
  p_profile_b_id UUID
)
RETURNS INTEGER AS $$
-- Returns count of people who are relatives of both profiles
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find duplicates among deceased profiles
CREATE OR REPLACE FUNCTION fn_find_deceased_duplicates(
  p_min_confidence INTEGER DEFAULT 50
)
RETURNS TABLE (
  profile_a_id UUID,
  profile_b_id UUID,
  confidence_score INTEGER,
  match_reasons JSONB,
  shared_relatives INTEGER
) AS $$
-- Server-side duplicate detection for deceased profiles
-- More efficient for large datasets
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Files

### Types

**`src/lib/duplicates/types.ts`**

```typescript
export interface MatchReasons {
  exact_name_match?: boolean;
  first_name_match?: boolean;
  last_name_match?: boolean;
  maiden_name_match?: boolean;
  nickname_match?: boolean;
  exact_birth_date_match?: boolean;
  birth_year_match?: boolean;
  birth_city_match?: boolean;
  birth_country_match?: boolean;
  fuzzy_name_match?: boolean;
  fuzzy_name_similarity?: number;
}

export interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  maiden_name?: string | null;
  nickname?: string | null;
  birth_date?: string | null;
  birth_city?: string | null;
  birth_country?: string | null;
  death_date?: string | null;
  death_place?: string | null;
  is_living?: boolean | null;
}

export type DuplicateStatus = 'pending' | 'merged' | 'not_duplicate' | 'dismissed';

export interface PotentialDuplicate {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  confidence_score: number;
  match_reasons: MatchReasons;
  status: DuplicateStatus;
  profile_a?: ProfileData;
  profile_b?: ProfileData;
}

export interface MergeResult {
  success: boolean;
  mergeHistoryId?: string;
  relationshipsTransferred: number;
  error?: string;
}
```

**`src/types/duplicate.ts`**

```typescript
// Name variants for cross-language matching
export const NAME_VARIANTS: Record<string, string[]> = {
  maria: ['mary', 'marie', 'мария', 'маша', 'маруся'],
  alexander: ['alex', 'sasha', 'александр', 'саша', 'шура'],
  michael: ['mike', 'misha', 'михаил', 'миша'],
  // ... 40+ name mappings for EN/RU
};

export function areNameVariants(name1: string, name2: string): boolean;

// Extended match reasons for deceased profiles
export interface ExtendedMatchReasons extends MatchReasons {
  name_variant_match?: boolean;
  birth_year_close?: boolean;     // Within 2 years
  exact_death_date_match?: boolean;
  death_year_match?: boolean;
  death_year_close?: boolean;
  death_place_match?: boolean;
  shared_relatives?: number;
}

export interface EnhancedProfileData extends ProfileData {
  death_city?: string | null;
  relationships_count?: number;
  stories_count?: number;
  photos_count?: number;
}

export interface EnhancedPotentialDuplicate {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  confidence_score: number;
  match_reasons: ExtendedMatchReasons;
  status: ExtendedDuplicateStatus;
  is_deceased_pair: boolean;
  shared_relatives_count: number;
  profile_a?: EnhancedProfileData;
  profile_b?: EnhancedProfileData;
}

export interface ProfileComparisonField {
  key: string;
  label: string;
  labelRu: string;
  profileAValue: string | null;
  profileBValue: string | null;
  isMatch: boolean;
  matchType?: 'exact' | 'similar' | 'variant' | 'none';
}

export function buildProfileComparison(
  profileA: EnhancedProfileData,
  profileB: EnhancedProfileData
): ProfileComparisonField[];
```

### Detection Algorithm

**`src/lib/duplicates/detector.ts`**

```typescript
// Standard profile comparison
export function compareProfiles(
  profileA: ProfileData,
  profileB: ProfileData
): { score: number; reasons: MatchReasons };

// Enhanced comparison for deceased profiles
export function compareDeceasedProfiles(
  profileA: EnhancedProfileData,
  profileB: EnhancedProfileData,
  sharedRelativesCount?: number
): { score: number; reasons: ExtendedMatchReasons };

// Scan for duplicates
export function scanForDuplicates(
  profiles: ProfileData[],
  minConfidence?: number,
  existingPairs?: Set<string>
): DuplicateScanResult[];

// Enhanced scan for deceased profiles
export function scanForDeceasedDuplicates(
  profiles: EnhancedProfileData[],
  minConfidence?: number,
  existingPairs?: Set<string>,
  sharedRelativesMap?: Map<string, number>
): EnhancedDuplicateScanResult[];

// Human-readable descriptions
export function describeMatchReasons(reasons: MatchReasons): string[];
export function describeExtendedMatchReasons(reasons: ExtendedMatchReasons, locale: 'en' | 'ru'): string[];

// Confidence level helpers
export function getConfidenceLevel(score: number): 'low' | 'medium' | 'high' | 'very_high';
export function getConfidenceColor(score: number): string;
export function getConfidenceBadgeVariant(score: number): 'destructive' | 'warning' | 'secondary' | 'outline';
```

### Score Weights

**Standard Matching:**

| Signal | Weight | Max |
|--------|--------|-----|
| Exact name match (first + last) | 50 | 50 |
| First name match | 25 | - |
| Last name match | 15 | - |
| Maiden name match | 10 | - |
| Nickname match | 5 | - |
| Fuzzy name match (>80%) | 20 | - |
| **Max Name Score** | - | **50** |
| Exact birth date match | 30 | 30 |
| Birth year match | 15 | - |
| **Max Date Score** | - | **30** |
| Birth city match | 15 | - |
| Birth country match | 5 | - |
| **Max Place Score** | - | **20** |
| **Total Max** | - | **100** |

**Deceased Profile Matching:**

| Signal | Weight | Max |
|--------|--------|-----|
| Exact name match | 40 | 40 |
| First name match | 20 | - |
| Last name match | 15 | - |
| Maiden name match | 15 | - |
| Name variant match | 18 | - |
| Fuzzy name match | 16 | - |
| **Max Name Score** | - | **40** |
| Exact birth date match | 20 | - |
| Birth year match | 12 | - |
| Birth year close (2yr) | 8 | - |
| Exact death date match | 15 | - |
| Death year match | 8 | - |
| Death year close (2yr) | 5 | - |
| **Max Date Score** | - | **30** |
| Birth city match | 10 | - |
| Birth country match | 3 | - |
| Death place match | 8 | - |
| **Max Place Score** | - | **15** |
| Shared relative | 8 each | 15 |
| **Max Relationship Score** | - | **15** |
| **Total Max** | - | **100** |

### Components

| Component | Path | Description |
|-----------|------|-------------|
| `DuplicateDetectionWidget` | `src/components/duplicates/DuplicateDetectionWidget.tsx` | Dashboard widget for admins |
| `DuplicateQueue` | `src/components/duplicates/DuplicateQueue.tsx` | Queue list with filters |
| `DuplicateCard` | `src/components/duplicates/DuplicateCard.tsx` | Individual duplicate card |
| `DuplicateComparisonModal` | `src/components/duplicates/DuplicateComparisonModal.tsx` | Side-by-side comparison |
| `MergeProfilesModal` | `src/components/duplicates/MergeProfilesModal.tsx` | Merge confirmation dialog |

## Component Props

### DuplicateDetectionWidget

```typescript
interface DuplicateDetectionWidgetProps {
  locale?: 'en' | 'ru';
}
```

### DuplicateComparisonModal

```typescript
interface DuplicateComparisonModalProps {
  duplicateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerge: (duplicateId: string, keepProfileId: string, mergeProfileId: string) => Promise<void>;
  onDismiss: (duplicateId: string) => Promise<void>;
  locale?: 'en' | 'ru';
}
```

### DuplicateQueue

```typescript
interface DuplicateQueueProps {
  filters?: EnhancedDuplicateQueueFilters;
  onSelect: (duplicateId: string) => void;
  locale?: 'en' | 'ru';
}
```

## API Endpoints

### `GET /api/duplicates/queue`

List pending duplicates.

**Query Parameters:**
- `status`: `'pending'` | `'merged'` | `'dismissed'` (default: `'pending'`)
- `minConfidence`: number (default: 0)
- `deceasedOnly`: boolean (default: false)
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**
```json
{
  "duplicates": [
    {
      "id": "uuid",
      "profile_a_id": "uuid",
      "profile_b_id": "uuid",
      "confidence_score": 85,
      "match_reasons": {
        "exact_name_match": true,
        "birth_year_match": true
      },
      "is_deceased_pair": true,
      "shared_relatives_count": 2,
      "profile_a": { ... },
      "profile_b": { ... }
    }
  ],
  "pendingCount": 15
}
```

### `GET /api/duplicates/[id]`

Get full details for a specific duplicate.

**Response:**
```json
{
  "duplicate": {
    "id": "uuid",
    "confidence_score": 85,
    "match_reasons": { ... },
    "is_deceased_pair": true,
    "shared_relatives_count": 2,
    "profile_a": {
      "id": "uuid",
      "first_name": "Ivan",
      "last_name": "Petrov",
      "birth_date": "1920-05-15",
      "death_date": "1985-03-20",
      "relationships_count": 5,
      "stories_count": 2
    },
    "profile_b": { ... }
  }
}
```

### `GET /api/duplicates/scan`

Scan profiles for duplicates.

**Query Parameters:**
- `scanType`: `'full'` | `'deceased_only'` | `'incremental'`
- `minConfidence`: number (default: 50)
- `includeRelationships`: boolean (default: false)

**Response:**
```json
{
  "success": true,
  "scanType": "deceased_only",
  "profilesScanned": 150,
  "duplicatesFound": 8,
  "duplicatesInserted": 5,
  "durationMs": 1250,
  "duplicates": [ ... ]  // First 10 for preview
}
```

### `POST /api/duplicates/merge`

Merge two profiles.

**Request:**
```json
{
  "duplicateId": "uuid",
  "keepProfileId": "uuid",
  "mergeProfileId": "uuid",
  "fieldsToMerge": ["birth_date", "occupation"],
  "resolutionNotes": "Confirmed same person via family photos"
}
```

**Response:**
```json
{
  "success": true,
  "mergeHistoryId": "uuid",
  "relationshipsTransferred": 5,
  "storiesTransferred": 2,
  "photosTransferred": 3
}
```

### `POST /api/duplicates/dismiss`

Mark as not duplicate.

**Request:**
```json
{
  "duplicateId": "uuid",
  "notes": "Different people - one is from Moscow, other from St. Petersburg"
}
```

## Name Variant Matching

The system includes a comprehensive mapping of name variants for English and Russian:

```typescript
const NAME_VARIANTS: Record<string, string[]> = {
  // English name -> variants (including Russian)
  maria: ['mary', 'marie', 'мария', 'маша', 'маруся'],
  alexander: ['alex', 'sasha', 'александр', 'саша', 'шура'],
  michael: ['mike', 'misha', 'михаил', 'миша'],
  anna: ['ann', 'annie', 'анна', 'аня', 'анюта', 'нюра'],
  elena: ['helen', 'helena', 'елена', 'лена', 'аленка'],
  vladimir: ['volodya', 'vova', 'владимир', 'вова', 'володя'],
  nikolai: ['nicholas', 'nick', 'николай', 'коля'],
  ivan: ['john', 'иван', 'ваня', 'ванюша'],
  // ... 40+ mappings

  // Russian name -> variants (including English)
  мария: ['maria', 'mary', 'marie', 'маша', 'маруся'],
  александр: ['alexander', 'alex', 'sasha', 'саша', 'шура'],
  // ...
};
```

## Localization

### English (`en`)

```typescript
{
  // Widget
  title: 'Potential Duplicate Profiles',
  description: 'We found profiles that might be the same person',
  pending: 'pending review',
  highConfidence: 'high confidence',
  deceased: 'deceased pairs',
  review: 'Review Duplicates',

  // Comparison modal
  compareTitle: 'Compare Profiles',
  compareDescription: 'Review the details and decide if these are the same person',
  matchReasons: 'Why we think these might be duplicates',
  selectProfile: 'Click on the profile you want to keep',
  samePerson: 'Same Person - Merge',
  differentPeople: 'Different People',
  confidence: 'Match Confidence',
  sharedRelatives: 'Shared Relatives',

  // Match reasons
  exact_name_match: 'Exact name match (first and last name)',
  first_name_match: 'First name matches exactly',
  last_name_match: 'Last name matches exactly',
  name_variant_match: 'Names are language variants (e.g., Maria / Мария)',
  fuzzy_name_match: 'Names are similar',
  exact_birth_date_match: 'Birth date matches exactly',
  birth_year_match: 'Birth year matches',
  birth_year_close: 'Birth year within 2 years',
  exact_death_date_match: 'Death date matches exactly',
  death_year_match: 'Death year matches',
  birth_city_match: 'Birth city matches',
  death_place_match: 'Death place matches',
  shared_relatives: 'shared relative(s)',
}
```

### Russian (`ru`)

```typescript
{
  // Widget
  title: 'Возможные дубликаты профилей',
  description: 'Мы нашли профили, которые могут быть одним и тем же человеком',
  pending: 'ожидают проверки',
  highConfidence: 'высокая вероятность',
  deceased: 'пары усопших',
  review: 'Проверить дубликаты',

  // Comparison modal
  compareTitle: 'Сравнение профилей',
  compareDescription: 'Проверьте данные и решите, это один и тот же человек',
  matchReasons: 'Почему мы думаем, что это дубликаты',
  selectProfile: 'Нажмите на профиль, который хотите оставить',
  samePerson: 'Тот же человек - Объединить',
  differentPeople: 'Разные люди',
  confidence: 'Уверенность совпадения',
  sharedRelatives: 'Общие родственники',

  // Match reasons
  exact_name_match: 'Точное совпадение имени и фамилии',
  first_name_match: 'Имя совпадает',
  last_name_match: 'Фамилия совпадает',
  name_variant_match: 'Имена являются вариантами (напр., Maria / Мария)',
  fuzzy_name_match: 'Имена похожи',
  exact_birth_date_match: 'Дата рождения совпадает',
  birth_year_match: 'Год рождения совпадает',
  birth_year_close: 'Год рождения в пределах 2 лет',
  exact_death_date_match: 'Дата смерти совпадает',
  death_year_match: 'Год смерти совпадает',
  birth_city_match: 'Город рождения совпадает',
  death_place_match: 'Место смерти совпадает',
  shared_relatives: 'общих родственника(ов)',
}
```

## Confidence Levels

| Score Range | Level | Color | Badge Variant |
|-------------|-------|-------|---------------|
| 80-100 | Very High | Red | destructive |
| 60-79 | High | Orange | warning |
| 40-59 | Medium | Amber | secondary |
| 0-39 | Low | Gray | outline |

## Testing Checklist

### Dashboard Widget
- [ ] Widget shows for admin users only
- [ ] Pending count displays correctly
- [ ] High confidence count displays correctly
- [ ] Deceased pairs count displays correctly
- [ ] "Review" button navigates to queue

### Scan Functionality
- [ ] Full scan finds duplicates
- [ ] Deceased-only scan works
- [ ] Incremental scan skips existing pairs
- [ ] Relationship matching works when enabled
- [ ] Scan history is recorded

### Comparison Modal
- [ ] Opens with correct duplicate data
- [ ] Match reasons display correctly
- [ ] Profile comparison fields show
- [ ] Match/different badges display correctly
- [ ] Profile selection works
- [ ] Merge button disabled until profile selected
- [ ] Dismiss button works

### Merge Workflow
- [ ] Merge transfers relationships
- [ ] Merge transfers stories
- [ ] Merge history is created
- [ ] Merged profile is soft-deleted
- [ ] Kept profile retains all data

### Dismissal
- [ ] Dismiss updates status correctly
- [ ] Notes are saved
- [ ] Dismissed pairs not shown in pending queue

### Name Variant Matching
- [ ] English-Russian variants detected (Maria/Мария)
- [ ] Nicknames detected (Alexander/Sasha)
- [ ] Case-insensitive matching works

## Security Considerations

1. **Admin Only**: All duplicate management is restricted to admin users
2. **Audit Trail**: All merges and dismissals are logged with user ID
3. **Soft Delete**: Merged profiles are soft-deleted, data preserved in merge_history
4. **RLS Policies**: Database-level access control for all tables
5. **Rate Limiting**: Scan endpoint should be rate-limited

## Performance Considerations

1. **Batch Processing**: Scan processes profiles in batches
2. **Existing Pair Skip**: Skips already-detected pairs
3. **Database Function**: Server-side function for large-scale scans
4. **Lazy Loading**: Queue loads duplicates with pagination
5. **Index Optimization**: Indexes on status, is_deceased_pair, confidence_score

## Future Improvements

1. **Auto-Merge**: Automatic merge for very high confidence matches (>95%)
2. **ML Enhancement**: Machine learning for improved matching
3. **Photo Comparison**: AI-based face matching for photos
4. **Bulk Operations**: Approve/dismiss multiple at once
5. **Undo Merge**: Ability to reverse a merge
6. **Scheduled Scans**: Automatic periodic scanning
7. **Notifications**: Alert admins when high-confidence duplicates found
8. **API for External Tools**: Allow GEDCOM importers to check for duplicates
9. **Confidence Explanation**: Detailed breakdown of score calculation
10. **Historical Name Changes**: Track maiden names, married names over time
