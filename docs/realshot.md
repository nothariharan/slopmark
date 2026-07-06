# realshot

realshot is the BYOK agent duel mode. you paste two agents' API credentials, pick a one-shot task, and the verifier picks the winner — no human voting, no fixed model pool.

`/bench` is solo eval. `/arena` is subjective blind voting. realshot is **your agents, same prompt, auto-scored**.

---

## how it works

1. configure agent A and agent B (name, base URL, API key, model id)
2. pick a task category or leave it on random
3. both agents get the **same user prompt** in **one API call each**
4. outputs run through the task verifier
5. higher score wins; ties break on pass/fail

keys stay in your browser session (`sessionStorage`). they are sent to the server only for the duel request and are **not** written to the database.

---

## harness

zero context is the default: empty system prompt, no "helpful assistant" framing. toggle it off if you want the standard slopmark system prompt instead.

| setting | value |
|---|---|
| temperature | 0 |
| max tokens | 600 (1200 for html tasks) |
| turns | 1 |

---

## task categories

| category | what you're testing |
|---|---|
| **html** | one-shot website / markup replication (landing page, form, inline CSS, click handler) |
| **extract** | scrape-like extraction — page text is **included in the prompt**, model extracts a fact (price, email, year…) |
| **constraint** | multi-rule instruction burst (word count + forbidden words + format) |
| **procedural** | novel instance from seed (direction, sequence, calendar, palindrome…) |
| **json** | structured output against a schema |
| **regex** | write a pattern that passes hidden test strings |
| **random** | picks any category above |

extract tasks simulate scraping: the model cannot fetch URLs in one shot, so we embed the page content server-side. live URL fetch is a future extension.

---

## winner logic

1. higher verifier score wins
2. same score → whoever passed wins
3. both pass or both fail at same score → tie
4. if one agent errors (bad key, timeout, invalid model) → the other wins

---

## api

### POST /api/realshot/duel

run a duel.

```json
{
  "agentA": {
    "name": "gpt",
    "baseURL": "https://openrouter.ai/api/v1",
    "apiKey": "sk-...",
    "model": "openai/gpt-4o-mini"
  },
  "agentB": {
    "name": "claude",
    "baseURL": "https://openrouter.ai/api/v1",
    "apiKey": "sk-...",
    "model": "anthropic/claude-3.5-haiku"
  },
  "category": "extract",
  "harnessMode": "zero_context",
  "seed": 42,
  "taskId": "rs-extract-01"
}
```

- `category` — defaults to `random`
- `harnessMode` — `zero_context` (default) or `standard`
- `seed` — optional, for reproducible random picks
- `taskId` — optional, rematch the exact same task (overrides category/seed pick)

response includes both outputs, scores, verifier breakdown, and `winner: "a" | "b" | "tie"`.

### PUT /api/realshot/duel

smoke test one agent (sends a pong prompt).

```json
{
  "name": "my agent",
  "baseURL": "https://openrouter.ai/api/v1",
  "apiKey": "sk-...",
  "model": "openai/gpt-4o-mini"
}
```

returns `{ "ok": true }` or `{ "ok": false, "error": "..." }`.

---

## rate limits

10 duels per minute per IP (same bucket pattern as other eval routes).

---

## adding tasks

curated one-shot tasks live in `data/tasks/realshot.json`. each entry can set `category`, `label`, `prompt`, and `verifier`.

procedural and json tasks are pulled from existing pools at runtime. html/extract/regex/constraint tasks are defined in the realshot file.

---

## vs zero context domain

| | zero_ctx on /bench | realshot |
|---|---|---|
| agents | slopmark model pool or paste | your BYOK agents |
| format | solo eval | head-to-head duel |
| tasks | html only | html, extract, json, procedural, regex, constraint |
| winner | pass/fail score | A vs B comparison |

zero context is a harness setting inside realshot, not the whole product.
