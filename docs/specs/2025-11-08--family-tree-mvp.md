# Family Tree MVP

Дата: 2025-11-08
Автор: Warp AI Agent
Статус: Draft

## Цели

Создать минимально жизнеспособный продукт (MVP) для управления семейным деревом:
- Добавление членов семьи (ФИО, даты рождения/смерти, фото)
- Установление родственных связей (родитель-ребёнок, супруги)
- Просмотр списка всех членов семьи
- Просмотр детальной информации о человеке
- Визуализация семейного дерева
- Поиск и фильтрация по людям

## Не-цели (out of scope для MVP)

- Сложные генеалогические отчёты
- Импорт/экспорт GEDCOM
- Геолокация и карты
- Документы и источники
- ДНК-тестирование интеграция
- Мультиязычные биографии
- Права доступа и семейные группы (будет один владелец)

## Модель данных

### Таблица: `people`
```sql
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Основная информация
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  maiden_name TEXT, -- девичья фамилия
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
  bio TEXT, -- краткая биография
  avatar_url TEXT, -- URL фотографии
  occupation TEXT,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Индексы
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_people_user_id ON people(user_id);
CREATE INDEX idx_people_last_name ON people(last_name);
CREATE INDEX idx_people_birth_date ON people(birth_date);
```

### Таблица: `relationships`
```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  person1_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  
  -- Тип связи
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN (
      'parent', -- person1 является родителем person2
      'spouse', -- супруги (симметричная связь)
      'sibling' -- братья/сёстры (симметричная связь)
    )
  ),
  
  -- Дополнительная информация
  marriage_date DATE,
  marriage_place TEXT,
  divorce_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Уникальность для предотвращения дубликатов
  CONSTRAINT unique_relationship UNIQUE (person1_id, person2_id, relationship_type),
  
  -- Проверка что не связываем человека с самим собой
  CONSTRAINT different_people CHECK (person1_id != person2_id)
);

CREATE INDEX idx_relationships_person1 ON relationships(person1_id);
CREATE INDEX idx_relationships_person2 ON relationships(person2_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
```

### Row Level Security (RLS)

```sql
-- Включить RLS
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- Политики для people
CREATE POLICY "Users can view their own people"
  ON people FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own people"
  ON people FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own people"
  ON people FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own people"
  ON people FOR DELETE
  USING (auth.uid() = user_id);

-- Политики для relationships
CREATE POLICY "Users can view their own relationships"
  ON relationships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own relationships"
  ON relationships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationships"
  ON relationships FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationships"
  ON relationships FOR DELETE
  USING (auth.uid() = user_id);
```

## API Endpoints

### People API

#### GET /api/people
Получить список всех людей текущего пользователя
```typescript
Response: {
  data: Person[],
  count: number
}
```

#### GET /api/people/:id
Получить детали конкретного человека
```typescript
Response: {
  data: Person & {
    parents: Person[],
    children: Person[],
    spouses: Person[],
    siblings: Person[]
  }
}
```

#### POST /api/people
Создать нового человека
```typescript
Request: {
  first_name: string,
  last_name: string,
  // ... другие поля
}
Response: { data: Person }
```

#### PUT /api/people/:id
Обновить человека

#### DELETE /api/people/:id
Удалить человека (cascade удалит связи)

### Relationships API

#### POST /api/relationships
Создать связь между двумя людьми
```typescript
Request: {
  person1_id: string,
  person2_id: string,
  relationship_type: 'parent' | 'spouse' | 'sibling',
  marriage_date?: string
}
```

#### DELETE /api/relationships/:id
Удалить связь

## UI Макеты

### 1. Dashboard (/app)
- Приветствие с именем пользователя
- Статистика: количество людей, последние добавления
- Быстрые действия: "Добавить человека", "Просмотреть дерево"
- Последние изменения в семейном дереве

### 2. Список людей (/people)
- Таблица/карточки со всеми членами семьи
- Поиск по имени
- Фильтры: живые/умершие, по дате рождения
- Сортировка
- Кнопка "Добавить человека"

### 3. Профиль человека (/people/:id)
- Фото (аватар)
- Основная информация: ФИО, даты, место рождения
- Биография
- Родственные связи (родители, дети, супруг(и), братья/сёстры)
- Кнопки: Редактировать, Удалить, Добавить связь

### 4. Форма добавления/редактирования
- Модальное окно с полями из таблицы people
- Валидация
- Загрузка фото (опционально в MVP)

### 5. Визуализация дерева (/tree)
- Интерактивное дерево с карточками людей
- Навигация: zoom, pan
- Клик на человека → переход к профилю
- Легенда: мужчины (синий), женщины (розовый)

## Технический стек

- **Frontend**: Next.js 16, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (уже настроен)
- **Tree Visualization**: react-d3-tree или family-tree библиотека

## План миграции

1. Создать SQL миграцию для таблиц people и relationships
2. Применить миграцию в Supabase
3. Проверить RLS политики
4. Заполнить тестовыми данными

## Тест-кейсы

### Smoke tests
1. Пользователь может добавить нового человека
2. Пользователь может просмотреть список всех людей
3. Пользователь может открыть профиль человека
4. Пользователь может установить родительскую связь
5. Пользователь может установить супружескую связь
6. Пользователь может удалить человека
7. Дерево отображается корректно для базовых случаев

### Edge cases
- Добавление человека без даты рождения
- Удаление человека с существующими связями
- Попытка создать циклическую связь
- Одновременное редактирование одного человека

## Риски

1. **Производительность визуализации** для больших деревьев (>100 людей)
   - Митигация: пагинация, ленивая загрузка, оптимизация рендеринга
   
2. **Сложность модели родства**
   - Митигация: начинаем с простой модели (parent, spouse, sibling)
   
3. **Загрузка фото** может замедлить UX
   - Митигация: использовать Supabase Storage, оптимизировать изображения

## Критерии готовности (DoD)

- [ ] Миграции БД применены
- [ ] API endpoints реализованы и протестированы
- [ ] UI страницы созданы и работают
- [ ] Базовая визуализация дерева работает
- [ ] Smoke tests проходят
- [ ] Задеплоено на Railway
- [ ] Документация обновлена (CHANGELOG)

## Следующие шаги после MVP

- Роли и права доступа (семейные группы)
- События (рождения, свадьбы, смерти)
- Документы и источники
- Экспорт в GEDCOM
- Геолокация и карты
- Медиа галерея
