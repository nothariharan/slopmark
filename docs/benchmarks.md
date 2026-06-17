# how we bench

slopmark is a benchmark base, not a leaderboard skin. this page is the short version of how we score models.

---

## the spine

every domain uses the same loop:

```
novel task  →  fixed harness  →  behavioral verifier  →  human quality gate
```

| step | what it means |
|---|---|
| novel task | tasks models haven't memorized from training |
| fixed harness | same system prompt, token cap, tools for every model |
| behavioral verifier | check if output *works*, not if it looks like an answer key |
| quality gate | human reviews tasks before they go live |

if the verifier is weak, the benchmark is useless. that's the whole product.

---

## what we avoid

- **llm-as-judge** — biased toward verbose gpt-style outputs
- **public test sets as gospel** — mmlu, humaneval, gsm8k are contaminated
- **structural matching** — diff match, exact string match when behavior is what matters
- **per-model scaffolding** — different prompts or tools per vendor

---

## domains (rollout order)

| priority | domain | how we score |
|---|---|---|
| 1 | instruction follow | deterministic rule parser |
| 2 | json / tool use | ajv schema validation |
| 3 | math | exact number / sympy |
| 4 | coding | judge0 hidden tests |
| 5 | writing | human review (later) |
| 6 | swe | repo behavioral tests (deepswe style) |

v0 ships instruction follow only. more domains plug into the same task shape and verifier contract.

---

## harness defaults

every model run gets identical conditions:

- system: follow instructions exactly, no preamble
- max output tokens: 600
- temperature: 0
- provider: openrouter (same api path for all models)

we log latency, token count, and cost on every run.

---

## scoring instruction follow

tasks have hard constraints: word count, paragraph count, forbidden words, required phrases, etc.

the verifier checks each rule programmatically. pass = all rules pass. score = percent of rules passed.

no human needed. no llm needed. reproducible for the same output.

---

## read more

- [scoring & verifiers](/docs/judging)
- [platform architecture](/docs/architecture)
- [why deepswe is the template](/docs/deepswe)
