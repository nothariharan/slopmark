# Arena benchmark architecture

*last updated: june 2026*

this doc is the single reference for how arena is structured. platform layers, domain benchmarks, scoring, data flow, and what is built vs planned.

see also: [PLAN.md](./PLAN.md), [deepswe.md](./deepswe.md)

---

## the core idea

arena is not one benchmark. it is one platform where many benchmarks share the same skeleton:

```
novel task  →  fixed harness  →  behavioral verifier  →  human quality gate
```

deepswe proved this works for coding. we generalize it across domains. where you can score objectively, you auto-score. where you cannot (writing, creative), you use blind human votes and elo.

---

## platform layers

four layers stacked top to bottom.

### layer 1: frontend

what the user sees and clicks.

| piece | purpose |
|---|---|
| `/` | landing, links into the product |
| `/battle` | two models stream side by side, blind vote, reveal |
| `/leaderboard` | model rankings, cost columns, later cost-capability chart |
| `/submit` (planned) | community task submission |

stack: next.js app router, react, tailwind, shadcn/ui, dark theme.

### layer 2: api gateway

next.js route handlers. no separate backend server yet.

| route | purpose |
|---|---|
| `POST /api/battle/new` | pick prompt + 2 models, create battle, return id only |
| `POST /api/battle/stream` | stream one model slot (a or b) |
| `POST /api/battle/vote` | record vote, update elo, reveal names |
| `GET /api/leaderboard` | return model rankings |

also handles: ip rate limiting (10 new battles/hour), request validation.

planned: eval routes per domain (`/api/eval/coding`, etc.) when auto-scored benchmarks go live.

### layer 3: eval engine

runs the actual test logic.

**today (built):**
- openrouter calls with fixed max tokens (600)
- human vote + bradley-terry elo (k=32)
- latency, token count, cost logging per stream

**stubbed (plugin system exists, not wired to ui):**
- `lib/verifiers/` dispatches by verifier type
- coding, math, json, instruction follow scorers return "not implemented yet"

**planned:**
- judge0 or docker sandbox for code execution
- sympy for math equivalence
- ajv for json schema validation
- deterministic string parsing for instruction follow

### layer 4: data

**today:** in-memory battle store (`globalThis` map). resets on server restart. fine for dev.

**planned:** supabase postgres. schema already written in `supabase/schema.sql`.

| table | holds |
|---|---|
| `models` | slug, name, elo, cost per token, active flag |
| `prompts` | content, domain, source, approved |
| `battles` | prompt, model pair, winner, latency, tokens, cost |
| `elo_history` | elo snapshots over time |

---

## the deepswe spine (applies to every domain)

deepswe is not just a coding benchmark. it is the template.

| step | what it means |
|---|---|
| 1. novel task | prompt never existed in training data. community-written or human-reviewed |
| 2. behavioral verifier | check if output works, not if it matches one gold patch |
| 3. standardized harness | same system prompt, token cap, tools for every model |
| 4. quality gate | human review before a task enters the live pool |

why this matters: public benchmarks (mmlu, humaneval, gsm8k) are contaminated. deepswe avoids that by keeping tasks original and off the public record.

---

## unified task shape

every domain uses the same data model. only the verifier changes.

```typescript
ArenaTask = {
  id: string
  domain: "swe" | "coding" | "math" | "json" | "instruction" | "writing"
  prompt: string
  metadata?: object
  verifier: VerifierConfig
  source: "seed" | "community" | "deepswe"
  approved: boolean
}
```

verifier types:

| type | domain | how it scores |
|---|---|---|
| `code_exec` | coding, swe | run hidden unit tests, pass/fail |
| `exact_number` | math | extract answer, compare (sympy optional) |
| `json_schema` | json, tool use | ajv validates output against schema |
| `instruction_rules` | instruction follow | parse text against constraint rules |
| `human_vote` | writing, creative | blind a/b battle, elo update |

---

## domain benchmark architectures

### 1. writing (human voted) — **built**

the only domain live in the app today.

| field | detail |
|---|---|
| input | open prompt (user typed or random seed) |
| output | prose from the model |
| scorer | blind human vote (a / b / tie) |
| anti-bias | model names hidden until vote is cast |
| ranking | elo per model, aggregated on leaderboard |
| seed data | 3 writing prompts in `lib/prompts.ts` |
| contamination | low if prompts are community-submitted and fresh |

flow: same as the main battle loop (see below).

---

### 2. coding (function-level) — **planned, week 3-4**

short functions, not full repos yet.

