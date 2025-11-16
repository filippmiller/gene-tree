# Gene-Tree Project Handoff — 2025‑11‑14 (Session 2)

**Date:** 2025‑11‑14  
**Project:** Gene-Tree — Family Tree / Stories Platform  
**Session:** Evening pass (continued work on media, notifications, voice stories)

This document summarizes what was done in this session, current environment setup (Supabase/Railway/GitHub), known issues, and next steps for the next working session.

---

## 1. How We Work / Dev Flow

### Local Development

- Repo: `C:\dev\gene-tree` (GitHub: `https://github.com/filippmiller/gene-tree`)
- Tooling:
  - Node.js 20.x
  - `npm` as package manager
  - Next.js 15.0.3 (App Router)
  - TypeScript 5.x, ESLint 9.x
  - Supabase JS client, Tailwind, next-intl, Playwright

Typical local workflow:

```bash
# 1) Install deps (done once per checkout)
npm install

# 2) Start dev server (default port 3000)
npm run dev
# or with explicit port
# $env:PORT="3020"; npm run dev -- --port 3020

# 3) Lint + typecheck + build (before pushing)
npm run check   # typecheck + lint
npm run build
npm start       # run production build locally
```

### Git / CI / Deploy

- Main branch: `main`.
- CI: `.github/workflows/ci.yml`
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck` (non‑blocking, `continue-on-error: true`)
  - `npm run build`
  - `npm run test:e2e` on pushes to `main`.
- Deployment (Railway, production):
  - Project: **`gene-tree-production`** (see `docs/ops/railway-quickstart.md`).
  - Typical commands:

    ```bash
    # link local repo to Railway project (once)
    railway link

    # run dev server with Railway env
    railway run npm run dev

    # deploy latest commit on main
    railway up
    ```

- CI/CD can also be done via GitHub → Railway integration (push to `main` triggers deploy).

### Supabase / Environment

- Supabase project:
  - **Project ID / ref:** `mbntpsfllwhlnzuzspvp`
  - URL: `https://mbntpsfllwhlnzuzspvp.supabase.co`
  - Dashboard: `https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp`
- Environment variables (see `SUPABASE_CONNECTION_REPORT.md`, `SYSTEM_FUNCTIONALITY.md`, `docs/MEDIA_SYSTEM.md`):

  ```env
  # Public
  NEXT_PUBLIC_SUPABASE_URL=https://mbntpsfllwhlnzuzspvp.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...  # anon key

  # Server-side
  SUPABASE_SERVICE_ROLE_KEY=...      # rotate if leaked
  SUPABASE_URL=https://mbntpsfllwhlnzuzspvp.supabase.co
  DATABASE_URL=postgresql://...      # Supabase pooler URL

  # Local only (for dev TLS issues)
  NODE_TLS_REJECT_UNAUTHORIZED=0
  ```

- Storage buckets (from `supabase/migrations/0022_media_storage_system.sql` + later migrations):
  - `avatars` — public image bucket for avatars (direct client uploads).
  - `media`   — private media (photos, general images) via signed URLs.
  - **NEW:** `audio` — private bucket for voice stories (webm/mp3/m4a, max 25–50 MB depending on config).

---

## 2. Build / Version Banner in Nav

**Goal:** always know which commit/build is running (avoid debugging cached/old deploy).

Changes:

- New file `BUILD_VERSION` (numeric counter). Incremented automatically before `npm run build`.
- New script `scripts/generate-build-info.js`:
  - Reads `BUILD_VERSION`.
  - Reads current Git commit and timestamp:
    - `git --no-pager rev-parse --short HEAD`
    - `git --no-pager log -1 --format=%cI`.
  - Generates `src/lib/build-info.ts` with:

    ```ts
    export const BUILD_NUMBER = '48';
    export const BUILD_LABEL = 'dev-v48';
    export const GIT_COMMIT_HASH = 'b69364d';
    export const GIT_COMMIT_TIMESTAMP = '2025-11-14T10:59:00+03:00';
    ```

- `package.json` scripts:

  ```json
  "prebuild": "node scripts/increment-build.js && node scripts/generate-build-info.js",
  "build": "next build"
  ```

