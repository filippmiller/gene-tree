-- ============================================================================
-- ДИАГНОСТИКА: Проверка RLS policies на таблице relationships
-- ============================================================================

-- 1. Проверить все policies на relationships
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'relationships'
ORDER BY policyname;

-- 2. Проверить, включен ли RLS на relationships
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'relationships';

-- 3. Проверить структуру таблицы relationships
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'relationships'
ORDER BY ordinal_position;

-- 4. Попробовать простой SELECT (покажет, есть ли вообще доступ)
SELECT 
  id,
  user1_id,
  user2_id,
  relationship_type,
  created_at
FROM relationships
LIMIT 5;
