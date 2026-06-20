# how we bench

every eval runs the same four-step cycle: novel task → fixed harness → behavioral verifier → human quality gate. the order is non-negotiable. a weak verifier invalidates the whole pipeline regardless of how carefully the task was designed. a strong verifier run through a biased harness produces numbers that don't generalize across models.

---

## the four-step loop

**novel task.** the biggest failure mode in public benchmarking isn't bad scoring — it's bad tasks. when task content appears in training data, you're measuring retrieval, not capability. MMLU's questions leaked into pretraining corpora; models that score near-ceiling on it can't reason across 57 subjects, they recall answers. HumanEval function signatures and docstrings appeared in GitHub crawls used for code pretraining. GSM8K problem-answer pairs showed up in instruction-tuning datasets — contaminated models guessed missing answer options at 52-57% accuracy without seeing the original question. slopmark labels every task with its origin (`seed`, `community`, `original`) and never represents seed scores as contamination-proof.

**fixed harness.** every model gets identical conditions: same system prompt, 600 max tokens, temperature 0, through OpenRouter. no per-vendor prompt engineering, no chain-of-thought injection for certain models, no custom scaffolding for specific providers. when the harness varies per model, the leaderboard measures the tuning effort, not the model. any change to harness constants is a versioning event — scores before and after aren't comparable.

**behavioral verifier.** the verifier defines what correct means. for instruction-following tasks, that's deterministic rule checking. for code, it's hidden test execution. for math, it's symbolic equivalence. the verifier runs server-side only — clients receive the task prompt and an ID, never the scoring config. a verifier that can be reverse-engineered from the API response is gameable.

**human quality gate.** automated scorers can score outputs. they can't evaluate whether the task itself is well-designed. human review catches tasks where frontier and small models score identically (no discriminability), tasks with two defensible correct answers, and tasks that look novel but contain exact phrases from public datasets.

---

## what we avoid

**llm-as-judge.** models fine-tuned with RLHF systematically prefer longer, more confident outputs regardless of accuracy. specific attention heads in middle transformer layers become sensitized to stylistic patterns from training data — outputs resembling the judge's own style get rated higher than semantically equivalent alternatives. the verbosity bias and self-preference bias are real and quantifiable. slopmark doesn't use model-based scoring for any domain.

**static public test sets treated as ground truth.** MMLU, HumanEval, and GSM8K are all documented contamination cases. a benchmark that saturates because models memorized the test set isn't measuring anything. the correct response is to label contaminated sources honestly and build new tasks that aren't in circulation.

**per-model scaffolding.** giving one model a custom system prompt while another gets a different one compares scaffolding strategies, not models. same harness, every model, every run.

**structural matching when behavior is what matters.** the SWE-bench maintainer audit found a 24-point gap between automated test-pass rates and actual human merge decisions. code that passes unit tests while introducing regressions, violating style, or misaligning with architecture doesn't represent a solved task. behavioral correctness and test coverage are different things.

**leaderboard cosmetics without a real scoring layer.** arena-style preference rankings tell you what users chose in open-ended, uncontrolled conditions. they don't produce pass rates on specific capabilities under identical conditions. these are different measurements and shouldn't be compared.

---

## domains (rollout order)

| priority | domain | scorer | status |
|---|---|---|---|
| 1 | instruction follow | rule parser | live |
| 2 | json / tool use | ajv + schema validation | planned |
| 3 | math | exact match / sympy | planned |
| 4 | coding | judge0 hidden tests | planned |
| 5 | sycophancy / calibration | multi-turn adversarial | planned |
| 6 | multi-step state tracking | deterministic state comparison | planned |
| 7 | instruction hierarchy | rule-based precedence check | planned |
| 8 | refusal calibration | binary refusal checker | planned |
| 9 | writing | human review | later |
| 10 | swe / repo level | behavioral repo tests | later |

domains are ordered by verifier readiness. any domain where we can't define a deterministic scorer comes after those where we can. writing and swe come last because no clean deterministic scorer exists for them yet.

---

## harness defaults

system prompt: `"Follow the user instructions exactly. Output only what is asked, no preamble."`

- max_tokens: 600
- temperature: 0
- provider: OpenRouter (OpenAI-compatible SDK)
- logged per run: wall-clock latency, input tokens, output tokens, cost_usd

temperature 0 is a reproducibility requirement. at temperature > 0 the same task produces different outputs across runs, making score aggregation harder and giving high-variance models an artificial advantage in small-n evaluations.

---

## read next

- [domains](/docs/domains)
- [scoring & verifiers](/docs/judging)
- [tasks & contamination](/docs/tasks)
- [harness](/docs/harness)
- [metrics & leaderboard](/docs/metrics)
- [api](/docs/api)
