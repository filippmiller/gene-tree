-- ============================================
-- Тестовый пользователь для разработки
-- ============================================
-- ВНИМАНИЕ: Этот скрипт создает тестового пользователя
-- Выполните его в Supabase SQL Editor после настройки проекта
-- 
-- Email: mylifeis0plus1@gmail.com
-- Password: Airbus380+
-- ============================================

-- Создание пользователя через Supabase Auth API
-- ВАЖНО: Этот скрипт нужно выполнить через Supabase Dashboard -> Authentication -> Users
-- или использовать Supabase Management API
--
-- Альтернативно, можно использовать Supabase CLI:
-- supabase auth users create mylifeis0plus1@gmail.com --password Airbus380+

-- Для автоматического создания через SQL (требует расширенных прав):
-- ВНИМАНИЕ: Обычно создание пользователей через SQL требует service_role ключа
-- и должно выполняться через API или Dashboard

-- Если у вас есть доступ к Supabase Management API, используйте:
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'mylifeis0plus1@gmail.com',
  crypt('Airbus380+', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);
*/

-- РЕКОМЕНДУЕМЫЙ СПОСОБ:
-- 1. Перейдите в Supabase Dashboard -> Authentication -> Users
-- 2. Нажмите "Add User" -> "Create new user"
-- 3. Введите:
--    Email: mylifeis0plus1@gmail.com
--    Password: Airbus380+
--    Auto Confirm User: включите (чтобы не требовалась верификация email)
-- 4. Сохраните

-- ИЛИ используйте Supabase CLI (если установлен):
-- supabase auth users create mylifeis0plus1@gmail.com --password "Airbus380+" --email-confirm

