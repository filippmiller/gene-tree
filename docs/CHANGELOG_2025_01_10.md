# Лог изменений - 10 января 2025

## Задача
Реализация полноценной медиа-системы с двумя зонами безопасности:
1. Публичные аватарки (простая загрузка)
2. Приватные медиа с модерацией (server-signed uploads)

---

## Изменения в базе данных (Supabase)

### Миграция 0022: Media Storage System
**Файл:** `supabase/migrations/0022_media_storage_system.sql`

**Создано:**

1. **Enum типы**
   - `media_status` - статусы фото (pending, approved, rejected, archived)
   - `media_visibility` - видимость (public, family, private, unlisted)
   - `media_type` - типы медиа (avatar, portrait, group, document, event, headstone, certificate, other)

2. **Storage Buckets**
   - `avatars` - публичный bucket
     - Размер: 25 MB
     - Типы: JPEG, PNG, WebP, HEIC, HEIF
     - Public read: true
   - `media` - приватный bucket
     - Размер: 25 MB
     - Типы: JPEG, PNG, WebP, HEIC, HEIF
     - Public read: false

3. **Таблица `photos`** - главный реестр всех фото
   - Поля хранения: `bucket`, `path`, `storage_object_id`
   - Владение: `uploaded_by`, `target_profile_id`
   - Классификация: `type`, `status`, `visibility`
   - Метаданные: `caption`, `taken_at`, `exif`, `sha256`, `width`, `height`
   - Модерация: `approved_at`, `approved_by`, `rejected_at`, `rejected_by`, `rejection_reason`, `archived_at`
   - Индексы: на `target_profile_id+status`, `uploaded_by`, `sha256`, `bucket+path`

4. **Таблица `photo_people`** - связь фото ↔ профили (кто на фото)
   - PK: (`photo_id`, `profile_id`)
   - Поле: `role`

5. **Таблица `photo_reviews`** - журнал модерации
   - Поля: `photo_id`, `action` (approve/reject), `actor`, `reason`, `created_at`

6. **Таблица `media_jobs`** - очередь фоновых задач
   - Поля: `kind`, `payload`, `status`, `created_at`, `started_at`, `finished_at`, `error`
   - Типы jobs: thumbnail, strip_exif, hash, move_to_approved, delete

7. **Добавлено поле в `user_profiles`**
   - `current_avatar_id` UUID → `photos.id`
   - Текущая активная аватарка пользователя

---

### Миграция 0023: RLS Policies
**Файл:** `supabase/migrations/0023_media_rls_policies.sql`

**Создано:**

1. **Helper функции**
   - `is_profile_owner(profile_id, user_id)` - проверка владения профилем
   - `can_upload_to_profile(profile_id, user_id)` - право загрузки (владелец, модератор, или семья)
   - `is_in_family_circle(profile_id, user_id)` - проверка родственных связей

2. **RLS политики для `photos`**
   - SELECT: владелец, автор, семья (для approved), модератор, public (для approved+public)
   - INSERT: только pending, если `can_upload_to_profile()`
   - UPDATE: автор (pending), владелец/модератор (все)
   - DELETE: автор (pending), владелец/модератор (все)

3. **RLS политики для `photo_people`**
   - SELECT: все кто видят фото через photos RLS
   - MODIFY: владелец профиля или модератор

4. **RLS политики для `photo_reviews`**
   - SELECT: владелец профиля, модератор
   - INSERT: владелец профиля, модератор (только свои действия)

5. **RLS политики для `media_jobs`**
   - ALL: только модераторы (admin)

6. **RLS политики для `storage.objects` (avatars)**
   - INSERT/UPDATE/DELETE: authenticated, только в свою папку `auth.uid()/`
   - SELECT: public (для CDN)

7. **RLS политики для `storage.objects` (media)**
   - INSERT: запрещён (только через server-signed URLs)
   - SELECT: через таблицу photos + проверка прав
   - DELETE: владелец профиля или модератор

---

## Backend изменения

### 1. Admin Supabase Client
**Файл:** `src/lib/supabase-admin.ts` (НОВЫЙ)

**Назначение:** Создание Supabase client с `service_role` ключом для server-side операций

**Функции:**
- `createAdminClient()` - создать новый admin client
- `getAdminClient()` - singleton instance

**Использование:** Только на сервере, обходит RLS

---

### 2. TypeScript типы
**Файл:** `src/types/media.ts` (НОВЫЙ)

