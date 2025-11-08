# Supabase Configuration

## Настройка Redirect URLs

**ВАЖНО**: Необходимо настроить Supabase для правильной работы email подтверждения.

### Шаги:

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект: `mbntpsfllwhlnzuzspvp`
3. Перейдите в **Authentication** → **URL Configuration**

### Настройки URL:

#### Site URL
```
https://gene-tree-production.up.railway.app
```

#### Redirect URLs (добавьте все):
```
https://gene-tree-production.up.railway.app/auth/callback
https://gene-tree-production.up.railway.app/en/app
https://gene-tree-production.up.railway.app/ru/app
http://localhost:3020/auth/callback
http://localhost:3020/en/app
```

### Email Templates (опционально)

Можно настроить кастомные шаблоны email в **Authentication** → **Email Templates**

#### Confirm signup
Убедитесь что в ссылке используется:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
```

#### Reset password
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
```

## После настройки

1. Сохраните изменения в Supabase Dashboard
2. Подождите 1-2 минуты для применения изменений
3. Попробуйте зарегистрироваться снова с новым email (или удалите старого пользователя)

## Проверка

После настройки проверьте:
- Регистрация на https://gene-tree-production.up.railway.app/en/sign-up
- Получение email
- Клик по ссылке в email должен перенаправить на `/auth/callback`, который затем перенаправит на `/en/app`
- Вход через https://gene-tree-production.up.railway.app/en/sign-in

## Управление пользователями

### Через Supabase Dashboard
**Authentication** → **Users** - можно:
- Просмотреть всех пользователей
- Подтвердить email вручную
- Удалить пользователя
- Сбросить пароль

### Текущий админ
- Email: `filippmiller@gmail.com`
- После регистрации и подтверждения email можно войти с этим email и паролем который вы укажете при регистрации
