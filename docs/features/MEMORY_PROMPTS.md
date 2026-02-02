# Memory Prompts System

> **Feature ID:** Sprint3-B1
> **Status:** Complete
> **Added:** February 2, 2026

## Overview

Memory Prompts is a system designed to encourage family story sharing by presenting users with thoughtful questions about their memories and experiences. The system includes seasonal rotation, relationship-specific prompts with placeholders, skip/remind functionality, and comprehensive statistics tracking.

This feature directly supports the platform's core philosophy that "stories matter" and helps drive the north star metric of families with verified profiles and shared stories.

## Architecture

```
+------------------------------------------------------------------+
|                         Application                               |
|                                                                   |
|   +----------------------------------------------------------+   |
|   |                 MemoryPromptsWidget                       |   |
|   |   (Dashboard widget - featured prompt)                    |   |
|   |                                                           |   |
|   |   +--------------------------------------------------+   |   |
|   |   |            MemoryPromptCard                       |   |   |
|   |   |   - Category badge & icon                        |   |   |
|   |   |   - Prompt text (localized)                      |   |   |
|   |   |   - Actions: Write, Skip, Remind Later           |   |   |
|   |   +--------------------------------------------------+   |   |
|   +----------------------------------------------------------+   |
|                                                                   |
|   +----------------------------------------------------------+   |
|   |                 MemoryPromptsList                         |   |
|   |   (Full-page prompts browser)                             |   |
|   |                                                           |   |
|   |   [Stats Overview]                                        |   |
|   |   [Filters: Category, Status, Search]                    |   |
|   |   [Prompts grouped by category]                          |   |
|   +----------------------------------------------------------+   |
+------------------------------------------------------------------+
                              |
                              v
              +----------------------------------+
              |          API Routes              |
              |                                  |
              |  GET  /api/memory-prompts        |
              |  GET  /api/memory-prompts/daily  |
              |  GET  /api/memory-prompts/stats  |
              |  POST /api/memory-prompts/:id/skip|
              |  POST /api/memory-prompts/:id/respond|
              |  POST /api/memory-prompts/:id/remind-later|
              +----------------------------------+
                              |
                              v
              +----------------------------------+
              |       PostgreSQL Functions       |
              |                                  |
              |  get_daily_memory_prompt()       |
              |  get_memory_prompts_for_user()   |
              |  get_memory_prompt_stats()       |
              |  skip_memory_prompt()            |
              |  respond_to_memory_prompt()      |
              |  remind_later_memory_prompt()    |
              +----------------------------------+
```

## Database Schema

### memory_prompts

