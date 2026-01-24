# Invitation Flow - Manual Test Checklist

## Quick Start

```bash
# Start dev server
npm run dev

# Run Playwright tests
npx playwright test tests/e2e/invitation-flow.spec.ts --headed
```

---

## Pre-Test Setup

- [ ] Dev server running at `http://localhost:3000`
- [ ] Database accessible
- [ ] Open **Tab 1** (Inviter) - Chrome/Firefox
- [ ] Open **Tab 2** (Invitee) - Incognito window

---

## Phase 1: Registration

### Tab 1 - Create Primary User
- [ ] Go to `/en/sign-up`
- [ ] Register: `Alexander Testov` / `test+primary@example.com`
- [ ] Verify redirect to dashboard
- [ ] Note user ID: `_____________________`

---

## Phase 2: Add 30 Relatives

Navigate to `/en/people` in Tab 1.

### Immediate Family
| # | Name | Relationship | Email | Done |
|---|------|--------------|-------|------|
| 1 | Maria Testova | Mother | test+mother@... | [ ] |
| 2 | Ivan Testov | Father | test+father@... | [ ] |
| 3 | Anna Testova | Spouse | test+spouse@... | [ ] |
| 4 | Dmitry Testov | Son | test+son@... | [ ] |
| 5 | Elena Testova | Daughter | test+daughter@... | [ ] |

### Siblings
| # | Name | Relationship | Special | Done |
|---|------|--------------|---------|------|
| 6 | Sergei Testov | Brother | Full | [ ] |
| 7 | Olga Testova | Sister | Full | [ ] |
| 8 | Viktor Testov | Half-Brother | Paternal | [ ] |
| 9 | Nadia Testova | Half-Sister | Maternal | [ ] |

### Grandparents
| # | Name | Lineage | Done |
|---|------|---------|------|
| 10 | Boris Testov | Paternal | [ ] |
| 11 | Galina Testova | Paternal | [ ] |
| 12 | Mikhail Petrov | Maternal | [ ] |
| 13 | Svetlana Petrova | Maternal | [ ] |

### Aunts & Uncles
| # | Name | Lineage | Done |
|---|------|---------|------|
| 14 | Andrei Testov | Paternal Uncle | [ ] |
| 15 | Tatiana Testova | Paternal Aunt | [ ] |
| 16 | Pavel Petrov | Maternal Uncle | [ ] |
| 17 | Irina Petrova | Maternal Aunt | [ ] |

### Cousins
| # | Name | Details | Done |
|---|------|---------|------|
| 18 | Nikolai Testov | 1st cousin, paternal | [ ] |
| 19 | Vera Testova | 1st cousin, paternal | [ ] |
| 20 | Roman Petrov | 1st cousin, maternal | [ ] |
| 21 | Ekaterina Petrova | 1st cousin, maternal | [ ] |

### Nephews/Nieces
| # | Name | Via | Done |
|---|------|-----|------|
| 22 | Alexei Testov | Brother's son | [ ] |
| 23 | Sofia Testova | Sister's daughter | [ ] |

### Deceased Ancestors (No Email)
| # | Name | Birth Date | Done |
|---|------|------------|------|
| 24 | Pyotr Testov | 1920-03-15 | [ ] |
| 25 | Elizaveta Testova | 1925-07-22 | [ ] |

### Complex Relationships
| # | Name | Relationship | Done |
|---|------|--------------|------|
| 26 | Kirill Testov | 2nd Cousin | [ ] |
| 27 | Baby Testov | Grandchild | [ ] |
| 28 | Stepan Novikov | Step-Parent | [ ] |
| 29 | Misha Testov | Foster Sibling | [ ] |
| 30 | Viktor Ivanov | In-Law | [ ] |

---

## Phase 3: Database Verification

```sql
-- Run in Supabase SQL editor
SELECT COUNT(*) as total FROM pending_relatives
WHERE invited_by = '[PRIMARY_USER_ID]';
-- Expected: 30
```

- [ ] Total records created: `____` / 30
- [ ] Pending invitations: `____`
- [ ] Verified (deceased): `____`

---

## Phase 4: Accept Invitations (Tab 2)

### Get Invitation Token
```sql
SELECT first_name, invitation_token
FROM pending_relatives
WHERE status = 'pending'
LIMIT 5;
```

### Test 1: Accept Mother's Invitation
- [ ] Copy mother's token: `_____________________`
- [ ] Tab 2: Go to `/en/invite/[token]`
- [ ] Verify shows "Alexander invited you"
- [ ] Verify shows "Maria Testova" as mother
- [ ] Click "Accept"
- [ ] Redirect to sign-up
- [ ] Complete registration
- [ ] Verify dashboard access

### Test 2: Accept with Edit (Spouse)
- [ ] Copy spouse's token
- [ ] Go to invitation page
- [ ] Click "Edit"
- [ ] Change name "Anna" → "Anastasia"
- [ ] Save and Accept
- [ ] Complete registration
- [ ] Verify corrected name saved

### Test 3: Reject Invitation (Uncle)
- [ ] Copy uncle's token
- [ ] Go to invitation page
- [ ] Click "Reject"
- [ ] Verify status changed to 'rejected'

### Test 4: Accept 5+ More Relatives
- [ ] Father: `____`
- [ ] Son: `____`
- [ ] Daughter: `____`
- [ ] Brother: `____`
- [ ] Grandparent: `____`

---

## Phase 5: Tree Visualization

### Tab 1: Primary User's Tree
- [ ] Go to `/en/tree/[primary_id]`
- [ ] Alexander at center
- [ ] Parents visible above
- [ ] Spouse connected
- [ ] Children visible below
- [ ] Siblings visible

### Tab 2: Mother's Tree (Logged in as Maria)
- [ ] Go to `/en/tree/[mother_id]`
- [ ] **Maria at center** (CRITICAL)
- [ ] Alexander (son) visible below
- [ ] Grandparents visible above (if connected)

### Tab 2: Other Perspectives
- [ ] Log in as Father → Tree centered on Father
- [ ] Log in as Spouse → Tree centered on Spouse
- [ ] Each user sees themselves at center

---

## Phase 6: Edge Cases

| Test | Action | Expected | Pass |
|------|--------|----------|------|
| Invalid token | `/en/invite/fake-token` | Error message | [ ] |
| Duplicate invite | Add same email again | 409 error | [ ] |
| Rate limit | Send 26 invites fast | 429 error | [ ] |
| Used token | Revisit accepted invite | Already used message | [ ] |

---

## Final Verification

| Item | Status |
|------|--------|
| All 30 relatives added | [ ] |
| 5+ invitations accepted | [ ] |
| 1 invitation rejected | [ ] |
| Primary tree shows family | [ ] |
| Invitee trees centered correctly | [ ] |
| Edge cases handled | [ ] |

---

## Test Result

**Date:** _______________
**Tester:** _______________
**Environment:** _______________

| Phase | Status |
|-------|--------|
| Registration | ⬜ Pass / ⬜ Fail |
| Add Relatives | ⬜ Pass / ⬜ Fail |
| Accept Invitations | ⬜ Pass / ⬜ Fail |
| Tree Visualization | ⬜ Pass / ⬜ Fail |
| Edge Cases | ⬜ Pass / ⬜ Fail |

**Overall:** ⬜ PASS / ⬜ FAIL

**Notes:**
```




```
