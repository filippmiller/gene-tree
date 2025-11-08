# CHANGELOG

## 2025-11-08
- specs: добавлена спецификация инициализации — docs/specs/2025-11-08--bootstrap.md
- ops: инвентаризация локальных репозиториев — docs/ops/repo-inventory.md
- arch: создан обзор архитектуры — docs/arch/overview.md
- ops: создан runbook по GitHub/Git потокам и Railway/Cloudflare — docs/ops/runbook.md
- ops: дополнен runbook точными командами GitHub/Railway/Cloudflare (разделы 1–7)
- docs: добавлен ADR-индекс — docs/DECISIONS.md
- ops: установлен Railway CLI и подготовлен вход/link — railway 4.11.0
- ops: привязан локальный репозиторий к Railway проекту pretty-exploration (env=production, service=gene-tree)
- ops: проверена связка Supabase через Railway env (auth/v1/health → 200), без вывода секретов
- env: добавлен .env.example (поля для Supabase и API)
- dev: добавлены скрипты запуска и конфиг Playwright (scripts/dev_bootstrap.ps1, playwright.config.ts, tests/smoke.spec.ts)
- git: настроен origin по SSH, требуется загрузка SSH-ключа в агент/аккаунт (permission denied publickey)
- fix: исправлена ошибка "params is not defined" в src/app/[locale]/layout.tsx (корректная обработка params)
- auth: добавлен Supabase client (src/lib/supabase/client.ts) и переход sign-in/sign-up на Supabase; зависимости: @supabase/supabase-js, @supabase/ssr; добавлен server client (src/lib/supabase/server.ts)
- env: .env.example сокращён до PUBLIC-переменных (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, NEXT_PUBLIC_API_BASE_URL)
- dev: добавлен скрипт dev:rw (Railway env injection) и test:e2e
- api: добавлен маршрут /api/health (проверка Supabase auth health публичными ключами)
- deploy: Railway используется для полного приложения (frontend + backend)
- deploy: успешный деплой на https://gene-tree-production.up.railway.app
- decision: Cloudflare Pages не используется (Next.js 16 пока не поддерживается @cloudflare/next-on-pages)
