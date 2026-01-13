# Database Schema Reference

> **APPEND-ONLY**: Document discovered tables, fields, and relationships. Mark deprecated schemas as `[DEPRECATED]`.

---

## Platform

- **Database**: PostgreSQL (via Supabase)
- **ORM**: None (direct Supabase client queries)
- **Migrations**: `supabase/migrations/` (SQL files)
- **Types**: `src/types/supabase.ts`

---

## Core Tables

### auth.users (Supabase managed)
- Supabase Auth built-in table
- Referenced by `user_profiles.id`

### user_profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK, FK to auth.users |
| first_name | text | User's first name |
| last_name | text | User's last name |
| avatar_url | text | Profile picture URL |
| bio | text | User biography |
| birth_date | date | Date of birth |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Last update |

### relationships
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| from_user_id | uuid | FK to user_profiles |
| to_user_id | uuid | FK to user_profiles |
| relationship_type | text | parent, child, spouse, sibling |
| created_at | timestamptz | Record creation |
| confirmed | boolean | Whether relationship is confirmed |

### pending_relatives
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| inviter_id | uuid | FK to user_profiles |
| email | text | Invited person's email |
| relationship_type | text | Proposed relationship |
| status | text | pending, accepted, rejected |
| created_at | timestamptz | Record creation |

### photos
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| uploader_id | uuid | FK to user_profiles |
| storage_path | text | Path in storage bucket |
| status | text | pending, approved, rejected |
| created_at | timestamptz | Upload time |

### photo_people
| Column | Type | Description |
|--------|------|-------------|
| photo_id | uuid | FK to photos |
| user_id | uuid | FK to user_profiles |
| tagged_by | uuid | Who tagged this person |

### photo_reviews
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| photo_id | uuid | FK to photos |
| reviewer_id | uuid | FK to user_profiles |
| action | text | approve, reject |
| reason | text | Optional rejection reason |
| created_at | timestamptz | Review time |

### media_jobs
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| job_type | text | Type of background job |
| payload | jsonb | Job parameters |
| status | text | pending, processing, completed, failed |
| created_at | timestamptz | Job creation |
| processed_at | timestamptz | Completion time |

### stories
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| author_id | uuid | FK to user_profiles |
| subject_id | uuid | FK to user_profiles (about whom) |
| title | text | Story title |
| content | text | Story content (markdown) |
| status | text | pending, approved, rejected |
| created_at | timestamptz | Creation time |

### voice_stories
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| author_id | uuid | FK to user_profiles |
| subject_id | uuid | FK to user_profiles |
| storage_path | text | Audio file path |
| duration_seconds | integer | Recording length |
| created_at | timestamptz | Upload time |

### notifications
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK to user_profiles |
| type | text | Notification type |
| payload | jsonb | Notification data |
| read | boolean | Read status |
| created_at | timestamptz | Creation time |

### education
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK to user_profiles |
| institution | text | School/university name |
| degree | text | Degree obtained |
| field | text | Field of study |
| start_year | integer | Start year |
| end_year | integer | End year (null if current) |

### employment
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK to user_profiles |
| company | text | Company name |
| position | text | Job title |
| start_date | date | Start date |
| end_date | date | End date (null if current) |

---

## Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| avatars | public | User profile pictures |
| media | private | Photos, documents (signed URLs) |

---

## Key Relationships

```
auth.users (1) <---> (1) user_profiles
user_profiles (1) <---> (N) relationships
user_profiles (1) <---> (N) photos
user_profiles (1) <---> (N) stories
user_profiles (1) <---> (N) voice_stories
user_profiles (1) <---> (N) notifications
photos (1) <---> (N) photo_people
photos (1) <---> (N) photo_reviews
```

---

## Schema Updates

### [2026-01-13] Initial Schema Documentation

- Documented all known tables from migration analysis
- Tables derived from: `supabase/migrations/` files
- RLS policies in place for all tables

---

<!-- New schema discoveries will be appended here -->
