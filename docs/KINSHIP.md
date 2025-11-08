# Kinship Graph v1 — Data & Deep Tree UX

## 📋 Overview

This document describes the kinship graph schema and provides guidelines for building a deep family tree UI.

## 🗄️ Database Schema

### Tables

#### `user_profiles` (existing)
Main user/person table with profile information:
- `id` UUID - references auth.users(id)
- `first_name`, `last_name`, `middle_name`, `nickname`
- `gender` - 'male', 'female', 'other', 'unknown'
- `birth_date`, `death_date`, `birth_place`, `death_place`
- `avatar_url`, `bio`, `occupation`, `phone`

#### `relationship_types` (new)
Defines all possible relationship types:
- `id` BIGSERIAL - primary key
- `code` TEXT - unique code (e.g., 'parent', 'spouse', 'sibling')
- `category` TEXT - 'consanguine', 'affinal', 'legal', 'social'
- `is_directed` BOOLEAN - if true, a→b ≠ b→a
- `is_symmetric` BOOLEAN - if true, stored once (a<b canonicalized)
- `default_inverse_code` TEXT - inverse relationship code
- `default_inverse_type_id` BIGINT - inverse relationship type_id

#### `relationships` (enhanced)
Facts about relationships between people:
- `id` UUID - primary key
- `user1_id` UUID - person A (or parent in parent→child)
- `user2_id` UUID - person B (or child in parent→child)
- `relationship_type` TEXT - code (e.g., 'parent')
- `type_id` BIGINT - references relationship_types(id)

**New qualifiers:**
- `in_law` BOOLEAN - is this an in-law relationship?
- `halfness` TEXT - 'full', 'half', 'step', 'adoptive', 'foster', 'unknown'
- `lineage` TEXT - 'maternal', 'paternal', 'both', 'unknown'
- `is_ex` BOOLEAN - former relationship (ex-spouse, ex-partner)
- `cousin_degree` SMALLINT - 1=first cousin, 2=second cousin, etc.
- `cousin_removed` SMALLINT - generations removed (0=same generation)
- `notes` TEXT - free-form notes
- `source` JSONB - source/proof of relationship
- `qualifiers` JSONB - additional qualifiers
- `created_by` UUID - who created this relationship

**Existing fields:**
- `marriage_date`, `marriage_place`, `divorce_date`
- `created_from_invitation_id` - link to invitation
- `created_at`, `updated_at`

#### `kinship_labels` (new)
Localized labels for relationship types:
- `type_id` BIGINT - references relationship_types(id)
- `lang` TEXT - 'ru', 'en'
- `direction` TEXT - 'a_to_b', 'b_to_a', 'symmetric'
- `gender` TEXT - 'male', 'female', 'any' (for gendered labels)
- `label` TEXT - localized label

## 🔧 Functions (RPC)

All functions are available via Supabase RPC: `POST /rest/v1/rpc/function_name`

### `fn_get_ancestors(p_person UUID, p_max_depth INT)`
Returns ancestors of a person (going up the tree).

**Returns:** `TABLE(ancestor_id UUID, depth INT, path UUID[])`

**Example:**
```javascript
const { data } = await supabase.rpc('fn_get_ancestors', {
  p_person: userId,
  p_max_depth: 5
});
// data = [
//   { ancestor_id: 'uuid1', depth: 1, path: [userId, 'uuid1'] },
//   { ancestor_id: 'uuid2', depth: 2, path: [userId, 'uuid1', 'uuid2'] }
// ]
```

### `fn_get_descendants(p_person UUID, p_max_depth INT)`
Returns descendants of a person (going down the tree).

**Returns:** `TABLE(descendant_id UUID, depth INT, path UUID[])`

### `fn_compute_layers(p_root UUID, p_up INT, p_down INT)`
Computes layer numbers for tree rendering with root at layer 0.

**Returns:** `TABLE(person_id UUID, layer INT)`
- Ancestors have negative layers (-1, -2, -3...)
- Root is at layer 0
- Descendants have positive layers (1, 2, 3...)

**Example:**
```javascript
const { data } = await supabase.rpc('fn_compute_layers', {
  p_root: userId,
  p_up: 6,    // 6 generations up
  p_down: 6   // 6 generations down
});
// data = [
//   { person_id: 'grandparent-id', layer: -2 },
//   { person_id: 'parent-id', layer: -1 },
//   { person_id: userId, layer: 0 },
//   { person_id: 'child-id', layer: 1 },
//   { person_id: 'grandchild-id', layer: 2 }
// ]
```

### `fn_add_relationship_by_code(p_user1 UUID, p_user2 UUID, p_code TEXT, p_qualifiers JSONB, p_created_by UUID)`
Creates a new relationship by code.

**Example:**
```javascript
const { data } = await supabase.rpc('fn_add_relationship_by_code', {
  p_user1: parentId,
  p_user2: childId,
  p_code: 'parent',
  p_qualifiers: {
    lineage: 'paternal',
    halfness: 'full'
  },
  p_created_by: currentUserId
});
// returns: UUID of created relationship
```

## 📊 Views

### `v_immediate_family`
Shows immediate family relationships with localized labels (Russian).

