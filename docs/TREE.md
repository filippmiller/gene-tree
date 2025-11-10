# Family Tree Visualization Architecture

## Обзор

Система визуализации генеалогического дерева с правильной классификацией родства по глубине.

**Дата создания**: 2025-11-10  
**Статус**: В разработке

---

## Проблема

**До исправления**: Дедушки и бабушки попадали в раздел "Parents" вместо "Grandparents", т.к. не контролировалась глубина родства.

**После исправления**: Каждый родственник классифицируется строго по глубине:
- **Parents**: depth = 1 (ровно один шаг вверх)
- **Grandparents**: depth = 2 (два шага вверх)
- **Children**: depth = 1 (один шаг вниз)
- **Grandchildren**: depth = 2 (два шага вниз)

---

## Архитектура

### 1. SQL Layer (Postgres + Supabase)

#### VIEW Адаптеры

**`gt_v_person`** - Нормализованное представление людей
```sql
-- Источник: user_profiles
-- Поля: id, name, gender, birth_date, death_date, photo_url, is_alive
```

**`gt_v_parent_child`** - Parent→Child связи
```sql
-- Источник: relationships WHERE relationship_type='parent'
-- Поля: parent_id, child_id
-- ВАЖНО: user1 = parent, user2 = child
```

**`gt_v_union`** - Виртуальные узлы браков/партнёрств
```sql
-- Группирует родителей по детям
-- Формат ID: 'U:parent1_id' или 'U:parent1_id:parent2_id'
-- Поля: union_id, p1, p2, marriage_date, divorce_date
```

**`gt_v_union_child`** - Union→Child связи
```sql
-- Соединяет union узлы с детьми
-- Поля: union_id, child_id
```

#### SQL Функции с глубиной

**`get_ancestors_with_depth(person_id, max_depth)`**
- Рекурсивный CTE вверх по дереву
- Возвращает: Person + depth (1, 2, 3, ...)
- Используется для: Parents, Grandparents, Great-grandparents

**`get_descendants_with_depth(person_id, max_depth)`**
- Рекурсивный CTE вниз по дереву
- Возвращает: Person + depth (1, 2, 3, ...)
- Используется для: Children, Grandchildren, Great-grandchildren

**`get_siblings(person_id)`**
- Находит людей с общими родителями
- Исключает самого person_id

**`get_spouses(person_id)`**
- Вариант 1: Прямая связь через relationships.spouse
- Вариант 2: Партнёры через общих детей
- Возвращает: Person + marriage_date, divorce_date

---

### 2. API Layer

#### `/api/relationships?proband_id={uuid}`

**Возвращает:**
```typescript
{
  parents: Person[],        // depth=1
  grandparents: Person[],   // depth=2
  children: Person[],       // depth=1
  grandchildren: Person[],  // depth=2
  siblings: Person[],
  spouses: Person[]
}
```

**Алгоритм:**
1. Вызывает `get_ancestors_with_depth(proband_id, 3)`
2. Фильтрует: parents = depth===1, grandparents = depth===2
3. Вызывает `get_descendants_with_depth(proband_id, 3)`
4. Фильтрует: children = depth===1, grandchildren = depth===2
5. Вызывает `get_siblings(proband_id)`
6. Вызывает `get_spouses(proband_id)`

**Кеширование:** `Cache-Control: private, max-age=300` (5 минут)

#### `/api/tree?proband_id={uuid}&mode={mode}&depth={depth}`

**Параметры:**
- `proband_id`: UUID (обязательно)
- `mode`: 'ancestors' | 'descendants' | 'hourglass' (по умолчанию: ancestors)
- `depth`: 1-10 (по умолчанию: 4)

**Возвращает:**
```typescript
{
  persons: Person[],
  parentChild: {parent_id, child_id}[],
  unions: {union_id, p1, p2?, marriage_date?, divorce_date?}[],
  unionChildren: {union_id, child_id}[]
}
```

**Режимы:**
- **ancestors**: Только предки (depth поколений вверх)
- **descendants**: Только потомки (depth поколений вниз)
- **hourglass**: И предки, и потомки (песочные часы)