**Экспорты:**
- `MediaStatus`, `MediaVisibility`, `MediaType` - enum типы
- `Photo` - интерфейс фото
- `PhotoPeople`, `PhotoReview`, `MediaJob` - связанные интерфейсы
- Request/Response типы для API:
  - `SignedUploadRequest/Response`
  - `CommitUploadRequest/Response`
  - `ApprovePhotoRequest/Response`
  - `RejectPhotoRequest/Response`
  - `SetAvatarRequest/Response`

---

### 3. API Endpoints

#### POST /api/media/signed-upload
**Файл:** `src/app/api/media/signed-upload/route.ts` (НОВЫЙ)

**Назначение:** Создание signed URL для загрузки в media bucket

**Логика:**
1. Проверка аутентификации
2. Валидация размера файла (25 MB)
3. Проверка `can_upload_to_profile()` через RPC
4. Генерация пути: `profiles/<profile_id>/incoming/<uuid>.<ext>`
5. Создание signed URL через admin client
6. Создание записи в `photos` (status=pending)
7. Возврат `{ uploadUrl, token, bucket, path, photoId }`

---

#### POST /api/media/commit
**Файл:** `src/app/api/media/commit/route.ts` (НОВЫЙ)

**Назначение:** Подтверждение успешной загрузки файла

**Логика:**
1. Проверка что фото существует и принадлежит пользователю
2. Проверка наличия файла в storage
3. Обновление метаданных (width, height, sha256)
4. Создание jobs:
   - `strip_exif` - очистка метаданных
   - `hash` - вычисление sha256 (если не передан)
   - `thumbnail` - генерация превью (1024, 512, 256)

---

#### POST /api/media/approve
**Файл:** `src/app/api/media/approve/route.ts` (НОВЫЙ)

**Назначение:** Одобрение фото владельцем профиля

**Логика:**
1. Проверка прав (`is_profile_owner()` или `current_user_is_admin()`)
2. Обновление статуса → approved
3. Установка `approved_at`, `approved_by`
4. Опциональное изменение `visibility`
5. Создание записи в `photo_reviews`
6. Создание job `move_to_approved` (перенос из incoming/ → approved/)

---

#### POST /api/media/reject
**Файл:** `src/app/api/media/reject/route.ts` (НОВЫЙ)

**Назначение:** Отклонение фото

**Логика:**
1. Проверка прав (владелец или модератор)
2. Обновление статуса → rejected
3. Установка `rejected_at`, `rejected_by`, `rejection_reason`
4. Создание записи в `photo_reviews`
5. Создание job `delete` (удаление через 24 часа)

---

#### POST /api/media/set-avatar
**Файл:** `src/app/api/media/set-avatar/route.ts` (НОВЫЙ)

**Назначение:** Установка основной аватарки профиля

**Логика:**
1. Проверка владения профилем
2. Авто-approve если фото из avatars bucket
3. Архивирование старой аватарки (status=archived)
4. Обновление `user_profiles.current_avatar_id`
5. Возврат обновлённого профиля

---

#### GET /api/media/pending?profileId=xxx
**Файл:** `src/app/api/media/pending/route.ts` (НОВЫЙ)

**Назначение:** Получение списка pending фото для модерации

**Логика:**
1. Проверка прав (владелец или модератор)
2. Запрос pending фото из таблицы `photos`
3. Join с uploader для получения email
4. Генерация URL:
   - avatars: public URL
   - media: signed URL (TTL: 1 час)
5. Возврат массива фото с URL

---

## Frontend изменения

### 1. Обновлённый AvatarUpload
**Файл:** `src/components/profile/AvatarUpload.tsx` (ОБНОВЛЁН)

**Изменения:**
- Добавлен проп `profileId`
- Лимит размера увеличен до 25 MB
- Генерация уникального имени файла: `userId/uuid.ext` (вместо `userId/avatar.ext`)
- Прямая загрузка в avatars bucket (разрешена RLS)
- Создание записи в `photos` таблице
- Вызов `/api/media/set-avatar` для установки как текущей
- Обновлённый текст: "JPG, PNG, WebP, HEIC. Макс 25 МБ."

**Использование:** В секции "Фотография профиля"

---

### 2. Новый компонент PhotoModerationSection
**Файл:** `src/components/profile/PhotoModerationSection.tsx` (НОВЫЙ)

**Назначение:** UI для модерации предложенных фото

