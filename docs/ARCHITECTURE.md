# architecture

> outline doc — how the platform is structured. what to document in each layer.

---

## core idea

> explain: slopmark as benchmark base, not one static test

- [ ] one skeleton, many domain plugins
- [ ] moat = scoring stack, not ui
- [ ] link spine diagram to [benchmarks](/docs/benchmarks)

---

## layer 1 — frontend

> explain: routes and user flows

| route | document |
|---|---|
| `/` | landing — CTAs split **bench** vs **play**, featured receipts |
| `/bench` | task pick, model pick, run task, run suite, paste mode, results panel |
| `/challenges` · `/challenge/[slug]` | curated sprints + shareable receipts |
| `/playground` | play hub — freeform multi-model + game launcher |
| `/canvas` · `/thunderdome` · `/goal` · `/arena` · `/realshot` | play cluster (also in nav) |
| `/leaderboard` · `/sessions` · `/shame` | bench receipts / walls |
| `/docs` | markdown docs from `docs/` folder |

nav (`components/Nav.tsx`) is clustered **bench | play** so canvas/thunderdome are discoverable without opening playground first.

- [ ] client vs server components
- [ ] what data each page fetches

---

## layer 2 — api

> explain: route handlers — link to [api](/docs/api) for request/response detail

- [ ] `GET /api/tasks`
- [ ] `POST /api/eval/run`
- [ ] `POST /api/eval/suite`
- [ ] `GET /api/leaderboard`
- [ ] `GET /api/runs`

---

## layer 3 — eval engine

> explain: lib/ modules and responsibilities

- [ ] `lib/harness.ts` + `lib/openrouter.ts`
- [ ] `lib/eval.ts` orchestration
- [ ] `lib/verifiers/` plugins
- [ ] `lib/models.ts` pool

---

## layer 4 — data

> explain: persistence strategy

- [ ] json fallback: `data/tasks/`, `data/eval-runs.json`
- [ ] supabase: `tasks`, `eval_runs`, leaderboard view
- [ ] when each backend is used
- [ ] schema in `supabase/schema.sql`

---

## data flow diagram

> explain: draw end-to-end for single eval and full suite

- [ ] single eval sequence
- [ ] suite loop sequence
- [ ] leaderboard aggregation query

---

## tech stack

> explain: choices and escape hatches

- [ ] next.js 16 app router
- [ ] openrouter
- [ ] supabase optional
- [ ] vitest for verifier tests
- [ ] when to extract fastapi worker (judge0, sympy, docker)

---

## file map

> explain: where to find things in repo

- [ ] `app/` routes
- [ ] `lib/` core
- [ ] `data/tasks/` seeds
- [ ] `docs/` this documentation
- [ ] keep map updated when structure changes

---

## built vs planned

> honest status checklist — july 2026

- [x] instruction follow + verifier
- [x] json, math, coding/swe, sycophancy, calibration, persistence, hierarchy, refusal, agentic, safety, procedural, drawing
- [x] bench ui + leaderboard + cost/capability charts
- [x] docs site
- [x] community task submission + review queue (sqlite local; supabase when configured)
- [x] challenges, realshot, playground games
- [ ] supabase wired by default on every deploy
- [ ] Judge0 / WASM coding sandbox for serverless
- [ ] durable cross-instance rate limits (KV)

---

## design principles

> explain: rules that shouldn't bend as we add features

- [ ] verifier first
- [ ] same harness always
- [ ] auto-score when possible
- [ ] cost is first class
- [ ] honest contamination labels
- [ ] plugin verifiers, same task schema
