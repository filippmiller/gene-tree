# Migrations to Apply

Based on the error messages from your dev server, the following migrations need to be applied to your production Supabase database:

## ⚠️ Missing Migrations

### 1. **0027_notifications.sql** ❌ NOT APPLIED
**Error:** `Could not find the table 'public.notification_recipients' in the schema cache`

**What it creates:**
- `notifications` table - Stores notification events
- `notification_recipients` table - Tracks who receives each notification
- `get_family_circle_profile_ids()` function - Returns family members for notifications

**Impact:** Notifications feature is broken without this.

---

### 2. **0028_voice_stories.sql** ❓ UNKNOWN STATUS
**What it creates:**
- `voice_stories` table - Stores audio recordings/stories
- Related storage buckets and RLS policies

**Impact:** Voice stories feature won't work without this.

---

### 3. **0029_spouse_relationship_fields.sql** ✅ APPLIED (you just ran this)
**What it creates:**
- Adds `role_for_a`, `role_for_b` columns to `pending_relatives`
- Adds `marriage_date`, `divorce_date` columns
- Updates `gt_v_union` view

**Impact:** Spouse & mini-tree feature needs this.

---

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project: `mbntpsfllwhlnzuzspvp`
3. Navigate to **SQL Editor**
4. For each migration:
   - Open the migration file locally
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**

### Option 2: Via SQL Files (Batch)

Copy and run this combined SQL in Supabase dashboard:

```sql
-- First, check if tables already exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notifications', 'notification_recipients', 'voice_stories');
```

If any are missing, run the corresponding migration file.

---

## Priority Order

1. **HIGH PRIORITY:** `0027_notifications.sql` - Blocking current app functionality
2. **MEDIUM:** `0028_voice_stories.sql` - Feature-specific, not blocking
3. **DONE:** `0029_spouse_relationship_fields.sql` - Already applied

---

## After Applying

1. Restart your dev server (or it will auto-reload)
2. Regenerate TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id mbntpsfllwhlnzuzspvp --schema public > src/lib/types/supabase_fresh.ts
   ```
3. Run the type injection scripts:
   ```bash
   node scripts/add-notifications-types.mjs
   node scripts/add-function-types.mjs
   ```

---

## Files to Apply

- [0027_notifications.sql](file:///c:/dev/gene-tree/supabase/migrations/0027_notifications.sql)
- [0028_voice_stories.sql](file:///c:/dev/gene-tree/supabase/migrations/0028_voice_stories.sql)
- [0029_spouse_relationship_fields.sql](file:///c:/dev/gene-tree/supabase/migrations/0029_spouse_relationship_fields.sql) ✅ Done
