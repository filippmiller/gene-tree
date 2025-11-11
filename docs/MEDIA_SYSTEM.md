# Медиа-система для Генеалогического Дерева

## Обзор

Двухзонная система хранения медиа с модерацией:
- **Публичные аватарки** (avatars bucket) - прямая загрузка с клиента
- **Приватные медиа** (media bucket) - server-signed uploads с модерацией

## Railway Variables (Environment Variables)

### Обязательные переменные

```bash
# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Next.js
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ⚠️ Безопасность

- `SUPABASE_SERVICE_ROLE` - **НИКОГДА** не экспортировать на клиент!
- Используется только на server-side (API routes, Railway workers)
- Обходит все RLS политики

## Архитектура

### Storage Buckets

#### 1. `avatars` (Public)
- **Путь**: `<user_id>/<uuid>.<ext>`
- **Размер**: max 25 MB
- **Форматы**: JPEG, PNG, WebP, HEIC, HEIF
- **Доступ**: Публичный на чтение, прямой upload с клиента
- **RLS**: Пользователь может загружать только в свою папку

#### 2. `media` (Private)
- **Путь**: 
  - `profiles/<profile_id>/incoming/<uuid>.<ext>` - ожидают модерации
  - `profiles/<profile_id>/approved/<uuid>.<ext>` - одобренные
  - `albums/<album_id>/<uuid>.<ext>` - альбомы/события
  - `documents/<profile_id>/<uuid>.<ext>` - документы/сертификаты
- **Размер**: max 25 MB
- **Форматы**: JPEG, PNG, WebP, HEIC, HEIF
- **Доступ**: Private, только через signed URLs
- **RLS**: Прямой INSERT запрещён, только через server-side API

### Database Schema

#### `photos` - Реестр всех фото

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `bucket` | TEXT | 'avatars' or 'media' |
| `path` | TEXT | Путь в storage |
| `uploaded_by` | UUID | Кто загрузил |
| `target_profile_id` | UUID | К какому профилю относится |
| `type` | media_type | avatar/portrait/group/document/... |
| `status` | media_status | pending/approved/rejected/archived |
| `visibility` | media_visibility | public/family/private/unlisted |
| `caption` | TEXT | Описание |
| `sha256` | CHAR(64) | Хэш для дедупликации |
| `exif` | JSONB | EXIF метаданные |
| `approved_at` | TIMESTAMPTZ | Когда одобрено |
| `approved_by` | UUID | Кто одобрил |

#### `photo_people` - Кто на фото

| Column | Type |
|--------|------|
| `photo_id` | UUID |
| `profile_id` | UUID |
| `role` | TEXT |

#### `photo_reviews` - Журнал модерации

| Column | Type |
|--------|------|
| `id` | UUID |
| `photo_id` | UUID |
| `action` | TEXT (approve/reject) |
| `actor` | UUID |
| `reason` | TEXT |

#### `media_jobs` - Очередь фоновых задач

| Column | Type |
|--------|------|
| `id` | UUID |
| `kind` | TEXT (thumbnail/strip_exif/hash/move_to_approved/delete) |
| `payload` | JSONB |
| `status` | TEXT (queued/processing/completed/failed) |

### Enums

```sql
media_status: 'pending' | 'approved' | 'rejected' | 'archived'
media_visibility: 'public' | 'family' | 'private' | 'unlisted'
media_type: 'avatar' | 'portrait' | 'group' | 'document' | 'event' | 'headstone' | 'certificate' | 'other'
```

## API Endpoints

### POST `/api/media/signed-upload`

Создаёт подписанный URL для загрузки в `media` bucket.

**Request:**
```json
{
  "target_profile_id": "uuid",
  "type": "portrait",
  "visibility": "family",
  "file_ext": "jpg",
  "content_type": "image/jpeg",
  "size": 1234567,
  "caption": "Семейное фото 1985"
}
```

**Response:**
```json
{
  "uploadUrl": "https://...",
  "token": "...",
  "bucket": "media",
  "path": "profiles/.../incoming/...",
  "photoId": "uuid"
}
```

**Flow:**
1. Клиент вызывает `/api/media/signed-upload`
2. Сервер проверяет `can_upload_to_profile()`
3. Сервер создаёт signed URL (service_role)
4. Клиент загружает файл по signed URL
5. Клиент вызывает `/api/media/commit`

### POST `/api/media/commit`

Подтверждает загрузку, создаёт jobs.

**Request:**
```json
{
  "photoId": "uuid",
  "width": 1920,
  "height": 1080,
  "sha256": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "photo": { ... },
  "jobs": ["job-id-1", "job-id-2"]
}
```

### POST `/api/media/approve`

Одобрение фото владельцем профиля.

**Request:**
```json
{
  "photoId": "uuid",
  "visibility": "family"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "photo": { ... }
}
```

**Действия:**
- Меняет `status` → `approved`
- Создаёт запись в `photo_reviews`
- Создаёт job для перемещения `incoming` → `approved`

### POST `/api/media/reject`

Отклонение фото.

**Request:**
```json
{
  "photoId": "uuid",
  "reason": "Неподходящее фото"
}
```

**Response:**
```json
{
  "success": true,
  "photo": { ... }
}
```

### POST `/api/media/set-avatar`

Установка основной аватарки профиля.

**Request:**
```json
{
  "photoId": "uuid",
  "profileId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "current_avatar_id": "uuid"
  }
}
```

**Действия:**
- Архивирует старую аватарку
- Устанавливает новую как `current_avatar_id`
- Авто-approve если из `avatars` bucket

### GET `/api/media/pending?profileId=xxx`

Список pending фото для модерации.

**Response:**
```json
{
  "photos": [
    {
      "id": "uuid",
      "type": "portrait",
      "caption": "...",
      "url": "signed-url-or-public",
      "uploader": { "email": "..." },
      "created_at": "..."
    }
  ],
  "count": 2
}
```

## Матрица прав (RLS)

### Таблица `photos`

| Действие | Владелец профиля | Автор загрузки | Семья | Модератор | Public |
|----------|------------------|----------------|-------|-----------|--------|
| **SELECT** (pending) | ✅ | ✅ | ❌ | ✅ | ❌ |
| **SELECT** (approved + public) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SELECT** (approved + family) | ✅ | ✅ | ✅ (verified) | ✅ | ❌ |
| **SELECT** (approved + private) | ✅ | ✅ | ❌ | ✅ | ❌ |
| **INSERT** | ✅ (свой профиль) | ✅ | ✅ (pending) | ✅ | ❌ |
| **UPDATE** (pending) | ✅ | ✅ | ❌ | ✅ | ❌ |
| **UPDATE** (status) | ✅ | ❌ | ❌ | ✅ | ❌ |
| **DELETE** | ✅ | ✅ (pending) | ❌ | ✅ | ❌ |

### Storage `avatars`

| Действие | Условие |
|----------|---------|
| **INSERT** | `authenticated` AND `path LIKE auth.uid() || '/%'` |
| **UPDATE** | `authenticated` AND `path LIKE auth.uid() || '/%'` |
| **DELETE** | `authenticated` AND `path LIKE auth.uid() || '/%'` |
| **SELECT** | `public` (CDN-friendly) |

### Storage `media`

| Действие | Условие |
|----------|---------|
| **INSERT** | ❌ (только через server-signed URLs) |
| **SELECT** | Через `photos` таблицу + RLS |
| **DELETE** | Владелец профиля OR модератор |

## Visibility Logic

### `public`
- Видно всем (authenticated + anonymous)
- Отдаётся через публичные URLs
- Можно кэшировать на CDN

### `family`
- Видно семейному кругу (verified relatives)
- Проверка через `is_in_family_circle(profile_id, user_id)`
- Отдаётся через signed URLs с коротким TTL

### `private`
- Видно только владельцу профиля + модераторам
- Отдаётся через signed URLs (TTL: 1 час)

### `unlisted`
- Видно по прямой ссылке (signed URL)
- Не показывается в публичных галереях

## Фоновые Jobs (Worker)

### `thumbnail`
- Генерация превью: 1024px, 512px, 256px
- Сохранение в тот же bucket с суффиксом `_thumb_1024.jpg`

### `strip_exif`
- Удаление GPS и других sensitive метаданных
- Сохранение полезных (дата, камера) в `photos.exif`

### `hash`
- Вычисление SHA-256 для дедупликации
- Сравнение с существующими `photos.sha256`

### `move_to_approved`
- Копирование из `incoming/` → `approved/`
- Обновление `photos.path`
- Удаление исходника

### `delete`
- Удаление rejected фото через 24 часа
- Очистка `storage.objects` + `photos` запись

## Flow диаграммы

### Загрузка аватарки (avatars)

```
Клиент                        Server              Storage
  |                              |                    |
  |-- Upload file ------------> | (RLS check)        |
  |                              | <----------------> | (avatars bucket)
  |                              |                    |
  |-- Create photos record ----> |                    |
  |                              |                    |
  |-- POST /api/media/set-avatar |                    |
  |    { photoId, profileId }    |                    |
  |                              | - Approve photo    |
  |                              | - Archive old      |
  |                              | - Update profile   |
  | <-- Success ----------------                      |
