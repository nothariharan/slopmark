# benchmark challenges

fixed, revisitable model-vs-model sessions — niche task mixes saved forever in sqlite + committed json.

related: [aiml api testing](/docs/aimlapi) · [zero context mode](/docs/zero-context) · [realshot tasks](/docs/realshot) · [api](/docs/api)

---

## what you get

- **manifest** — `data/challenges/{slug}/manifest.json` defines tasks + models
- **results** — `data/challenges/{slug}/results.json` (committed for devlog / deploy revisit)
- **sqlite** — `data/local.db` tables `challenges`, `challenge_runs` (local forever)
- **ui** — `/challenge/{slug}` infographic + per-model drill-down
- **api** — `GET /api/challenges`, `GET /api/challenges/{slug}`

---

## niche sprint v1

| | |
|---|---|
| slug | `niche-sprint-v1` |
| models | 6 low-tier AIML models (verified via `/v1/models`) |
| tasks | 10 mixed: procedural, extract, html, constraint, json, regex |
| harness | `zero_context` (see [zero context](/docs/zero-context)) |
| view | `/challenge/niche-sprint-v1` |
| devlog asset | `/challenges/niche-sprint-v1-infographic.png` |

### run it

```bash
# needs AIMLAPI_KEY in .env.local
npm run challenge
# or
npx tsx scripts/run-challenge.ts niche-sprint-v1
```

smoke-tests every model first, then runs all task×model combos (~60 API calls).

### latest results (june 2026)

| rank | model | pass rate |
|---:|---|---:|
| 1 | Gemini 2.5 Flash | 90% |
| 2 | DeepSeek V3 | 70% |
| 3 | GPT-4o Mini | 60% |
| 3 | Llama 3.1 8B | 60% |
| 5 | Ministral 3B | 50% |
| 5 | Qwen 2.5 7B | 50% |

every model failed the **ANSWER: 8 words** constraint burst (partial credit only).

---

## adding a new challenge

1. create `data/challenges/my-challenge/manifest.json`
2. run `npx tsx scripts/run-challenge.ts my-challenge`
3. commit `manifest.json` + `results.json`
4. open `/challenge/my-challenge`

manifest shape:

```json
{
  "slug": "my-challenge",
  "title": "My Challenge",
  "subtitle": "…",
  "description": "…",
  "harness_mode": "zero_context",
  "tasks": [{ "id": "proc-sequence-5", "label": "…", "category": "procedural" }],
  "models": [{ "slug": "aiml/openai/gpt-4o-mini", "label": "GPT-4o Mini" }]
}
```

task ids can be procedural (`proc-*`), realshot (`rs-*`), or domain tasks (`json-01`, etc.).

---

## storage

| layer | path / table | purpose |
|---|---|---|
| sqlite | `challenges`, `challenge_runs` | local query + forever persistence |
| json export | `data/challenges/{slug}/results.json` | git-tracked revisit without db |
| supabase | `supabase/schema.sql` | production postgres when linked |

api prefers sqlite; falls back to committed json if db is empty.

---

## devlog screenshot

the infographic lives at `#challenge-infographic` on the challenge page — bar chart, category heatmap, model cards. screenshot that block for your devlog.

---

## production (vercel)

deployed api routes read from committed json via `lib/challenges/store-json.ts` — no sqlite on serverless. see [deploy](/docs/deploy).

---

## phase 2 — BYOK bench (live)

`/bench` now has a **use my own API key** toggle. keys stay in `sessionStorage` — sent per request only.

`POST /api/eval/run` accepts optional `provider`:

```json
{
  "taskId": "json-01",
  "provider": {
    "name": "my model",
    "baseURL": "https://api.aimlapi.com/v1",
    "apiKey": "…",
    "model": "openai/gpt-4o-mini"
  },
  "harnessMode": "zero_context"
}
```

`POST /api/eval/suite` also accepts `provider` for full-domain BYOK sweeps.

test connection uses the same pong smoke as realshot (`PUT /api/realshot/duel`).

---

## phase 3 — build your own sprint (ad-hoc)

`/challenges/new` — pick preset tasks, add 1–6 BYOK models, run, get the same infographic inline.

`POST /api/challenges/run` — ad-hoc challenge (max 15 tasks × 6 models). returns full `ChallengeResults` json. download from the ui — not persisted on vercel unless you commit json locally.

---

## roadmap

| phase | feature |
|---|---|
| 2 | BYOK solo eval on `/bench` via optional `provider` in `POST /api/eval/run` |
| 3 | challenge builder + `POST /api/challenges` + supabase persistence |
| 4 | background jobs + redis rate limits |
