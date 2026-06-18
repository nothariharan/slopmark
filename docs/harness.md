# harness

> outline doc — fixed execution environment for every model run.

the harness isolates model capability from scaffolding. every model gets the same conditions.

---

## why a fixed harness

> explain: what breaks when harness varies per model

- [ ] leaderboard reflects model, not prompt engineering per vendor
- [ ] reproducibility across runs and across time
- [ ] fair comparison when new models are added
- [ ] what deepswe proved with mini-swe-agent held constant

---

## system prompt

> explain: exact policy and rationale

- [ ] current text: follow instructions exactly, no preamble
- [ ] why no chain-of-thought injection in harness
- [ ] why no per-domain system prompt overrides (or when exceptions are allowed)
- [ ] version history / change log when prompt updates

---

## generation params

> explain: every knob we set and why

- [ ] max output tokens: 600
- [ ] temperature: 0
- [ ] top_p / other params — locked or documented defaults
- [ ] what happens when model ignores token cap

---

## provider path

> explain: openrouter as unified gateway

- [ ] single api key, openai-compatible sdk
- [ ] model slug format
- [ ] curated model pool and why those 5
- [ ] how to add a model without changing harness
- [ ] fallback when api key missing (paste mode for dev)

---

## per-run logging

> explain: metrics captured on every eval

- [ ] latency_ms (wall clock)
- [ ] input_tokens / output_tokens
- [ ] cost_usd (when available from provider)
- [ ] model_slug, task_id, timestamp
- [ ] what is NOT logged yet (ttft, tokens/sec)

---

## harness vs verifier

> explain: where harness ends and scoring begins

- [ ] harness produces raw model output string
- [ ] verifier receives output only, not chat history
- [ ] no verifier access to hidden tests in prompt
- [ ] same split for all domains

---

## future: domain-specific harness extensions

> explain: when harness grows per domain without breaking fairness

- [ ] coding: tool access / file context — how to keep fixed
- [ ] swe: agent loop — single standardized agent binary
- [ ] json: response format hints in user prompt vs system
