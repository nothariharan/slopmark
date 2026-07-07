# slopmark

a benchmark base for ai models. novel tasks, fixed harness, behavioral verifiers. literally anything 

our moat is **how** we bench: novel tasks, fixed harness, behavioral verifiers, human quality gate. scores you can actually trust as models get smarter. 

most importantly no more ' trust me bro benchmark ' 

---

## what works (v0)

- **instruction follow** — 181 seed tasks, rule-based verifier
- **json** + **math** + **sycophancy** domains (seed tasks, deterministic verifiers)
- **procedural** — 75 seeded instances (direction, sequence, time, calendar, palindrome)
- **refusal** + **hierarchy** + **calibration** + **persistence** domains
- **zero context** — HTML one-shot tasks with no system prompt (`zero_ctx` domain)
- **realshot** — BYOK agent duels at `/realshot` (one-shot tasks, auto-scored winner)
- **aiml api** — cheap live testing via `AIMLAPI_KEY` and `aiml/` model slugs (Claude blocked)
- contamination probes (paraphrase + counterfactual) on supported tasks
- custom task suites API, baseline script, BYOK provider smoke test
- `POST /api/eval/run` — single task eval (optional `harnessMode`)
- `POST /api/eval/suite` — full domain suite for one model
- `GET /api/leaderboard` — per-model pass rate and avg score (min 10 runs)
- `/bench` eval console (run task, run suite, paste-to-score dev mode)
- `/leaderboard` benchmark rankings
- `/goal` minigames vs live models (stump, roulette, direction tracker, object tracker, anagram, sequence, and more)

---

## quick start

```bash
npm install
npm run dev
```


open http://localhost:3000/bench ( custom port is fine too )

for head-to-head agent duels with your own API keys, open http://localhost:3000/realshot

paste mode works without an api key. for live runs:

- **aiml (recommended for testing):** set `AIMLAPI_KEY` in `.env.local`, pick an `aiml/` model on `/bench` — see [aiml api docs](/docs/aimlapi)
- **openrouter:** set `OPENROUTER_API_KEY`, use the openrouter model group
optional: set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for postgres persistence. without it, runs save to `data/eval-runs.json`.

---

## api

| route | method | purpose |
|---|---|---|
| `/api/tasks?domain=instruction` | GET | list tasks (optional `difficulty` filter) |
| `/api/eval/run` | POST | `{ taskId, modelSlug }` or `{ taskId, output }` — optional `harnessMode` |
| `/api/eval/suite` | POST | `{ modelSlug, domain }` — all tasks in a domain |
| `/api/realshot/duel` | POST | BYOK duel — `{ agentA, agentB, category?, harnessMode?, seed?, taskId? }` |
| `/api/realshot/duel` | PUT | smoke test one agent — `{ name, baseURL, apiKey, model }` |
| `/api/leaderboard?domain=instruction` | GET | model stats |
| `/api/runs` | GET | recent runs |
| `/api/providers/smoke` | POST | `{ modelSlug }` — pong test (e.g. `aiml/openai/gpt-4o-mini`) |
| `/api/goal/challenge` | POST | `{ prompt, modelSlug }` — single model call for goal games |
| `/api/goal/stump` | POST | `{ prompt, rules, modelSlug }` — instruction follow challenge |
| `/api/goal/roulette` | POST | two-turn sycophancy trivia (`turn: 1` or `2`) |
| `/api/goal/draw` | POST | `{ subject, modelSlug }` — ascii art duel |

---

## stack

- next.js, react, tailwind
- openrouter + aiml api (model access)
- supabase optional (postgres)
- vitest (verifier tests)

---

## docs

on-site docs at `/docs`.

- [how we bench](/docs/benchmarks)
- [domains](/docs/domains)
- [scoring & verifiers](/docs/judging)
- [harness](/docs/harness)
- [zero context mode](/docs/zero-context)
- [realshot duels](/docs/realshot)
- [aiml api testing](/docs/aimlapi)
- [tasks & contamination](/docs/tasks)
- [metrics & leaderboard](/docs/metrics)
- [api](/docs/api)
- [architecture](/docs/architecture)
- [deepswe template](/docs/deepswe)




note to self: still need to flesh out tasks and the non-technical domain specs. going well otherwise. 


few other secions that needs tighitenion out overall

sect



