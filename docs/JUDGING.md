# scoring & verifiers

> outline doc — how pass/fail works and how to add a new scorer.

see also: [domains](/docs/domains), [harness](/docs/harness)

---

## core principle

> explain: one rule for choosing judge type

- [ ] auto-score when possible
- [ ] human review when no objective ground truth
- [ ] never llm-as-judge
- [ ] latency + cost logged alongside quality (not as quality)

---

## verifier result shape

> explain: contract every plugin must return

```typescript
VerifierResult = { passed, score, details, rules? }
```

- [ ] `passed` — all rules/tests pass
- [ ] `score` — 0-100 normalized
- [ ] `details` — human-readable breakdown for debugging
- [ ] `rules` — per-rule pass/fail for instruction domain

---

## plugin contract

> explain: how to add a domain scorer

- [ ] file under `lib/verifiers/`
- [ ] dispatch in `lib/verifiers/index.ts` by `verifier.type`
- [ ] same input: model output string + verifier config
- [ ] no side effects inside verifier (pure function)
- [ ] stub pattern for not-yet-built domains

---

## per-type reference

> explain: one subsection each — link to [domains](/docs/domains) for depth

### instruction_rules (live)
- [ ] rule types and check logic
- [ ] partial scoring math
- [ ] example failure messages

### json_schema (planned)
- [ ] ajv setup, error counting, pass threshold

### exact_number (planned)
- [ ] extraction regex, sympy path, tolerance rules

### code_exec (planned)
- [ ] judge0 request shape, timeout, pass = all tests green

### human_vote (planned)
- [ ] rubric fields, aggregation, no battle flow

---

## eval flow

> explain: server path from api to persisted result

- [ ] load task → run harness → runVerifier → save eval_run → update leaderboard
- [ ] paste mode for dev (skip harness)
- [ ] suite mode: all tasks for one model

---

## rankings

> explain: how scores roll up

- [ ] pass rate per model per domain
- [ ] avg score, avg latency, avg cost
- [ ] sort order on leaderboard
- [ ] minimum runs before ranking counts (planned)

---

## anti-gaming

> explain: integrity rules

- [ ] approved flag on tasks
- [ ] server-side verifier only
- [ ] rate limits on eval api (planned)
- [ ] no publishing hidden tests in api responses