| field | detail |
|---|---|
| input | problem spec + function signature |
| output | runnable code |
| scorer | judge0 api (sandboxed execution) |
| pass condition | all hidden test cases pass |
| seed datasets | bigcodebench (apache 2.0), apps easy/medium |
| verifier plugin | `lib/verifiers/code-exec.ts` |

notes:
- label public seed datasets honestly as "possibly contaminated"
- prefer original community problems long term

---

### 3. swe / repo-level (deepswe style) — **planned, later**

full software engineering tasks. hardest infra.

| field | detail |
|---|---|
| input | issue description + repo snapshot |
| output | patch or multi-file edit |
| scorer | behavioral verifiers (tests pass, not diff match) |
| harness | fixed agent env (mini-swe-agent pattern) |
| infra | docker worker or fastapi sidecar, too heavy for serverless |
| reference | deepswe task design (see deepswe.md) |

why separate from function-level coding: needs long context, multi-turn tool use, sandboxed git repos.

---

### 4. math + logic — **planned, week 3-4**

| field | detail |
|---|---|
| input | word problem or logic puzzle |
| output | numeric or symbolic answer |
| scorer | regex extract final number, exact match or sympy |
| seed datasets | math-500, gsm8k variants (gsm1k-style rewrites preferred) |
| verifier plugin | `lib/verifiers/exact-number.ts` |
| cost | zero extra api calls, pure local parsing |

contamination strategy: use variant problems (new numbers, same logic) or community-authored questions.

---

### 5. json + tool use — **planned, week 5-6**

| field | detail |
|---|---|
| input | json schema + task description |
| output | structured json (or function call payload) |
| scorer | ajv schema validation + field error count |
| seed datasets | bfcl-inspired specs |
| verifier plugin | `lib/verifiers/json-schema.ts` |
| why it matters | devs need to know which models break on structured output |

later extension: ast match for function calling (berkeley bfcl style).

---

### 6. instruction follow — **planned, week 5-6**

| field | detail |
|---|---|
| input | prompt with hard constraints ("3 paragraphs, no letter e") |
| output | constrained text |
| scorer | deterministic rule parser (word count, forbidden words, paragraph count) |
| seed datasets | ifeval-style prompts + variants |
| verifier plugin | `lib/verifiers/instruction.ts` |
| contamination | hard to game because constraints are arbitrary |

no llm-as-judge. pass or fail is programmatic.

---

### 7. summarisation — **post-mvp**

| field | detail |
|---|---|
| input | long document |
| output | summary |
| scorer | rouge (weak) or human vote (better) |
| axes | faithfulness, coverage, conciseness |

may merge into writing battles instead of a separate domain.

---

### 8. image generation — **post-mvp, skip for now**

| field | detail |
|---|---|
| input | text prompt |
| output | image |
| scorer | clip score or blind human vote |
| blocker | different ui, gpu infra, clip scoring pipeline |

---

### 9. image understanding — **post-mvp**

| field | detail |
|---|---|
| input | image + question |
| output | text answer |
| scorer | exact match |
| reference benchmarks | vqav2, mmbench, mmmu |
| blocker | needs multimodal models on openrouter |

---

### 10. agentic / multi-step — **post-mvp, skip for now**

| field | detail |
|---|---|
| input | high-level goal |
| output | tool calls, terminal commands, browser actions |
| scorer | task completion in sandbox |
| reference benchmarks | webarena, osworld, gaia, tau-bench |
| blocker | docker vms, long timeouts, easy to game |

---

## scoring categories summary

```
deterministic (auto-scored)
  ├── coding        → judge0 unit tests
  ├── math          → exact number / sympy
  ├── json          → ajv schema
  └── instruction   → rule parser

human preference
  ├── writing       → blind vote + elo
  └── summarisation → vote or rouge (tbd)

always on (every run)
  ├── latency       → ttft, total time, tokens/sec
  └── cost          → input/output tokens × openrouter pricing
```

---

## battle flow (writing domain, built)

```
user opens /battle
  → POST /api/battle/new
      picks 2 random models from pool of 5
      picks prompt (custom or seed)
      stores battle in memory
      returns { battleId, prompt }  ← no model names

  → POST /api/battle/stream  (slot a)  ─┐
  → POST /api/battle/stream  (slot b)  ─┤ parallel
      openrouter streams tokens          │
      logs latency + cost per slot       ┘

  → user votes a / b / tie
  → POST /api/battle/vote
      updates elo
      returns model names + elo delta

  → GET /api/leaderboard
      shows updated rankings
```

model pool (openrouter slugs):

