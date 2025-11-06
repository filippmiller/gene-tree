# Настройка тестового пользователя

## Тестовые учетные данные

- **Email**: `mylifeis0plus1@gmail.com`
- **Password**: `Airbus380+`

## Способы создания пользователя

### Способ 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Authentication** → **Users**
4. Нажмите **"Add User"** → **"Create new user"**
5. Заполните:
   - **Email**: `mylifeis0plus1@gmail.com`
   - **Password**: `Airbus380+`
   - **Auto Confirm User**: ✅ включите (чтобы не требовалась верификация email)
6. Нажмите **"Create user"**

### Способ 2: Через Supabase CLI

```bash
# Установите Supabase CLI (если еще не установлен)
npm install -g supabase

# Войдите в Supabase
supabase login

# Создайте пользователя
supabase auth users create mylifeis0plus1@gmail.com \
  --password "Airbus380+" \
  --email-confirm
```

### Способ 3: Через Management API

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mylifeis0plus1@gmail.com",
    "password": "Airbus380+",
    "email_confirm": true
  }'
```

## Включение Email/Password аутентификации

Если вы хотите использовать email/password вместо magic link:

1. В Supabase Dashboard → **Authentication** → **Providers**
2. Найдите **Email** provider
3. Убедитесь, что он включен
4. Включите **"Enable email confirmations"** (опционально, для теста можно отключить)

## Тестирование входа

После создания пользователя:

1. Запустите dev сервер: `npm run dev`
2. Откройте `http://localhost:3000/ru/sign-in`
3. Введите email: `mylifeis0plus1@gmail.com`
4. Нажмите "Sign in" (magic link) или используйте форму с паролем (если настроена)

## Примечание

Для тестирования с паролем вместо magic link, нужно обновить страницу sign-in для поддержки password auth.