```sql
CREATE TABLE memory_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category for organization
  category TEXT NOT NULL CHECK (category IN (
    'childhood', 'family', 'traditions', 'seasonal', 'relationship'
  )),

  -- Bilingual prompt text
  prompt_en TEXT NOT NULL,
  prompt_ru TEXT NOT NULL,

  -- Placeholder support for dynamic prompts
  placeholder_type TEXT CHECK (placeholder_type IN (
    'person_name', 'relationship', 'event', NULL
  )),

  -- Seasonal prompts
  is_seasonal BOOLEAN DEFAULT false,
  season TEXT CHECK (season IN ('winter', 'spring', 'summer', 'fall', NULL)),

  -- Active flag for soft deletes
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_prompt_responses

```sql
CREATE TABLE user_prompt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES memory_prompts(id) ON DELETE CASCADE,

  -- Link to created story (if answered)
  story_id UUID,

  -- Interaction status
  skipped BOOLEAN DEFAULT false,
  remind_later BOOLEAN DEFAULT false,
  remind_after TIMESTAMPTZ,

  -- Context when prompt was shown
  context_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  responded_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, prompt_id)
);
```

### Indexes

```sql
CREATE INDEX idx_memory_prompts_category ON memory_prompts(category);
CREATE INDEX idx_memory_prompts_seasonal ON memory_prompts(is_seasonal, season) WHERE is_seasonal = true;
CREATE INDEX idx_memory_prompts_active ON memory_prompts(is_active) WHERE is_active = true;
CREATE INDEX idx_user_prompt_responses_user ON user_prompt_responses(user_id);
CREATE INDEX idx_user_prompt_responses_user_skipped ON user_prompt_responses(user_id, skipped) WHERE skipped = false;
```

## Files

### Components

| File | Purpose |
|------|---------|
| `src/components/prompts/MemoryPromptCard.tsx` | Single prompt card with category styling and actions |
| `src/components/prompts/MemoryPromptsWidget.tsx` | Dashboard widget showing daily prompt |
| `src/components/prompts/MemoryPromptsList.tsx` | Full prompts browser with filters and stats |

### Types

| File | Purpose |
|------|---------|
| `src/types/prompts.ts` | TypeScript types, constants, and helper functions |

### API Routes

| File | Purpose |
|------|---------|
| `src/app/api/memory-prompts/route.ts` | List prompts with filters |
| `src/app/api/memory-prompts/daily/route.ts` | Get daily featured prompt |
| `src/app/api/memory-prompts/stats/route.ts` | Get user statistics |
| `src/app/api/memory-prompts/[id]/skip/route.ts` | Skip a prompt |
| `src/app/api/memory-prompts/[id]/respond/route.ts` | Mark prompt as answered |
| `src/app/api/memory-prompts/[id]/remind-later/route.ts` | Defer prompt |

### Database

| File | Purpose |
|------|---------|
| `supabase/migrations/20260202400000_memory_prompts.sql` | Schema, functions, RLS, seed data |

## Component Props

### MemoryPromptCard

```typescript
interface MemoryPromptCardProps {
  prompt: {
    prompt_id: string;
    prompt_en: string;
    prompt_ru: string;
    category: PromptCategory;
    placeholder_type: PlaceholderType;
    is_seasonal: boolean;
    season: Season;
    is_new?: boolean;
  };
  placeholders?: Record<string, string>;  // For dynamic prompts
  onWriteStory?: (promptId: string, promptText: string) => void;
  onSkip?: (promptId: string) => Promise<void>;
  onRemindLater?: (promptId: string) => Promise<void>;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  isAnswered?: boolean;
}
```

### MemoryPromptsWidget

```typescript
interface MemoryPromptsWidgetProps {
  contextProfileId?: string;        // For relationship-specific prompts
  contextPersonName?: string;       // Name to substitute in placeholders
  contextRelationship?: string;     // Relationship to substitute
  promptCount?: 1 | 2;              // Number of prompts to show
  onCreateStory?: (promptId: string, promptText: string) => void;
}
```

### MemoryPromptsList

```typescript
interface MemoryPromptsListProps {
  onCreateStory?: (promptId: string, promptText: string) => void;
}
```

## API Endpoints

### GET /api/memory-prompts

List prompts with user response status.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| category | string | all | Filter by category |
| includeAnswered | boolean | false | Include answered prompts |
| limit | number | 20 | Results per page |
| offset | number | 0 | Pagination offset |

**Response:**
```json
{
  "prompts": [
    {
      "prompt_id": "uuid",
      "prompt_en": "What is your earliest memory?",
      "prompt_ru": "Какое ваше самое раннее воспоминание?",
      "category": "childhood",
      "placeholder_type": null,
      "is_seasonal": false,
      "season": null,
      "is_answered": false,
      "is_skipped": false,
      "story_id": null,
      "responded_at": null
    }
  ],
  "total": 25
}
```

### GET /api/memory-prompts/daily

Get the daily featured prompt for the user.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| contextProfileId | string | Profile ID for relationship prompts |

**Response:**
```json
{
  "prompt": {
    "prompt_id": "uuid",
    "prompt_en": "What did grandma always cook?",
    "prompt_ru": "Что всегда готовила бабушка?",
    "category": "family",
    "placeholder_type": null,
    "is_seasonal": false,
    "season": null,
    "is_new": true
  }
}
```

### GET /api/memory-prompts/stats

Get user's prompt response statistics.

**Response:**
```json
{
  "stats": {
    "total_prompts": 25,
    "answered_count": 5,
    "skipped_count": 3,
    "pending_count": 17,
    "by_category": {
      "childhood": { "total": 5, "answered": 2, "skipped": 1 },
      "family": { "total": 5, "answered": 1, "skipped": 0 },
      ...
    }
  }
}
```

### POST /api/memory-prompts/:id/skip

Skip a prompt.

**Response:**
```json
{ "success": true }
```

### POST /api/memory-prompts/:id/respond

Mark a prompt as answered with a story link.

**Request:**
```json
{
  "storyId": "uuid",
  "contextProfileId": "uuid"
}
```

**Response:**
```json
{ "success": true }
```

### POST /api/memory-prompts/:id/remind-later

Defer a prompt for later.

**Request:**
```json
{
  "days": 7
}
```

**Response:**
```json
{ "success": true }
```

## Prompt Categories

| Category | Icon | Color | Description |
|----------|------|-------|-------------|
| childhood | Baby | Sky blue | Early memories, toys, games |
| family | Users | Emerald | Family relationships, traditions |
| traditions | Gift | Amber | Customs, recipes, celebrations |
| seasonal | Sparkles | Violet | Holiday and season-specific |
| relationship | Heart | Pink | About specific family members |

## Daily Prompt Selection Algorithm

The `get_daily_memory_prompt()` function uses this priority:

1. **Seasonal Priority**: In winter/summer, show seasonal prompts first (if unanswered)
2. **Context Priority**: When viewing a profile, show relationship-specific prompts
3. **Rotation**: Select from unanswered prompts using deterministic daily rotation
4. **Remind Later**: Exclude prompts with active remind_after dates
5. **Fallback**: If all prompts seen, show oldest skipped prompt

## Placeholder Substitution

Prompts with `placeholder_type` support dynamic text:

```typescript
// Prompt: "What is your first memory of {person}?"
// With placeholders: { person: "Grandma" }
// Result: "What is your first memory of Grandma?"

