# Runbook: GitHub/Git, Railway, Cloudflare

Дата: 2025-11-08

Внимание: не храните секреты в `.env` в репозитории. Используйте `.env.example` и панели/CLI провайдеров. В командах ниже заменяйте плейсхолдеры значениями ваших проектов.

## GitHub и Git‑потоки

### 1) Авторизация GitHub CLI
```powershell
# Установите GitHub CLI: https://cli.github.com/
# Вариант 1: быстрый вход (выбор HTTPS/SSH в мастере)
gh auth login

# Вариант 2: сразу SSH
gh auth login --git-protocol ssh
```

### 2) Генерация SSH‑ключа (если нет) и добавление в GitHub
```powershell
# Создать ключ (ed25519)
ssh-keygen -t ed25519 -C "your_email@example.com" -f "$env:USERPROFILE\.ssh\id_ed25519"

# Запустить ssh-agent и добавить ключ
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"

# Добавить публичный ключ на GitHub
# macOS/Linux пример из запроса: gh ssh-key add ~/.ssh/id_ed25519.pub -t "Warp Dev Machine"
# Windows (PowerShell):
gh ssh-key add "$env:USERPROFILE\.ssh\id_ed25519.pub" --title "Warp Dev Machine"
```

### 3) Привязка репозитория к удалённому origin
```powershell
# В корне проекта
git init

# Добавить origin (SSH)
git remote add origin git@github.com:<org>/<repo>.git

# или поменять URL, если уже есть remote
git remote set-url origin git@github.com:<org>/<repo>.git
```

### 4) Базовый флоу веток/PR
```powershell
# Новая ветка
git checkout -b feat/<slug>   # или fix/<slug>

# ... изменения
git add -A
git commit -m "warp: <что изменили>"

# Пуш ветки
git push -u origin HEAD

# Открыть PR
gh pr create -f -B main
```

## Railway
```powershell
# Установка CLI (один из вариантов)
npm i -g @railway/cli
# или (macOS)
brew install railway

# 1) Логин
railway login

# 2) Привязать локальный репо к проекту Railway (в каталоге репозитория)
railway link  # выбрать существующий проект или создать новый

# 3) Переменные окружения (секреты) — только через Railway
railway variables                  # список
railway variables set KEY=VAL      # установка

# 4) Проброс портов/локальный запуск (если используется)
railway run npm run dev

# 5) Деплой бекэнда/воркера
railway up
```

Примечания:
- Секреты (eBay creds, DB URL, JWT) держим только в Railway Variables и внешнем хранилище (1Password/Doppler). `.env` не коммитим.
- Для фоновых задач используйте Railway worker/cron и логируйте состояние OAuth‑токенов, курсоры синхронизации.

## Cloudflare (Pages/Workers) через Wrangler
```powershell
# Установка
npm i -g wrangler

# 1) Логин и проверка
wrangler login
wrangler whoami

# 2) Pages (статический фронтенд)
# если build выдаёт dist/. Настройте scripts в package.json: build → dist
wrangler pages project create genealogical-tree --production-branch=main
wrangler pages deploy ./dist --project-name=genealogical-tree

# 3) Workers (если нужен бек на edge)
# Создайте wrangler.toml и первую функцию
wrangler init edge-api --yes
cd edge-api && wrangler deploy

# 4) Переменные окружения (секреты)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```

Альтернатива: Git‑интеграция Cloudflare Pages → привяжите репозиторий, настройте build команду и NODE_VERSION. Секреты → «Environment Variables».

## Локальный запуск и проверки (Next.js)
```powershell
# Установка зависимостей
npm ci

# Разработка на порту 3020
$env:PORT="3020"
npm run dev -- --port 3020

# Сборка и запуск прод-сборки
npm run build
npm start

# Линт
npm run lint
```

Скрипт для автоматизации:
```powershell
# Запуск всего из одного скрипта (интерактивно)
./scripts/dev_bootstrap.ps1 -Install -Dev -Port 3020
# Только Playwright UI (в другом окне):
./scripts/dev_bootstrap.ps1 -Playwright -Port 3020
```

## Документация и комментарии к коду
- В каждом модуле сверху краткий doc‑блок: назначение, входы/выходы, ошибки, ссылки на спецификации.
- docs/DECISIONS.md — фиксируйте архитектурные решения форматом ADR (дата, контекст, варианты, решение, последствия).
- docs/CHANGELOG.md — человекочитаемо: дата, что добавлено/изменено/исправлено, ссылка на PR/коммиты.
- Каждая спека — минимальные тест‑кейсы (таблица), критерии готовности (DoD) и чек‑лист регресса.

Шаблон заголовка файла‑модуля:
```ts path=null start=null
/**
* Модуль: PeopleService
* Назначение: CRUD для профилей; связи родства; выборки по фамилии/гео.
* Входы: dto (validated), user ctx; Выход: entities.
* Ошибки: ValidationError, NotFound, Auth.
* Спецификация: docs/specs/2025-11-08--people-crud.md
*/
```
