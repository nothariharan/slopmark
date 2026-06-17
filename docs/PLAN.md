# PLAN.md — Slopmark

*last updated: june 2026*

---

## one line

open benchmark base for ai models — novel tasks, fixed harness, behavioral verifiers.

---

## the problem

public benchmarks are contaminated. models train on test data. leaderboards lie. llm-as-judge is biased. cost is invisible on most platforms.

slopmark fixes the **scoring layer**, not the leaderboard chrome.

---

## what we're building

a multi-domain eval platform where every task runs through the same spine:

```
novel task  →  fixed harness  →  behavioral verifier  →  human quality gate
```

v0 ships **instruction follow** only. more domains plug in via verifier plugins.

---

## four layers

```
frontend     /bench, /leaderboard, /docs
api          /api/tasks, /api/eval/run, /api/eval/suite, /api/leaderboard
eval engine  openrouter harness + verifier plugins
data         supabase postgres (optional) or json fallback
```

---

## domain rollout

| priority | domain | scorer | status |
|---|---|---|---|
| 1 | instruction follow | rule parser | **live** |
| 2 | json / tool use | ajv | planned |
| 3 | math | exact number / sympy | planned |
| 4 | coding | judge0 hidden tests | planned |
| 5 | writing | human review workflow | planned |
| 6 | swe | repo behavioral tests | later |

---

## harness (fixed for every model)

- same system prompt, 600 token cap, temperature 0
- openrouter for all models
- log latency, tokens, cost on every run

---

## build order

1. instruction follow verifier + seed tasks
2. eval api + persistence
3. bench ui + leaderboard
4. json domain
5. math domain
6. coding domain (judge0)
7. community task submission + review queue

---

## success looks like

- models scored on the same task set with reproducible verifiers
- pass rate and avg score per model per domain
- docs explain how each domain is judged
- community can submit tasks after human review

---

## open questions

1. model pool — 5 openrouter slugs for coverage without blowing budget
2. task vetting — lightweight review before tasks go live
