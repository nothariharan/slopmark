# aiml api provider

slopmark can run live evals through [AI/ML API](https://docs.aimlapi.com/) — an OpenAI-compatible gateway with 600+ models behind one key.

use this for **cheap bench testing** before burning OpenRouter credits or running full leaderboard sweeps.

---

## setup

1. get a key at [aimlapi.com/app/keys](https://aimlapi.com/app/keys)
2. add to `.env.local` (never commit this file):

```
AIMLAPI_KEY=your_key_here
AIMLAPI_BASE=https://api.aimlapi.com/v1
```

3. restart `npm run dev` so Next.js loads the env

`.env.example` has the variable names; copy it to `.env.local` and fill in values.

---

## model slugs

prefix models with `aiml/` in bench, baseline scripts, or API calls:

| bench label | slug | aiml model id |
|---|---|---|
| gpt-4o mini (aiml) | `aiml/openai/gpt-4o-mini` | `openai/gpt-4o-mini` |
| llama 3.1 8b (aiml) | `aiml/meta-llama/llama-3.1-8b-instruct` | `meta-llama/llama-3.1-8b-instruct` |
| mistral 7b (aiml) | `aiml/mistralai/mistral-7b-instruct` | `mistralai/mistral-7b-instruct` |
| qwen 2.5 7b (aiml) | `aiml/qwen/qwen-2.5-7b-instruct` | `qwen/qwen-2.5-7b-instruct` |
| gemini 2.0 flash (aiml) | `aiml/google/gemini-2.0-flash` | `google/gemini-2.0-flash` |

defined in `lib/aimlapi.ts`. cross-check ids at [aimlapi.com/models](https://aimlapi.com/models) if a call fails.

---

## credit policy

**claude and anthropic models are blocked** for `aiml/` slugs in code. they are expensive on this provider and not needed for bench validation.

```typescript
// lib/aimlapi.ts — throws if slug matches claude/anthropic
assertAimlModelAllowed(model)
```

stick to the low-tier list above for testing.

---

## smoke test

confirm key + model id before running suites:

```bash
curl -X POST http://localhost:3000/api/providers/smoke \
  -H "content-type: application/json" \
  -d '{"modelSlug":"aiml/openai/gpt-4o-mini"}'
```

expect `{ "ok": true }`.

---

## running evals

### bench ui

`/bench` model dropdown has an **aiml — low-tier testing** group. default selection is gpt-4o mini (aiml).

start with **run task** on one procedural or extract task — not **run full suite** until smoke passes.

### baseline script

```bash
npx tsx scripts/baseline.ts --domain procedural --model aiml/openai/gpt-4o-mini
```

when `AIMLAPI_KEY` is set and no `--model` flag is passed, baseline defaults to all `aimlTestModels` instead of openrouter slugs.

### realshot

paste the same base URL and key in the agent form:

- base URL: `https://api.aimlapi.com/v1`
- model: `openai/gpt-4o-mini` (no `aiml/` prefix in realshot — that's bench-only)

---

## openrouter vs aiml

| | openrouter | aiml |
|---|---|---|
| env var | `OPENROUTER_API_KEY` | `AIMLAPI_KEY` |
| slug prefix | none (`openai/gpt-4o-mini`) | `aiml/` (`aiml/openai/gpt-4o-mini`) |
| bench dropdown | openrouter group | aiml group |
| claude | available (expensive) | **blocked** |

both use the same harness and verifiers — only the provider path changes.

---

## troubleshooting

| error | fix |
|---|---|
| `AIMLAPI_KEY not set` | add key to `.env.local`, restart dev server |
| `model blocked for aiml testing` | pick a non-claude slug from the table above |
| 401 / invalid model | verify model id on aimlapi.com/models |
| empty leaderboard | need 10+ runs per model/domain (`MIN_RUNS=10`) |
