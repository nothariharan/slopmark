# Slopmark benchmark architecture

*last updated: june 2026*

this doc is the single reference for how slopmark is structured. platform layers, domain benchmarks, scoring, data flow, and what is built vs planned.

see also: [PLAN.md](./PLAN.md), [JUDGING.md](./JUDGING.md), [deepswe.md](./deepswe.md)

---

## the core idea

slopmark is not one benchmark. it is one base where many benchmarks share the same skeleton:

```
novel task  →  fixed harness  →  behavioral verifier  →  human quality gate
```

our moat is this scoring stack — not ui gimmicks or leaderboard cosmetics.

---

## platform layers

### layer 1: frontend

| route | purpose |
|---|---|
| `/` | landing |
| `/bench` | run tasks, score output, run full suite |
| `/leaderboard` | per-model pass rate and avg score |
| `/docs` | how we bench models |

### layer 2: api

| route | purpose |
|---|---|
| `GET /api/tasks` | list approved tasks |
| `POST /api/eval/run` | single task eval |
| `POST /api/eval/suite` | full domain suite for one model |
| `GET /api/leaderboard` | aggregated model stats |
| `GET /api/runs` | recent eval runs |

### layer 3: eval engine

- openrouter with fixed harness (system prompt, 600 tok cap, temp 0)
- `lib/verifiers/` plugin dispatch by verifier type
- instruction follow scorer live; json, math, coding stubbed

### layer 4: data

- json fallback: `data/tasks/`, `data/eval-runs.json`
- supabase optional: `supabase/schema.sql` (tasks + eval_runs)

---

## unified task shape

```typescript
BenchTask = {
  id: string
  domain: "swe" | "coding" | "math" | "json" | "instruction" | "writing"
  prompt: string
  verifier: VerifierConfig
  source: "seed" | "community"
  approved: boolean
}
```

verifier types:

| type | domain | how it scores |
|---|---|---|
| `instruction_rules` | instruction | deterministic rule parser |
| `json_schema` | json | ajv validation |
| `exact_number` | math | extract + compare |
| `code_exec` | coding, swe | hidden unit tests |
| `human_vote` | writing | human review (planned) |

---

## eval flow (live)

```
load BenchTask
  → call model via openrouter (fixed harness)
  → runVerifier(output, task.verifier)
  → persist eval run (passed, score, latency, cost)
  → update leaderboard aggregates
```

---

## domain status

| domain | status |
|---|---|
| instruction follow | **live** — 25 seed tasks |
| json | planned |
| math | planned |
| coding | planned |
| writing | planned (human review) |
| swe | later (docker) |

---

## model pool

| name | slug |
|---|---|
| claude haiku 3.5 | `anthropic/claude-3.5-haiku` |
| gpt-4o mini | `openai/gpt-4o-mini` |
| llama 3.1 8b | `meta-llama/llama-3.1-8b-instruct` |
| mistral 7b | `mistralai/mistral-7b-instruct` |
| qwen 2.5 7b | `qwen/qwen-2.5-7b-instruct` |

---

## tech stack

| layer | choice |
|---|---|
| frontend | next.js 16, react, tailwind |
| api | next.js route handlers |
| models | openrouter |
| db | supabase optional, json fallback |
| tests | vitest |

---

## file map

```
app/
  page.tsx, bench/, leaderboard/, docs/
  api/tasks, api/eval/run, api/eval/suite, api/leaderboard, api/runs

lib/
  types.ts, models.ts, harness.ts, openrouter.ts, eval.ts
  verifiers/          domain scorers
  store/              json + supabase adapters
  docs.ts             docs manifest

data/tasks/           seed task json
supabase/schema.sql
docs/                 architecture, judging, benchmarks
```

---

## design principles

1. **verifier first** — if scoring is fake, nothing else matters
2. **same harness always** — fixed prompt, cap, no per-vendor tricks
3. **auto-score when possible** — no llm-as-judge
4. **cost is first class** — log on every run
5. **honest about contamination** — label seed data
6. **plugin verifiers** — new domain = new scorer file, same task schema