- `src/components/Nav.tsx` now shows a small build badge in the top-right:
  - First line: `dev-v48 · b69364d`.
  - Second line: ISO timestamp.

**Next steps:**
- Optionally add a similar badge in the footer or `/api/health` for easier debugging of deployed environments.

---

## 3. Dashboard: i18n + Notifications

### 3.1. Dashboard i18n cleanup

File: `src/app/[locale]/(protected)/app/page.tsx`

- Replaced hardcoded English strings with `next-intl` `t('dashboard.*')` keys.
- New `dashboard` namespace in `src/messages/en/common.json` and `src/messages/ru/common.json`:
  - `welcomeBack`, `subtitle`, `totalPeople`, `generations`, `relationships`, `quickActions`, `addFamilyMember`, `viewFamilyTree`, `recentActivity`, etc.
- Result: `/ru/app` полностью на русском, `/en/app` — на английском.

### 3.2. Notifications backend

Migration: `supabase/migrations/0027_notifications.sql`

New tables:

- `public.notifications`
  - `event_type` — `'relative_added' | 'media_added' | ...`
  - `actor_profile_id` — кто сделал действие.
  - `primary_profile_id` — к какому профилю относится событие.
  - `related_profile_id` — опционально, для связанных профилей.
  - `payload` — JSON с деталями (имя родственника, `photo_id`, тип связи и т.д.).

- `public.notification_recipients`
  - `notification_id` → `notifications.id`.
  - `profile_id` → `user_profiles.id` (кому адресовано).
  - `is_read`, `read_at`.

RLS:

- `notifications`: доступ только для admin (обычные пользователи читают через join).
- `notification_recipients`: пользователь видит/меняет только свои записи (`profile_id = auth.uid()`), админ — всё.

Helper function:

- `get_family_circle_profile_ids(p_user_id uuid)` → `SETOF (profile_id uuid)`
  - базируется на существующей функции `is_in_family_circle(profile_id, user_id)`.

Server helper (TypeScript): `src/lib/notifications.ts`:

- `createNotification({ eventType, actorUserId, primaryProfileId?, relatedProfileId?, payload? })`:
  1. Создаёт запись в `notifications`.
  2. Вычисляет получателей через `get_family_circle_profile_ids(actorUserId)`.
  3. Добавляет самого автора в список получателей.
  4. Записывает в `notification_recipients` по одной строке на каждого.

### 3.3. Notifications API

- `GET /api/notifications` — список последних уведомлений текущего пользователя.
  - Файл: `src/app/api/notifications/route.ts`.
  - Возвращает массив объектов вида:

    ```ts
    {
      notification_id,
      is_read,
      read_at,
      notification: {
        id,
        event_type,
        actor_profile_id,
        primary_profile_id,
        related_profile_id,
        payload,
        created_at,
      }
    }
    ```

- `POST /api/notifications/read` — пометить набор уведомлений как прочитанные.
  - Файл: `src/app/api/notifications/read/route.ts`.
  - Тело: `{ "ids": ["uuid1", "uuid2", ...] }`.

### 3.4. Уведомления в дешборде

Компонент: `src/components/dashboard/NotificationsPanel.tsx`

- Клиентский компонент, рендерит:
  - Заголовок «Уведомления» с иконкой колокольчика.
  - Badge с количеством непрочитанных.
  - Список последних ~8 событий.
- Форматирование:
  - `relative_added` → текст вида: «Добавлен новый родственник: Дарья Нуберг (sibling)».
  - `media_added`:
    - если `payload.media_type === 'video' && payload.kind === 'voice_story'` → логически это голосовая история (позже можно поменять текст на «Добавлена новая голосовая история»), 
    - иначе: «Добавлена новая фотография».
- При клике на элемент уведомление помечается прочитанным через `/api/notifications/read`.

Интеграция в дешборд:

- `src/app/[locale]/(protected)/app/page.tsx` теперь в верхней части страницы располагает приветствие и `NotificationsPanel` рядом:
  - слева блок "Добро пожаловать, {имя}", справа колонка с уведомлениями.

