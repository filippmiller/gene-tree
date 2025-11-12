# Help Needed: Supabase Connection & RLS Migration Issues

**Date**: 2025-11-12  
**Project**: gene-tree (Next.js 15 + Supabase)  
**Problem**: Cannot connect to PostgreSQL to apply RLS migration, but REST API works

---

## 🎯 Goal

Apply SQL migration to fix "infinite recursion" error in RLS policies that blocks avatar uploads.

---

## 🔴 Current Blocker

**Tried to run SQL in Supabase Dashboard SQL Editor:**
```sql
DROP POLICY IF EXISTS "Admins have full access" ON public.user_profiles;
```

**Got error:**
```
ERROR: 42P01: relation "public.user_profiles" does not exist
```

**But:**
- JavaScript REST API can query the table successfully ✅
- `check-table-exists.mjs` script confirmed table exists with 8 rows ✅
- This inconsistency is blocking migration

---

## ✅ What WORKS

### Supabase REST API Connection

**Script**: `check-table-exists.mjs`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const { data, error, count } = await supabase
  .from('user_profiles')
  .select('id', { count: 'exact', head: true });
```

**Result:**
```
✅ Table user_profiles EXISTS
   Row count: 8
✅ Column "role" exists
```

---

## ❌ What DOESN'T Work

### 1. Supabase Dashboard SQL Editor
**URL**: https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp/sql/new

**Query:**
```sql
SELECT * FROM public.user_profiles LIMIT 1;
```

**Error:**
```
ERROR: 42P01: relation "public.user_profiles" does not exist
```

**Theory**: Maybe SQL Editor is connected to different schema/database?

---

### 2. PostgreSQL Pooler (Transaction Mode - Port 6543)

**Connection String:**
```
postgresql://postgres.mbntpsfllwhlnzuzspvp:Airbus380Airbud3802024@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**Script**: `test-supabase-conn.mjs`
```javascript
import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mbntpsfllwhlnzuzspvp',
  password: 'Airbus380Airbud3802024',
  ssl: { rejectUnauthorized: false }
});
await client.connect();
```

**Error:**
```
password authentication failed for user "postgres"
```

**Root Cause**: PgBouncer strips username:
- Sent: `postgres.mbntpsfllwhlnzuzspvp`
- Received by server: `postgres` (dot treated as separator)

---

### 3. PostgreSQL Session Pooler (Port 5432)

**Connection String:**
```
postgresql://postgres.mbntpsfllwhlnzuzspvp:Airbus380Airbud3802024@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Error:** Same authentication failure

---

### 4. Direct PostgreSQL Connection

**Connection String:**
```
postgresql://postgres:Airbus380Airbud3802024@db.mbntpsfllwhlnzuzspvp.supabase.co:5432/postgres
```

**Error:**
```
ENOTFOUND db.mbntpsfllwhlnzuzspvp.supabase.co
```

**Notes**:
- `nslookup db.mbntpsfllwhlnzuzspvp.supabase.co` resolves successfully
- Node.js pg client cannot resolve hostname
- Possible IPv6 or Windows DNS cache issue

---

### 5. Supabase CLI Push

**Command:**
```bash
supabase db push --linked
```

**Error:**
```
Do you want to push these migrations to the remote database?
 • 001_invitation_based_tree.sql
 • 0018_extended_profile_fields.sql
 • ... (18 migrations)

error: unexpected EOF
```

**Issue**: CLI hangs waiting for input confirmation

---

## 🔑 Complete Credentials (Test Environment)

**IMPORTANT**: These are for test/development database - will be rotated after fixing

### Supabase Project
```
Project Name: gene-tree
Project Reference: mbntpsfllwhlnzuzspvp
Region: us-east-2 (Ohio)
Organization: ygdlbqfixolvgldhuqtz

Dashboard URL: https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp
SQL Editor: https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp/sql/new
API URL: https://mbntpsfllwhlnzuzspvp.supabase.co
```

### API Keys
```bash
NEXT_PUBLIC_SUPABASE_URL=https://mbntpsfllwhlnzuzspvp.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTU5NjAsImV4cCI6MjA3ODA5MTk2MH0.esC4-YPgCGZ82RO6Iud3d6nPEK0UX3iT6enqBGz9_dE

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U
```

### Database Credentials
```bash
# Database Password
SUPABASE_DB_PASSWORD=Airbus380Airbud3802024

# Direct Connection (bypasses pooler)
SUPABASE_DB_DIRECT_URL=postgresql://postgres:Airbus380Airbud3802024@db.mbntpsfllwhlnzuzspvp.supabase.co:5432/postgres

# Session Pooler (port 5432)
SUPABASE_DB_POOLER_URL=postgresql://postgres.mbntpsfllwhlnzuzspvp:Airbus380Airbud3802024@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Transaction Pooler (port 6543) - Currently used by Railway
DATABASE_URL=postgresql://postgres.mbntpsfllwhlnzuzspvp:Airbus380Airbud3802024@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
```

### Connection Parameters Breakdown
```
Pooler Host: aws-1-us-east-2.pooler.supabase.com
Direct Host: db.mbntpsfllwhlnzuzspvp.supabase.co

Session Pooler Port: 5432
Transaction Pooler Port: 6543

Database Name: postgres
Schema: public

Username (Pooler): postgres.mbntpsfllwhlnzuzspvp
Username (Direct): postgres

Password: Airbus380Airbud3802024

