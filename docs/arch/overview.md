# Архитектура: обзор

Дата: 2025-11-08
Последняя проверка: см. docs/ops/repo-inventory.md

## Контекст и цели
Веб‑приложение для генеалогического дерева. Основной стек — Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, i18n через next-intl. Хостинг целится на Cloudflare Pages (наличие wrangler.toml). Бэкенд API реализуется через маршруты Next.js (route handlers) и/или edge‑функции.

## Ключевые модули (big picture)
- Роутинг и i18n
  - `src/app/[locale]/...` — локализованный скоуп. Главные сегменты:
    - `(auth)/sign-in`, `(auth)/sign-up` — публичные страницы аутентификации.
    - `(protected)/...` — защищённые разделы (layout с гардом).
    - `people`, `relations` — доменные страницы дерева.
  - `src/i18n/request.ts` — интеграция next-intl (подключается в `next.config.ts`).
  - Сообщения: `src/messages/{en,ru}/common.json`.
- UI слой
  - Базовые компоненты: `src/components/ui/*` (shadcn‑стиль), навигация `src/components/Nav.tsx`, переключение языка `LanguageSwitcher.tsx`.
  - Глобальные стили: `src/app/globals.css`.
- Провайдеры и утилиты
  - `src/components/providers/SupabaseProvider.tsx` (слот для провайдера аутентификации).
  - `src/lib/utils.ts` — утилиты.
  - Примечание: в коммитах отмечено удаление Supabase зависимостей; текущая интеграция с Supabase может быть отключена/минимальна.

## Зависимости и конфиг
- `next.config.ts` — обёрнут плагином `next-intl/plugin`.
- `tsconfig.json` — строгий TypeScript, алиас `@/* -> ./src/*`.
- Линтинг: `eslint` + `eslint-config-next` (скрипт `npm run lint`).
- Стили: TailwindCSS + PostCSS (конфиги присутствуют в корне).

## Среды окружения
- local: разработка на машине разработчика (`npm run dev`).
- dev/stage/prod: определяются параметрами хостинга (например, Cloudflare Pages окружения). Переменные окружения не хранятся в `.env` в репозитории — используйте `.env.example` и панели/CLI провайдеров.

## Точки деплоя
- Cloudflare Pages + Wrangler (см. `wrangler.toml` в корне; GitHub remote настроен).
- Альтернативы: Railway (не настроен в текущем репозитории; см. runbook для шаблонов).

## Дальшие шаги (рекомендации)
- Согласовать модель данных для людей/связей и источника правды (БД/хранилище) в отдельной спецификации (`docs/specs/*`).
- Определить стратегию аутентификации (Supabase/Auth.js/иное) и добавить соответствующие провайдеры.
- Внедрить базовые тесты (Playwright smoke) и CI workflow для них.
