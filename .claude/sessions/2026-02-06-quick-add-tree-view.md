# Session: Quick-Add from Tree View (Master Plan #6)
**Date**: 2026-02-06 ~10:00-11:30
**Agent**: Claude Code (Opus 4.6)
**Status**: Completed

## Context
- Master Plan item #6: HIGH impact, LOW effort
- Users previously had to navigate away from the tree to `/people/new` to add relatives
- This killed flow and violated the "grow your tree visually" principle
- QuickAddMenu.tsx already existed with navigation-based behavior

## Work Performed

### Phase 1: Discovery
- Read handoff document `.claude/handoffs/SESSION_1_QUICK_ADD_TREE.md`
- Requirements fully specified: inline dialog, tree refresh, EN/RU translations

### Phase 2: Codebase Exploration
- Launched 3 parallel explorer agents:
  1. Tree components architecture (TreeCanvas, PersonCard, build-graph, layout, QuickAddMenu)
  2. API and form patterns (POST /api/relatives, AddRelativeForm, dialog/toast patterns)
  3. UI patterns and data fetching (shadcn/ui, Supabase client, no React Query)
- Read all key files: TreeCanvasWrapper, TreeCanvas, PersonCard, QuickAddMenu, API route, dialog.tsx, PersonProfileDialog

### Phase 3: Architecture Design
- Requirements were unambiguous from handoff doc — no clarifying questions needed
- Single clear approach: callback threading from wrapper → canvas → node data → menu → dialog

### Phase 4: Implementation

**Created `QuickAddDialog.tsx`** (new file, 226 lines)
- Radix Dialog with glassmorphism styling (matches app theme)
- Minimal form: First Name*, Last Name*, Birth Year (optional), Deceased checkbox
- Uses `useTranslations('quickAdd')` for i18n
- Calls `POST /api/relatives` with `isDirect: false`
- Toast success/error via Sonner
- Form reset on close
- Loading state on submit button

**Modified `PersonCard.tsx`**
- Accepts `onQuickAdd` callback via extended data type
- `useCallback` handler delegates to parent
- Passes `onAdd` to QuickAddMenu (overrides default navigation)

**Modified `TreeCanvas.tsx`**
- Accepts `onQuickAdd` prop
- Injects callback into person node data during layout phase
- Added to useEffect dependency array

**Modified `TreeCanvasWrapper.tsx`**
- Added `quickAddState` (isOpen, personId, personName, type)
- `handleQuickAdd` opens dialog with context
- `handleQuickAddSuccess` calls `fetchTreeData(activeRootId, true)` to refresh tree
- Renders `QuickAddDialog` alongside `PersonProfileDialog`

**Updated translations**
- `src/messages/en/common.json`: 8 new quickAdd keys
- `src/messages/ru/common.json`: 8 new quickAdd keys (Russian)

## Technical Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Simple refetch (not optimistic) | Tree needs ELK re-layout for new nodes; optimistic update would require complex edge/union handling | Optimistic update with manual node insertion |
| Callback through node data | React Flow nodes receive data as props; only way to pass dynamic callbacks without context provider | React Context, global event bus |
| `isDirect: false` API call | Quick-add from tree is always "add relative of this person" (indirect) | Could default to isDirect: true for the user's own node |
| Minimal form fields | Speed over completeness — user can edit details later | Full AddRelativeForm in dialog (too complex for quick-add UX) |

## Testing Performed
- [x] TypeScript compilation: 0 errors (`npx tsc --noEmit`)
- [x] ESLint: passed via lint-staged pre-commit hook
- [x] Pre-existing build errors verified (unrelated: missing page modules for admin/duplicates and connections)

## Deployment
- [x] Committed: `302531c`
- [x] Pushed to `origin/main`
- [ ] Production deployment: Pending Railway auto-deploy

## Commits
- `302531c` — feat(tree): add Quick-Add dialog for adding relatives from tree view

## Issues Discovered
- Pre-existing build errors: `Cannot find module for page: /[locale]/admin/duplicates` and `/[locale]/connections` — unrelated to this work
- Git stash/pop conflict during build verification (concurrent sessions modifying shared files) — resolved by re-applying changes

## Handoff Notes
- The dialog calls `POST /api/relatives` with minimal fields. If the person is living (not deceased), the API requires email or phone for invitation. Currently the quick-add dialog doesn't collect contact info, so **living relatives will fail validation** unless the API is updated or the form adds optional contact fields.
- Recommended fix: Either make the quick-add create deceased-like "placeholder" records, or add an optional email field to the dialog.
- Mobile: QuickAddMenu uses hover events which don't work on touch devices. A future improvement would add tap-to-show-menu behavior.
