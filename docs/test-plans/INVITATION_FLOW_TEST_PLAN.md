# Invitation Flow End-to-End Test Plan

## Overview

This test plan validates the complete user journey for family invitations, from registration through tree visualization. Uses **two browser tabs** to simulate inviter and invitee perspectives.

---

## Prerequisites

1. **Local dev server running**: `npm run dev` on `http://localhost:3000`
2. **Database accessible**: Supabase local or remote
3. **Two browser tabs/windows** (preferably incognito for isolation)
4. **Test email addresses**: Use `+alias` pattern (e.g., `test+inviter@gmail.com`, `test+child1@gmail.com`)

---

## Test Accounts

| Role | Email Pattern | Purpose |
|------|---------------|---------|
| **Primary User (Inviter)** | `testuser+primary@example.com` | Creates tree, sends invitations |
| **Invitees (1-30)** | `testuser+rel{N}@example.com` | Accept invitations, view their tree |

---

## Phase 1: Primary User Registration

### Test 1.1: Register Primary Account

**Tab 1 (Inviter)**

1. Navigate to `/en/sign-up`
2. Fill registration form:
   - First Name: `Alexander`
   - Last Name: `Testov`
   - Email: `testuser+primary@example.com`
   - Password: `TestPassword123!`
3. Submit and verify redirect to dashboard
4. Complete profile setup if prompted

**Expected Result:**
- Account created successfully
- Redirected to `/app` dashboard
- User profile accessible at `/my-profile`

**Verification:**
```sql
SELECT id, email, raw_user_meta_data FROM auth.users
WHERE email = 'testuser+primary@example.com';
```

---

## Phase 2: Add 30 Relatives (Various Types)

### Relationship Types to Cover

| # | Name | Relationship | Contact Method | Special Flags |
|---|------|--------------|----------------|---------------|
| 1 | Maria Testova | Mother | Email | - |
| 2 | Ivan Testov | Father | Email | - |
| 3 | Anna Testova | Spouse | Email + Phone | Marriage date |
| 4 | Dmitry Testov | Son | Email | - |
| 5 | Elena Testova | Daughter | Email | - |
| 6 | Sergei Testov | Brother | Email | Full sibling |
| 7 | Olga Testova | Sister | Email | Full sibling |
| 8 | Viktor Testov | Half-Brother | Email | Paternal half |
| 9 | Nadia Testova | Half-Sister | Email | Maternal half |
| 10 | Boris Testov | Grandfather (paternal) | Email | - |
| 11 | Galina Testova | Grandmother (paternal) | Email | - |
| 12 | Mikhail Petrov | Grandfather (maternal) | Email | - |
| 13 | Svetlana Petrova | Grandmother (maternal) | Email | - |
| 14 | Andrei Testov | Uncle (paternal) | Email | - |
| 15 | Tatiana Testova | Aunt (paternal) | Email | - |
| 16 | Pavel Petrov | Uncle (maternal) | Email | - |
| 17 | Irina Petrova | Aunt (maternal) | Email | - |
| 18 | Nikolai Testov | Cousin (paternal) | Email | 1st cousin |
| 19 | Vera Testova | Cousin (paternal) | Email | 1st cousin |
| 20 | Roman Petrov | Cousin (maternal) | Email | 1st cousin |
| 21 | Ekaterina Petrova | Cousin (maternal) | Email | 1st cousin |
| 22 | Alexei Testov | Nephew | Email | Brother's son |
| 23 | Sofia Testova | Niece | Email | Sister's daughter |
| 24 | Great-Grandfather | Great-Grandparent | - | Deceased |
| 25 | Great-Grandmother | Great-Grandparent | - | Deceased |
| 26 | Second Cousin | 2nd Cousin | Email | Cousin degree: 2 |
| 27 | Grandchild | Grandchild | - | Via son |
| 28 | Step-Parent | Step-Parent | Email | - |
| 29 | Foster Sibling | Sibling | Email | Foster type |
| 30 | In-Law Father | Father-in-law | Email | Via spouse |

