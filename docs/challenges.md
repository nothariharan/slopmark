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

api prefers committed json for public deploys; sqlite is for local CLI runs.

---

## drawing contest v1

| | |
|---|---|
| slug | `drawing-contest-v1` |
| models | 5 Fireworks serverless (`fireworks/` slugs) |
| tasks | 10 SVG drawing contracts |
| harness | `zero_context`, 4000 max tokens |
| view | `/challenge/drawing-contest-v1` (gallery renders every drawing) |

top scores: GPT-OSS 120B + GLM 5.1 at 100%; GLM 5.2 / DeepSeek V4 Pro / Kimi K2.6 at 90% (rocket flame color). see [drawing docs](/docs/drawing).

---

## game night v1

| | |
|---|---|
| slug | `game-night-v1` |
| models | 5 Fireworks serverless (same lineup as drawing contest) |
| tasks | 10 party-game instruction contracts (`ins-game-*`) |
| harness | `zero_context` |
| view | `/challenge/game-night-v1` |

### scoreboard

| rank | model | pass rate |
|---:|---|---:|
| 1 | GPT-OSS 120B | **90%** (9/10) |
| 2 | DeepSeek V4 Pro | 60% |
| 3 | Kimi K2.6 | 30% |
| 4 | GLM 5.2 | 20% |
| 5 | GLM 5.1 | 10% |

unlike drawing contest (~90–100% across the board), game night spreads hard — models leak chain-of-thought into answers under zero context (one-word / ALL CAPS / haiku contracts expose narrators). GPT-OSS’s only miss: empty output on the no-letter-`e` pizza lipogram.

tasks live in `data/tasks/instruction.json` as `ins-game-*`.

---

## slop chaos v1

| | |
|---|---|
| slug | `slop-chaos-v1` |
| models | Fireworks panel: **Kimi K3**, Kimi K2.6, GLM 5.2, DeepSeek V4 Pro, GPT-OSS 120B (`fireworks/*` slugs). Runner falls back to OpenRouter twins if `FIREWORKS_API_KEY` is unset. |
| tasks | 10 cursed constraint traps (`ins-slop-*` + `json-slop-mayo-1`) — haunted toaster recalls, racoon lipograms, goose HR ALL CAPS, mayonnaise JSON, classic F-count |
| harness | `zero_context` |
| view | `/challenge/slop-chaos-v1` |
| run | `npm run challenge:slop-chaos` |

designed to show where “frontend kings” like Kimi K3 still trip on stupid, simultaneous formatting contracts. no vibes scoring — rule parser only.

seed prompts also live in `data/tasks/slop_chaos.json` (merged into instruction/json pools for the harness).

### scoreboard (jul 29 2026)

ran via OpenRouter twins (`FIREWORKS_API_KEY` was not in local `.env.local`). re-run with Fireworks when the key is present: `npm run challenge:slop-chaos`.

| rank | model | pass rate |
|---:|---|---:|
| 1 | Kimi K3 | **60%** (6/10) |
| 1 | Kimi K2.6 | **60%** (6/10) |
| 3 | GPT-OSS 120B | 40% |
| 4 | GLM 5.2 | 30% |
| 4 | DeepSeek V4 Pro | 30% |

**universal fails (0/5):** haunted toaster (banned glue words + exact count), racoon lipogram (no letter `e`), shoe-tying questions with taboo words.

**universal passes (5/5):** meme math `21 meme`, yes/no/maybe-later paragraphs.

Kimi K3 still loses hard on multi-constraint lipogram / glue-word bans — the “frontend” model is not a constraint model.

challenge receipt pages (`/challenge/[slug]`) lead with a **shareable receipt hero**: top pass %, universal wipeout/clear chips, one specimen fail (prompt + verifier line + output), copy-link / share-card, and an Open Graph image. task briefing + per-run verifier chips sit below; json/csv export is tucked at the bottom.

---

## trap season v2

| | |
|---|---|
| slug | `trap-season-v2` |
| models | same Fireworks panel as Slop Chaos (Kimi K3 / K2.6, GLM 5.2, DeepSeek V4 Pro, GPT-OSS 120B) |
| tasks | 10 new cursed office / seasonal traps (`ins-trap-*` + `json-trap-cactus-1`) — elevator pitch glue bans, owl lipogram (no `a`), microwave dash lines, whisper lowercase, Zig/Zag maze, vowel count, `south wins` meme, alien wifi taboo, TICK/TOCK ALL CAPS, cactus JSON |
| harness | `zero_context` |
| view | `/challenge/trap-season-v2` |
| run | `npm run challenge:trap-season` |

second pack in the Trap Season cadence — same “stupid simultaneous contracts” mold as Slop Chaos, new jokes. seed prompts live in `data/tasks/trap_season.json` and are merged into `instruction.json` / `json.json` for the harness.

### scoreboard (jul 30 2026)

ran on **Fireworks** serverless (`FIREWORKS_API_KEY` present). re-run: `npm run challenge:trap-season`.

| rank | model | pass rate |
|---:|---|---:|
| 1 | GPT-OSS 120B | **90%** (9/10) |
| 2 | Kimi K3 | **80%** (8/10) |
| 3 | DeepSeek V4 Pro | 60% |
| 4 | Kimi K2.6 | 30% |
| 4 | GLM 5.2 | 30% |

**universal wipeout (0/5):** cursed HR SaaS elevator pitch (banned glue words + exact count + PITCH:/DOOM.).

**universal clears (5/5):** vowel count `[7]`, `south wins` meme, cactus JSON schema.

Kimi K3 looks strong here (80%) vs Slop Chaos (60%) — different trap mix, still loses the stacked glue-word elevator pitch like everyone else.

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