| name | slug |
|---|---|
| claude haiku 3.5 | `anthropic/claude-3.5-haiku` |
| gpt-4o mini | `openai/gpt-4o-mini` |
| llama 3.1 8b | `meta-llama/llama-3.1-8b-instruct` |
| mistral 7b | `mistralai/mistral-7b-instruct` |
| qwen 2.5 7b | `qwen/qwen-2.5-7b-instruct` |

---

## eval flow (auto-scored domains, planned)

same harness, different ending:

```
load ArenaTask from db
  → call model via openrouter (fixed system prompt, token cap)
  → runVerifier(output, task.verifier)
  → store { passed, score, latency, cost }
  → update domain-specific leaderboard
```

no human vote needed. head-to-head battles optional per domain.

---

## how domains unify in one interface

three pieces connect everything:

**one input form**
dynamic ui adapts by domain. code editor for coding, textarea for writing, schema viewer for json.

**scorer plugins**
each domain module implements the same result shape:

```typescript
VerifierResult = {
  passed: boolean
  score: number      // 0-100 normalized
  details: string
}
```

**one leaderboard**
per-domain tabs + composite view. filter by cost, speed, domain. cost-capability scatter plot (planned).

---

## content rollout (task sourcing)

| phase | source | trust level |
|---|---|---|
| phase 1 | public seed datasets (bigcodebench, ifeval, math-500) | low, labeled "public seed" |
| phase 2 | community submission + human review | medium/high |
| phase 3 | original tasks only (deepswe pattern) | high, "verified novel" badge |

transparency over pretending stale benchmarks are trustworthy.

---

## tech stack

| layer | choice | notes |
|---|---|---|
| frontend | next.js 16, react 19, tailwind 4, shadcn | app router |
| api | next.js route handlers | extract fastapi later for sandboxes |
| models | openrouter via openai sdk | one key, 300+ models |
| streaming | readablestream / fetch reader | plain text chunks |
| db (planned) | supabase postgres | schema written, not wired |
| code exec (planned) | judge0 api → docker worker | week 4+ |
| math (planned) | sympy in python worker | or regex-only in node first |
| json validation | ajv | already in dependencies |
| deploy | vercel (frontend) + supabase + railway/render (workers) | |

---

## phase 2: prediction market (architecture preview)

not built. layered on top once elo history exists.

```
arena battle resolves
  → market price updates
  → users who predicted correctly earn points
  → predictor leaderboard grows
```

market types planned:
- pre-battle winner prediction
- new model launch score markets
- elo movement futures (30 day)

uses points, not real money.

---

## built vs planned checklist

### built
- [x] next.js scaffold + ui
- [x] writing battle flow (stream, vote, reveal)
- [x] openrouter integration
- [x] elo calculation
- [x] in-memory battle store
- [x] rate limiting
- [x] verifier plugin stubs
- [x] supabase schema files
- [x] 5 model pool + 3 seed prompts

### next
- [ ] wire supabase persistence
- [ ] instruction follow domain (easiest auto-score win)
- [ ] json / tool use domain
- [ ] coding arena (judge0)
- [ ] math domain
- [ ] cost-capability scatter plot
- [ ] community prompt submission

### later
- [ ] swe / deepswe repo tasks
- [ ] summarisation
- [ ] image gen / understanding
- [ ] agentic sandboxes
- [ ] prediction market layer

---

## file map (when codebase is present)

```
app/
  page.tsx, battle/, leaderboard/
  api/battle/new|stream|vote/
  api/leaderboard/

components/
  BattleArena.tsx      full battle orchestration
  BattlePanel.tsx      one streaming panel

lib/
  battle-store.ts      in-memory battles
  models.ts            model pool
  prompts.ts           seed prompts
  openrouter.ts        llm client
  elo.ts               rating math
  rate-limit.ts        ip throttle
  types.ts             shared shapes
  verifiers/           domain scorers (stubs)
  supabase/            db clients (unused)

supabase/
  schema.sql
  seed.sql

docs/
  PLAN.md              roadmap
  deepswe.md           deepswe pattern notes
  ARCHITECTURE.md      this file
```

---

## design principles

1. **monolith first** — one next app until sandboxes force a python worker
2. **same harness always** — fixed prompt, cap, no per-vendor tricks
3. **auto-score when possible** — no llm-as-judge unless there is no alternative
4. **blind until vote** — model names stay server-side for human domains
5. **cost is first class** — log it on every run, show it on leaderboard
6. **honest about contamination** — label seed data, push community tasks for trust
7. **plugin verifiers** — new domain = new scorer file, same task schema




few stuff to note includes:


1. the benchmark mechanims is entirely based upon on the DeepSWE