```

### Предложение фото (media)

```
Родственник                  Server                Owner
  |                            |                      |
  |-- POST /signed-upload ---> |                      |
  |    (target_profile_id)     | - can_upload?        |
  |                            | - createSignedUrl    |
  | <-- { uploadUrl } --------|                      |
  |                            |                      |
  |-- Upload to signed URL --> | (media/incoming/)    |
  |                            |                      |
  |-- POST /commit ----------> |                      |
  |    (photoId)               | - Create jobs        |
  | <-- Success --------------|                      |
  |                            |                      |
  |                            | -- Notification --> |
  |                            |                      |
  |                            |    (pending photo)   |
  |                            |                      |
  |                            | <-- Approve/Reject - |
  |                            |                      |
  |                            | - move_to_approved   |
```

## Проверка RLS

```sql
-- Проверить политики photos
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'photos' AND schemaname = 'public';

-- Проверить политики storage.objects
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Проверить бакеты
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('avatars', 'media');
```

## TODO: Фоновый воркер (Railway)

Для production необходимо создать отдельный Railway service:

```typescript
// worker/index.ts
import { getAdminClient } from '@/lib/supabase-admin';

async function processJobs() {
  const supabase = getAdminClient();
  
  // Fetch queued jobs
  const { data: jobs } = await supabase
    .from('media_jobs')
    .select('*')
    .eq('status', 'queued')
    .limit(10);
    
  for (const job of jobs || []) {
    await processJob(job);
  }
}

