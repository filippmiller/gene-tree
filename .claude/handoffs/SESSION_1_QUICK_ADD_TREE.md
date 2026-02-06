# Session 1: Quick-Add from Tree View

**Master Plan Item:** #6 — HIGH impact, LOW effort
**Goal:** Click any person in the tree, see "+" buttons to add parent/child/spouse/sibling directly from the visualization.

---

## Context

The tree visualization uses React Flow (via `@xyflow/react`) with ELK.js for layout. Users currently need to navigate away from the tree to `/people/new` to add relatives. This kills flow — users should be able to grow their tree visually without leaving it.

## Current Architecture

### Tree Components
| File | Purpose |
|------|---------|
| `src/components/tree/TreeCanvas.tsx` | Main React Flow visualization. Props: `data: TreeData`, `onNodeClick?` |
| `src/components/tree/TreeCanvasWrapper.tsx` | Data fetching wrapper. Props: `rootPersonId`, `currentUserId` |
| `src/components/tree/PersonCard.tsx` | Custom React Flow node for people |
| `src/components/tree/UnionNode.tsx` | Custom React Flow node for marriages |
| `src/components/tree/build-graph.ts` | Transforms TreeData into React Flow nodes/edges |
| `src/components/tree/layout.ts` | ELK-based auto layout |
| `src/components/tree/types.ts` | `Person`, `Union`, `TreeData`, `TreeMode` |
| `src/components/tree/PersonProfileDialog.tsx` | Modal showing person details on click |
| `src/components/tree/QuickAddMenu.tsx` | **Already exists** — context menu for adding relatives |

### Key Types (src/components/tree/types.ts)
```typescript
interface Person {
  id: string; name: string; gender?: string;
  birth_date?: string; death_date?: string;
  photo_url?: string; is_alive?: boolean;
}

interface TreeData {
  persons: Person[];
  parentChild: { parent_id: string; child_id: string }[];
  unions: { union_id: string; p1: string; p2?: string; marriage_date?: string }[];
  unionChildren: { union_id: string; child_id: string }[];
}
```

### API for Creating Relatives
- **POST /api/relatives** — Creates a `pending_relatives` record and sends invite
- **Request:** `{ isDirect, relationshipType, firstName, lastName, email?, phone?, isDeceased?, dateOfBirth? }`
- **Response:** `{ id: "<uuid>" }`

### AddRelativeForm (src/components/relatives/AddRelativeForm.tsx)
- Supports URL params: `?relatedTo=<user_id>&relationType=<parent|child|spouse|sibling>`
- Has smart invite guard (checks for duplicates)
- KinshipSearchField for Russian-language kinship queries

### Tree Page
- `src/app/[locale]/(protected)/tree/[id]/page.tsx` — renders TreeCanvasWrapper
- Full height layout: `h-[calc(100vh-4rem)]`

---

## What to Implement

### 1. QuickAddMenu Enhancement
File `src/components/tree/QuickAddMenu.tsx` already exists. Read it first — it may already have partial implementation. The menu should:

- Appear when user clicks a person node in the tree
- Show contextual "+" buttons based on what's missing:
  - **Add Parent** (if person has < 2 parents)
  - **Add Child**
  - **Add Spouse** (if no spouse)
  - **Add Sibling** (if person has at least one parent)
- Each button opens a **lightweight inline form** (not a full page redirect)

### 2. Inline Quick-Add Dialog
Create `src/components/tree/QuickAddDialog.tsx`:
- Modal/popover that appears over the tree
- Minimal fields: First Name, Last Name, (optional) Birth Year, Deceased checkbox
- Relationship type pre-filled from context (parent/child/spouse/sibling)
- Calls `POST /api/relatives` with `isDirect: false`, `relatedToUserId: <clicked_person_id>`
- On success: refetch tree data to show new node immediately
- On error: show toast message

### 3. PersonCard Enhancement
Update `src/components/tree/PersonCard.tsx`:
- Add a subtle "+" button or hover state that triggers QuickAddMenu
- Keep it non-intrusive — the tree should remain clean

### 4. Tree Data Refresh
After adding a relative, the tree must update:
- `TreeCanvasWrapper.tsx` should expose a `refetch()` mechanism
- Or use React Query / SWR cache invalidation
- The new node should appear in the tree with animation

### 5. Translations
Add keys to `src/messages/en/common.json` and `src/messages/ru/common.json`:
```json
"quickAdd": {
  "addParent": "Add Parent",
  "addChild": "Add Child",
  "addSpouse": "Add Spouse",
  "addSibling": "Add Sibling",
  "firstName": "First Name",
  "lastName": "Last Name",
  "birthYear": "Birth Year",
  "deceased": "Deceased",
  "add": "Add",
  "cancel": "Cancel",
  "success": "Added to your tree!",
  "error": "Could not add. Please try again."
}
```
And the Russian equivalents.

---

## Quality Bar

- Build passes (`npx next build`)
- New node appears in tree immediately after adding
- Works in both EN and RU
- Mobile-friendly (the dialog should work on small screens)
- No page navigation — everything happens in the tree view

---

## Test Credentials
- Email: filippmiller@gmail.com
- Password: Airbus380+
- Production: https://gene-tree-production.up.railway.app/

## Database
- Supabase project: axbotjtdnbefhfpgemex
- Push migrations: `npx supabase db push --password P6CQoeMfPyrdwQvc`
- Regen types: `npx supabase gen types typescript --linked > src/lib/types/supabase.ts` (remove first line)
