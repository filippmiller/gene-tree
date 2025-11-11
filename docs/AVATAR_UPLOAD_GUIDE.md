# 🖼️ Avatar Upload - Technical Documentation

## 📋 Overview
This document explains how avatar upload works in the genealogy app and how to debug issues.

---

## 🔄 Upload Flow (Step by Step)

### **1. User selects file**
📄 **File**: `src/components/profile/AvatarUpload.tsx` (line 18)
- User clicks "Загрузить фото" button
- `<input type="file">` triggers `handleFileChange()`
- File validation: must be image, max 25MB

### **2. Client sends file to API**
📄 **File**: `src/components/profile/AvatarUpload.tsx` (line 36-44)
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('profileId', profileId);

const response = await fetch('/api/avatar/upload', {
  method: 'POST',
  body: formData,
});
```

### **3. Server receives upload**
📄 **File**: `src/app/api/avatar/upload/route.ts` (line 5)

#### 3.1 Authentication check
```typescript
const { data: { user } } = await supabase.auth.getUser();
```
- Verifies user is logged in
- Returns 401 if not authenticated

#### 3.2 Create admin client (bypass RLS)
```typescript
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```
⚠️ **Critical**: Uses service role key to bypass Row Level Security (RLS) policies

#### 3.3 Upload file to Supabase Storage
```typescript
await supabaseAdmin.storage
  .from('avatars')
  .upload(fileName, file);
```
- Bucket: `avatars` (public bucket)
- Path: `{user_id}/{random_uuid}.{ext}`
- Example: `abc123/7f8e9d0a-1b2c.jpg`

#### 3.4 Create photo record in database
```typescript
const { data: photo } = await supabaseAdmin
  .from('photos')
  .insert({
    bucket: 'avatars',
    path: fileName,
    uploaded_by: user.id,
    target_profile_id: profileId || user.id,
    type: 'avatar',
    status: 'approved',
    approved_by: user.id,
    approved_at: new Date().toISOString(),
    visibility: 'public',
  });
```
- **Table**: `photos`
- **Critical fields**: `approved_by` + `approved_at` (required by CHECK constraint)

#### 3.5 Update user profile ⚠️ **CRITICAL STEP**
```typescript
await supabaseAdmin
  .from('user_profiles')
  .update({ 
    current_avatar_id: photo.id,
    avatar_url: urlData.publicUrl 
  })
  .eq('id', targetProfileId);
```
- **Table**: `user_profiles`
- **Columns updated**:
  - `current_avatar_id` → FK to `photos.id`
  - `avatar_url` → Direct URL to image

### **4. Client receives response**
📄 **File**: `src/components/profile/AvatarUpload.tsx` (line 56)
```typescript
const data = await response.json();
console.log('[CLIENT] Avatar upload success:', data);
setPreview(data.url);
setTimeout(() => window.location.reload(), 500); // Reload to fetch fresh data
```

---

## 🐛 Debugging: Why Avatar Doesn't Persist

### **Check 1: Console Logs (Backend)**
Open Railway logs or local terminal and look for:

```
[AVATAR-API] === UPLOAD STARTED ===
[AVATAR-API] User authenticated: abc-123-def
[AVATAR-API] Form data: { fileName: 'image.jpg', fileSize: 123456, profileId: 'abc-123' }
[AVATAR-API] Generated filename: abc-123/uuid.jpg
[AVATAR-API] ✅ File uploaded to storage
[AVATAR-API] Public URL generated: https://...
[AVATAR-API] ✅ Photo record created: photo-id-123
[AVATAR-API] Attempting to update user_profiles... { targetProfileId: '...', ... }
[AVATAR-API] ✅ Profile updated successfully! Data: [...]
```

**If you see ❌ at any step**, that's where the problem is!

### **Check 2: Database State**
Open Supabase Dashboard → SQL Editor and run:

```sql
-- Check if file was uploaded
SELECT * FROM storage.objects 
WHERE bucket_id = 'avatars' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if photo record exists
SELECT * FROM photos 
WHERE uploaded_by = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if profile was updated
SELECT id, avatar_url, current_avatar_id 
FROM user_profiles 
WHERE id = 'YOUR_USER_ID';
```

### **Check 3: RLS Policies**
The most common issue is RLS blocking the UPDATE operation.

```sql
-- Check current policies on user_profiles
SELECT * FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Test if service role can update
-- (Run this in SQL Editor with service role key)
UPDATE user_profiles 
SET avatar_url = 'test' 
WHERE id = 'YOUR_USER_ID';
```

**If this fails**, the service role doesn't have permission!

---

## 🔧 Common Issues & Solutions

### Issue 1: "Profile update FAILED" in logs
**Cause**: RLS policy blocking UPDATE on `user_profiles`

**Solution A**: Add permissive policy
```sql
CREATE POLICY "Service role can update profiles"
ON user_profiles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

