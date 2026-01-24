# Session Notes: Visual Test - Invitation Flow
**Date:** 2026-01-24
**Focus:** End-to-end visual testing of invitation flow and bug fixes

## Summary
Conducted a visual full-flow test of the invitation system and discovered/fixed critical bugs in the People page display logic.

## Bugs Found and Fixed

### 1. People Page Status Filtering Bug (CRITICAL)
**Location:** `src/app/[locale]/(protected)/people/page.tsx`

**Problem:** The People page fetched ALL `pending_relatives` records without filtering by status. This caused:
- Relatives who accepted invitations still appeared as "Pending"
- The "Confirmed Relatives" section was always empty (static message)
- Users couldn't see when their invitations were accepted

**Root Cause:**
```typescript
// BAD: No status filter - shows all relatives as pending
const { data: pendingRelatives } = await supabase
  .from('pending_relatives')
  .select('*')
  .eq('invited_by', user.id)
```

**Fix:**
```typescript
// GOOD: Filter by status
// Pending only
const { data: pendingRelatives } = await supabase
  .from('pending_relatives')
  .select('*')
  .eq('invited_by', user.id)
  .eq('status', 'pending')

// Confirmed (accepted)
const { data: confirmedRelatives } = await supabase
  .from('pending_relatives')
  .select('*')
  .eq('invited_by', user.id)
  .eq('status', 'accepted')
```

### 2. Invitation Page RLS Issue (Fixed in previous session)
**Location:** `src/app/[locale]/invite/[token]/page.tsx`

**Problem:** Invitation page used SSR client which couldn't query `pending_relatives` for unauthenticated users due to RLS policies.

**Fix:** Changed to use `getSupabaseAdmin()` which bypasses RLS. Also simplified the query to avoid failing joins:
```typescript
// Use admin client for unauthenticated access
const supabase = getSupabaseAdmin();

// Simple query instead of complex join
const { data: invitation } = await supabase
  .from('pending_relatives')
  .select('*')
  .eq('invitation_token', token)
  .eq('status', 'pending')
  .single();

// Fetch inviter separately
if (invitation?.invited_by) {
  const { data: inviterProfile } = await supabase
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('id', invitation.invited_by)
    .single();
}
```

## Invitation Flow Status Values
The `pending_relatives.status` field tracks invitation state:
- `pending` - Invitation sent, waiting for response
- `accepted` - User clicked Accept on invitation page
- (future: `rejected`, `expired`)

## Two Acceptance Endpoints
There are TWO different acceptance endpoints:

1. **`/api/invitations/accept`** - For unauthenticated users
   - Called when user clicks "Accept" on invitation page
   - Sets `status = 'accepted'`
   - Does NOT link to user account (user hasn't registered yet)

2. **`/api/invites/accept`** - For authenticated users
   - Called after user registers and logs in
   - Links the pending_relatives record to the user's account
   - Sets `related_to_user_id` and `is_verified = true`

## E2E Test Selector Fixes
**Location:** `tests/e2e/invitation-flow.spec.ts`

The registration form uses FloatingInput components with `id` attributes, not `name`:
```typescript
// WRONG: [name="firstName"]
// RIGHT: #name, #email, #password, #confirmPassword
await page.fill('#name', 'Alexander Testov');
await page.fill('#email', email);
```

## Technical Discoveries

### Next.js Hot Reload Issues
The dev server occasionally hits webpack module errors:
```
__webpack_modules__[moduleId] is not a function
```
**Workaround:** Restart dev server or navigate directly to pages instead of client-side routing.

### Supabase Migration Sync
When local and remote migrations don't match:
```bash
npx supabase migration repair --status reverted 001 002 003
npx supabase db push
```

## Commits
- `d30adc4` - test: e2e tests and documentation updates
- `98b0999` - fix: People page now shows pending vs confirmed relatives correctly

## Files Modified
- `src/app/[locale]/(protected)/people/page.tsx` - Status filtering fix
- `src/app/[locale]/invite/[token]/page.tsx` - Admin client + simplified query
- `tests/e2e/invitation-flow.spec.ts` - Fixed selectors

## Verification Checklist
After deployment:
1. [ ] Add a relative from People page
2. [ ] Check invitation link works (shows details, not "not found")
3. [ ] Accept invitation
4. [ ] Register new account
5. [ ] Original user's People page shows relative as "Confirmed"