setInterval(processJobs, 5000); // каждые 5 секунд
```

## Клиентские примеры

### Загрузка аватарки

```typescript
// Прямой upload в avatars
const file = event.target.files[0];
const fileName = `${userId}/${crypto.randomUUID()}.jpg`;

await supabase.storage
  .from('avatars')
  .upload(fileName, file);

// Создать photos запись
const { data: photo } = await supabase
  .from('photos')
  .insert({ bucket: 'avatars', path: fileName, ... })
  .select('id')
  .single();

// Установить как аватарку
await fetch('/api/media/set-avatar', {
  method: 'POST',
  body: JSON.stringify({ photoId: photo.id, profileId })
});
```

### Предложение фото

```typescript
// 1. Получить signed URL
const res = await fetch('/api/media/signed-upload', {
  method: 'POST',
  body: JSON.stringify({
    target_profile_id: profileId,
    type: 'portrait',
    file_ext: 'jpg',
    content_type: 'image/jpeg',
    size: file.size,
  })
});
const { uploadUrl, token, photoId } = await res.json();

// 2. Загрузить файл
await supabase.storage
  .from('media')
  .uploadToSignedUrl(path, token, file);

// 3. Commit
await fetch('/api/media/commit', {
  method: 'POST',
  body: JSON.stringify({ photoId })
});
```

## Безопасность

✅ **Что сделано:**
- RLS на всех таблицах
- Service role только на server-side
- Signed URLs для private media
- Проверка прав через функции (`can_upload_to_profile`, `is_profile_owner`)
- Ограничение размера файлов (25 MB)
- Ограничение типов файлов

⚠️ **Рекомендации:**
- Rate limiting на API endpoints (защита от спама)
- Virus scanning для загруженных файлов
- Watermarking для публичных фото (опционально)
- CDN (Cloudflare) для кэширования публичных аватарок
