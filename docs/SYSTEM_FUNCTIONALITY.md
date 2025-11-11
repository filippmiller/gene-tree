# Функционал системы "Генеалогическое дерево" - Постраничное описание

## 📋 Содержание
- [Публичные страницы](#публичные-страницы)
- [Аутентификация](#аутентификация)
- [Защищённые страницы](#защищённые-страницы)
- [API Endpoints](#api-endpoints)

---

## Публичные страницы

### 1. Главная страница `/`
**Файл:** `src/app/page.tsx`

**Функционал:**
- Редирект на `/en` (дефолтная локаль)

**Референсы:**
- `src/app/page.tsx`

---

### 2. Страница логина `/[locale]/sign-in`
**Файл:** `src/app/[locale]/(auth)/sign-in/page.tsx`

**Функционал:**
- Форма входа (email + password)
- Кнопка "Show/Hide" для пароля
- Ссылка "Forgot password" (отправка reset email)
- Ссылка на регистрацию `/[locale]/sign-up`
- После успешного логина → редирект на `/[locale]/app`

**Используемые библиотеки:**
- `@/lib/auth.supabase` - функция `signIn(email, password)`
- shadcn/ui компоненты: Button, Input, Label, Card

**Референсы:**
- `src/app/[locale]/(auth)/sign-in/page.tsx`
- `src/lib/auth.supabase.ts`

---

### 3. Страница регистрации `/[locale]/sign-up`
**Файл:** `src/app/[locale]/(auth)/sign-up/page.tsx`

**Функционал:**
- Форма регистрации (email, password, confirm password)
- Валидация совпадения паролей
- Создание учётной записи через Supabase Auth
- Ссылка на логин

**Референсы:**
- `src/app/[locale]/(auth)/sign-up/page.tsx`
- `src/lib/auth.supabase.ts`

---

## Аутентификация

### Middleware/Proxy
**Файл:** `src/middleware.ts` (переименовать в `proxy.ts`)

**Функционал:**
- Проверка сессии через Supabase Auth
- Защита роутов `/[locale]/app/*`
- Редирект неавторизованных на `/[locale]/sign-in`

**Референсы:**
- `src/middleware.ts`

---

## Защищённые страницы

### 4. Dashboard `/[locale]/app`
**Файл:** `src/app/[locale]/app/page.tsx`

**Функционал:**
- Главная страница приложения после логина
- Статистика семьи (кол-во родственников, фото, воспоминаний)
- Последние добавленные родственники
- Быстрые действия (Добавить родственника, Загрузить фото, и т.д.)

**Компоненты:**
- Навигация (Дашборд, Люди, Связи)
- Кнопка выхода

**Референсы:**
- `src/app/[locale]/app/page.tsx`

---

### 5. Страница профиля `/[locale]/app/profile`
**Файл:** `src/app/[locale]/profile/page.tsx`

**Функционал:**
Редактирование собственного профиля с collapsible секциями:

#### Секция: Фотография профиля
**Компонент:** `AvatarUpload.tsx`
- Загрузка аватарки (прямая в `avatars` bucket)
- Форматы: JPG, PNG, WebP, HEIC, HEIF
- Макс размер: 25 MB
- Предпросмотр текущей аватарки
- Кнопка удаления

**Логика:**
1. Пользователь выбирает файл
2. Upload в `storage.avatars` по пути `<user_id>/<uuid>.<ext>`
3. Создаётся запись в `photos` таблице (status=pending)
4. Вызов `/api/media/set-avatar` для установки как current
5. Авто-approve для аватарок

**Референсы:**
- `src/components/profile/AvatarUpload.tsx`
- API: `/api/media/set-avatar`

---

#### Секция: Предложенные фото
**Компонент:** `PhotoModerationSection.tsx`
- Список pending фото от родственников
- Карточки с превью, информацией о загрузившем
- Кнопки "Одобрить" / "Отклонить"
- Empty state если нет предложений

**Логика:**
1. Загрузка pending фото через `/api/media/pending?profileId=xxx`
2. Для `media` bucket - генерация signed URLs (TTL: 1 час)
3. Approve → `/api/media/approve` → создаётся job `move_to_approved`
4. Reject → `/api/media/reject` → создаётся job `delete` (через 24 часа)

**Референсы:**
- `src/components/profile/PhotoModerationSection.tsx`
- API: `/api/media/pending`, `/api/media/approve`, `/api/media/reject`

---

#### Секция: Основная информация
**Компонент:** `BasicInfoSection.tsx`
- Имя, фамилия, отчество
- Девичья фамилия
- Пол (select: Мужской/Женский)
- Дата рождения (date picker)
- Режим View/Edit с кнопкой "Редактировать"

**Референсы:**
- `src/components/profile/BasicInfoSection.tsx`

---

#### Секция: Места проживания
**Компонент:** `LocationsSection.tsx`
- Место рождения (город, страна)
- Текущий адрес

**Референсы:**
- `src/components/profile/LocationsSection.tsx`

---

#### Секция: Образование
**Компонент:** `EducationSection.tsx`
- Список учебных заведений
- Поля: institution_name, degree, start_year, end_year, is_current
- Добавление/удаление записей

**Референсы:**
- `src/components/profile/EducationSection.tsx`
- Таблица БД: `education`

---

#### Секция: Карьера
**Компонент:** `EmploymentSection.tsx`
- Список мест работы
- Поля: company_name, position, employment_type, start_date, end_date, is_current

**Референсы:**
- `src/components/profile/EmploymentSection.tsx`
- Таблица БД: `employment`

---

#### Секция: О себе
**Компонент:** `BioSection.tsx`
- Биография (текстовое поле)
- Интересы

**Референсы:**
- `src/components/profile/BioSection.tsx`

---

### 6. Страница родственников `/[locale]/app/relationships`
**Файл:** `src/app/[locale]/app/relationships/page.tsx`

**Функционал:**
- Список родственников по глубине родства
- Разделы: Ваша семья, Родители, Прародители, Дети, Внуки
- Кол-во родственников в каждой категории
- Карточки с фото и базовой информацией

**Логика:**
- Использует temporary API `/api/relationships-temp`
- Читает из `pending_relatives` напрямую
- Классификация по depth от 0 до 2+

**Референсы:**
- `src/app/[locale]/app/relationships/page.tsx`
- Компонент: `RelationshipsListByDepth.tsx`
- API: `/api/relationships-temp`

---

### 7. Страница визуализации дерева `/[locale]/app/tree`
**Файл:** `src/app/[locale]/app/tree/page.tsx`

**Функционал:**
- Интерактивная визуализация генеалогического дерева
- Использует D3.js для рендеринга
- Показывает связи: родитель-ребёнок, союзы (браки)

**Типы связей:**
- parent_child - прямые родственные связи
- union - браки/партнёрства
- union_children - дети от союзов

**Логика:**
- API `/api/tree-data` возвращает nodes + links
- Правильная обработка `related_to_user_id` для дедушек/бабушек
- Семён → Кирилл → Филипп (правильная цепочка поколений)

**Референсы:**
- `src/app/[locale]/app/tree/page.tsx`
- Компонент: `TreeVisualization.tsx`
- API: `/api/tree-data`

---

## API Endpoints

### Аутентификация

#### POST `/api/auth/sign-in`
**Логика:** Логин через Supabase Auth

#### POST `/api/auth/sign-up`
**Логика:** Регистрация нового пользователя

#### POST `/api/auth/sign-out`
**Логика:** Выход из системы

---

### Родственники

#### GET `/api/relationships-temp`
**Файл:** `src/app/api/relationships-temp/route.ts`

**Логика:**
- Читает из `pending_relatives`
- Возвращает родственников текущего пользователя
- Группировка по depth (0, 1, 2+)

**Возврат:**
```json
{
  "user_id": "uuid",
  "relationships": [
    {
      "id": "uuid",
      "first_name": "Кирилл",
      "last_name": "Миллер",
      "relationship_type": "parent",
      "depth": 1
    }
  ]
}
```

---

#### GET `/api/tree-data`
**Файл:** `src/app/api/tree-data/route.ts`

**Логика:**
- Читает из `pending_relatives` и `gt_v_*` views
- Собирает nodes (узлы дерева) и links (связи)
- Обрабатывает `related_to_relationship` для правильной иерархии

**Возврат:**
```json
{
  "nodes": [...],
  "parentChild": [...],
  "unionChildren": [...]
}
```

---

### Медиа-система

#### POST `/api/media/signed-upload`
**Файл:** `src/app/api/media/signed-upload/route.ts`

**Назначение:** Создание signed URL для загрузки в `media` bucket

**Вход:**
```json
{
  "target_profile_id": "uuid",
  "type": "portrait",
  "visibility": "family",
  "file_ext": "jpg",
  "content_type": "image/jpeg",
  "size": 1234567
}
```

**Логика:**
1. Проверка `can_upload_to_profile()`
2. Генерация пути `profiles/<profile_id>/incoming/<uuid>.<ext>`
3. `createSignedUploadUrl()` через admin client
4. Создание записи в `photos` (status=pending)

**Возврат:**
```json
{
  "uploadUrl": "https://...",
  "token": "...",
  "bucket": "media",
  "path": "...",
  "photoId": "uuid"
}
```

---

#### POST `/api/media/commit`
**Файл:** `src/app/api/media/commit/route.ts`

**Назначение:** Подтверждение загрузки + создание jobs

**Вход:**
```json
{
  "photoId": "uuid",
  "width": 1920,
  "height": 1080
}
```

**Логика:**
1. Проверка что файл загружен в storage
2. Обновление метаданных (width, height)
3. Создание jobs: strip_exif, hash, thumbnail

**Возврат:**
```json
{
  "success": true,
  "photo": {...},
  "jobs": ["job-id-1", "job-id-2"]
}
```

---

#### POST `/api/media/approve`
**Файл:** `src/app/api/media/approve/route.ts`

**Назначение:** Одобрение фото владельцем профиля

**Вход:**
```json
{
  "photoId": "uuid",
  "visibility": "family"
}
```

**Логика:**
1. Проверка прав (is_profile_owner OR admin)
2. UPDATE photos SET status='approved'
3. Создание записи в photo_reviews
4. Создание job move_to_approved

---

#### POST `/api/media/reject`
**Файл:** `src/app/api/media/reject/route.ts`

**Назначение:** Отклонение фото

**Вход:**
```json
{
  "photoId": "uuid",
  "reason": "..."
}
```

**Логика:**
1. UPDATE photos SET status='rejected'
2. Создание записи в photo_reviews
3. Создание job delete (через 24 часа)

---

#### POST `/api/media/set-avatar`
**Файл:** `src/app/api/media/set-avatar/route.ts`

**Назначение:** Установка основной аватарки профиля

**Вход:**
```json
{
  "photoId": "uuid",
  "profileId": "uuid"
}
```

**Логика:**
1. Авто-approve если из avatars bucket
2. Архивирование старой аватарки (status=archived)
3. UPDATE user_profiles SET current_avatar_id

---

#### GET `/api/media/pending?profileId=xxx`
**Файл:** `src/app/api/media/pending/route.ts`

**Назначение:** Список pending фото для модерации

**Логика:**
1. SELECT * FROM photos WHERE target_profile_id AND status='pending'
2. Генерация signed URLs для media bucket (TTL: 1 час)
3. Public URLs для avatars bucket

**Возврат:**
```json
{
  "photos": [
    {
      "id": "uuid",
      "type": "portrait",
      "url": "...",
      "uploader": {"email": "..."},
      "created_at": "..."
    }
  ],
  "count": 2
}
```

---

#### POST `/api/media/process-jobs`
**Файл:** `src/app/api/media/process-jobs/route.ts`

**Назначение:** Обработка очереди media_jobs

**Аутентификация:** 
- Admin через RPC `current_user_is_admin()`
- OR Bearer token (для cron): `Authorization: Bearer <CRON_SECRET>`

**Логика:**
1. SELECT * FROM media_jobs WHERE status='queued' LIMIT 10
2. Обработка по типу:
   - `move_to_approved` - копирование файла incoming → approved
   - `delete` - удаление rejected фото (с delay_hours)
   - `thumbnail`, `strip_exif`, `hash` - TODO

**Возврат:**
```json
{
  "processed": 3,
  "results": [
    {"id": "...", "status": "completed"},
    {"id": "...", "status": "failed", "error": "..."}
  ]
}
```

---

## База данных

### Таблицы медиа-системы

#### `photos`
Главный реестр всех фото
- `id` UUID PK
- `bucket` TEXT ('avatars' | 'media')
- `path` TEXT
- `uploaded_by` UUID → auth.users
- `target_profile_id` UUID → user_profiles
- `type` media_type
- `status` media_status (pending/approved/rejected/archived)
- `visibility` media_visibility (public/family/private/unlisted)
- Метаданные: caption, taken_at, exif, sha256, width, height
- Модерация: approved_at, approved_by, rejected_at, rejected_by, rejection_reason

#### `photo_people`
N:M связь фото ↔ профили (кто на фото)
- `photo_id` UUID
- `profile_id` UUID
- `role` TEXT

#### `photo_reviews`
Журнал модерации
- `id` UUID PK
- `photo_id` UUID
- `action` TEXT (approve/reject)
- `actor` UUID
- `reason` TEXT
- `created_at` TIMESTAMPTZ

#### `media_jobs`
Очередь фоновых задач
- `id` UUID PK
- `kind` TEXT (thumbnail/strip_exif/hash/move_to_approved/delete)
- `payload` JSONB
- `status` TEXT (queued/processing/completed/failed)
- `created_at`, `started_at`, `finished_at`
- `error` TEXT

---

## RLS Политики

### Таблица `photos`
- **SELECT**: владелец профиля, автор, семья (для approved+family), public (для approved+public), модератор
- **INSERT**: только pending, если can_upload_to_profile()
- **UPDATE**: автор (pending), владелец/модератор (все)
- **DELETE**: автор (pending), владелец/модератор (все)

### Storage `avatars`
- **INSERT/UPDATE/DELETE**: authenticated AND path LIKE auth.uid() || '/%'
- **SELECT**: public (для CDN)

### Storage `media`
- **INSERT**: запрещён (только через server-signed URLs)
- **SELECT**: через photos таблицу + RLS
- **DELETE**: владелец профиля OR модератор

---

## Фоновые задачи (TODO)

### `thumbnail`
- Генерация превью: 1024px, 512px, 256px
- Сохранение с суффиксом `_thumb_1024.jpg`

### `strip_exif`
- Удаление GPS и sensitive метаданных
- Сохранение полезных (дата, камера) в photos.exif

### `hash`
- Вычисление SHA-256 для дедупликации

### `move_to_approved`
- Копирование incoming → approved
- Обновление photos.path
- Удаление исходника

### `delete`
- Удаление rejected фото через delay_hours
- Очистка storage + photos запись

---

## Environment Variables (Railway)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE=eyJhbGc...  # ⚠️ НИКОГДА на клиент!

# Next.js
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Cron (optional)
CRON_SECRET=your-secret-token
```

---

## Полезные команды

```bash
# Запуск dev сервера
npm run dev

# Playwright тесты
npx playwright test --headed
npx playwright test tests/avatar-simple.spec.ts

# Обработка jobs вручную (если admin)
curl -X POST http://localhost:3000/api/media/process-jobs

# Проверка RLS политик
# В Supabase Dashboard SQL Editor:
SELECT * FROM pg_policies WHERE tablename='photos';
```
