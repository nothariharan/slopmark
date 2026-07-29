# api

> outline doc — endpoints, payloads, errors. fill in examples later.

base url: `/api` (same origin as next app)

---

## GET /api/tasks

> explain: list approved tasks for a domain

- [ ] query: `?domain=instruction&difficulty=hard` (difficulty optional)
- [ ] response: `{ tasks: [{ id, domain, prompt, source, difficulty? }] }`
- [ ] verifier config intentionally omitted
- [ ] error cases: unknown domain, empty list

---

## POST /api/eval/run

> explain: score one task with a model or pasted output

- [ ] body: `{ taskId, modelSlug }` OR `{ taskId, output }` for paste mode OR `{ taskId, provider }` for BYOK
- [ ] response: `{ passed, score, details, rules?, output, meta, run }`
- [ ] errors: missing key, task not found, missing OPENROUTER_API_KEY
- [ ] example curl commands (placeholder)

---

## POST /api/eval/suite

> explain: run all tasks in a domain for one model

- [ ] body: `{ modelSlug, domain }` — defaults to instruction if domain omitted
- [ ] response: `{ modelSlug, domain, total, passed, passRate, avgScore, runs }`
- [ ] runtime/cost warning for full suite
- [ ] sequential vs parallel policy (document current behavior)

---

## GET /api/leaderboard

> explain: aggregated model stats

- [ ] query: `?domain=instruction`
- [ ] response: `{ domain, rows: [{ model_slug, runs, pass_rate, avg_score, ... }] }`
- [ ] sort order documented
- [ ] empty state when no runs

---

## GET /api/runs

> explain: recent eval history

- [ ] response: `{ runs: EvalRun[] }`
- [ ] limit (10) and pagination (planned)

---

## goal routes (live)

used by `/goal` minigames — not part of the benchmark eval pipeline.

### POST /api/goal/challenge

- body: `{ prompt, modelSlug }`
- response: `{ output, meta: { latency_ms } }`
- generic single-turn call through the same harness as bench

### POST /api/goal/stump

- body: `{ prompt, rules, modelSlug }` — rules are instruction verifier rules
- response: `{ output, passed, score, details, rules, meta }`

### POST /api/goal/roulette

- turn 1: `{ turn: 1, question, modelSlug }` → `{ output, meta }`
- turn 2: `{ turn: 2, question, modelSlug, turn1Answer, challenge, correctToken }` → `{ output, caved, meta }`

### POST /api/goal/draw

- body: `{ subject, modelSlug }`
- response: `{ output, meta }` — ascii art prompt

---

## realshot (live)

BYOK agent duels. see [realshot duels](/docs/realshot) for full docs.

### POST /api/realshot/duel

- body: `{ agentA, agentB, category?, harnessMode?, seed?, taskId? }`
- each agent: `{ name, baseURL, apiKey, model }`
- response: `{ duelId, category, harnessMode, seed, task, agentA, agentB, winner }`
- rate limit: 10/min per IP

### PUT /api/realshot/duel

- body: `{ name, baseURL, apiKey, model }` — smoke test (pong prompt)
- response: `{ ok: true }` or `{ ok: false, error }`

---

## challenges (live)

fixed niche sprints — persisted sessions with infographic UI. see [benchmark challenges](/docs/challenges) for full docs.

### GET /api/challenges

- response: `{ challenges: [{ slug, title, subtitle, status, completed_at, task_count, model_count }] }`
- lists manifests from `data/challenges/*/manifest.json`

### GET /api/challenges/{slug}

- response: full `ChallengeResults` — `{ manifest, runs, summaries, completed_at }`
- prefers sqlite (`challenges` + `challenge_runs` tables); falls back to committed `data/challenges/{slug}/results.json`

### CLI: `npm run challenge`

- runs `scripts/run-challenge.ts [slug]` — smoke-tests models, evals all task×model combos, saves sqlite + json
- default slug: `niche-sprint-v1`
- requires `AIMLAPI_KEY` in `.env.local`
- view results: `/challenge/{slug}`

### POST /api/challenges/run (ad-hoc BYOK)

- body: `{ title, tasks[], models: [{ label, provider }] }` — max 15 tasks, 6 models
- response: full `ChallengeResults` (not persisted on serverless)
- ui: `/challenges/new`

### POST /api/eval/run — BYOK

- optional `provider: { name?, baseURL, apiKey, model }` instead of `modelSlug`
- keys are not stored server-side

---

## auth & rate limits

> current behavior — july 2026

- [x] no end-user auth required for public bench / games
- [x] in-memory + cookie rate limits on eval, goal, arena, thunderdome, realshot, smoke (`lib/rate-limit.ts`)
- [ ] durable cross-instance limits (Upstash / Vercel KV) — deferred
- [ ] api keys for programmatic access — not shipped

---

## env vars

> explain: what the api needs

- `AIMLAPI_KEY` — live runs via `aiml/` slugs (see [aiml api](/docs/aimlapi))
- `OPENROUTER_API_KEY` — live runs via openrouter slugs
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — postgres persistence
- works without env via json fallback + paste mode
