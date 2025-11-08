# Спецификация: Связи между родственниками

**Дата**: 2025-11-08  
**Статус**: Планирование  
**Автор**: Warp Agent Session

---

## Цели

Реализовать систему хранения и отображения связей между членами семьи в генеалогическом дереве.

---

## Типы связей (Relationship Types)

### Основные типы связей

```typescript
enum RelationshipType {
  // Родители → Дети
  PARENT = 'parent',           // Родитель (общий)
  FATHER = 'father',           // Отец
  MOTHER = 'mother',           // Мать
  CHILD = 'child',             // Ребёнок (общий)
  SON = 'son',                 // Сын
  DAUGHTER = 'daughter',       // Дочь
  
  // Партнёры
  SPOUSE = 'spouse',           // Супруг/супруга (общий)
  HUSBAND = 'husband',         // Муж
  WIFE = 'wife',               // Жена
  PARTNER = 'partner',         // Партнёр (не женаты)
  
  // Братья/сёстры
  SIBLING = 'sibling',         // Брат/сестра (общий)
  BROTHER = 'brother',         // Брат
  SISTER = 'sister',           // Сестра
  HALF_SIBLING = 'half_sibling', // Сводный брат/сестра
  
  // Расширенная семья
  GRANDPARENT = 'grandparent', // Бабушка/дедушка
  GRANDCHILD = 'grandchild',   // Внук/внучка
  UNCLE_AUNT = 'uncle_aunt',   // Дядя/тётя
  NEPHEW_NIECE = 'nephew_niece', // Племянник/племянница
  COUSIN = 'cousin',           // Двоюродный брат/сестра
  
  // Другое
  GUARDIAN = 'guardian',       // Опекун
  WARD = 'ward',               // Подопечный
  ADOPTIVE_PARENT = 'adoptive_parent', // Приёмный родитель
  ADOPTED_CHILD = 'adopted_child'      // Приёмный ребёнок
}
```

---

## Схема базы данных

### Таблица `relationships`

