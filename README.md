# Arena

Open evaluation platform for AI models and agents. One harness, many domains, deterministic scoring where possible.

Public benchmarks like MMLU, HumanEval, and GSM8K are saturated or contaminated. Arena takes a different approach: original tasks, fixed execution conditions, and behavioral verifiers that check whether output actually satisfies the spec — not whether it matches a memorized answer key.

---

## What this is

Arena is a **benchmark platform**, not a leaderboard clone. Models run against tasks in a controlled harness. Each domain has a verifier plugin that returns pass/fail, a normalized score, and a breakdown of what failed.

Core pattern (from DeepSWE):

```
novel task  →  fixed harness  →  behavioral verifier  →  human quality gate
```

Auto-scored domains use programmatic judges (rule parsers, schema validation, test execution). Subjective domains use blind human preference voting later.

---

## Status

| layer | state |
|---|---|
| docs + architecture | done |
| instruction follow verifier | in progress |
| eval api + bench ui | in progress |
| json, math, coding domains | planned |
| swe / repo-level eval | later |

The repo includes a Next.js scaffold for the eval interface. Application code is being built incrementally — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.

---

## Documentation

| doc | contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | platform layers, domain modules, data flow |
| [docs/JUDGING.md](docs/JUDGING.md) | verifier types, scoring rules, rollout order |
| [docs/deepswe.md](docs/deepswe.md) | why DeepSWE is the evaluation template |
| [docs/PLAN.md](docs/PLAN.md) | roadmap and domain priorities |
| [docs/logs.md](docs/logs.md) | build notes |

Research notes: [docs/deep-research-report-1.md](docs/deep-research-report-1.md), [docs/deep-research-report-2.md](docs/deep-research-report-2.md)

---

## Domains

| domain | scorer | status |
|---|---|---|
| instruction follow | deterministic rule parser | first target |
| json / tool use | ajv schema validation | planned |
| math | exact number / sympy | planned |
| coding | judge0 hidden tests | planned |
| writing | blind human vote | planned |
| swe | repo behavioral tests | later |

---

## Stack

- **frontend / api** — Next.js, React, Tailwind
- **models** — OpenRouter (fixed system prompt, token cap, temperature 0)
- **database** — Supabase Postgres (JSON file fallback for local dev)
- **verifiers** — plugin per domain under `lib/verifiers/`

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional env vars (create `.env.local`):

```
OPENROUTER_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Without API keys you can still score pasted model output against tasks.

---

## Project structure

```
app/                  next.js routes and pages
docs/                 architecture, judging, research
lib/                  types, harness, verifiers, store (as built)
data/tasks/           seed benchmark tasks (as built)
supabase/             postgres schema (as built)
```

---

## Principles

1. **Novel tasks** — reduce contamination; prefer community-authored or reviewed prompts
2. **Behavioral verification** — score what the output does, not how it looks
3. **Fixed harness** — same conditions for every model on every run
4. **No LLM-as-judge** for auto-scored domains — deterministic or execution-based only
5. **Transparency** — label seed data honestly; log latency and cost on every run

---

## License

TBD