### Test 2.1: Add Immediate Family (Parents, Spouse, Children)

**Tab 1 (Inviter)** - Navigate to `/en/people`

#### 2.1.1 Add Mother
1. Click "Add Relative" button
2. Fill form:
   - First Name: `Maria`
   - Last Name: `Testova`
   - Relationship: `Parent` → `Mother`
   - Email: `testuser+mother@example.com`
3. Submit

**Expected:**
- Success toast notification
- Entry appears in relatives list
- `pending_relatives` record created with `status='pending'`

#### 2.1.2 Add Father
- Same process, relationship: `Parent` → `Father`
- Email: `testuser+father@example.com`

#### 2.1.3 Add Spouse
1. Relationship: `Spouse`
2. First Name: `Anna`
3. Email: `testuser+spouse@example.com`
4. Phone: `+1234567890` (optional)
5. Marriage Date: `2015-06-15`

#### 2.1.4 Add Children (Son & Daughter)
- Son: `Dmitry`, `testuser+son@example.com`, Relationship: `Child` → `Son`
- Daughter: `Elena`, `testuser+daughter@example.com`, Relationship: `Child` → `Daughter`

### Test 2.2: Add Siblings

#### 2.2.1 Full Siblings
- Brother: `Sergei`, `testuser+brother@example.com`
- Sister: `Olga`, `testuser+sister@example.com`
- Halfness: `Full`

#### 2.2.2 Half Siblings
- Half-Brother (paternal): `Viktor`, halfness: `Half`, lineage: `Paternal`
- Half-Sister (maternal): `Nadia`, halfness: `Half`, lineage: `Maternal`

### Test 2.3: Add Grandparents

#### Paternal Line
- Grandfather: `Boris Testov`, relationship: `Grandparent`, lineage: `Paternal`
- Grandmother: `Galina Testova`, lineage: `Paternal`

#### Maternal Line
- Grandfather: `Mikhail Petrov`, lineage: `Maternal`
- Grandmother: `Svetlana Petrova`, lineage: `Maternal`

### Test 2.4: Add Extended Family (Aunts, Uncles, Cousins)

#### Aunts & Uncles
Use indirect relationship method:
1. Select "Indirect relationship"
2. "Brother/Sister of my..." → select intermediate person (e.g., Father)

- Uncle (paternal): Brother of Father
- Aunt (paternal): Sister of Father
- Uncle (maternal): Brother of Mother
- Aunt (maternal): Sister of Mother

#### First Cousins
1. Use kinship search: "сын дяди" (son of uncle)
2. Or manually: Indirect → Child of → Uncle

Add 4 first cousins (2 paternal, 2 maternal)

### Test 2.5: Add Nephews/Nieces

- Nephew: `Alexei`, relationship via: Child of Brother (`Sergei`)
- Niece: `Sofia`, relationship via: Child of Sister (`Olga`)

### Test 2.6: Add Deceased Ancestors

1. Click "Add Relative"
2. Check "Deceased" checkbox
3. Fill name: `Pyotr Testov` (Great-Grandfather)
4. No email required
5. Birth date: `1920-03-15`

**Expected:**
- Record created with `status='verified'` (no invitation needed)
- No SMS/email sent

### Test 2.7: Add Complex Relationships

#### Second Cousin
- Kinship: "сын двоюродного брата" (son of first cousin)
- Cousin degree: 2
- Removed: 0

#### Grandchild (via Son)
1. Navigate to Son's profile or use indirect
2. Add: Child of `Dmitry` (son)
3. Name: `Baby Testov`
4. No email (minor)

#### Step-Parent
- Select "Step-Parent" relationship type
- Name: `Stepan Novikov`

#### Foster Sibling
- Relationship: Sibling
- Halfness: `Foster`

#### In-Law (Father-in-law)
- Indirect: Father of Spouse (`Anna`)
- Name: `Viktor Ivanov`

---

## Phase 3: Verify Invitation Records

### Test 3.1: Check Database State