**Функционал:**
- Автоматическая загрузка pending фото через `/api/media/pending`
- Grid layout (2 колонки на desktop)
- Карточка каждого фото:
  - Превью изображения
  - Caption
  - Информация о загрузившем
  - Тип и дата
  - Кнопки "Одобрить" / "Отклонить"
- Loading и empty states
- Обработка approve/reject через API
- Удаление из списка после действия

**Использование:** В секции "Предложенные фото"

---

### 3. Обновлённый ProfileForm
**Файл:** `src/components/profile/ProfileForm.tsx` (ОБНОВЛЁН)

**Изменения:**
- Добавлен проп `profileId`
- Импорт `PhotoModerationSection` и иконки `Image` из lucide-react
- Добавлен `'moderation'` в `SectionId` type
- Новая секция в sections array:
  ```typescript
  {
    id: 'moderation',
    title: 'Предложенные фото',
    icon: Image,
    description: 'Модерация фото от родственников',
    component: <PhotoModerationSection profileId={profileId} />
  }
  ```
- Передача `profileId` в `AvatarUpload`

---

### 4. Обновлённая страница Profile
**Файл:** `src/app/[locale]/(protected)/profile/page.tsx` (ОБНОВЛЁН)

**Изменения:**
- Передача `profileId={user.id}` в `ProfileForm`

---

## Документация

### 1. Полное руководство по медиа-системе
**Файл:** `docs/MEDIA_SYSTEM.md` (НОВЫЙ)

**Содержание:**
- Обзор архитектуры
- Railway Variables (environment)
- Описание storage buckets
- Database schema
- API endpoints с примерами
- Матрица прав (RLS)
- Visibility logic
- Фоновые jobs
- Flow диаграммы
- Примеры кода
- Проверочные SQL запросы
- Рекомендации по безопасности

---

### 2. Changelog
**Файл:** `docs/CHANGELOG_2025_01_10.md` (ЭТОТ ФАЙЛ)

---

## Итоговая статистика

### Созданные файлы (11)
1. `supabase/migrations/0022_media_storage_system.sql`
2. `supabase/migrations/0023_media_rls_policies.sql`
3. `src/lib/supabase-admin.ts`
4. `src/types/media.ts`
5. `src/app/api/media/signed-upload/route.ts`
6. `src/app/api/media/commit/route.ts`
7. `src/app/api/media/approve/route.ts`
8. `src/app/api/media/reject/route.ts`
9. `src/app/api/media/set-avatar/route.ts`
10. `src/app/api/media/pending/route.ts`
11. `src/components/profile/PhotoModerationSection.tsx`
12. `docs/MEDIA_SYSTEM.md`
13. `docs/CHANGELOG_2025_01_10.md`

### Обновлённые файлы (3)
1. `src/components/profile/AvatarUpload.tsx`
2. `src/components/profile/ProfileForm.tsx`
3. `src/app/[locale]/(protected)/profile/page.tsx`

### Добавлено в БД
- 3 enum типа
- 2 storage buckets
- 4 таблицы
- 1 поле в user_profiles
- 3 helper функции
- 15+ RLS политик

---

## Следующие шаги

### Обязательно
1. ✅ Применить миграции 0022 и 0023 в Supabase Dashboard
2. ⚠️ Добавить `SUPABASE_SERVICE_ROLE` в Railway Variables
3. 🧪 Протестировать загрузку аватарки

### Опционально
4. Создать фоновый воркер для обработки media_jobs (Railway service)
5. Playwright тесты для полного цикла загрузки
6. Реализовать предложение фото от родственников (UI)
7. Rate limiting на API endpoints
8. Cloudflare CDN для публичных аватарок

---

## Заметки разработчика

### Безопасность
- ✅ Service role ключ НИКОГДА не попадает на клиент
- ✅ Все загрузки в media через server-signed URLs
- ✅ RLS защищает avatars bucket (только своя папка)
- ✅ Модерация обязательна для предложенных фото
- ✅ Видимость family проверяется через verified relatives

### Архитектурные решения
- Два бакета вместо одного: простота для аватарок, безопасность для медиа
- Таблица photos как источник истины (storage = файлы, photos = метаданные)
- Status-based workflow: pending → approved/rejected → archived
- Jobs система для отложенной обработки (thumbnails, EXIF)
- Signed URLs с TTL для приватного контента

### Известные ограничения
- Фоновый воркер пока не реализован (jobs создаются но не обрабатываются)
- Нет rate limiting (можно спамить загрузками)
- Нет вирусного сканирования
- Thumbnails пока не генерируются автоматически
