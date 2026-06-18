# how we bench

> outline doc — sections below list what needs to be written, not the final copy.

slopmark is a benchmark base. this page is the entry point for how we score models.

---

## the spine

> explain: the 4-step loop every domain shares and why order matters

- [ ] define: novel task → fixed harness → behavioral verifier → human quality gate
- [ ] explain why a weak verifier makes the whole benchmark useless
- [ ] diagram the loop end-to-end (task in → score out)
- [ ] link to [deepswe](/docs/deepswe) for where this pattern came from

---

## what we avoid

> explain: anti-patterns that make benchmarks rot as models get smarter

- [ ] llm-as-judge — verbosity bias, self-preference, why we ban it
- [ ] public test sets treated as ground truth — contamination, memorization
- [ ] structural matching when behavior is what matters (gold diff vs tests pass)
- [ ] per-model scaffolding — different prompts/tools per vendor breaks comparability
- [ ] leaderboard cosmetics without a real scoring layer underneath

---

## domains (rollout order)

> explain: which categories we bench, in what order, and why

| priority | domain | scorer | doc status |
|---|---|---|---|
| 1 | instruction follow | rule parser | live |
| 2 | json / tool use | ajv | planned |
| 3 | math | exact / sympy | planned |
| 4 | coding | judge0 | planned |
| 5 | writing | human review | planned |
| 6 | swe | repo behavioral tests | later |

- [ ] one paragraph per domain on *why* it matters to devs
- [ ] link each row to [domains](/docs/domains) for per-domain detail
- [ ] note v0 = instruction follow only

---

## harness defaults

> explain: fixed conditions every model gets — non-negotiable for fair comparison

- [ ] system prompt (what it says, why no preamble)
- [ ] max output tokens (600) and why capped
- [ ] temperature 0 and reproducibility
- [ ] openrouter as single provider path
- [ ] what we log every run: latency, input/output tokens, cost
- [ ] link to [harness](/docs/harness) for full spec

---

## scoring instruction follow (v0)

> explain: how the live domain works today

- [ ] task shape: prompt + constraint rules in verifier config
- [ ] rule types supported (word count, paragraphs, forbidden text, etc.)
- [ ] pass = all rules pass; score = % rules passed
- [ ] why deterministic > llm for this domain
- [ ] example pass and fail with rule breakdown (placeholder for screenshots later)
- [ ] link to [judging](/docs/judging) for verifier contract

---

## read next

- [domains](/docs/domains) — per-category bench design
- [scoring & verifiers](/docs/judging)
- [tasks & contamination](/docs/tasks)
- [harness](/docs/harness)
- [api](/docs/api)
- [metrics & leaderboard](/docs/metrics)
- [architecture](/docs/architecture)
- [deepswe template](/docs/deepswe)