```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Кто и с кем связан
  person_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  person_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Тип связи (от A к B)
  relationship_type VARCHAR(50) NOT NULL,
  
  -- Метаданные
  start_date DATE,              -- Начало отношений (свадьба, рождение и т.д.)
  end_date DATE,                -- Конец отношений (развод, смерть и т.д.)
  status VARCHAR(20) DEFAULT 'active', -- active, ended, divorced, widowed
  
  -- Дополнительная информация
  notes TEXT,                   -- Заметки о связи
  is_biological BOOLEAN DEFAULT true, -- Биологическая связь или нет (усыновление)
  is_verified BOOLEAN DEFAULT false,  -- Подтверждена ли связь
  
  -- Аудит
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ограничения
  CONSTRAINT different_persons CHECK (person_a_id != person_b_id),
  CONSTRAINT unique_relationship UNIQUE (person_a_id, person_b_id, relationship_type)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_relationships_person_a ON relationships(person_a_id);
CREATE INDEX idx_relationships_person_b ON relationships(person_b_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_status ON relationships(status);

-- Триггер для обновления updated_at
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Логика связей

### Симметричные связи (двусторонние)

Некоторые связи автоматически создают обратную связь:

```typescript
const SYMMETRIC_RELATIONSHIPS: Record<RelationshipType, RelationshipType> = {
  [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
  [RelationshipType.HUSBAND]: RelationshipType.WIFE,
  [RelationshipType.WIFE]: RelationshipType.HUSBAND,
  [RelationshipType.PARTNER]: RelationshipType.PARTNER,
  
  [RelationshipType.SIBLING]: RelationshipType.SIBLING,
  [RelationshipType.BROTHER]: RelationshipType.SISTER, // или BROTHER
  [RelationshipType.SISTER]: RelationshipType.BROTHER,  // или SISTER
  
  [RelationshipType.COUSIN]: RelationshipType.COUSIN,
};

const INVERSE_RELATIONSHIPS: Record<RelationshipType, RelationshipType> = {
  [RelationshipType.PARENT]: RelationshipType.CHILD,
  [RelationshipType.CHILD]: RelationshipType.PARENT,
  
  [RelationshipType.FATHER]: RelationshipType.SON, // или DAUGHTER
  [RelationshipType.MOTHER]: RelationshipType.SON, // или DAUGHTER
  [RelationshipType.SON]: RelationshipType.FATHER, // или MOTHER
  [RelationshipType.DAUGHTER]: RelationshipType.FATHER, // или MOTHER
  
  [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
  [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
  
  [RelationshipType.UNCLE_AUNT]: RelationshipType.NEPHEW_NIECE,
  [RelationshipType.NEPHEW_NIECE]: RelationshipType.UNCLE_AUNT,
  
  [RelationshipType.GUARDIAN]: RelationshipType.WARD,
  [RelationshipType.WARD]: RelationshipType.GUARDIAN,
  
  [RelationshipType.ADOPTIVE_PARENT]: RelationshipType.ADOPTED_CHILD,
  [RelationshipType.ADOPTED_CHILD]: RelationshipType.ADOPTIVE_PARENT,
};
```

---

## Код для проверки текущей БД

### SQL-запрос для проверки существующих связей

```sql
-- Проверить, есть ли таблица relationships
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'relationships'
);

-- Если таблица существует, посмотреть её структуру
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'relationships'
ORDER BY ordinal_position;

-- Посмотреть все связи (если есть)
SELECT 
  r.id,
  r.relationship_type,
  r.status,
  r.is_biological,
  pa.full_name as person_a_name,
  pa.email as person_a_email,
  pb.full_name as person_b_name,
  pb.email as person_b_email,
  r.start_date,
  r.end_date,
  r.created_at
FROM relationships r
LEFT JOIN profiles pa ON r.person_a_id = pa.id
LEFT JOIN profiles pb ON r.person_b_id = pb.id
ORDER BY r.created_at DESC;

-- Статистика по типам связей
SELECT 
  relationship_type,
  COUNT(*) as count,
  COUNT(DISTINCT person_a_id) as unique_person_a,
  COUNT(DISTINCT person_b_id) as unique_person_b
FROM relationships
GROUP BY relationship_type
ORDER BY count DESC;
```

### Node.js скрипт для проверки (через Supabase)

```javascript
// check-relationships.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRelationships() {
  console.log('🔍 Проверка наличия таблицы relationships...\n');

  try {
    // Попытка получить связи
    const { data: relationships, error } = await supabase
      .from('relationships')
      .select(`
        id,
        relationship_type,
        status,
        is_biological,
        person_a:person_a_id(id, full_name, email),
        person_b:person_b_id(id, full_name, email),
        start_date,
        end_date,
        created_at
      `)
      .limit(100);

    if (error) {
      if (error.message.includes('relation "public.relationships" does not exist')) {
        console.log('❌ Таблица relationships НЕ существует');
        console.log('\n📝 Необходимо создать таблицу. См. SQL в спецификации.\n');
        return { exists: false, count: 0 };
      }
      throw error;
    }

    console.log(`✅ Таблица relationships существует`);
    console.log(`📊 Найдено связей: ${relationships?.length || 0}\n`);

    if (relationships && relationships.length > 0) {
      console.log('📋 Существующие связи:\n');
      
      // Группировка по типам
      const byType = relationships.reduce((acc, rel) => {
        acc[rel.relationship_type] = (acc[rel.relationship_type] || 0) + 1;
        return acc;
      }, {});

      console.log('По типам:');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });

      console.log('\n📝 Примеры связей:\n');
      relationships.slice(0, 5).forEach(rel => {
        const personA = rel.person_a?.full_name || rel.person_a?.email || 'Unknown';
        const personB = rel.person_b?.full_name || rel.person_b?.email || 'Unknown';
        console.log(`  ${personA} --[${rel.relationship_type}]--> ${personB}`);
      });
    } else {
      console.log('ℹ️  Связей пока нет. Таблица пустая.\n');
    }

    return { 
      exists: true, 
      count: relationships?.length || 0,
      relationships 
    };

  } catch (error) {
    console.error('❌ Ошибка при проверке:', error.message);
    return { exists: false, count: 0, error };
  }
}

// Дополнительно: проверить профили
async function checkProfiles() {
  console.log('\n👥 Проверка профилей пользователей...\n');

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, date_of_birth, created_at')
      .limit(10);

    if (error) throw error;

    console.log(`✅ Найдено профилей: ${profiles?.length || 0}\n`);

    if (profiles && profiles.length > 0) {
      console.log('📝 Примеры профилей:\n');
      profiles.forEach(profile => {
        const name = profile.full_name || profile.email || 'No name';
        const dob = profile.date_of_birth ? ` (${profile.date_of_birth})` : '';
        console.log(`  - ${name}${dob}`);
      });
    }

    return { count: profiles?.length || 0, profiles };

  } catch (error) {
    console.error('❌ Ошибка при проверке профилей:', error.message);
    return { count: 0, error };
  }
}

// Запуск проверки
async function main() {
  console.log('='.repeat(60));
  console.log('  Проверка базы данных: Relationships & Profiles');
  console.log('='.repeat(60));
  console.log();

  const relationshipsResult = await checkRelationships();
  const profilesResult = await checkProfiles();

  console.log('\n' + '='.repeat(60));
  console.log('  Итого:');
  console.log('='.repeat(60));
  console.log(`  Таблица relationships: ${relationshipsResult.exists ? '✅ Есть' : '❌ Нет'}`);
  console.log(`  Связей в БД: ${relationshipsResult.count}`);
  console.log(`  Профилей в БД: ${profilesResult.count}`);
  console.log('='.repeat(60));
  console.log();
}