**Что ещё можно сделать:**
- Добавить фильтрацию/пагинацию, выделение по типам событий.
- Добавить переходы по клику (например, открыть профиль родственника или медиагалерею).

---

## 4. Профиль пользователя: фото и интересы

### 4.1. Личные фото в профиле

Компонент: `src/components/profile/ProfilePhotosSection.tsx`

- Отдельная секция «Мои фотографии» на странице `My Profile` (`/ [locale]/my-profile`).
- Возможности:
  - Мультизагрузка изображений (`input type="file" multiple`), фильтр по `image/*`.
  - Лимит размера: 25 МБ на файл (соответствует настройкам bucket `media`).
  - Прогресс по каждому файлу: статусы `pending → signed-url → uploading → committing → done/error`.
  - После завершения батча фотографии подгружаются из `photos` и отображаются сеткой.

Технически:

1. Для каждого файла: `POST /api/media/signed-upload` с:
   - `target_profile_id` = id собственного профиля,
   - `type = 'portrait'`, `visibility = 'family'`, `file_ext`, `content_type`, `size`.
2. По ответу:
   - `supabase.storage.from('media').uploadToSignedUrl(path, token, file)`.
3. `POST /api/media/commit` с `photoId`.
4. Фото выбираются из `photos` (bucket `media`, `status='approved'`, `target_profile_id = profileId`), для каждого строится `createSignedUrl` и отображается в `<img>`.

### 4.2. Интересы пользователя

Миграция: `supabase/migrations/0026_profile_media_and_interests.sql`

Новые таблицы:

- `public.profile_interests`
  - `profile_id` → `user_profiles.id` (чей интерес).
  - `title`, `description`.
- `public.profile_interest_items`
  - `interest_id` → `profile_interests.id`.
  - `kind` — `'photo' | 'link | 'video'`.
  - `photo_id` (опциональный связанный медиа‑объект из `photos`).
  - `url`, `title`, `notes`.

RLS:

- Управлять интересами и их элементами может владелец профиля (`profile_id = auth.uid()`) или админ.

Компонент: `src/components/profile/ProfileInterestsSection.tsx`

- Секция «Мои интересы» на `My Profile`.
- Возможности:
  - Создать новый интерес (название + описание).
  - Для каждого интереса — список элементов (в текущей версии: **ссылки** `kind='link'`).
  - Форма «Добавить ссылку» (URL + подпись).
- Хранение через Supabase JS client в новых таблицах.

### 4.3. Интеграция в страницу «Мой профиль»

Файл: `src/app/[locale]/(protected)/my-profile/page.tsx`

- Страница теперь собирается из компонентов:
  - Шапка с заголовком «Мой профиль» и аватаркой (`AvatarUpload`).
  - `ProfilePhotosSection` — личные фото.
  - `EducationSection` — образование (существующий функционал).
  - `ResidenceSection` — места проживания.
  - `ProfileInterestsSection` — блок с интересами.

Открытые вопросы:
- Пока `AvatarUpload` не читает `currentAvatar` из БД (передаётся `null`); можно подтянуть `user_profiles.avatar_url` и прокинуть вниз.
- `ProfilePhotosSection` и interests сейчас только на RU, в текстах нет en‑переводов — нужно добавить в `common.json` и использовать `useTranslations`.

---

## 5. Голосовые истории о родственниках

Цель: дать пожилым родственникам простой способ записывать **голосовые истории** про членов семьи — с сохранением как аудио + (в будущем) автоматическая транскрипция.

### 5.1. Хранение голосовых историй

Миграция: `supabase/migrations/0028_voice_stories.sql` (уже применена).

- Bucket `audio` для файлов (webm/mp3/m4a, max 50MB).
- Таблица `public.voice_stories` (см. раздел 1):
  - `target_profile_id` — о ком история.
  - `narrator_profile_id` — кто рассказывает.
  - `bucket`, `path`, `duration_seconds`, `size_bytes`.
  - `transcript_text`, `transcript_lang`, `transcript_confidence` (для будущего ASR).
  - `visibility`, `status`, поля модерации.

