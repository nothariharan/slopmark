# tasks & contamination

> outline doc — where tasks come from, how we keep them trustworthy.

---

## the contamination problem

> explain: why public benchmarks stop measuring capability

- [ ] models train on test data — mmlu, humaneval, gsm8k examples
- [ ] goodhart's law — optimize the metric, lose the signal
- [ ] why high public scores don't match real-world use
- [ ] slopmark's answer: novel tasks + behavioral verify + honest labeling

---

## task sources

> explain: three tiers of trust

| source | trust | label |
|---|---|---|
| seed | low-medium | public or hand-written starter set |
| community | medium-high | human-reviewed submission |
| original | high | verified novel, never public |

- [ ] what each tag means on the ui
- [ ] never pretend seed data is contamination-free

---

## task lifecycle

> explain: path from draft to live benchmark

- [ ] author writes task + verifier config
- [ ] verifier config validated (rules parse, tests run, schema valid)
- [ ] human reviewer checks clarity and fairness
- [ ] `approved: true` set in db
- [ ] task appears in `/api/tasks` and bench ui
- [ ] retirement / deprecation when gamed or stale

---

## writing good tasks

> explain: guidelines for task authors

- [ ] one clear objective per task
- [ ] constraints must be programmatically checkable (for auto domains)
- [ ] avoid ambiguous wording models can exploit
- [ ] difficulty gradient within a domain
- [ ] no trick questions that test parsing not capability
- [ ] examples of good vs bad task prompts (placeholders)

---

## community submission (planned)

> explain: how outsiders contribute without polluting the pool

- [ ] submission form / api shape
- [ ] review queue workflow
- [ ] rejection reasons (vague, unverifiable, duplicate, contaminated)
- [ ] attribution and license for contributed tasks

---

## hiding verifier config

> explain: why clients don't get full verifier json

- [ ] reduce gaming — models shouldn't see exact rules before run
- [ ] api returns prompt + id only
- [ ] verifier runs server-side only

---

## dataset honesty

> explain: transparency over marketing

- [ ] label seed tasks on bench ui
- [ ] publish methodology, not just scores
- [ ] document when we migrate from seed → community → original pool
