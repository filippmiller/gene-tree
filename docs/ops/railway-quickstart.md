# Railway Quick Start

## Текущий статус

- **Проект**: pretty-exploration
- **Environment**: production  
- **Service**: gene-tree
- **URL**: https://gene-tree-production.up.railway.app

## Быстрые команды

### Просмотр статуса
```powershell
railway status
```

### Просмотр логов
```powershell
railway logs
```

### Просмотр переменных окружения
```powershell
railway variables
```

### Установка переменной
```powershell
railway variables --set 'KEY=value'
```

### Деплой
```powershell
# Вариант 1: Прямой деплой из локального кода
railway up

# Вариант 2: Автоматический деплой при push в GitHub
git push origin main
```

### Запуск команд с Railway ENV
```powershell
# Запустить dev сервер с Railway переменными
railway run npm run dev
```

### Открыть Dashboard
```powershell
railway open
```

## Переменные окружения (установлены)

- `NEXT_PUBLIC_SUPABASE_URL` - публичный URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - публичный анонимный ключ Supabase
- `SUPABASE_URL` - серверный URL Supabase
- `SUPABASE_ANON_KEY` - серверный ключ
- `SUPABASE_DB_*` - переменные для прямого подключения к БД

## Автоматические деплои

Railway настроен на автоматический деплой при push в ветку `main`. 
После `git push origin main` приложение автоматически пересобирается и деплоится.

## Мониторинг

- **Логи**: `railway logs` или в Dashboard
- **Метрики**: Railway Dashboard → Metrics
- **Статус билда**: Railway Dashboard → Deployments

## Откат (Rollback)

В Railway Dashboard → Deployments можно откатиться на любой предыдущий деплой в один клик.

## Полезные ссылки

- [Railway Dashboard](https://railway.app)
- [Railway Docs](https://docs.railway.app)
- [Проект в Railway](https://railway.com/project/e2a4908d-6e01-46fa-a3ab-aa99ef3befdf)