const result = substitutePromptPlaceholders(promptText, placeholders);
```

## Card Variants

### Default
- Medium GlassCard with hover lift effect
- Category badge and seasonal indicator
- Write and Skip action buttons

### Compact
- Minimal styling for list views
- Single-line layout with icon
- Quick write button only

### Featured
- Large GlassCard with decorative gradient
- "Memory of the Day" header
- Full action set: Write, Skip, Remind Later

## Localization

### English

```typescript
const en = {
  writeStory: 'Write Story',
  skip: 'Skip',
  later: 'Later',
  answered: 'Answered',
  storyRecorded: 'Story recorded!',
  memoryOfTheDay: 'Memory of the Day',
  skipPromptTitle: 'Skip this prompt?',
  skipPromptDescription: 'You can return to it later in the prompts list.',
};
```

### Russian

```typescript
const ru = {
  writeStory: 'Написать историю',
  skip: 'Пропустить',
  later: 'Напомнить',
  answered: 'Отвечено',
  storyRecorded: 'История записана!',
  memoryOfTheDay: 'Воспоминание дня',
  skipPromptTitle: 'Пропустить этот вопрос?',
  skipPromptDescription: 'Вы можете вернуться к нему позже в списке вопросов.',
};
```

### Category Labels

| Category | English | Russian |
|----------|---------|---------|
| childhood | Childhood | Детство |
| family | Family | Семья |
| traditions | Traditions | Традиции |
| seasonal | Seasonal | Сезонные |
| relationship | Relationships | Отношения |

### Season Labels

| Season | English | Russian |
|--------|---------|---------|
| winter | Winter | Зима |
| spring | Spring | Весна |
| summer | Summer | Лето |
| fall | Fall | Осень |

## RLS Policies

### memory_prompts

- **SELECT**: All authenticated users can view active prompts
- **ALL**: Only admins can modify prompts

### user_prompt_responses

- **SELECT**: Users can view their own responses
- **INSERT**: Users can create responses for themselves
- **UPDATE**: Users can update their own responses

## Seed Data

The migration seeds 25 prompts across 5 categories:

- **Childhood (5)**: Earliest memory, childhood games, childhood home, favorite toy, career dreams
- **Family (5)**: Grandma's cooking, family sayings, funny stories, parental lessons, family uniqueness
- **Traditions (5)**: Birthday celebrations, traditions to pass on, family recipes, family songs, Sunday mornings
- **Relationship (5)**: First memory of person, what makes them special, best advice, favorite memory, things to tell them
- **Seasonal (5)**: New Year celebration, winter memory, summer memory, summer vacations, school breaks

## Testing Checklist

### Widget Tests

- [ ] Daily prompt loads on dashboard
- [ ] Write button navigates to story creation with prompt pre-filled
- [ ] Skip button shows confirmation dialog
- [ ] After skip, next prompt loads automatically
- [ ] Remind Later sets future reminder date
- [ ] Empty state shows when all prompts answered

### List Tests

- [ ] Stats display correctly (total, answered, skipped, pending)
- [ ] Category filter works
- [ ] Status filter (All, New, Answered, Skipped) works
- [ ] Search finds prompts in both languages
- [ ] Prompts grouped by category when no filter
- [ ] Reset filters button clears all filters

### API Tests

- [ ] Daily endpoint returns seasonal prompt in winter/summer
- [ ] Daily endpoint respects context_profile_id
- [ ] Stats endpoint returns correct counts
- [ ] Skip endpoint creates/updates response record
- [ ] Respond endpoint links story to prompt

### Edge Cases

- [ ] User with no responses sees first prompt
- [ ] All prompts answered shows oldest skipped
- [ ] Placeholder substitution handles missing values
- [ ] Concurrent skip requests are idempotent

## Future Improvements

1. **AI-Generated Prompts** - Personalized prompts based on family tree
2. **Prompt Suggestions** - Users can suggest new prompts
3. **Prompt Chains** - Follow-up questions based on story content
4. **Family Prompts** - Prompts visible to whole family to answer together
5. **Prompt Notifications** - Push notifications for seasonal prompts
6. **Prompt Analytics** - Which prompts generate the most stories
7. **Audio Prompts** - Voice recordings of prompts from family members
8. **Photo Prompts** - Upload a photo and get contextual prompts
