# Invitation-Based Family Tree MVP

Дата: 2025-11-08
Автор: Warp AI Agent
Статус: Active
Заменяет: 2025-11-08--family-tree-mvp.md

## Ключевая концепция

**Распределённое семейное дерево через приглашения:**
- Каждый пользователь = один реальный человек (user = person)
- Регистрация происходит либо напрямую, либо по приглашению
- Родственники приглашают друг друга, автоматически создавая связи
- Каждый управляет своими данными и контролирует приватность
- Дерево растёт органически через сеть приглашений

## Цели MVP

1. **Регистрация и профиль**
   - Регистрация с подробными данными о себе
   - Расширенный профиль с полями приватности
   - Загрузка фото

2. **Система приглашений**
   - Создание приглашения (email/phone + тип родства)
   - Отправка приглашения по email
   - Регистрация по уникальной ссылке-приглашению
   - Автоматическое создание связи при регистрации

3. **Просмотр дерева**
   - Список всех родственников
   - Визуализация семейного дерева
   - Фильтрация по видимости данных (публичные/семейные)

4. **Управление связями**
   - Просмотр существующих связей
   - Удаление связи (по согласию обеих сторон?)

## Не-цели (out of scope для MVP)

- Множественные семейные группы
- Модерация приглашений
- Разрешение конфликтов (два приглашения одному человеку)
- Сложные права доступа (только: public, family, private)
- События и документы
- GEDCOM импорт/экспорт

## Модель данных

### Таблица: `user_profiles` (расширение auth.users)

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Основная информация
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  maiden_name TEXT,
  nickname TEXT,
  
  -- Даты
  birth_date DATE,
  birth_place TEXT,
  death_date DATE,
  death_place TEXT,
  is_living BOOLEAN DEFAULT true,
  
  -- Пол
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  
  -- Дополнительно
  bio TEXT,
  avatar_url TEXT,
  occupation TEXT,
  phone TEXT,
  
  -- Приватность (JSON для гибкости)
  privacy_settings JSONB DEFAULT '{"birth_date": "family", "birth_place": "family", "phone": "private", "bio": "public"}'::jsonb,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_last_name ON user_profiles(last_name);
CREATE INDEX idx_user_profiles_birth_date ON user_profiles(birth_date);

-- Триггер для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

### Таблица: `invitations`

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Кто приглашает
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Кого приглашают
  invitee_email TEXT NOT NULL,
  invitee_phone TEXT,
  
  -- Тип родства (относительно inviter)
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN (
      'parent',    -- родитель
      'child',     -- ребёнок
      'spouse',    -- супруг(а)
      'sibling',   -- брат/сестра
      'grandparent',
      'grandchild',
      'uncle_aunt',
      'nephew_niece',
      'cousin'
    )
  ),
  
  -- Токен и статус
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'rejected')),
  
  -- Персональное сообщение
  message TEXT,
  
  -- Кто зарегистрировался по приглашению (заполняется при accept)
  accepted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Даты
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  accepted_at TIMESTAMPTZ
);

CREATE INDEX idx_invitations_inviter ON invitations(inviter_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status ON invitations(status);
```

### Таблица: `relationships`

```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Тип связи (симметричные: spouse, sibling; направленные: parent)
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN (
      'parent',    -- user1 является родителем user2
      'spouse',
      'sibling',
      'grandparent',
      'uncle_aunt',
      'cousin'
    )
  ),
  
  -- Дополнительная информация
  marriage_date DATE,
  marriage_place TEXT,
  divorce_date DATE,
  
  -- Ссылка на приглашение которое создало эту связь
  created_from_invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Уникальность
  CONSTRAINT unique_relationship UNIQUE (user1_id, user2_id, relationship_type),
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