```sql
-- Count all pending relatives
SELECT COUNT(*) as total,
       status,
       relationship_type
FROM pending_relatives
WHERE invited_by = (SELECT id FROM auth.users WHERE email = 'testuser+primary@example.com')
GROUP BY status, relationship_type
ORDER BY status, relationship_type;
```

**Expected:** 30 records total (mix of pending/verified for deceased)

### Test 3.2: Extract Invitation Tokens

```sql
SELECT
    first_name,
    last_name,
    relationship_type,
    email,
    invitation_token,
    status
FROM pending_relatives
WHERE invited_by = (SELECT id FROM auth.users WHERE email = 'testuser+primary@example.com')
  AND status = 'pending'
ORDER BY created_at;
```

Save tokens for Phase 4 testing.

---

## Phase 4: Invitation Acceptance Flow (Two-Tab Testing)

### Test 4.1: Accept Mother's Invitation

**Tab 2 (Invitee - New Incognito Window)**

1. Copy mother's invitation token from database
2. Navigate to: `http://localhost:3000/en/invite/{token}`

**Expected Display:**
- Inviter info: "Alexander Testov invited you"
- Relationship: "Mother"
- Pre-filled name: "Maria Testova"
- Accept / Edit / Reject buttons

3. Click "Accept"

**Expected:**
- Redirect to `/en/sign-up` with prefilled email
- `pending_relatives.status` changed to `'accepted'`

4. Complete registration:
   - Email: `testuser+mother@example.com`
   - Password: `TestMother123!`
   - Submit

5. After registration, navigate to `/en/app`

**Expected:**
- Dashboard shows connection to Alexander (son)
- Tree accessible at `/en/tree/{mother_user_id}`

### Test 4.2: Accept Spouse's Invitation with Edit

**Tab 2 (clear session or new incognito)**

1. Navigate to spouse's invitation link
2. Click "Edit" button
3. Modify:
   - First name: `Anna` → `Anastasia` (correction)
4. Click "Save" then "Accept"

**Expected:**
- `pending_relatives` record updated with corrected name
- Redirect to registration

5. Complete registration as spouse

### Test 4.3: Reject Invitation

**Tab 2**

1. Navigate to uncle's invitation link
2. Click "Reject"

**Expected:**
- `pending_relatives.status` = `'rejected'`
- Return to homepage or rejection confirmation

### Test 4.4: Accept Multiple Family Members

Repeat acceptance flow for:
- Father
- Son
- Daughter
- Brother
- At least one grandparent
- At least one cousin

Ensure each gets their own account and can view their tree.

---

## Phase 5: Tree Visualization Verification

### Test 5.1: View Tree as Primary User

**Tab 1 (Alexander - Primary)**

1. Navigate to `/en/tree/{alexander_id}`

**Expected:**
- Alexander at center
- Parents (Maria, Ivan) above
- Spouse (Anna) connected
- Children (Dmitry, Elena) below
- Siblings to the side
- Grandparents in upper levels (if depth allows)
- All accepted relatives visible
- Pending relatives shown with indicator

### Test 5.2: View Tree as Accepted Invitee (Mother)

**Tab 2 (Maria - Mother)**

1. Log in as mother: `testuser+mother@example.com`
2. Navigate to `/en/tree/{maria_id}` (or "My Tree")

