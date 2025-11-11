# 📝 Manual Migration Instructions

## Problem
Cannot connect to Supabase via CLI/Node.js due to IPv6-only direct connection.

## Solution
Apply migration manually via Supabase Dashboard SQL Editor.

## Steps:

### 1. Open Supabase Dashboard
https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp/editor

### 2. Go to SQL Editor
Left sidebar → SQL Editor → New Query

### 3. Copy Migration SQL
Copy **ALL** content from file:
```
supabase/migrations/0016_merge_tables_with_flags.sql
```

### 4. Paste and Execute
- Paste the SQL into the query editor
- Click "Run" button
- Wait for completion (~5-10 seconds)

### 5. Verify
Run this query to verify columns were added:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pending_relatives' 
  AND column_name IN ('is_pending', 'is_verified', 'is_temporary')
ORDER BY column_name;
```

Expected result:
```
column_name    | data_type
---------------+----------
is_pending     | boolean
is_temporary   | boolean
is_verified    | boolean
```

### 6. Check Data
```sql
SELECT 
  first_name, 
  last_name, 
  relationship_type, 
  is_pending, 
  is_verified, 
  is_temporary
FROM pending_relatives
LIMIT 5;
```

All existing records should have:
- `is_pending = true`
- `is_verified = false`
- `is_temporary = false`

## After Migration

The app will automatically:
- ✅ Show ALL relatives (pending + verified) in Relations page
- ✅ Show complete family tree in Tree View
- ✅ Support filtering by status flags (future feature)

## If Issues

Contact me if you see any errors during migration. The SQL is designed to be idempotent (safe to run multiple times).
