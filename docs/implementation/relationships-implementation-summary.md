# Relationships Implementation Summary

**Date**: 2025-11-08  
**Status**: ✅ Complete  

---

## Overview

This document summarizes the implementation of the relationships feature in the gene-tree application. The feature allows users to track family relationships between members.

---

## What Was Already Available

### 1. Database Schema ✅
**Location**: `supabase/migrations/001_invitation_based_tree.sql`

The `relationships` table already exists with the following structure:
- `id` - UUID primary key
- `user1_id` - UUID reference to auth.users
- `user2_id` - UUID reference to auth.users  
- `relationship_type` - TEXT (parent, spouse, sibling, grandparent, uncle_aunt, cousin)
- `marriage_date` - DATE (optional)
- `marriage_place` - TEXT (optional)
- `divorce_date` - DATE (optional)
- `created_from_invitation_id` - UUID reference to invitations table
- `created_at`, `updated_at` - TIMESTAMPTZ

**Key Features**:
- Row-Level Security (RLS) enabled
- Policies allow users to view/manage their own relationships
- Service role can manage all relationships (migration 003)
- Unique constraint on (user1_id, user2_id, relationship_type)
- Helper function `get_reverse_relationship_type()` for relationship mapping

**Additional Tables**:
- `user_profiles` - Extended user information
- `invitations` - For inviting family members
- `residences` - Track life history (migration 002)
- `deceased_relatives` - Store non-registered family members (migration 002)

### 2. TypeScript Types ✅
**Location**: `src/types/database.ts`

Already defined:
```typescript
export type RelationshipType = 
  | 'parent' | 'child'
  | 'spouse'
  | 'sibling'
  | 'grandparent' | 'grandchild'
  | 'uncle_aunt' | 'nephew_niece'
  | 'cousin';

export interface Relationship {
  id: string;
  user1_id: string;
  user2_id: string;
  relationship_type: RelationshipType;
  marriage_date: string | null;
  marriage_place: string | null;
  divorce_date: string | null;
  created_from_invitation_id: string | null;
  created_at: string;
  updated_at: string;
}
```

Plus helper types:
- `UserProfile` - Full profile structure
- `Invitation` - Invitation structure
- `RelationshipLabels` - UI labels for relationship types
- `ProfileWithRelationships` - Profile with related users grouped by type

### 3. Existing API Routes
**Location**: `src/app/api/`

- ✅ `/api/health` - Health check
- ✅ `/api/profile/complete` - Complete user profile
- ✅ `/api/profile/quick-setup` - Quick profile setup
- ✅ `/auth/callback` - Auth callback
- ❌ No relationships API existed

---

## What Was Created

### 1. API Endpoints (NEW) ✨

#### GET /api/relationships
**Location**: `src/app/api/relationships/route.ts`

Fetches all relationships for the authenticated user.

**Response**:
```json
{
  "relationships": [
    {
      "id": "uuid",
      "user1_id": "uuid",
      "user2_id": "uuid",
      "relationship_type": "parent",
      "marriage_date": null,
      "user1": { "id": "uuid", "first_name": "John", "last_name": "Doe", ... },
      "user2": { "id": "uuid", "first_name": "Jane", "last_name": "Doe", ... }
    }
  ]
}
```

**Features**:
- Authenticated users only
- Returns relationships where user is either user1 or user2
- Includes full profile data for both users
- Proper error handling with console logs

#### POST /api/relationships
**Location**: `src/app/api/relationships/route.ts`

Creates a new relationship.

**Request Body**:
```json
{
  "user2_id": "uuid",
  "relationship_type": "parent",
  "marriage_date": "2020-01-01",  // optional
  "marriage_place": "City",        // optional
  "divorce_date": null             // optional
}
```

**Response**: 
```json
{
  "relationship": { /* created relationship */ }
}
```

#### PATCH /api/relationships/[id]
**Location**: `src/app/api/relationships/[id]/route.ts`

Updates an existing relationship.

**Request Body** (all fields optional):
```json
{
  "relationship_type": "spouse",
  "marriage_date": "2020-01-01",
  "marriage_place": "City",
  "divorce_date": null
}
```

#### DELETE /api/relationships/[id]
**Location**: `src/app/api/relationships/[id]/route.ts`

Deletes a relationship.

**Response**:
```json
{
  "success": true
}
```

**Security**:
- All endpoints require authentication
- Users can only manage relationships they're part of
- RLS policies enforce data access rules

