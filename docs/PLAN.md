# PLAN.md — Slopmark

*last updated: july 2026*

---

## one line

open benchmark base for ai models — novel tasks, fixed harness, behavioral verifiers.

---

## the problem

public benchmarks are contaminated. models train on test data. leaderboards lie. llm-as-judge is biased. cost is invisible on most platforms.

slopmark fixes the **scoring layer**, not the leaderboard chrome.

---

## what ships

a multi-domain eval platform where every task runs through the same spine:

```
novel task  →  fixed harness  →  behavioral verifier  →  human quality gate
```

never another llm as judge. domains plug in via verifier plugins.

---

## four layers

```
frontend     /bench, /playground, /challenges, /leaderboard, /docs, games
api          /api/tasks, /api/eval/*, /api/challenges/*, /api/realshot/*, …
eval engine  openrouter / aiml / fireworks / byok + verifier plugins
data         committed challenge json · sqlite local · supabase optional
```

---

## domain status

| domain | scorer | status |
|---|---|---|
| instruction follow | instruction_rules | **live** |
| json / tool use | json_schema (AJV) | **live** |
| math | exact_number | **live** |
| coding / swe | code_exec (docker or local python) | **live** (sandbox-dependent) |
| sycophancy | sycophancy_check / resistance | **live** |
| calibration | calibration_check | **live** |
| persistence | persistence_check (multi-turn) | **live** |
| hierarchy | hierarchy_check | **live** |
| refusal | refusal_check | **live** |
| agentic | gaslight / tool / loop / rag | **live** |
| safety | distraction / malicious / injection | **live** |
| procedural | procedural_answer (generated) | **live** |
| drawing / html / regex | html_contract / regex_craft | **live** |
| writing | human_vote + review queue | **live** (soft) |
| zero_ctx | standard verifiers + zero harness | **live** |

---

## harness (fixed for every model in a run)

- same system prompt, temperature 0, shared token caps by mode
- providers: OpenRouter free (host), AIML, Fireworks, BYOK custom
- log latency, tokens, cost on every run

---

## next build priorities

1. keep docs honest when verifiers change
2. Supabase as default persistence on Vercel for submit/review/live boards
3. stronger coding sandbox path (Judge0 / WASM) when docker unavailable
4. scheduled baseline re-runs when free model pools rotate
5. strike stale docs when verifiers change; thicken soft domains; durable KV rate limits when credentials exist

---

## success looks like

- models scored on the same task set with reproducible verifiers
- pass rate, avg score, cost, and latency per model per domain
- docs explain how each domain is judged
- community can submit tasks after human review
