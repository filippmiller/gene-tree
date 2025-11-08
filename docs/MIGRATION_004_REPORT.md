# Migration 004: Kinship Enhancements — Report

**Date:** 2025-11-08  
**Status:** ⚠️ Ready to Apply  
**Author:** Warp Agent

---

## ✅ Created Files

1. **`supabase/migrations/004_kinship_enhancements.sql`** (365 lines)
   - Extends existing schema (non-destructive)
   - Adds relationship_types table
   - Adds kinship_labels table  
   - Extends relationships table with new columns
   - Creates tree traversal functions
   - Creates views for visualization

2. **`docs/KINSHIP.md`** (294 lines)
   - Complete developer documentation
   - API usage examples
   - UX guidelines for deep tree rendering
   - Quick start code samples

---

## 📊 What This Migration Does

### New Tables
- **`relationship_types`** - Master list of all relationship types with metadata
- **`kinship_labels`** - Localized labels (RU/EN) for relationships

### Extended Tables
Adds new columns to existing `relationships` table:
- `type_id` - Reference to relationship_types
- `in_law` - Boolean flag
- `halfness` - 'full', 'half', 'step', 'adoptive', 'foster'
- `lineage` - 'maternal', 'paternal', 'both'
- `is_ex` - For former relationships
- `cousin_degree`, `cousin_removed` - For cousins
- `notes`, `source`, `qualifiers` - Additional metadata
- `created_by` - User who created relationship

### New Functions
- `fn_get_ancestors(person_id, max_depth)` - Get all ancestors
- `fn_get_descendants(person_id, max_depth)` - Get all descendants  
- `fn_compute_layers(root_id, up, down)` - Compute layers for tree rendering
- `fn_add_relationship_by_code(...)` - Helper to create relationships

### New Views
- `v_immediate_family` - Immediate family with Russian labels
- `v_graph_edges` - Graph representation for visualization

### Data Migration
- Auto-populates `type_id` for all existing relationships
- All existing data preserved
- New columns get safe default values

---

## 🚀 How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **"+ New query"**
4. Copy the entire contents of `supabase/migrations/004_kinship_enhancements.sql`
5. Paste into the editor
6. Click **"Run"** button
7. Wait for success confirmation

### Option 2: Supabase CLI (if available)

```bash
# Install CLI if not installed
npm install -g supabase

# Link project
supabase link --project-ref <YOUR_PROJECT_REF>

# Push migration
supabase db push
```

---

## ✓ Verification Steps

After applying the migration, run these queries to verify:

### 1. Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('relationship_types', 'kinship_labels');
-- Should return 2 rows
```

### 2. Check Relationship Types
```sql
SELECT code, category, is_directed, is_symmetric 
FROM public.relationship_types 
ORDER BY code LIMIT 10;
-- Should return types like parent, child, spouse, etc.
```

### 3. Check Labels
```sql
SELECT rt.code, kl.lang, kl.label
FROM public.relationship_types rt
JOIN public.kinship_labels kl ON kl.type_id = rt.id
WHERE kl.lang = 'ru' AND rt.code IN ('parent', 'child', 'spouse')
ORDER BY rt.code, kl.lang;
-- Should return Russian labels
```

### 4. Check Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'fn_%';
-- Should return: fn_get_ancestors, fn_get_descendants, fn_compute_layers, fn_add_relationship_by_code
```

### 5. Check Views
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'v_%';
-- Should return: v_immediate_family, v_graph_edges
```

### 6. Check Extended Columns
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'relationships' 
  AND column_name IN ('type_id', 'in_law', 'halfness', 'lineage', 'is_ex', 'cousin_degree', 'qualifiers')
ORDER BY column_name;
-- Should return all 7 columns
```

---

## 📖 Next Steps for Frontend

1. **Read Documentation**
   - Open `docs/KINSHIP.md`
   - Review schema, functions, and UX guidelines

2. **Test Functions** (via Supabase JS client)
   ```javascript
   // Get layers for tree
   const { data } = await supabase.rpc('fn_compute_layers', {
     p_root: userId,
     p_up: 3,
     p_down: 3
   });
   ```

3. **Update TypeScript Types** (optional)
   - Regenerate types: `supabase gen types typescript`
   - Or manually add new table/column types

4. **Build UI Components**
   - Use views `v_graph_edges` and `v_immediate_family`
   - Implement layer-based tree rendering
   - Add relationship creation forms

---

## 🔧 Rollback (if needed)

If you need to rollback this migration:

```sql
-- Drop in reverse order to avoid FK constraints
DROP VIEW IF EXISTS public.v_graph_edges;
DROP VIEW IF EXISTS public.v_immediate_family;

DROP FUNCTION IF EXISTS public.fn_add_relationship_by_code;
DROP FUNCTION IF EXISTS public.fn_compute_layers;
DROP FUNCTION IF EXISTS public.fn_get_descendants;
DROP FUNCTION IF EXISTS public.fn_get_ancestors;

-- Remove extended columns
ALTER TABLE public.relationships 
  DROP COLUMN IF EXISTS type_id,
  DROP COLUMN IF EXISTS in_law,
  DROP COLUMN IF EXISTS halfness,
  DROP COLUMN IF EXISTS lineage,
  DROP COLUMN IF EXISTS is_ex,
  DROP COLUMN IF EXISTS cousin_degree,
  DROP COLUMN IF EXISTS cousin_removed,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS qualifiers,
  DROP COLUMN IF EXISTS created_by;

DROP TABLE IF EXISTS public.kinship_labels;
DROP TABLE IF EXISTS public.relationship_types CASCADE;
```

---

## 📝 Summary

✅ **Migration File:** Ready  
✅ **Documentation:** Complete  
⏳ **Status:** Waiting for database apply  

**Impact:**
- **Zero downtime** - All changes are additive
- **No data loss** - Existing data migrated automatically
- **Backward compatible** - Old code continues to work
- **New features** - Tree traversal, labels, qualifiers

**Estimated Apply Time:** < 1 minute

---

**Ready to apply?** Go to Supabase Dashboard → SQL Editor and run the migration! 🚀