### 2. Verification Script (NEW) ✨
**Location**: `scripts/check-relationships.mjs`

Command-line tool to inspect the database state.

**Usage**:
```bash
# With Railway environment
railway run node scripts/check-relationships.mjs

# With manual env vars (PowerShell)
$env:NEXT_PUBLIC_SUPABASE_URL="https://..."
$env:SUPABASE_SERVICE_ROLE_KEY="..."
node scripts/check-relationships.mjs
```

**Output**:
- ✅ Checks if relationships table exists
- 📊 Shows count of relationships
- 📋 Lists relationships grouped by type
- 👥 Shows user profiles in database
- 📝 Displays example relationships with names

**Features**:
- Validates environment variables
- Handles missing tables gracefully
- Shows detailed relationship information
- Includes profile data in output

---

## How to Use

### 1. Check Current State
```bash
# Verify database has relationships table and data
railway run node scripts/check-relationships.mjs
```

### 2. Create a Relationship via API
```typescript
const response = await fetch('/api/relationships', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user2_id: 'other-user-uuid',
    relationship_type: 'parent',
  })
});
```

### 3. Get User's Relationships
```typescript
const response = await fetch('/api/relationships');
const { relationships } = await response.json();
```

### 4. Update a Relationship
```typescript
await fetch(`/api/relationships/${relationshipId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    marriage_date: '2020-01-01'
  })
});
```

### 5. Delete a Relationship
```typescript
await fetch(`/api/relationships/${relationshipId}`, {
  method: 'DELETE'
});
```

---

## Database Structure

### Table: relationships
```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id),
  user2_id UUID REFERENCES auth.users(id),
  relationship_type TEXT,
  marriage_date DATE,
  marriage_place TEXT,
  divorce_date DATE,
  created_from_invitation_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Indexes
- `idx_relationships_user1` on user1_id
- `idx_relationships_user2` on user2_id
- `idx_relationships_type` on relationship_type
- `idx_relationships_invitation` on created_from_invitation_id

### RLS Policies
- Users can SELECT their own relationships
- Users can INSERT relationships they're part of
- Users can UPDATE their own relationships
- Users can DELETE their own relationships
- Service role has full access

---

## Next Steps (Not Implemented Yet)

1. **UI Components** - Create React components for:
   - Displaying family tree visualization
   - Adding/editing relationships
   - Relationship timeline
   - Family member cards

2. **Advanced Features**:
   - Auto-create reverse relationships
   - Validate relationship logic (prevent impossible relationships)
   - Relationship suggestions based on existing data
   - Family tree export (PDF, GEDCOM)
   - Photos and documents attached to relationships

3. **Testing**:
   - Unit tests for API endpoints
   - Integration tests for relationship creation flow
   - E2E tests with Playwright

4. **Performance**:
   - Add caching for frequently accessed relationships
   - Optimize queries for large family trees
   - Implement pagination for relationship lists

---

## File Changes Summary

### Created Files ✨
1. `src/app/api/relationships/route.ts` - GET/POST endpoints
2. `src/app/api/relationships/[id]/route.ts` - PATCH/DELETE endpoints
3. `scripts/check-relationships.mjs` - Database verification script
4. `docs/implementation/relationships-implementation-summary.md` - This file

### Modified Files
- None (all necessary types and migrations already existed)

### Existing Files Referenced
- `supabase/migrations/001_invitation_based_tree.sql`
- `supabase/migrations/002_residences_and_deceased.sql`
- `supabase/migrations/003_service_role_relationships.sql`
- `src/types/database.ts`

---

## Testing Checklist

- [ ] Run verification script to check database state
- [ ] Test GET /api/relationships (authenticated)
- [ ] Test POST /api/relationships (create new relationship)
- [ ] Test PATCH /api/relationships/[id] (update relationship)
- [ ] Test DELETE /api/relationships/[id] (delete relationship)
- [ ] Test unauthorized access (should return 401)
- [ ] Test RLS policies (users can only see their relationships)
- [ ] Verify relationships appear in database via script

---

## Notes

- The database schema uses `user1_id` and `user2_id` naming convention (not `person_a_id` and `person_b_id` as in the original spec)
- The relationships table references `user_profiles` table, not a separate `profiles` table
- Marriage-related fields are already in the main relationships table
- The system uses an invitation-based flow for adding family members
- Service role key is needed for the verification script to bypass RLS

---

**Implementation Complete**: All core relationship management features are now available via API endpoints. The system is ready for UI development.
