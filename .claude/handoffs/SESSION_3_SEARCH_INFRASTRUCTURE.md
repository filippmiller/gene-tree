# Session 3: Search Infrastructure

**Master Plan Item:** #9 — HIGH impact, MEDIUM effort
**Goal:** Build full-text search with fuzzy matching so users can find family members, profiles, and stories across the platform.

---

## Context

The PostgreSQL search functions already exist (pg_trgm + GIN indexes). What's missing is the API route, React components, and integration into the app's key workflows (navbar, add-relative, onboarding).

## Current State

### Database Functions (ALREADY DEPLOYED)
Migration: `supabase/migrations/20260205210000_fulltext_search_pg_trgm.sql`

Two PostgreSQL functions are ready:

**1. `search_profiles(search_query, limit_count, min_similarity)`**
- Fuzzy trigram search on first_name, last_name, middle_name, maiden_name
- Weighted scoring: first_name 1.2x, last_name 1.0x, middle_name 0.8x, maiden_name 0.9x
- Returns: id, first_name, last_name, middle_name, maiden_name, avatar_url, similarity_score
- Default: limit 20, min_similarity 0.15

**2. `search_profiles_fullname(search_query, limit_count)`**
- Full name matching (e.g., "John Smith")
- Splits query into words, matches each against all name fields
- Word-level bonuses for multi-word queries
- Returns: same columns as search_profiles

Both granted to `authenticated` role.

### What Doesn't Exist Yet
- No `/api/search/` route
- No `src/components/search/` components
- No search UI anywhere in the app
- No integration with add-relative or onboarding flows

---

## What to Implement

### 1. Search API Route
Create `src/app/api/search/route.ts`:

```typescript
// GET /api/search?q=<query>&type=profiles|stories|all&limit=20
// - Auth required
// - Calls search_profiles() or search_profiles_fullname() via supabase.rpc()
// - For stories: query stories table with ILIKE or ts_vector
// - Returns JSON: { results: [...], total: number, query: string }
```

**Profile search response shape:**
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "profile",
      "first_name": "John",
      "last_name": "Smith",
      "avatar_url": "...",
      "similarity": 0.85,
      "relationship": "Your uncle"  // Optional: compute if related
    }
  ],
  "total": 5,
  "query": "john"
}
```

### 2. Search Components

**a. `src/components/search/SearchInput.tsx`** (Client component)
- Debounced input (300ms) with search icon
- Shows loading spinner while fetching
- Keyboard shortcut: Ctrl+K or Cmd+K to focus
- Clear button
- Props: `onSelect(result)`, `placeholder`, `autoFocus`

**b. `src/components/search/SearchResults.tsx`** (Client component)
- Dropdown/popover list of results
- Avatar + name + relationship badge for profiles
- Title + excerpt for stories
- Click to navigate to profile/story
- "No results" state
- Keyboard navigation (arrow keys + Enter)

**c. `src/components/search/GlobalSearch.tsx`** (Client component)
- Command palette style (like Cmd+K in VS Code)
- Full-screen overlay on mobile
- Searches profiles, stories, pages
- Recent searches in localStorage

### 3. Navbar Integration
Add search to the sidebar/navbar:
- `src/components/layout/Sidebar.tsx` — add search button that opens GlobalSearch
- Desktop: shows search input in sidebar header
- Mobile: shows search icon that opens overlay

### 4. Add-Relative Integration
In `src/components/relatives/AddRelativeForm.tsx`:
- Before creating a new relative, search for existing profiles
- Show "Did you mean?" suggestions when typing first/last name
- Prevent duplicate relative creation
- Use `SearchInput` component inline

### 5. Stories Search (Optional Enhancement)
If time permits, extend search to stories:
- Create a migration to add `tsvector` column to stories table
- Or use ILIKE with pg_trgm for fuzzy story content search
- Add "Stories" tab to search results

### 6. Translations
Add to `src/messages/en/common.json` and `src/messages/ru/common.json`:
```json
"search": {
  "placeholder": "Search people, stories...",
  "noResults": "No results found",
  "profiles": "People",
  "stories": "Stories",
  "recentSearches": "Recent Searches",
  "clearRecent": "Clear",
  "searching": "Searching...",
  "resultCount": "{count} results",
  "hint": "Press Ctrl+K to search"
}
```
Plus Russian equivalents:
```json
"search": {
  "placeholder": "Поиск людей, историй...",
  "noResults": "Ничего не найдено",
  "profiles": "Люди",
  "stories": "Истории",
  "recentSearches": "Недавние поиски",
  "clearRecent": "Очистить",
  "searching": "Поиск...",
  "resultCount": "{count} результатов",
  "hint": "Нажмите Ctrl+K для поиска"
}
```

---

## Architecture Notes

### Supabase RPC Call Pattern
```typescript
const supabase = getSupabaseAdmin(); // or SSR client
const { data, error } = await supabase.rpc('search_profiles', {
  search_query: query,
  limit_count: 20,
  min_similarity: 0.15
});
```

### Debounce Pattern (Client)
```typescript
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  if (debouncedQuery.length >= 2) {
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=profiles`)
      .then(r => r.json())
      .then(setResults);
  }
}, [debouncedQuery]);
```

### Keyboard Shortcut
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(true);
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);
```

---

## Quality Bar

- Build passes (`npx next build`)
- Search returns results within 200ms for common queries
- Fuzzy matching works (typos, partial names)
- Works in both EN and RU (Cyrillic names searchable)
- Ctrl+K shortcut opens search from anywhere
- Mobile-friendly overlay
- No results state handled gracefully

---

## Test Credentials
- Email: filippmiller@gmail.com
- Password: Airbus380+
- Production: https://gene-tree-production.up.railway.app/

## Database
- Supabase project: axbotjtdnbefhfpgemex
- Push migrations: `npx supabase db push --password P6CQoeMfPyrdwQvc`
- Regen types: `npx supabase gen types typescript --linked > src/lib/types/supabase.ts` (remove first line)
