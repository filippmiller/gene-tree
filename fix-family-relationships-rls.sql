-- ============================================================================
-- FIX: Family Relationships RLS Policy (без рекурсии)
-- ============================================================================
-- Проблема: Удалили policy "Users can view family profiles", теперь 
--           пользователи не видят родственников через relationships
-- Решение: Вернуть policy, но БЕЗ вложенных подзапросов к user_profiles
-- ============================================================================

-- Шаг 1: Создать policy для просмотра семейных профилей
CREATE POLICY "Users can view family profiles" 
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  -- Либо это твой профиль
  id = auth.uid()
  -- Либо есть связь в relationships (НЕ обращаемся к user_profiles внутри EXISTS!)
  OR EXISTS (
    SELECT 1 
    FROM relationships r
    WHERE (r.user1_id = auth.uid() AND r.user2_id = user_profiles.id)
       OR (r.user2_id = auth.uid() AND r.user1_id = user_profiles.id)
  )
);

-- ============================================================================
-- Шаг 2: Проверка - должна быть только эта policy с "family" в имени
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_profiles'
  AND policyname LIKE '%family%';

-- Ожидаемый результат:
-- policyname                       | cmd    | qual
-- ---------------------------------|--------|---------------------------------------
-- Users can view family profiles   | SELECT | (id = auth.uid()) OR EXISTS (...)
