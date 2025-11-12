# Supabase Connection Report - gene-tree

**Date**: 2025-11-12 11:41 UTC  
**Status**: ✅ Connected via REST API | ❌ Cannot execute raw SQL

---

## ✅ Working Connection Method

**Method**: Supabase JavaScript Client (REST API)  
**Library**: `@supabase/supabase-js`

### Connection Code:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Query tables
const { data, error } = await supabase.from('user_profiles').select('*');
```

### Verified Results:
- ✅ Table `user_profiles` exists
- ✅ 8 rows in table
- ✅ Column `role` exists for admin checks
- ✅ Can SELECT/INSERT/UPDATE via REST API

---

## ❌ Failed Connection Methods

### 1. PostgreSQL Pooler (Transaction Mode - Port 6543)
**URL**: `postgresql://postgres.mbntpsfllwhlnzuzspvp:Airbus380Airbud3802024@aws-1-us-east-2.pooler.supabase.com:6543/postgres`

**Error**: `password authentication failed for user "postgres"`

**Root Cause**: PgBouncer transaction pooler strips username:
- Expected: `postgres.mbntpsfllwhlnzuzspvp`
- Received by server: `postgres` (dot treated as separator)

### 2. PostgreSQL Pooler (Session Mode - Port 5432)
**URL**: `postgresql://postgres.mbntpsfllwhlnzuzspvp:Airbus380Airbud3802024@aws-1-us-east-2.pooler.supabase.com:5432/postgres`

**Error**: Same authentication error

**Root Cause**: Same username stripping issue

### 3. Direct Database Connection
**URL**: `postgresql://postgres:Airbus380Airbud3802024@db.mbntpsfllwhlnzuzspvp.supabase.co:5432/postgres`

**Error**: `ENOTFOUND db.mbntpsfllwhlnzuzspvp.supabase.co`

**Root Cause**: 
- DNS resolves via nslookup/ping
- Node.js cannot resolve (possibly IPv6 issue or Windows DNS cache)
- Might be blocked by firewall/VPN

### 4. PostgREST SQL Execution
**Method**: `POST /rest/v1/rpc/query`

**Error**: `Could not find the function public.query(query) in the schema cache`

**Root Cause**: PostgREST cannot execute arbitrary SQL - requires pre-defined functions

---

## 🔑 Complete Credentials (Test Environment)

### Supabase Project
```
Project Reference: mbntpsfllwhlnzuzspvp
Region: us-east-2 (aws-1-us-east-2)
Project URL: https://mbntpsfllwhlnzuzspvp.supabase.co
Dashboard: https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp
```

### API Keys
```
NEXT_PUBLIC_SUPABASE_URL=https://mbntpsfllwhlnzuzspvp.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTU5NjAsImV4cCI6MjA3ODA5MTk2MH0.esC4-YPgCGZ82RO6Iud3d6nPEK0UX3iT6enqBGz9_dE

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U
```

### Database Connection Strings
```
# Direct Connection (user: postgres)
SUPABASE_DB_DIRECT_URL=postgresql://postgres:Airbus380Airbud3802024@db.mbntpsfllwhlnzuzspvp.supabase.co:5432/postgres

# Session Pooler (user: postgres.mbntpsfllwhlnzuzspvp) - Port 5432
SUPABASE_DB_POOLER_URL=postgresql://postgres.mbntpsfllwhlnzuzspvp:Airbus380Airbud3802024@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Transaction Pooler (user: postgres.mbntpsfllwhlnzuzspvp) - Port 6543  
DATABASE_URL=postgresql://postgres.mbntpsfllwhlnzuzspvp:Airbus380Airbud3802024@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require

# Password
SUPABASE_DB_PASSWORD=Airbus380Airbud3802024
```

### Connection Parameters
```
Host (Pooler): aws-1-us-east-2.pooler.supabase.com
Host (Direct): db.mbntpsfllwhlnzuzspvp.supabase.co
Port (Session Pooler): 5432
Port (Transaction Pooler): 6543
Database: postgres
Username (Pooler): postgres.mbntpsfllwhlnzuzspvp
Username (Direct): postgres
Password: Airbus380Airbud3802024
SSL Mode: require
```

---

## 🚫 Why I Cannot Execute Raw SQL

### Limitation
Supabase PostgREST API does not support arbitrary SQL execution for security reasons.

### Available Methods:
1. **Supabase Dashboard SQL Editor** (Manual) ✅
   - URL: https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp/sql/new
   - Can execute any SQL
   - **REQUIRED** for migrations

2. **Supabase CLI** (via `supabase db push`) ❌
   - Requires local Docker
   - Already tried - has issues with unapplied migrations

3. **Direct psql connection** ❌
   - Hostname doesn't resolve from this machine
   - Would require PostgreSQL client

4. **Pre-defined RPC Functions** ✅
   - Can create function via Dashboard
   - Then call via API
   - Overkill for one-time migration

---

## ✅ Recommended Action

### Apply SQL migration manually in Dashboard:

1. Open: https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp/sql/new

2. Paste and run:

```sql
-- Fix RLS Infinite Recursion
DROP POLICY IF EXISTS "Admins have full access" ON public.user_profiles;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$ 
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'); 
$$;

DROP POLICY IF EXISTS "media_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_update_policy" ON storage.objects;

CREATE POLICY "media_bucket_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_bucket_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_bucket_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_bucket_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
```

3. Click "Run" or press Ctrl+Enter

4. Verify "Success. No rows returned"

5. Test avatar upload in application

---

## 📁 Files Created

- `check-table-exists.mjs` - Verify table via REST API ✅
- `check-rls-policies.mjs` - Attempt to query policies ❌
- `test-supabase-conn.mjs` - Test PostgreSQL connection ❌
- `apply-rls-fix.mjs` - Attempt to apply SQL via API ❌
- `scripts/db_ro_query.mjs` - Read-only query script ❌

---

## 🎯 Summary

**What Works**: 
- Supabase JS Client with REST API
- Can query/modify data via ORM-style API

**What Doesn't Work**:
- Direct PostgreSQL connections (hostname resolution)
- Pooler connections (username stripping)
- Raw SQL execution via API (security limitation)

**Solution**:
- Use Supabase Dashboard SQL Editor for migrations
- Use Supabase JS Client for data operations in code
- Keep DATABASE_URL for app connections (Next.js will use pooler)
