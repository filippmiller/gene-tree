# Team 2: Admin Features

## Objective
Verify admin pages work, then commit all admin-related code.

## Files to Commit (All Untracked)

```
src/app/[locale]/admin/           (entire directory)
src/app/api/admin/                (entire directory)
src/components/admin/             (entire directory)
src/lib/admin/                    (entire directory)
```

## Pre-Commit Verification

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Test Admin Pages (Manual Smoke Test)

| Page | URL | Check |
|------|-----|-------|
| Admin Dashboard | /en/admin | Stats display |
| Database Explorer | /en/admin/db-explorer | Tables load, can switch |
| Knowledge Base | /en/admin/librarian | Content displays |

### 3. Test Key Functionality
- [ ] Database Explorer: Select "User Profiles" table
- [ ] Database Explorer: Sort by a column
- [ ] Database Explorer: Switch to "Photos" table (bug was fixed)
- [ ] Database Explorer: Open edit modal
- [ ] Knowledge Base: View entries

## Admin Features Built

1. **Admin Dashboard** (`/admin`)
   - Stats overview
   - Quick links to admin sections

2. **Database Explorer** (`/admin/db-explorer`)
   - View all 21 database tables
   - Sort, filter, paginate
   - Create/Edit/Delete records
   - Table switching (bug fixed today)

3. **Knowledge Base** (`/admin/librarian`)
   - View knowledge entries
   - Search functionality

## Commit Message Template

```
feat: admin dashboard with database explorer

Admin Dashboard:
- Stats overview and quick navigation
- Role-based access control

Database Explorer:
- Browse 21 tables (Core, Content, System, Reference)
- CRUD operations on records
- Sorting, filtering, pagination
- Fixed table switching bug (sort reset)

Knowledge Base:
- View and search knowledge entries
- Content viewer

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Steps

1. Run dev server
2. Quick smoke test of admin pages
3. Stage all admin directories
4. Create commit with message above
5. Verify commit succeeded

## Do NOT Include
- Bug fix files (Team 1)
- Test files (Team 3)
- Migration (Team 1)