**Columns:** `id`, `person_id`, `relative_id`, `rel_code`, `in_law`, `halfness`, `lineage`, `is_ex`, `cousin_degree`, `cousin_removed`, `label`

### `v_graph_edges`
Graph representation for visualization libraries.

**Columns:** `id`, `source`, `target`, `type_code`, `is_symmetric`, `in_law`, `halfness`, `lineage`, `is_ex`, `cousin_degree`, `cousin_removed`

**Example:**
```javascript
const { data } = await supabase
  .from('v_graph_edges')
  .select('*')
  .or(`source.eq.${userId},target.eq.${userId}`);
```

## 🎨 Deep Tree UX Guidelines

### Layer-Based Rendering

1. **Compute Layers First**
   ```javascript
   const { data: layers } = await supabase.rpc('fn_compute_layers', {
     p_root: rootPersonId,
     p_up: 4,
     p_down: 4
   });
   ```

2. **Group by Layer**
   ```javascript
   const layerMap = layers.reduce((acc, { person_id, layer }) => {
     if (!acc[layer]) acc[layer] = [];
     acc[layer].push(person_id);
     return acc;
   }, {});
   ```

3. **Fetch Person Data**
   ```javascript
   const personIds = layers.map(l => l.person_id);
   const { data: people } = await supabase
     .from('user_profiles')
     .select('*')
     .in('id', personIds);
   ```

4. **Fetch Edges**
   ```javascript
   const { data: edges } = await supabase
     .from('v_graph_edges')
     .select('*')
     .or(`source.in.(${personIds.join(',')}),target.in.(${personIds.join(',')})`);
   ```

### Visual Encoding

**Edge Styles:**
- `parent/child` → **solid line** (vertical)
- `spouse/partner` → **dashed line** or **arc** (horizontal)
- `sibling` → **light dashed line** (horizontal)
- `in_law=true` → **semi-transparent** edge
- `is_ex=true` → **faded/gray** edge

**Node Modifiers:**
- `halfness='half'` → **striped border** or badge "½"
- `halfness='step'` → badge "S"
- `halfness='adoptive'` → badge "A"
- `lineage='maternal'` → pink accent
- `lineage='paternal'` → blue accent

**Cousin Degrees:**
- Show badge: "1st cousin", "2nd cousin"
- If `cousin_removed > 0`: "1st cousin 2x removed"

### Expansion & Performance

**Lazy Loading:**
- Default: show root ± 2-3 layers
- Show "+N" counters for collapsed branches
- Expand on click to load more layers

**Search & Focus:**
- Full-text search on `user_profiles.first_name || ' ' || last_name`
- "Focus as root" button to re-center tree on selected person

**Relationship Path Highlighting:**
```javascript
// Highlight shortest path between two people
const { data: path } = await supabase.rpc('fn_shortest_kinship_path', {
  p_a: personAId,
  p_b: personBId,
  p_max_steps: 12
});
```

### Localization

**Russian Labels:**
Query `kinship_labels` table for Russian labels:
```javascript
const { data: labels } = await supabase
  .from('kinship_labels')
  .select('type_id, label, direction, gender')
  .eq('lang', 'ru');
```

**Gender-Specific:**
For precise labels (e.g., "брат" vs "сестра"), use person's gender + label direction.

## 🚀 Quick Start Example

```javascript
// 1. Get current user
const { data: { user } } = await supabase.auth.getUser();

// 2. Compute tree layers
const { data: layers } = await supabase.rpc('fn_compute_layers', {
  p_root: user.id,
  p_up: 3,
  p_down: 3
});

// 3. Get all people in tree
const personIds = layers.map(l => l.person_id);
const { data: people } = await supabase
  .from('user_profiles')
  .select('id, first_name, last_name, gender, birth_date, avatar_url')
  .in('id', personIds);

// 4. Get all edges
const { data: edges } = await supabase
  .from('v_graph_edges')
  .select('*')
  .or(`source.in.(${personIds.join(',')}),target.in.(${personIds.join(',')})`);

// 5. Render with your favorite graph library (D3, Cytoscape, vis.js, etc.)
renderFamilyTree({ people, edges, layers });
```

## 📝 Notes

- **Directional Relationships:** For `parent→child`, insert ONE row with `user1_id=parent, user2_id=child, relationship_type='parent'`. The inverse will NOT be auto-created in this version (future enhancement).
  
- **Symmetric Relationships:** For `spouse/partner/sibling`, the system canonicalizes to ensure `user1_id < user2_id` for consistency.

- **Cousins:** Set `cousin_degree=1` for first cousins, `cousin_degree=2` for second cousins. Use `cousin_removed` for generational difference.

- **Existing Data:** After applying migration 004, existing relationships will have `type_id` populated automatically. New fields default to safe values (e.g., `in_law=false`, `halfness='full'`).

## 🔗 Related Migrations

- `001_invitation_based_tree.sql` - Base schema (user_profiles, relationships)
- `002_residences_and_deceased.sql` - Additional features
- `003_service_role_relationships.sql` - Service role permissions
- `004_kinship_enhancements.sql` - **This migration** (kinship graph v1)

---

**Last Updated:** 2025-11-08
**Version:** 1.0
