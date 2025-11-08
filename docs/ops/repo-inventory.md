# Репозитории (инвентаризация)

Дата: 2025-11-08
Диапазон: C:\dev

## Сводная таблица

| Путь | Ветка по умолчанию | Remotes | Последние 3 коммита | package.json | pnpm-lock | yarn.lock | package-lock | next.config.* | supabase/* | playwright.config.* | wrangler.toml | railway.* | .github/workflows |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| C:\dev\DO NOT TOUCH\ebay-connector-app-backup | main | origin=https://github.com/filippmiller/ebay-connector-app.git | 4caea08; 2ae8933; c804bea | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| C:\dev\DO NOT TOUCH\ebay-connector-app-backup-20251107 | (unknown) | — | — | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| C:\dev\DO NOT TOUCH\MSSQL Dashboard Backup | main | origin=https://github.com/filippmiller/mssql-dashboard.git | 4036f3d; be27945 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 1 | 0 |
| C:\dev\ebay-connector-app | main | origin=https://github.com/filippmiller/ebay-connector-app.git | 90ada99; fee1065; 7963c44 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| C:\dev\gene-tree | main | origin=https://github.com/filippmiller/gene-tree.git | a4b890b; 439d673; 8d4e76b | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 0 |
| C:\dev\gene-tree\gene-tree_frommssqlda\gene-tree | (unknown) | — | 41c2da7; 931920f; 0ccffa2 | 1 | 0 | 0 | 1 | 1 | 1 | 0 | 1 | 0 | 0 |

Примечания:
- «1» в колонке означает «обнаружено», «0» — не обнаружено.
- Для строк с «—» git не дал данных (нет origin/HEAD или не сконфигурирован remote).

## Краткие выводы
- Next.js проекты: C:\dev\gene-tree, C:\dev\DO NOT TOUCH\MSSQL Dashboard Backup, C:\dev\gene-tree\gene-tree_frommssqlda\gene-tree (по наличию next.config.*).
- Deploy артефакты:
  - Cloudflare Pages/Wrangler: C:\dev\gene-tree, C:\dev\gene-tree\gene-tree_frommssqlda\gene-tree (wrangler.toml).
  - Railway: C:\dev\DO NOT TOUCH\MSSQL Dashboard Backup (railway.json/следы).
  - GitHub Actions: присутствуют workflows в отдельных репозиториях (см. столбец .github/workflows).
- Тесты: playwright.config.* не обнаружен в перечисленных репозиториях.
- Supabase следы: есть только в C:\dev\gene-tree\gene-tree_frommssqlda\gene-tree (папка supabase/*). В корневом gene-tree следов конфигурации supabase не обнаружено.

## Детали коммитов (последние 3)

- C:\dev\gene-tree
  - a4b890b — fix: remove Supabase imports and duplicate routes
  - 439d673 — feat: add Cloudflare Pages wrangler.toml
  - 8d4e76b — refactor: remove Supabase dependencies and files

- C:\dev\DO NOT TOUCH\MSSQL Dashboard Backup
  - 4036f3d — feat: add Cloudflare Pages deployment configuration
  - be27945 — Initial commit

(остальные см. таблицу выше)
