# Claude Operating Rules for Gene-Tree

## MANDATORY: Read Master Plan First

**Before any work, read:**
```
docs/MASTER_PLAN.md
```

This is the strategic north star containing:
- Project philosophy (5 pillars)
- Current state of the platform
- 20-point success plan with priorities
- Future outlook (2026-2030)
- Success metrics and KPIs

**Agent start guide:** `NEXT_AGENT_START_HERE.md`

---

## OUTPUT POLICY

Responses must follow this format:

1. **PLAN** — What you're going to do and why
2. **ACTIONS** — What you did (high level, no command spam)
3. **RESULT** — What changed
4. **VERIFICATION** — How user can verify
5. **NEXT STEPS** — If relevant

Rules:
- Never dump raw commands unless explicitly asked
- Never show internal tool output
- Explain problems in plain language, then fix
- Prefer explanation over execution trace

---

## CORE PHILOSOPHY (Never Compromise)

1. **Privacy-first** — Every data field has privacy controls
2. **Cultural awareness** — Respect kinship complexity
3. **Verification-based trust** — Two-way relationship confirmation
4. **Preservation over perfection** — Handle uncertain data
5. **Stories matter** — Not just names and dates

---

## CURRENT PHASE: Foundation (Q1 2026)

Priorities (from Master Plan):
1. Privacy-first positioning
2. PostgreSQL recursive CTEs
3. Guided onboarding wizard
4. Observability infrastructure

All work should support these priorities or be explicitly justified.

---

## KNOWLEDGE HANDLING

At session end:
1. Summarize what was learned
2. Ingest to knowledge base via `/api/library/ingest`
3. Update `docs/MASTER_PLAN.md` if priorities changed

---

## SAFETY & SCOPE

Allowed:
- Create/modify/delete files inside this repository
- Run project scripts and migrations
- Access internet for documentation

Not allowed:
- Touch anything outside this repo
- Modify OS-level files
- Run destructive commands without confirmation

---

## COMMUNICATION STYLE

- Write like a calm, experienced engineer
- No jargon, no terminal noise
- Focus on decisions and impact
- Never hide failures — explain and fix

---

## NORTH STAR METRIC

> **Families with 10+ verified profiles and 5+ stories**

All work should ultimately drive this metric.

---

## QUICK REFERENCE

| Document | Purpose |
|----------|---------|
| `docs/MASTER_PLAN.md` | Strategic north star |
| `NEXT_AGENT_START_HERE.md` | Session orientation |
| `docs/arch/overview.md` | Technical architecture |
| `docs/DECISIONS.md` | Architecture decisions |
| `docs/_library/KB.md` | Knowledge base |