SSL Mode: require
SSL Cert Validation: disabled (rejectUnauthorized: false)
```

---

## 🧪 All Connection Attempts (Detailed)

### Attempt 1: pg Client with Transaction Pooler (6543)
```javascript
const client = new pg.Client({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mbntpsfllwhlnzuzspvp',
  password: 'Airbus380Airbud3802024',
  ssl: { rejectUnauthorized: false }
});
```
❌ Error: `password authentication failed for user "postgres"`

### Attempt 2: pg Client with Session Pooler (5432)
Same config, port 5432  
❌ Error: Same authentication failure

### Attempt 3: URL-encoded username
```javascript
const connectionString = 'postgresql://postgres%2Embntpsfllwhlnzuzspvp:...';
```
❌ Error: Still authentication failure

### Attempt 4: Direct connection
```javascript
const client = new pg.Client({
  host: 'db.mbntpsfllwhlnzuzspvp.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Airbus380Airbud3802024',
  //...
});
```
❌ Error: `ENOTFOUND db.mbntpsfllwhlnzuzspvp.supabase.co`

### Attempt 5: Supabase JS Client (REST API)
```javascript
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const { data } = await supabase.from('user_profiles').select('*');
```
✅ **SUCCESS** - Returns 8 rows

### Attempt 6: PostgREST SQL Execution
```javascript
await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
  method: 'POST',
  body: JSON.stringify({ query: 'SELECT * FROM user_profiles' })
});
```
❌ Error: `Could not find the function public.query(query)`

### Attempt 7: Supabase CLI
```bash
supabase db push --linked
```
❌ Hangs on confirmation prompt

### Attempt 8: Supabase Dashboard SQL Editor
```sql
SELECT * FROM public.user_profiles;
```
❌ Error: `relation "public.user_profiles" does not exist`

---

## 🐛 The Paradox

**Via REST API (PostgREST)**:
```javascript
supabase.from('user_profiles').select('*')
// ✅ Works - returns 8 rows
```

**Via SQL Editor / psql**:
```sql
SELECT * FROM public.user_profiles;
-- ❌ Error: relation does not exist
```

**Hypothesis**:
1. PostgREST might be querying a different schema?
2. SQL Editor connected to wrong database/project?
3. Table exists in schema other than `public`?
4. Permissions issue - service role can see via API but not SQL?

---

## 📋 SQL Migration We Need to Apply

**File**: `supabase/migrations/20251112000000_fix_rls_recursion_combined.sql`

```sql
-- Fix RLS Infinite Recursion
DROP POLICY IF EXISTS "Admins have full access" ON public.user_profiles;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$ 
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ); 
$$;

DROP POLICY IF EXISTS "media_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_update_policy" ON storage.objects;

CREATE POLICY "media_bucket_insert" ON storage.objects 
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "media_bucket_update" ON storage.objects 
FOR UPDATE TO authenticated
USING (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "media_bucket_delete" ON storage.objects 
FOR DELETE TO authenticated
USING (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "media_bucket_select" ON storage.objects 
FOR SELECT TO authenticated
USING (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Why we need this**:
- Current RLS policy on `user_profiles` calls `current_user_is_admin()`
- That function queries `user_profiles` table
- Which triggers the RLS policy again → infinite recursion
- This blocks avatar uploads with error: "infinite recursion detected"

---

## 💻 Environment

```
OS: Windows 11
Shell: PowerShell 5.1.26100.7019
Node.js: v22.21.0
npm: 10.8.2

Project Directory: C:\dev\gene-tree
Next.js: 15.0.3
React: 18.2.0
Supabase JS: Latest (via npm)
pg (node-postgres): 8.x
```

---

## 📁 Files Created During Troubleshooting

All available in repository:

```
check-table-exists.mjs           - ✅ Confirms table exists via API
check-rls-policies.mjs           - ❌ Cannot query pg_policies
test-supabase-conn.mjs           - ❌ PostgreSQL connection tests
apply-rls-fix.mjs                - ❌ Attempted SQL execution via API
scripts/db_ro_query.mjs          - ❌ Read-only query script
TECHNICAL_CHANGELOG.md           - Complete session history
SUPABASE_CONNECTION_REPORT.md   - Detailed connection attempts
```

Repository: https://github.com/filippmiller/gene-tree

---

## ❓ Questions for Expert

1. **Why does REST API see the table but SQL Editor doesn't?**
   - Same service role key
   - Same project
   - Different schema being queried?

2. **How to connect to PostgreSQL with username containing dot?**
   - `postgres.mbntpsfllwhlnzuzspvp` gets stripped to `postgres`
   - URL encoding doesn't help
   - Is there special escaping needed?

3. **Why doesn't direct hostname resolve in Node.js?**
   - `nslookup` works
   - Browser can reach it
   - `pg` client gets `ENOTFOUND`

4. **Best way to apply SQL migration?**
   - Dashboard SQL Editor says table doesn't exist
   - CLI hangs on confirmation
   - API doesn't support raw SQL
   - What's the correct method?

5. **Could table be in different schema?**
   - If not `public`, how to check?
   - PostgREST default schema configuration?

---

## 🆘 Immediate Help Needed

**Option A**: Guide to connect via PostgreSQL properly  
**Option B**: Alternative way to apply SQL migration  
**Option C**: Explanation of the REST API vs SQL Editor paradox

**Goal**: Apply the RLS fix migration so avatar uploads work again

---

## 📞 Contact

Repository: https://github.com/filippmiller/gene-tree  
Branch: main  
Latest Commit: bbf94f4

All scripts and logs are committed to repo for review.