### 5.2. API для загрузки голоса

#### `POST /api/voice-stories/signed-upload`

Файл: `src/app/api/voice-stories/signed-upload/route.ts`.

- Тело:

  ```json
  {
    "target_profile_id": "<uuid>",
    "duration_seconds": 75,
    "size": 1234567,
    "content_type": "audio/webm",
    "file_ext": "webm",
    "title": "Как Филя лежал и смотрел в окно"
  }
  ```

- Проверки:
  - авторизация;
  - MIME‑тип начинается с `audio/`;
  - размер ≤ 50MB;
  - `can_upload_to_profile(target_profile_id, user.id)`.
- Создаёт signed URL в bucket `audio` по пути `stories/<profile_id>/<uuid>.<ext>`.
- Вставляет черновик в `voice_stories` и возвращает `{ uploadUrl, token, bucket, path, storyId }`.

#### `POST /api/voice-stories/commit`

Файл: `src/app/api/voice-stories/commit/route.ts`.

- Тело: `{ "storyId": "uuid" }`.
- Проверяет, что история существует и принадлежит текущему пользователю.
- Добавляет job в `media_jobs`:

  ```ts
  { kind: 'transcribe_voice', payload: { story_id, bucket, path }, status: 'queued' }
  ```

  (отдельный worker будет позже делать транскрипцию и заполнять `transcript_text`.)

- Через `createNotification` создаёт уведомление `media_added` с `payload.kind = 'voice_story'`.

### 5.3. Клиентский голосовой рекордер

Компонент: `src/components/profile/VoiceStoryRecorder.tsx`

- Интерфейс для пожилого пользователя: одна большая кнопка «Начать запись / Остановить запись».
- Логика:
  - `MediaRecorder` пишет аудио (webm) с микрофона.
  - После остановки создаём `Blob` и считаем длительность.
  - Вызываем `signed-upload` → `uploadToSignedUrl` → `commit`.
  - Состояния и подсказки:
    - «Запись идёт», «Сохранение…», «История сохранена», «Ошибка».

### 5.4. Интеграция на страницу профиля

Файл: `src/app/[locale]/profile/[id]/page.tsx`

- Внизу страницы (перед блоком про incomplete profile / connection) добавлен блок:

  ```tsx path=null start=null
  {/* Voice stories recorder for relatives */}
  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
    <VoiceStoryRecorder profileId={actualProfile.id} />
  </div>
  ```

- Так любой авторизованный и имеющий право пользователь может открыть профиль (например, тёти или Фили), нажать кнопку «Записать историю» и сохранить голосовую заметку про этого человека.

**Следующие шаги по голосовым историям:**

1. **UI для просмотра историй**
   - Новый компонент, например `ProfileStoriesSection` на `profile/[id]` или `family-profile`.
   - Выборка из `voice_stories` по `target_profile_id` с учётом RLS/visibility.
   - Для каждого `voice_story` — `<audio controls src={signedUrl}>` + отображение `transcript_text` (когда появится).

2. **Фоновый worker для транскрипции**
   - Railway service, который читает `media_jobs` с `kind='transcribe_voice'` и `status='queued'`.
   - Загружает аудио через signed URL и отправляет в ASR (например, Whisper API / OpenAI / др.).
   - Пишет транскрипт в `voice_stories.transcript_text` / `transcript_lang` / `transcript_confidence` и помечает job `completed`.

3. **Улучшение notifications**
   - Для payload `kind='voice_story'` поменять текст в `NotificationsPanel` с «новое видео» на «новая голосовая история».

---

## 6. Bugfixes / Issues We Hit Today

1. **`/api/relatives` возвращал 401**
   - Причина: использовался `getSupabaseAdmin().auth.getUser()` (service role не видит cookie‑сессию).
   - Фикс: в `POST` и `GET /api/relatives` заменили на SSR‑клиент:

     ```ts
     const supabase = await getSupabaseSSR();
     const { data: { user }, error: userError } = await supabase.auth.getUser();
     ```