**Expected:**
- **Maria at center** (key test!)
- Parents above (Boris, Galina - her parents)
- Alexander (son) below
- Alexander's children (her grandchildren) below that
- Spouse (Ivan - Alexander's father) connected

### Test 5.3: View Tree as Grandchild

**Tab 2 (if grandchild accepted invitation)**

1. Navigate to grandchild's tree view
2. Verify 4+ generations visible:
   - Great-grandparents at top
   - Grandparents
   - Parents
   - Self (grandchild at center)

### Test 5.4: Switch Focus (Mini-Tree Feature)

1. On tree page, hover over spouse node
2. Click mini-tree in corner

**Expected:**
- Main tree switches to spouse's perspective
- Original person now in mini-tree corner

---

## Phase 6: Edge Cases & Error Handling

### Test 6.1: Duplicate Invitation Prevention

1. Try to add same person (same email) again
2. **Expected:** 409 error, "This person has already been invited"

### Test 6.2: Expired Token

1. Manually set a token's status to 'expired' in database
2. Visit that invitation link
3. **Expected:** Error message, cannot accept

### Test 6.3: Rate Limiting

1. Attempt to send 26+ invitations within 24 hours
2. **Expected:** 429 error after limit reached

### Test 6.4: Invalid Token

1. Visit `/en/invite/invalid-uuid-here`
2. **Expected:** 404 or friendly error page

### Test 6.5: Already Used Token

1. Accept an invitation
2. Try to visit same link again
3. **Expected:** Message indicating already accepted

---

## Phase 7: Cross-Account Relationship Verification

### Test 7.1: Two-Way Relationship Confirmation

After both primary and mother accept:

1. **As Alexander:** View relationships list - shows Maria as Mother (verified)
2. **As Maria:** View relationships list - shows Alexander as Son (verified)

### Test 7.2: Relationship Path Finder

1. Navigate to `/en/relationship-finder`
2. Select two distant relatives (e.g., cousin and grandmother)
3. Verify path is calculated correctly

---

## Verification Checklist

### Database State

| Check | Query | Expected |
|-------|-------|----------|
| Total invitations sent | `SELECT COUNT(*) FROM pending_relatives WHERE invited_by = ?` | 30 |
| Accepted invitations | `SELECT COUNT(*) FROM pending_relatives WHERE status = 'accepted'` | ≥ 10 |
| Rejected invitations | `SELECT COUNT(*) FROM pending_relatives WHERE status = 'rejected'` | ≥ 1 |
| Verified (deceased) | `SELECT COUNT(*) FROM pending_relatives WHERE status = 'verified'` | ≥ 2 |
| New user accounts | `SELECT COUNT(*) FROM auth.users WHERE email LIKE 'testuser+%'` | ≥ 10 |

### UI State

| Check | Location | Expected |
|-------|----------|----------|
| Inviter's tree shows all connections | `/tree/{inviter_id}` | Multi-generational tree |
| Invitee's tree centered on self | `/tree/{invitee_id}` | Self at center |
| Pending relatives indicator | People page | Shows pending count |
| Notifications for acceptances | Notification bell | New acceptance alerts |

---

## Cleanup Script

After testing, clean up test data:

```sql
-- Delete test users (cascade will handle relationships)
DELETE FROM auth.users WHERE email LIKE 'testuser+%';

-- Or keep for future testing and just reset pending_relatives
UPDATE pending_relatives
SET status = 'pending', updated_at = NOW()
WHERE invited_by IN (SELECT id FROM auth.users WHERE email LIKE 'testuser+%');
```

---

## Automated Test Script (Optional)

For CI/CD, create Playwright tests:

```typescript
// tests/e2e/invitation-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Invitation Flow', () => {
  test('complete invitation lifecycle', async ({ browser }) => {
    // Create two browser contexts
    const inviterContext = await browser.newContext();
    const inviteeContext = await browser.newContext();

    const inviterPage = await inviterContext.newPage();
    const inviteePage = await inviteeContext.newPage();

    // ... implement test steps
  });
});
```

---

## Success Criteria

The test is **PASSED** when:

1. ✅ Primary user can add 30 relatives of all types
2. ✅ Invitations are created with unique tokens
3. ✅ SMS/Email sending works (or gracefully degrades)
4. ✅ Invitees can view and accept invitations
5. ✅ Accepted invitees can create accounts
6. ✅ Each user's tree centers on themselves
7. ✅ Relationships appear correctly from both perspectives
8. ✅ Multi-generational trees render properly
9. ✅ Edge cases handled gracefully

---

## Notes

- **Email Delivery:** In development, emails may be logged to console instead of sent
- **SMS Delivery:** Requires Twilio credentials; will skip if not configured
- **Tree Depth:** Default is 4 levels; adjust `depth` param for more generations
- **Performance:** Large trees (100+ nodes) may need layout optimization