CREATE INDEX idx_relationships_user1 ON relationships(user1_id);
CREATE INDEX idx_relationships_user2 ON relationships(user2_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
```

### Privacy Settings Schema

```typescript
interface PrivacySettings {
  birth_date: 'public' | 'family' | 'private';
  birth_place: 'public' | 'family' | 'private';
  death_date: 'public' | 'family' | 'private';
  death_place: 'public' | 'family' | 'private';
  phone: 'public' | 'family' | 'private';
  occupation: 'public' | 'family' | 'private';
  bio: 'public' | 'family' | 'private';
  avatar_url: 'public' | 'family' | 'private';
}

// Defaults:
// - public: bio, occupation, avatar
// - family: даты, места, maiden_name
// - private: phone
```

## API Endpoints

### Profile API

#### GET /api/profile/me
Получить свой профиль (полный доступ ко всем полям)

#### PUT /api/profile/me
Обновить свой профиль

#### GET /api/profile/:userId
Получить профиль родственника (с учётом privacy settings)

### Invitations API

#### POST /api/invitations
Создать и отправить приглашение
```typescript
Request: {
  invitee_email: string,
  invitee_phone?: string,
  relationship_type: string,
  message?: string
}
Response: { data: Invitation }
```

#### GET /api/invitations/sent
Список отправленных приглашений

#### GET /api/invitations/received
Список полученных приглашений (по email)

#### GET /api/invitations/:token
Получить детали приглашения по токену (для страницы регистрации)

#### POST /api/invitations/:token/accept
Принять приглашение (создаёт relationship)

#### POST /api/invitations/:token/reject
Отклонить приглашение

### Relationships API

#### GET /api/relationships/me
Получить все связи текущего пользователя
```typescript
Response: {
  parents: User[],
  children: User[],
  spouses: User[],
  siblings: User[],
  // ... другие
}
```

#### GET /api/relationships/tree
Получить полное дерево родственников

#### DELETE /api/relationships/:id
Удалить связь

### Family API

#### GET /api/family
Получить список всех родственников (с фильтрацией по privacy)

## UI Flows

### 1. Первичная регистрация (основатель дерева)

1. Пользователь заходит на `/sign-up`
2. Заполняет email, пароль, имя
3. Подтверждает email
4. Перенаправляется на `/profile/complete` - заполнение расширенного профиля
5. После заполнения → `/app` (dashboard)

### 2. Регистрация по приглашению

1. Пользователь получает email с ссылкой: `https://app.com/invite/{token}`
2. Открывает ссылку → видит страницу с информацией кто пригласил
3. Нажимает "Accept & Sign Up"
4. Заполняет email, пароль, базовые данные
5. **Автоматически создаётся:**
   - Аккаунт
   - Профиль
   - Relationship с inviter
6. Перенаправляется на `/profile/complete`
7. Затем → `/app`

### 3. Отправка приглашения

1. Dashboard → кнопка "Invite Family Member"
2. Модальное окно с формой:
   - Email адрес
   - Тип родства (dropdown: Father, Mother, Son, Daughter, Spouse, Sibling...)
   - Персональное сообщение (опционально)
3. Submit → отправка email
4. Приглашение появляется в списке "Sent Invitations" со статусом

### 4. Просмотр профиля родственника

1. Dashboard → "Family Members" → клик на человека
2. Открывается профиль с учётом privacy:
   - Public поля - видны всегда
   - Family поля - видны родственникам
   - Private поля - скрыты
3. Кнопки: "View Relationship", "Message" (future)

### 5. Настройка приватности

1. Dashboard → "My Profile" → "Privacy Settings"
2. Для каждого поля выбирается уровень:
   - 🌍 Public (все)
   - 👨‍👩‍👧‍👦 Family (родственники)
   - 🔒 Private (только я)

## Email Template: Invitation

```
Subject: You've been invited to join the Family Tree by {InviterName}

Hi!

{InviterName} has invited you to join the family tree on FamilyTree.com

Relationship: {InviterName} is your {relationship}

{PersonalMessage}

Click here to accept and create your profile:
[Accept Invitation Button] → https://app.com/invite/{token}

This invitation expires in 30 days.

---
If you don't want to join, simply ignore this email.
```

## RLS Policies

```sql
-- User Profiles: каждый видит свой + родственников (с учётом privacy)
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view family profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE (r.user1_id = auth.uid() AND r.user2_id = user_profiles.id)
         OR (r.user2_id = auth.uid() AND r.user1_id = user_profiles.id)
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Invitations
CREATE POLICY "Users can view their sent invitations"
  ON invitations FOR SELECT
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can view invitations to their email"
  ON invitations FOR SELECT
  USING (
    auth.jwt()->>'email' = invitee_email
    OR auth.uid() = accepted_user_id
  );

CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Relationships: все могут видеть свои связи
CREATE POLICY "Users can view their relationships"
  ON relationships FOR SELECT
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );
```

## Privacy Filter Logic (Backend)

```typescript
function filterProfileByPrivacy(
  profile: UserProfile,
  viewerId: string,
  isFamily: boolean
): Partial<UserProfile> {
  const filtered = { ...profile };
  const settings = profile.privacy_settings;
  
  for (const [field, level] of Object.entries(settings)) {
    if (level === 'private' && viewerId !== profile.id) {
      delete filtered[field];
    }
    if (level === 'family' && !isFamily && viewerId !== profile.id) {
      delete filtered[field];
    }
    // 'public' - доступно всем
  }
  
  return filtered;
}
```

## Тест-кейсы

### Основные сценарии
1. ✅ Пользователь регистрируется и заполняет профиль
2. ✅ Пользователь отправляет приглашение родителю
3. ✅ Родитель получает email, регистрируется по ссылке
4. ✅ Автоматически создаётся связь parent-child
5. ✅ Оба видят друг друга в "Family Members"
6. ✅ Пользователь настраивает приватность своих полей
7. ✅ Родитель видит только разрешённые поля
8. ✅ Дерево отображается корректно

### Edge cases
- Приглашение на уже зарегистрированный email
- Expired invitation
- Два человека приглашают одного (конфликт)
- Пользователь пытается изменить чужой профиль
- Циклические связи
- Удаление пользователя с активными связями

## Риски и митигация

1. **Конфликт приглашений**
   - Риск: Два человека приглашают одного и того же
   - Митигация: В MVP - first come first served. В v2 - conflict resolution UI

2. **Спам приглашений**
   - Риск: Пользователь отправляет множество приглашений
   - Митигация: Rate limiting (max 10 приглашений в день)

3. **Privacy leaks**
   - Риск: Баг в фильтрации данных
   - Митигация: Строгие RLS policies + backend validation

4. **Orphaned profiles**
   - Риск: Пользователь создал аккаунт но не заполнил профиль
   - Митигация: Reminder emails, incomplete profile indicator

## Следующие итерации (после MVP)

- Conflict resolution для приглашений
- Групповые семейные чаты
- События и календарь
- Документы и фотоальбомы
- Генеалогические отчёты
- GEDCOM экспорт
- Mobile app