**Solution B**: Disable RLS (⚠️ not recommended for production)
```sql
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

### Issue 2: Avatar shows after upload but disappears after reload
**Cause**: `avatar_url` not saved to database

**Debug**:
1. Check logs: Does `[AVATAR-API] ✅ Profile updated` appear?
2. Query database: `SELECT avatar_url FROM user_profiles WHERE id = '...'`
3. If NULL → UPDATE is failing silently

### Issue 3: "column owner_user_id does not exist"
**Cause**: Code references wrong column name

**Fix**: Check migration file `0022_media_storage_system.sql`
- Correct columns: `uploaded_by`, `target_profile_id`
- NOT: `owner_user_id`

---

## 📁 Key Files Reference

| Purpose | File Path | Key Lines |
|---------|-----------|-----------|
| Upload UI | `src/components/profile/AvatarUpload.tsx` | 18-65 |
| API endpoint | `src/app/api/avatar/upload/route.ts` | Entire file |
| Dashboard display | `src/app/[locale]/(protected)/app/page.tsx` | 58-68 |
| Profile page | `src/app/[locale]/(protected)/family-profile/page.tsx` | 22-42 |
| DB schema | `supabase/migrations/0022_media_storage_system.sql` | 97-143 |

---

## 🎯 Expected Behavior (When Working)

1. User uploads avatar → "Loading..." spinner
2. After 500ms → Page reloads automatically
3. Avatar appears in:
   - ✅ Profile form (top of page)
   - ✅ Dashboard welcome section
   - ✅ Navigation bar (future)

---

## 🔍 How to Test

### Manual Test:
1. Go to `/family-profile`
2. Click "Загрузить фото" in "Фотография профиля" section
3. Select an image
4. Watch console logs (F12 → Console)
5. Page should reload
6. Avatar should appear
7. Go to dashboard → Avatar should appear there too
8. Reload page → Avatar should persist

### Expected Logs:
```
[CLIENT] Avatar upload success: { success: true, photoId: '...', url: '...' }
[AVATAR-API] === UPLOAD STARTED ===
[AVATAR-API] ✅ File uploaded to storage
[AVATAR-API] ✅ Photo record created
[AVATAR-API] ✅ Profile updated successfully!
```

---

## 🚨 Emergency Workaround

If avatar upload keeps failing, use direct database insert:

```sql
-- 1. Upload file manually via Supabase Storage UI
-- 2. Get the public URL
-- 3. Update profile directly:

UPDATE user_profiles 
SET avatar_url = 'https://YOUR_SUPABASE_URL/storage/v1/object/public/avatars/YOUR_FILE_PATH'
WHERE id = 'YOUR_USER_ID';
```

---

## 📝 Next Steps (For Developer)

1. Upload avatar and check Railway/console logs
2. Share full log output with your friend
3. Check Supabase dashboard → Table Editor → `user_profiles` → your row
4. Does `avatar_url` have a value? 
5. If NO → RLS issue
6. If YES → Client-side cache issue
