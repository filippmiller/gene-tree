-- ============================================================================
-- ПРОВЕРКА: Есть ли вообще данные в relationships?
-- ============================================================================

-- 1. Проверить общее количество relationships (через service role)
-- Выполнить с правами суперпользователя в SQL Editor
SELECT COUNT(*) as total_relationships
FROM relationships;

-- 2. Проверить, какие user_id есть в relationships
SELECT DISTINCT user1_id 
FROM relationships
UNION
SELECT DISTINCT user2_id 
FROM relationships;

-- 3. Проверить, сколько пользователей в user_profiles
SELECT COUNT(*) as total_users
FROM user_profiles;

-- 4. Проверить текущего залогиненного пользователя
SELECT 
  auth.uid() as current_user_id,
  (SELECT COUNT(*) FROM relationships WHERE user1_id = auth.uid() OR user2_id = auth.uid()) as my_relationships;
