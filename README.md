# slopmark

a benchmark base for ai models. novel tasks, fixed harness, behavioral verifiers. literally anything 

our moat is **how** we bench: novel tasks, fixed harness, behavioral verifiers, human quality gate. scores you can actually trust as models get smarter. 

most importantly no more ' trust me bro benchmark ' 

---

## what works (v0)

- **instruction follow** domain with 25 seed tasks
- deterministic rule verifier (word count, paragraphs, forbidden text, etc.)
- `POST /api/eval/run` — single task eval
- `POST /api/eval/suite` — full instruction suite for one model
- `GET /api/leaderboard` — per-model pass rate and avg score
- `/bench` eval console (run task, run suite, paste-to-score dev mode)
- `/leaderboard` benchmark rankings

---

## quick start

```bash
npm install
npm run dev
```


open http://localhost:3000/bench ( custom port is fine too )

paste mode works without an api key. set `OPENROUTER_API_KEY` in `.env` to run live models.

optional: set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for postgres persistence. without it, runs save to `data/eval-runs.json`.

---

## api

| route | method | purpose |
|---|---|---|
| `/api/tasks?domain=instruction` | GET | list tasks |
| `/api/eval/run` | POST | `{ taskId, modelSlug }` or `{ taskId, output }` |
| `/api/eval/suite` | POST | `{ modelSlug }` — all instruction tasks |
| `/api/leaderboard?domain=instruction` | GET | model stats |
| `/api/runs` | GET | recent runs |

---

## stack

- next.js, react, tailwind
- openrouter (model access)
- supabase optional (postgres)
- vitest (verifier tests)

---

## docs

on-site docs at `/docs`.

- [how we bench](/docs/benchmarks)
- [domains](/docs/domains)
- [scoring & verifiers](/docs/judging)
- [harness](/docs/harness)
- [tasks & contamination](/docs/tasks)
- [metrics & leaderboard](/docs/metrics)
- [api](/docs/api)
- [architecture](/docs/architecture)
- [deepswe template](/docs/deepswe)




note to self: still need to flesh out tasks and the non-technical domain specs. going well otherwise. 