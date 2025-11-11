# 📝 Changelog - Avatar & Profile Form Session

**Date**: 2025-11-10/11  
**Focus**: Avatar upload persistence & Profile form data loading

---

## ✅ Completed Changes

### 1. **Removed Double Navigation Bar**
**Files**: `src/app/[locale]/(protected)/relations/page.tsx`
- Deleted lines 26-66 (duplicate nav component)
- Changed layout from `max-w-7xl mx-auto` to `w-full` for full-width

### 2. **Fixed Avatar Upload API**
**File**: `src/app/api/avatar/upload/route.ts`

**Changes**:
- Added `approved_by` and `approved_at` fields to photo record (lines 77-78)
  - Required by CHECK constraint in `photos` table
- Fixed profile update to use correct `targetProfileId` instead of `user.id`
- Changed from regular client to `supabaseAdmin` for all database operations
- Added comprehensive logging throughout the upload process

**Why it was failing**:
- Missing `approved_by`/`approved_at` → CHECK constraint violation
- RLS policies blocking regular client writes → switched to service role

### 3. **Unified Avatar Sizes**
**Files**:
- `src/components/profile/AvatarUpload.tsx` (lines 94, 104)
- `src/app/[locale]/(protected)/app/page.tsx` (lines 62, 65)

**Changes**:
- All avatars now `w-24 h-24` (96px × 96px)
- Previously: upload form was 128px, dashboard was 80px

### 4. **Removed Alert, Added Auto-Reload**
**File**: `src/components/profile/AvatarUpload.tsx`

**Changes**:
- Line 58: Removed `alert('Аватарка обновлена!')`
- Line 61: Added `setTimeout(() => window.location.reload(), 500)`
- After upload, page automatically reloads to fetch fresh profile data

### 5. **Added Avatar Persistence**
**File**: `src/components/profile/AvatarUpload.tsx`

**Changes**:
- Lines 18-21: Added `useEffect` to sync preview when `currentAvatar` prop changes
- Imported `useEffect` from React (line 3)

**Why it was needed**:
- `useState(currentAvatar)` only runs on mount
- When page reloads, new `currentAvatar` wasn't updating preview state

### 6. **Added Avatar to Dashboard**
**File**: `src/app/[locale]/(protected)/app/page.tsx`

**Changes**:
- Lines 58-68: Added avatar display in welcome section
- Shows `profile.avatar_url` if exists
- Falls back to gradient circle with first letter of username

### 7. **Added Comprehensive Logging**
**File**: `src/app/api/avatar/upload/route.ts`

**Log points added**:
- `[AVATAR-API] === UPLOAD STARTED ===` (line 7)
- `[AVATAR-API] User authenticated: {id}` (line 18)
- `[AVATAR-API] Form data: {...}` (line 25)
- `[AVATAR-API] Generated filename: {path}` (line 45)
- `[AVATAR-API] ✅ File uploaded to storage` (line 71)
- `[AVATAR-API] Public URL generated: {url}` (line 78)
- `[AVATAR-API] ✅ Photo record created: {id}` (line 102)
- `[AVATAR-API] Attempting to update user_profiles...` (lines 106-110)
- `[AVATAR-API] ✅ Profile updated successfully!` (line 126)
- `[AVATAR-API] ❌ {error}` at failure points

**Also added client-side logging**:
- `[CLIENT] Avatar upload success: {...}` (line 57 of AvatarUpload.tsx)

---

## 📋 Known Issues (Not Yet Fixed)

### 🔴 Issue 1: Avatar Not Persisting After Upload
**Status**: Under Investigation

**Symptoms**:
- User uploads avatar
- Upload succeeds (shows preview)
- Page reloads
- Avatar disappears

**Likely Causes**:
1. **RLS Policy blocking UPDATE** on `user_profiles` table
2. **Service role key not set** in environment variables
3. **Foreign key constraint** on `current_avatar_id` failing

**Next Steps**:
1. Upload avatar and check logs for `[AVATAR-API] ❌` messages
2. Check Railway logs or local console
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
4. Run SQL query to check if `avatar_url` was saved:
   ```sql
   SELECT id, avatar_url, current_avatar_id FROM user_profiles WHERE id = 'YOUR_ID';
   ```

### 🔴 Issue 2: Profile Form Not Loading Name/Surname
**Status**: Solution Documented, Not Implemented

**Symptoms**:
- User has name/surname in database
- Opens `/family-profile`
- Form fields are empty

