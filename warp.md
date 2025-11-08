# Проект: «Генеалогическое дерево» — контекст для Warp


## Миссия
Создать веб‑приложение для семейного древa с профилями членов семьи, связями и геометками. Технологии: Next.js + TypeScript + Tailwind + shadcn/ui, Supabase/Postgres, i18n (ru/en), Playwright (smoke).


## Архитектура (кратко)
- Frontend: Next.js (app router), next-intl (i18n), shadcn/ui.
- Backend: Next API routes / edge functions; Supabase SDK. БД — Postgres (Supabase, read/write) + MSSQL (read‑only) при необходимости.
- Тесты: Playwright (smoke/e2e), Vitest (unit) — по мере внедрения.


## Правила (обязательно)
1) **Spec‑First**: любая задача начинается со спецификации в `docs/specs/<yyyy-mm-dd>--<slug>.md` (цели, не‑цели, API/схема, миграции, тест‑кейсы, риски). Без спеки — код не пишем.
2) **Безопасность секретов**: `.env` не трогаем, только `.env.example`. Настройка реальных секретов — через Railway/Cloudflare панели/CLI.
3) **Миграции и БД**: любые изменения схемы — только после утверждения спеки. Создаём миграции и план отката. В dev — прогоняем на локальной копии.
4) **Документация**: на каждый PR — обновление `docs/CHANGELOG.md` + ссылки на `docs/specs/*` и `docs/arch/*`.
5) **Коммиты**: формат `cursor: <кратко>` или `warp: <кратко>`. 1 логическая правка — 1 коммит.
6) **Тесты**: минимум smoke (Playwright) перед деплоем. Отчёт сохраняем в `docs/ops/test-report.md` или прикладываем ссылку.
7) **Ссылки/источники**: все внешние справки дублируем выдержками в `docs/refs/`.
8) **Осторожность**: не выполнять команды, приводящие к потере данных, без явного запроса и плана отката.


## Структура docs/
- `docs/arch/overview.md` — обзор архитектуры (обновляется).
- `docs/specs/` — рабочие спецификации задач.
- `docs/ops/runbook.md` — как запустить локально/деплой/rollback.
- `docs/CHANGELOG.md` — краткие изменения по датам (человекочитаемо).
- `docs/DECISIONS.md` — архитектурные решения (ADR‑стиль).
- `docs/refs/` — выдержки из доков/гайдов.


## Пайплайн разработки
PLAN → SPEC → APPLY (ветка/PR) → TEST → VERIFY → MERGE → DEPLOY → POSTMORTEM (если нужно).

Here is some context about my environment that could be useful:
{
  "directory_state": {
    "pwd": "C:\\dev\\gene-tree",
    "home": "C:\\Users\\filip"
  },
  "operating_system": {
    "platform": "Windows"
  },
  "current_time": "2025-11-08T08:11:33Z",
  "shell": {
    "name": "pwsh",
    "version": "5.1.26100.6899"
  }
}


External context:

[
  {
    "source": {
      "type": "WARP_DOCUMENTATION",
      "id": "README"
    },
    "content": "---\ndescription: >-\n  Warp is an Agentic Development Environment, built to help developers ship\n  faster with agents.\n---\n\n# Quickstart Guide\n\n## Key Features:\n\n* [**Warp Code**](code/code-overview.md): Warp is optimized for writing code by prompt on large, existing codebases. When Warp detects an opportunity to write code, it will enter an advanced code generation flow.\n* [**Agents**](agents/agents-overview.md): Warp autodetects whether you are typing a natural language prompt or a command. Use natural language prompts to have Warp write code, debug issues, or write commands for you.\n* [**Context management**](agents/using-agents/agent-context/): Warp will use codebase context, images, URLs, and documentation you save in Warp as context for agents.&\#x20;\n* [**Multi-agent management**](agents/using-agents/managing-agents.md): Warp is designed to have multiple agents running at once. Agents will send you notifications if they require your input, and you can see all your agents in one panel.\n* [**Modern UX and Text Editing**](terminal/editor/): Inputs (commands or prompts) and outputs are grouped into easy to use Blocks, and you can use your cursor or customizable keybindings to easily navigate Warp’s input editor.\n\nYou can fully customize Warp's appearance, prompts, settings, and keybindings to fit your preferences. Warp works with zsh, bash, fish, and PowerShell, and is built with Rust for high performance.\n\nFor an inside look at how Warp is built, you can read the blog post on [How Warp Works](https://www.warp.dev/blog/how-warp-works).\n\n#### **To see Warp in action, check out this video by Warp's Developer Advocate, Jess:**\n\n{% embed url=\"https://youtu.be/0yAL7iA0po4\" %}\n\n## Join the community\n\nStay connected to the team at Warp and get updates on the latest releases:\n\n* Visit Warp's [Blog](https://www.warp.dev/blog) to read about new features and engineering topics.\n* Join Warp's [Slack community](https://go.warp.dev/join-preview) to interact directly with Warp engineers and other developers.\n* Subscribe to Warp's [YouTube](http://www.youtube.com/@warpdotdev) and [TikTok](https://www.tiktok.com/@warp.dev) channels for longer demos and insider stories.\n* Visit [Warp University](https://www.warp.dev/university) to get end-to-end workflows for coding, deploying, and becoming pro AI developer.\n* Follow Warp on [Twitter](https://twitter.com/warpdotdev) for updates and tips.\n"
  }
]
