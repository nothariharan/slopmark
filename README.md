# arena

we started building an ai benchmark platform. then we deleted the code and changed direction.

this repo is research + architecture for now. the app comes back soon, built differently.

---

## what happened

for a few weeks we researched why ai benchmarks are broken (contamination, stale tests, leaderboard gaming). we read papers, mapped existing platforms, and landed on the deepswe pattern as the only evaluation design worth copying: novel tasks, behavioral verifiers, fixed harness, human review.

we scaffolded a next.js app. battle page, streaming models, blind votes, elo. it worked. we pushed it.

then we realized we were building the boring part first. a benchmark site competes with a dozen others. the interesting idea was always sitting in phase 2 of our own plan: **what if humans could bet on which agent wins before the result is revealed?**

so we wiped the codebase. kept the docs. starting over.

---

## what we're building now

**arena is a colosseum for ai agents where humans bet on outcomes.**

not polymarket with real money. points. same energy, no legal mess.

rough flow:

1. a task drops (coding, json, instruction follow, writing, etc.)
2. two agents fight it on the same task
3. humans bet points on who wins before the reveal
4. a verifier decides the winner (auto-scored where possible, human vote where not)
5. market resolves, agents get elo, predictors get points

the benchmark still matters. you need a fair way to pick a winner. deepswe-style verifiers handle that underneath. but the product is the fight and the bet, not another static leaderboard.

---

## what's in this repo right now

```
docs/
  ARCHITECTURE.md          how the platform + domains are structured
  PLAN.md                  original roadmap (being updated)
  deepswe.md               why deepswe is the evaluation template
  deep-research-report-1.md
  deep-research-report-2.md
  new.md                   notes on the pivot
  logs.md                  build log notes
```

no application code yet. that's intentional.

---

## how we'll build it (order)

1. supabase + one working verifier (instruction follow first, easiest to auto-score)
2. single eval endpoint: agent + task → pass/fail
3. head-to-head battle: two agents, same task, verifier picks winner
4. points + simple market: bet on battle outcome before reveal
5. more domains (json, coding, math, writing)
6. swe/deepswe repo tasks when docker workers are ready

benchmark mechanism first. betting layer second. we learned that the hard way.

---

## stack (when code returns)

- next.js, react, tailwind
- supabase (postgres + auth)
- openrouter (agent/model access)
- verifier plugins per domain (ajv, judge0, sympy, rule parsers)

---

## links

- architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- deepswe notes: [docs/deepswe.md](docs/deepswe.md)
- full plan: [docs/PLAN.md](docs/PLAN.md)

---

if you starred this when it was a benchmark scaffold, sorry for the whiplash. the new thing is more fun anyway.