2. **После создания родственника происходил редирект на `/people` → 404**
   - Причина: страница списка людей живёт по маршруту `/${locale}/people`, но `AddRelativeForm` делал `router.push('/people')`.
   - Фикс: `AddRelativeForm` теперь забирает `locale` из `useParams()` и делает `router.push(`/${locale}/people`).

3. **Синтаксическая ошибка в `app/page.tsx` (`Unexpected token 'div'`)**
   - Причина: при вставке `NotificationsPanel` был нарушен JSX (лишний `div` без обёртки).
   - Фикс: переформатирован `return` так, чтобы был один корневой `<div>` с вложенным `<main>` и корректно вложенными секциями.

4. **Локализация**
   - Дашборд был частично на английском при `ru` в URL.
   - Фикс: перенесли все строки в `dashboard` namespace в `common.json` для `ru/en`, переиспользовали `useTranslations('dashboard')`.

---

## 7. Open TODOs for Next Session

**High‑priority:**

1. **Finish notifications UX**
   - Добавить более информативные тексты, локализацию на EN.
   - Сделать клики по уведомлениям с переходом на соответствующий экран (профиль родственника, галерея, история и т.д.).

2. **Voice stories playback UI**
   - Реализовать компонент для просмотра/прослушивания `voice_stories` на странице профиля.
   - Определить формат отображения (список историй, сортировка по дате, кто рассказал и про кого).

3. **Transcription worker**
   - Спроектировать и реализовать сервис на Railway, который обрабатывает `media_jobs.kind='transcribe_voice'`.
   - Интегрировать с выбранным ASR API.

4. **Video uploads on dashboard**
   - На базе существующего `media` bucket (уже добавлен `media_type='video'` и видео‑MIME в `0026`), сделать секцию «Мои видеозаметки» на дешборде.
   - Ограничение файла (например, 50 МБ), прогресс‑бар, привязка к `photos` с `type='video'`.

**Medium‑priority:**

5. **Дочистить i18n**
   - Перевести новые строки: «Мои фотографии», «Мои интересы», тексты в NotificationsPanel, VoiceStoryRecorder и т.п. на английский, добавить в `src/messages/en/common.json` и использовать `useTranslations`.

6. **AvatarUpload улучшения**
   - Передавать реальный `currentAvatar` из `user_profiles.avatar_url` на `MyProfilePage`, чтобы при заходе отображалась текущая аватарка без перезагрузки.

7. **Документация для новых подсистем**
   - Добавить разделы в `docs/MEDIA_SYSTEM.md` и/или создать `docs/VOICE_STORIES.md` и `docs/NOTIFICATIONS.md` с архитектурой, схемой БД, API и UX паттернами.

---

## 8. Быстрый чек-лист перед следующей сессией

1. **Подтвердить, что все миграции применены**
   - `0022_media_storage_system.sql` (уже было).
   - `0023_media_rls_policies.sql` / `0024_fix_storage_rls.sql` (RLS для storage).
   - **Новые:** `0026_profile_media_and_interests.sql`, `0027_notifications.sql`, `0028_voice_stories.sql`.

2. **Проверить, что dev‑сервер поднимается без ошибок**

   ```bash
   npm run dev
   ```

3. **Пробежать по основным сценариям**:
   - Логин под своим аккаунтом (`/[locale]/sign-in` → `/[locale]/app`).
   - Добавление родственника → появление уведомления.
   - Загрузка личных фото в `My Profile` → фото видны в галерее.
   - Создание интересов и добавление ссылок.
   - Запись голосовой истории на `/[locale]/profile/[id]` (проверить, что запись появляется в `voice_stories` и в уведомлениях).

4. **Подготовить доступ к ASR API** (если планируется транскрипция в следующей сессии):
   - токен, endpoint, лимиты,
   - решить, где хранить ключ (Railway / Supabase secrets / 1Password).

---

Готово. Этот файл (`HANDOFF-2025-11-14-session-2.md`) можно открыть в следующей сессии как отправную точку: он описывает, что уже встроено (уведомления, личные фото, интересы, голосовые истории), как подключены Railway/Supabase/GitHub и какие задачи ещё впереди.