---

### 3. Client Layer (React + TypeScript)

#### Компоненты

**`TreeCanvas`** (`src/components/tree/TreeCanvas.tsx`)
- Главный компонент визуализации
- Интегрирует: React Flow + MiniMap + Controls + Background
- Жизненный цикл:
  1. Получает `TreeData` через props
  2. Преобразует через `buildGraph()`
  3. Применяет layout через `applyLayout()`
  4. Рендерит с автоматической анимацией

**`PersonCard`** (`src/components/tree/PersonCard.tsx`)
- Карточка человека (180×80px)
- Отображает: аватар, ФИО, годы жизни
- Цветная рамка по полу: голубая (male), розовая (female), серая (other)
- Handle точки: Top (входящие), Bottom (исходящие)

**`UnionNode`** (`src/components/tree/UnionNode.tsx`)
- Узел брака/партнёрства (20×20px круг)
- Цвет: зелёный (активный), оранжевый (развод)
- Tooltip: даты брака/развода
- Handle точки: Top (2 родителя), Bottom (дети)

#### Функции

**`buildGraph(data: TreeData)`** (`src/components/tree/build-graph.ts`)
- Преобразует TreeData в формат React Flow
- Создаёт узлы: person (type='person'), union (type='union')
- Создаёт рёбра: p1→union, p2→union, union→child

**`applyLayout(nodes, edges)`** (`src/components/tree/layout.ts`)
- Использует ELK (Eclipse Layout Kernel)
- Алгоритм: Sugiyama (layered, hierarchical)
- Конфигурация:
  ```typescript
  algorithm: 'layered'
  elk.direction: 'DOWN'
  elk.layered.nodePlacement.strategy: 'NETWORK_SIMPLEX'
  elk.layered.spacing.nodeNodeBetweenLayers: 80
  elk.spacing.nodeNode: 30
  elk.edgeRouting: 'ORTHOGONAL'
  ```
- Асинхронно (100-500ms)

#### Страницы

**`/tree/[id]`** (`src/app/tree/[id]/page.tsx`)
- Полноценная страница визуализации
- Sidebar с контролами:
  - Mode selector (3 кнопки)
  - Depth slider (1-10)
  - Search (в разработке)
  - Stats (счётчики)
  - Export buttons (SVG/PNG/Print)
- Canvas область: TreeCanvas с полными данными

**`/[locale]/(protected)/tree`** 
- Редирект на `/tree/{current_user_id}`

---

## Визуальная структура (ASCII)

```
          [Дедушка]──┐   ┌──[Бабушка]
                     └─◊─┘        (union-узел родителей)
                         │
                 [Отец]  │  [Мать]
                         │
                        ◊│  (союз родителей "Я")
                         │
                        [Я]──◊──[Супруг(а)]
                          │
                  ┌───────┴───────┐
               [Ребёнок1]      [Ребёнок2]
```

Где `◊` — union-узел (брак/партнёрство)

---

## Примеры запросов

### Relationships API
```bash
GET /api/relationships?proband_id=550e8400-e29b-41d4-a716-446655440000
```

**Ответ:**
```json
{
  "parents": [
    {"id": "...", "name": "Отец", "birth_date": "1960-01-01", "depth": 1},
    {"id": "...", "name": "Мать", "birth_date": "1962-05-15", "depth": 1}
  ],
  "grandparents": [
    {"id": "...", "name": "Дедушка", "birth_date": "1932-03-10", "depth": 2},
    {"id": "...", "name": "Бабушка", "birth_date": "1936-07-20", "depth": 2}
  ],
  "children": [
    {"id": "...", "name": "Ребёнок 1", "birth_date": "1988-12-01", "depth": 1}
  ],
  "grandchildren": [],
  "siblings": [],
  "spouses": [
    {"id": "...", "name": "Супруга", "marriage_date": "2010-06-15"}
  ]
}
```

### Tree API
```bash
GET /api/tree?proband_id=550e8400-e29b-41d4-a716-446655440000&mode=hourglass&depth=3
```

