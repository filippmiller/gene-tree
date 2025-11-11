# 👤 Profile Form - Name/Surname Loading Issue

## 📋 Problem
When user opens `/family-profile`, the "Имя" (first name) and "Фамилия" (last name) fields are empty, even though data exists in the database.

---

## 🔄 Data Flow (How It Should Work)

### **1. Server loads profile data**
📄 **File**: `src/app/[locale]/(protected)/family-profile/page.tsx` (lines 22-26)

```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

- Fetches entire `user_profiles` row
- Should include: `first_name`, `last_name`, `middle_name`, etc.

### **2. Server passes data to component**
📄 **File**: `src/app/[locale]/(protected)/family-profile/page.tsx` (line 42)

```typescript
<ProfileForm initialData={profile} userId={user.id} profileId={user.id} />
```

- `initialData` contains profile object
- Example: `{ first_name: "Filip", last_name: "Smith", ... }`

### **3. ProfileForm passes to BasicInfoSection**
📄 **File**: `src/components/profile/ProfileForm.tsx` (line 58)

```typescript
<BasicInfoSection initialData={initialData} userId={userId} />
```

### **4. BasicInfoSection initializes form state**
📄 **File**: `src/components/profile/BasicInfoSection.tsx` (lines 15-22)

```typescript
const [formData, setFormData] = useState({
  first_name: initialData?.first_name || '',
  last_name: initialData?.last_name || '',
  middle_name: initialData?.middle_name || '',
  maiden_name: initialData?.maiden_name || '',
  gender: initialData?.gender || '',
  birth_date: initialData?.birth_date || '',
});
```

⚠️ **PROBLEM**: This only runs ONCE when component mounts. If `initialData` arrives later (async), state won't update!

---

## 🐛 Root Cause

React's `useState` **only uses the initial value on first render**.

If the parent component (`ProfileForm`) receives `initialData` asynchronously:
1. First render: `initialData = undefined` → form fields empty
2. Second render: `initialData = { first_name: "Filip", ... }` → **state not updated!**

---

## ✅ Solution: Add useEffect

📄 **File**: `src/components/profile/BasicInfoSection.tsx`

Add this after the `useState` declaration:

```typescript
import { useState, useEffect } from 'react';

// ... existing useState ...

// Sync formData when initialData changes
useEffect(() => {
  if (initialData) {
    setFormData({
      first_name: initialData.first_name || '',
      last_name: initialData.last_name || '',
      middle_name: initialData.middle_name || '',
      maiden_name: initialData.maiden_name || '',
      gender: initialData.gender || '',
      birth_date: initialData.birth_date || '',
    });
  }
}, [initialData]);
```

This will update `formData` whenever `initialData` changes.

---

## 🔍 How to Debug

### **Step 1: Check server-side data**
Add logging to profile page:

📄 `src/app/[locale]/(protected)/family-profile/page.tsx`
```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', user.id)
  .single();

console.log('[PROFILE-PAGE] Loaded profile:', profile);
// Should print: { first_name: "...", last_name: "...", ... }
```

### **Step 2: Check component props**
Add logging to BasicInfoSection:

📄 `src/components/profile/BasicInfoSection.tsx`
```typescript
export default function BasicInfoSection({ initialData, userId }: Props) {
  console.log('[BASIC-INFO] Received initialData:', initialData);
  // Should print on mount AND when data arrives
  
  const [formData, setFormData] = useState({...});
  // ...
}
```

### **Step 3: Check form state**
```typescript
useEffect(() => {
  console.log('[BASIC-INFO] Current formData:', formData);
}, [formData]);
```

---

## 📁 Key Files for Name/Surname Loading

| Purpose | File Path | Key Lines |
|---------|-----------|-----------|
| Server data fetch | `src/app/[locale]/(protected)/family-profile/page.tsx` | 22-26 |
| Pass to ProfileForm | `src/app/[locale]/(protected)/family-profile/page.tsx` | 42 |
| Pass to BasicInfo | `src/components/profile/ProfileForm.tsx` | 58 |
| Form initialization | `src/components/profile/BasicInfoSection.tsx` | 15-22 |
| Form inputs | `src/components/profile/BasicInfoSection.tsx` | 95-116 |
| Save handler | `src/components/profile/BasicInfoSection.tsx` | 26-42 |

---

## 🧪 Test Cases

### **Test 1: Empty Profile (New User)**
1. User has no profile data in database
2. Form should show empty fields
3. User fills in name → clicks "Сохранить"
4. Data saved to database
5. Reload page → fields should be filled

### **Test 2: Existing Profile**
1. User has profile: `{ first_name: "Filip", last_name: "Smith" }`
2. Open `/family-profile`
3. Fields should be pre-filled with "Filip" and "Smith"
4. User edits → clicks "Сохранить"
5. Changes saved

### **Test 3: Fast Navigation**
1. Open profile page
2. Immediately click another link (before data loads)
3. Go back to profile page
4. Fields should be filled (not empty)

---

## 🔧 Common Issues

### Issue 1: Fields empty on first load
**Cause**: `initialData` arrives after component mount
**Fix**: Add `useEffect` to sync state

### Issue 2: Fields don't update after saving
**Cause**: `handleSave` doesn't update local state
**Fix**: After successful save:
```typescript
const { error } = await supabase
  .from('user_profiles')
  .update(formData)
  .eq('id', userId);

if (!error) {
  // State is already updated, just exit edit mode
  setIsEditing(false);
}
```

### Issue 3: Changes lost on reload
**Cause**: Save button doesn't actually save
**Fix**: Check network tab (F12) for failed requests

---

## 📝 Next Steps

1. Add `useEffect` to `BasicInfoSection.tsx`
2. Add console logs to track data flow
3. Test with existing user profile
4. Verify data persists after reload

---

## 🚨 Quick Fix (Manual Test)

If you want to test if it's a data issue or UI issue:

```sql
-- Check your profile in database
SELECT id, first_name, last_name, middle_name, gender, birth_date
FROM user_profiles
WHERE id = 'YOUR_USER_ID';

-- If empty, insert test data
UPDATE user_profiles
SET first_name = 'Test', last_name = 'User'
WHERE id = 'YOUR_USER_ID';
```

Then reload page. If fields still empty → UI problem. If filled → data problem.
