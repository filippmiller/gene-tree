# Smart Invite Guard - Manual Testing Guide

## Prerequisites

1. Dev server running: `npm run dev`
2. Logged in to the application at `http://localhost:3000`

---

## Test Scenarios

### Test 1: SELF_INVITE (Your own email)

**Steps:**
1. Go to Add Relative page (`/ru/dashboard` → Add Family Member)
2. Enter YOUR email address in the email field
3. Wait 500ms for validation

**Expected Result:**
- Red alert: "Вы не можете пригласить себя"
- Submit button disabled

---

### Test 2: OK_TO_INVITE (New email)

**Steps:**
1. Go to Add Relative page
2. Enter a random email: `random12345@example.com`
3. Wait 500ms for validation

**Expected Result:**
- No alert shown
- Submit button enabled (if other fields valid)

---

### Test 3: PENDING_INVITE (Email with existing invitation)

**Setup:**
First, create a pending invite in the database:
```sql
-- Run in Supabase Dashboard > SQL Editor
INSERT INTO pending_relatives (
  invited_by,
  email,
  first_name,
  last_name,
  relationship_type,
  status,
  invitation_token
) VALUES (
  'YOUR_USER_ID'::uuid,  -- Replace with your user ID
  'pending.test@example.com',
  'Pending',
  'TestPerson',
  'cousin',
  'pending',
  gen_random_uuid()
);
```

**Steps:**
1. Go to Add Relative page
2. Enter: `pending.test@example.com`
3. Wait 500ms for validation

**Expected Result:**
- Yellow/warning alert showing the pending invite
- "Send Reminder" button visible
- Submit button disabled

---

### Test 4: EXISTING_MEMBER (Family member's email)

**Requires:**
- Another user who is connected to your family tree

**Steps:**
1. Go to Add Relative page
2. Enter that family member's email
3. Wait 500ms for validation

**Expected Result:**
- Blue info alert showing their profile
- "View Profile" and "See How You're Related" buttons
- Submit button disabled

---

### Test 5: POTENTIAL_BRIDGE (External user's email)

**Requires:**
- Another Gene-Tree user who is NOT in your family tree

**Steps:**
1. Go to Add Relative page
2. Enter that user's email
3. Wait 500ms for validation

**Expected Result:**
- Blue info alert: "Someone with this email exists"
- "Send Connection Request" button
- Submit button disabled

---

## API Testing with cURL

If you have a session cookie, you can test directly:

```bash
# Get your session cookie from browser DevTools > Application > Cookies
# Look for: sb-mbntpsfllwhlnzuzspvp-auth-token

# Test self-invite
curl -X POST http://localhost:3000/api/invitations/check \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-mbntpsfllwhlnzuzspvp-auth-token=YOUR_TOKEN" \
  -d '{"email": "your@email.com"}'

# Test new email
curl -X POST http://localhost:3000/api/invitations/check \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-mbntpsfllwhlnzuzspvp-auth-token=YOUR_TOKEN" \
  -d '{"email": "random12345@example.com"}'

# Test by phone
curl -X POST http://localhost:3000/api/invitations/check \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-mbntpsfllwhlnzuzspvp-auth-token=YOUR_TOKEN" \
  -d '{"phone": "+1234567890"}'
```

---

## Expected API Responses

### OK_TO_INVITE
```json
{
  "status": "OK_TO_INVITE"
}
```

### SELF_INVITE
```json
{
  "status": "SELF_INVITE"
}
```

### EXISTING_MEMBER
```json
{
  "status": "EXISTING_MEMBER",
  "existingMember": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "...",
    "addedBy": { "id": "uuid", "firstName": "Jane", "lastName": "Doe" },
    "addedAt": "2024-01-15T...",
    "relationshipPath": "Your sibling"
  }
}
```

### PENDING_INVITE
```json
{
  "status": "PENDING_INVITE",
  "pendingInvite": {
    "id": "uuid",
    "firstName": "Pending",
    "lastName": "Person",
    "invitedBy": { "id": "uuid", "firstName": "You", "lastName": "Name" },
    "invitedAt": "2024-01-20T...",
    "status": "pending"
  }
}
```

### POTENTIAL_BRIDGE
```json
{
  "status": "POTENTIAL_BRIDGE",
  "bridgeCandidate": {
    "exists": true
  }
}
```

---

## Troubleshooting

### Alert not showing
- Check browser DevTools > Network for `/api/invitations/check` request
- Ensure email/phone is valid format
- Wait at least 500ms after typing

### 401 Unauthorized
- Make sure you're logged in
- Check that session cookie exists

### 500 Server Error
- Check server logs: `npm run dev` terminal
- Verify database connection

---

## Get Your User ID

Run in Supabase Dashboard > SQL Editor:
```sql
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```

Or in browser DevTools console:
```javascript
// If using Supabase client
const { data: { user } } = await supabase.auth.getUser();
console.log(user.id);
```