**Ответ:**
```json
{
  "persons": [
    {"id": "...", "name": "Я", ...},
    {"id": "...", "name": "Отец", ...},
    {"id": "...", "name": "Мать", ...},
    {"id": "...", "name": "Дедушка", ...},
    {"id": "...", "name": "Бабушка", ...}
  ],
  "parentChild": [
    {"parent_id": "...(Отец)", "child_id": "...(Я)"},
    {"parent_id": "...(Мать)", "child_id": "...(Я)"},
    {"parent_id": "...(Дедушка)", "child_id": "...(Отец)"},
    {"parent_id": "...(Бабушка)", "child_id": "...(Отец)"}
  ],
  "unions": [
    {"union_id": "U:отец_id:мать_id", "p1": "...", "p2": "..."},
    {"union_id": "U:дедушка_id:бабушка_id", "p1": "...", "p2": "..."}
  ],
  "unionChildren": [
    {"union_id": "U:отец_id:мать_id", "child_id": "...(Я)"},
    {"union_id": "U:дедушка_id:бабушка_id", "child_id": "...(Отец)"}
  ]
}
```

---

## Тестирование

### Unit Tests

**Классификация depth:**
```typescript
test('grandparent should have depth=2, not depth=1', () => {
  const ancestors = getAncestorsWithDepth(myId);
  const parents = ancestors.filter(p => p.depth === 1);
  const grandparents = ancestors.filter(p => p.depth === 2);
  
  expect(parents).not.toContainObject({name: 'Дедушка'});
  expect(grandparents).toContainObject({name: 'Дедушка'});
});
```

### Manual Testing

1. Создать тестовые данные:
   - Я (proband)
   - Отец, Мать (depth=1)
   - Дедушка, Бабушка (depth=2)

2. Проверить API `/api/relationships?proband_id={my_id}`:
   - Дедушка ДОЛЖЕН быть в `grandparents`
   - Дедушка НЕ ДОЛЖЕН быть в `parents`

3. Проверить визуализацию `/tree/{my_id}`:
   - Дедушка на слое ВЫШЕ родителей
   - Правильные union узлы между парами

---

## Миграции

1. **0012_tree_views_corrected.sql**
   - Создаёт/обновляет VIEW: gt_v_person, gt_v_parent_child, gt_v_union, gt_v_union_child, gt_v_tree_stats

2. **0013_depth_functions.sql**
   - Создаёт функции: get_ancestors_with_depth, get_descendants_with_depth, get_siblings, get_spouses

**Применение:**
```sql
-- Через Supabase Dashboard → SQL Editor
-- Скопировать содержимое каждого файла и выполнить
```

---

## Зависимости

```json
{
  "@xyflow/react": "^12.x",
  "elkjs": "^0.9.x",
  "zustand": "^4.x"
}
```

**Установка:**
```bash
npm install @xyflow/react elkjs zustand
```

---

## TODO

- [ ] Реализовать экспорт SVG через React Flow API
- [ ] Реализовать экспорт PNG через dom-to-image-more
- [ ] Создать print CSS для A4 формата
- [ ] Реализовать поиск людей в дереве (фильтрация/подсветка)
- [ ] Добавить анимацию при изменении mode/depth
- [ ] Оптимизировать layout для больших деревьев (Web Worker)
- [ ] Добавить возможность редактирования прямо в дереве

---

## Changelog

### 2025-11-10 - Исправление классификации depth

**Проблема:** Дедушки попадали в Parents

**Решение:**
1. Созданы VIEW адаптеры (gt_v_*)
2. Созданы SQL функции с рекурсивными CTE и depth
3. API `/api/relationships` переписан с использованием новых функций
4. Фильтрация строго по depth: parents WHERE depth=1, grandparents WHERE depth=2

**Файлы:**
- `supabase/migrations/0012_tree_views_corrected.sql`
- `supabase/migrations/0013_depth_functions.sql`
- `src/app/api/relationships/route.ts` (будет обновлён)

---

## Контакты

**Разработчик**: Warp Agent  
**Проект**: gene-tree  
**Репозиторий**: github.com:filippmiller/gene-tree.git
