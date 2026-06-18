# deepswe template

> outline doc — why we follow this pattern and how it maps to slopmark.

deepswe is the reference implementation for contamination-resistant eval. we generalize its ideas across domains.

---

## why deepswe matters

> explain: what was broken before it

- [ ] swe-bench contamination — fixes already on github
- [ ] structural matching false negatives (~24% on swe-bench)
- [ ] leaderboard clustering at 90%+ without real separation
- [ ] why the ml community trusts deepswe more than static leaderboards

---

## innovation 1 — novel tasks

> explain: tasks written from scratch, never public

- [ ] not copied from prs / commits / public patches
- [ ] tasks not merged upstream — stay off training record
- [ ] slopmark equivalent: community + hand-written seeds, approval gate
- [ ] link to [tasks](/docs/tasks) for sourcing tiers

---

## innovation 2 — behavioral verifiers

> explain: test behavior, not implementation shape

- [ ] verifier written from task spec
- [ ] any correct implementation strategy passes
- [ ] vs gold-diff matching
- [ ] slopmark mapping per domain (table in [domains](/docs/domains))

---

## innovation 3 — hard tasks

> explain: difficulty that separates frontier models

- [ ] long-horizon, multi-file solutions in deepswe
- [ ] slopmark: multi-rule instruction tasks, hidden test suites for code
- [ ] avoid trivial tasks that every model passes

---

## innovation 4 — standardized harness

> explain: mini-swe-agent held fixed

- [ ] same tools, same prompt, every model
- [ ] slopmark harness spec in [harness](/docs/harness)
- [ ] leaderboard reflects model not scaffolding

---

## four-step framework (our spine)

```
novel task  →  fixed harness  →  behavioral verifier  →  human quality gate
```

> explain: how each step maps from deepswe to slopmark

- [ ] step-by-step table for coding, instruction, json, math
- [ ] which steps are live vs planned

---

## rollout phases

> explain: don't need 100 original tasks on day one

- [ ] phase 1: seed infrastructure, label contamination honestly
- [ ] phase 2: community submissions + review queue
- [ ] phase 3: original-only pool as trust grows
- [ ] what slopmark is at today (phase 1, instruction live)

---

## what we are not copying

> explain: scope boundaries

- [ ] not replicating deepswe coding tasks verbatim
- [ ] not their agent binary — our harness is simpler for v0
- [ ] not claiming swe domain until docker infra exists

---

## further reading (placeholders)

- [ ] link deepswe paper / blog when added
- [ ] link datacurve posts referenced in research notes
- [ ] internal examples of behavioral vs structural verify
