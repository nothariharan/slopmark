# api

> outline doc — endpoints, payloads, errors. fill in examples later.

base url: `/api` (same origin as next app)

---

## GET /api/tasks

> explain: list approved tasks for a domain

- [ ] query: `?domain=instruction`
- [ ] response: `{ tasks: [{ id, domain, prompt, source }] }`
- [ ] verifier config intentionally omitted
- [ ] error cases: unknown domain, empty list

---

## POST /api/eval/run

> explain: score one task with a model or pasted output

- [ ] body: `{ taskId, modelSlug }` OR `{ taskId, output }` for paste mode
- [ ] response: `{ passed, score, details, rules?, output, meta, run }`
- [ ] errors: missing key, task not found, missing OPENROUTER_API_KEY
- [ ] example curl commands (placeholder)

---

## POST /api/eval/suite

> explain: run all tasks in a domain for one model

- [ ] body: `{ modelSlug }`
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

## auth & rate limits (planned)

> explain: what doesn't exist yet

- [ ] currently no auth
- [ ] planned: ip rate limit on eval routes
- [ ] planned: api keys for programmatic access

---

## env vars

> explain: what the api needs

- [ ] `OPENROUTER_API_KEY` — live model runs
- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — postgres persistence
- [ ] works without env via json fallback + paste mode