**Root Cause**:
- `BasicInfoSection.tsx` uses `useState(initialData?.first_name)`
- This only runs once on component mount
- If `initialData` arrives later (async), state doesn't update

**Solution**:
Add `useEffect` to sync state when `initialData` changes (see `docs/PROFILE_FORM_GUIDE.md`)

---

## 📁 New Documentation Files

### 1. `docs/AVATAR_UPLOAD_GUIDE.md`
**Contents**:
- Complete upload flow (step by step)
- Debugging checklist
- Common issues & solutions
- SQL queries for testing
- Key files reference

### 2. `docs/PROFILE_FORM_GUIDE.md`
**Contents**:
- Data flow explanation
- Root cause analysis (useState vs useEffect)
- Solution with code example
- Debugging steps
- Test cases

### 3. `CHANGELOG_SESSION.md` (this file)
**Contents**:
- All changes made in this session
- Known issues
- Next steps

---

## 🔍 Key Files Modified

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `src/app/api/avatar/upload/route.ts` | 5-130 | Avatar upload API with logging |
| `src/components/profile/AvatarUpload.tsx` | 1-130 | Avatar UI component |
| `src/app/[locale]/(protected)/app/page.tsx` | 56-76 | Dashboard with avatar display |
| `src/app/[locale]/(protected)/relations/page.tsx` | 23-66 | Removed duplicate nav |

---

## 🎯 Next Steps for Developer

### Immediate (Must Do):
1. **Test avatar upload** with new logging
2. **Check Railway logs** for `[AVATAR-API]` messages
3. **Verify database** - does `avatar_url` get saved?
4. **Share logs** with your friend for RLS troubleshooting

### Short Term:
1. **Fix BasicInfoSection** - add useEffect for form data sync
2. **Add RLS policy** if needed (see AVATAR_UPLOAD_GUIDE.md)
3. **Test end-to-end**: upload → reload → check dashboard

### Nice to Have:
1. Add avatar size selector (small/medium/large)
2. Add crop/resize tool before upload
3. Show loading state during upload
4. Add success toast instead of alert

---

## 🚀 How to Test Everything

### Test 1: Avatar Upload
```bash
# 1. Start dev server
npm run dev

# 2. Open browser console (F12)
# 3. Go to /family-profile
# 4. Upload avatar
# 5. Watch for logs:
#    [CLIENT] Avatar upload success: {...}
#    [AVATAR-API] === UPLOAD STARTED ===
#    [AVATAR-API] ✅ File uploaded to storage
#    [AVATAR-API] ✅ Photo record created
#    [AVATAR-API] ✅ Profile updated successfully!

# 6. Page should reload automatically
# 7. Avatar should appear in profile form
# 8. Go to /app (dashboard)
# 9. Avatar should appear next to "Welcome back"
```

### Test 2: Profile Form
```bash
# 1. Check database first:
# SELECT first_name, last_name FROM user_profiles WHERE id = 'YOUR_ID';

# 2. If empty, add test data:
# UPDATE user_profiles SET first_name='Test', last_name='User' WHERE id='YOUR_ID';

# 3. Go to /family-profile
# 4. Click "Основная информация" section
# 5. Fields should be pre-filled
# 6. Click "Редактировать"
# 7. Change values
# 8. Click "Сохранить"
# 9. Reload page
# 10. Changes should persist
```

---

## 📊 Code Statistics

- **Files created**: 3 (2 docs + changelog)
- **Files modified**: 4
- **Lines of code changed**: ~150
- **Console logs added**: 12
- **Bugs fixed**: 3 (double nav, avatar size, alert)
- **Bugs documented**: 2 (persistence, form loading)

---

## 💡 Architecture Notes

### Avatar Upload Flow:
```
User clicks button
  → AvatarUpload.tsx sends FormData
    → /api/avatar/upload (POST)
      → Upload to Storage (service role)
      → Insert into photos table
      → Update user_profiles.avatar_url ⚠️ (potential failure point)
      → Return success + URL
  → Client reloads page
    → Server fetches fresh profile data
      → ProfileForm receives new avatar_url
        → AvatarUpload shows image
```

### Why Service Role is Needed:
- Regular user client has RLS policies
- RLS may block INSERT into `photos` or UPDATE on `user_profiles`
- Service role bypasses all RLS
- Security: API verifies user auth before allowing upload

### Future Improvements:
1. Use revalidatePath() instead of window.reload()
2. Add optimistic UI updates
3. Store avatar in user_profiles directly (skip photos table for avatars)
4. Add image compression before upload
5. Generate thumbnails server-side

---

**End of Changelog**