main().catch(console.error);
```

### Как запустить скрипт

```bash
# 1. Создать файл в корне проекта
# C:\dev\gene-tree\scripts\check-relationships.mjs

# 2. Установить зависимости (если нужно)
npm install @supabase/supabase-js

# 3. Запустить с переменными окружения
node --env-file=.env.local scripts/check-relationships.mjs

# Или через Railway vars
railway run node scripts/check-relationships.mjs

# Или вручную установить переменные
$env:SUPABASE_URL="https://hmrzsfys2mhjigvsibyt.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
node scripts/check-relationships.mjs
```

---

## TypeScript типы для работы с связями

```typescript
// types/relationships.ts

export enum RelationshipType {
  PARENT = 'parent',
  FATHER = 'father',
  MOTHER = 'mother',
  CHILD = 'child',
  SON = 'son',
  DAUGHTER = 'daughter',
  SPOUSE = 'spouse',
  HUSBAND = 'husband',
  WIFE = 'wife',
  PARTNER = 'partner',
  SIBLING = 'sibling',
  BROTHER = 'brother',
  SISTER = 'sister',
  HALF_SIBLING = 'half_sibling',
  GRANDPARENT = 'grandparent',
  GRANDCHILD = 'grandchild',
  UNCLE_AUNT = 'uncle_aunt',
  NEPHEW_NIECE = 'nephew_niece',
  COUSIN = 'cousin',
  GUARDIAN = 'guardian',
  WARD = 'ward',
  ADOPTIVE_PARENT = 'adoptive_parent',
  ADOPTED_CHILD = 'adopted_child',
}

export enum RelationshipStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
}

export interface Relationship {
  id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: RelationshipType;
  start_date?: string;
  end_date?: string;
  status: RelationshipStatus;
  notes?: string;
  is_biological: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface RelationshipWithProfiles extends Relationship {
  person_a: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  person_b: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

// Утилита для определения обратной связи
export function getInverseRelationshipType(
  type: RelationshipType,
  personAGender?: 'male' | 'female' | null,
  personBGender?: 'male' | 'female' | null
): RelationshipType | null {
  // Логика определения обратной связи
  // С учётом пола участников
  // ...
  return null; // TODO: реализовать
}
```

---

## API endpoints (Next.js API Routes)

### Получить связи пользователя

```typescript
// app/api/relationships/[userId]/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const supabase = createClient();
  const { userId } = params;

  // Получить связи где пользователь - person_a или person_b
  const { data: relationships, error } = await supabase
    .from('relationships')
    .select(`
      *,
      person_a:person_a_id(id, full_name, email, avatar_url),
      person_b:person_b_id(id, full_name, email, avatar_url)
    `)
    .or(`person_a_id.eq.${userId},person_b_id.eq.${userId}`)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ relationships });
}
```

### Создать связь

```typescript
// app/api/relationships/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const body = await request.json();

  const {
    person_a_id,
    person_b_id,
    relationship_type,
    start_date,
    is_biological = true,
  } = body;

  // Валидация
  if (!person_a_id || !person_b_id || !relationship_type) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Создать связь
  const { data, error } = await supabase
    .from('relationships')
    .insert({
      person_a_id,
      person_b_id,
      relationship_type,
      start_date,
      is_biological,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Создать обратную связь если нужно

  return NextResponse.json({ relationship: data }, { status: 201 });
}
```

---

## Визуализация дерева

### Алгоритм построения дерева

```typescript
// lib/family-tree/build-tree.ts

interface TreeNode {
  id: string;
  profile: Profile;
  children: TreeNode[];
  spouse?: TreeNode;
  parents: TreeNode[];
}

export function buildFamilyTree(
  rootPersonId: string,
  relationships: RelationshipWithProfiles[]
): TreeNode {
  // 1. Найти всех родителей root person
  // 2. Найти всех детей
  // 3. Найти супругов
  // 4. Рекурсивно построить дерево для каждого уровня
  
  // TODO: реализовать
  return null as any;
}
```

---

## Следующие шаги

1. **Проверить текущую БД** - запустить скрипт `check-relationships.mjs`
2. **Создать таблицу** - если её нет, выполнить SQL из спецификации
3. **Создать типы** - добавить TypeScript типы
4. **Реализовать API** - endpoints для CRUD операций
5. **UI компоненты** - формы для добавления связей
6. **Визуализация** - компонент для отображения дерева

---

## Вопросы для уточнения

- Как обрабатывать несколько браков одного человека?
- Нужна ли поддержка однополых браков?
- Как отображать приёмных детей визуально?
- Нужна ли модерация связей (подтверждение другими членами семьи)?
- Максимальная глубина дерева (сколько поколений)?

---

**Примечание**: Это планирование. Реализация требует отдельной спецификации с детальным API design и UI/UX.
