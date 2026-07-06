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

## why current benchmarks actually lie

it's not that the benchmarks are poorly designed. some of them started out rigorous. the problem is what happens after publication.

**the lifecycle of a contaminated benchmark:**

1. benchmark publishes test set publicly (papers, GitHub, Hugging Face)
2. test set enters the web — blog posts, forums, social media cite specific questions and answers
3. web crawl picks up those pages, gets included in next training run
4. model trains on benchmark answers without knowing it
5. benchmark score rises without the underlying capability improving
6. maintainers notice when the benchmark saturates — all models score 90%+ — but by then it's already being cited as evidence of capability

this played out visibly with MMLU. the benchmark was designed to cover 57 subjects and test real cross-domain reasoning. it published in 2021. by 2023, models were scoring 87%+ on subjects where the same models couldn't actually solve novel problems in the domain. the signal that broke it: give a model a question from MMLU with the answer choices removed and just ask it to answer. contaminated models guess at the correct option at rates far above chance — because they saw question-answer pairs, not just questions. that's retrieval, not reasoning.

HumanEval broke the same way but faster. function signatures and docstrings from HumanEval showed up in GitHub crawls that became part of code pretraining. the tip-off: a model producing a correct solution to an HumanEval problem but unable to write a semantically equivalent function with a renamed parameter or shuffled variable names. it remembered the specific implementation, not the problem-solving approach.

GSM8K's contamination signature was the most concrete. researchers found that models would guess the missing final number in a GSM8K problem at 52-57% accuracy even when the problem statement was cut off mid-sentence — far above the 14% chance rate for multiple-choice. the model wasn't solving the problem; it was pattern-matching on partial input to recall the stored answer.

**what this means in practice:**

a model that was trained after a benchmark published scores are inflated by an unknown amount. no one knows the contamination level because model developers don't publish training corpus details at that granularity. the "contaminated vs clean" performance gap is real and measurable — models typically score 15-30 percentage points higher on benchmarks than on semantically equivalent novel tasks — but the exact gap per model per benchmark isn't published.

slopmark's position: label honestly, build tasks that can't be memorized, and don't pretend the problem is solved.

---

## the behavioral benchmark approach

the four-step eval loop tests structured outputs against objective criteria. that's the right method for systematic capability measurement. but there's a class of model weakness that surfaces most clearly when you watch a model work in real time, not in a batch report.

the `/goal` section runs on this premise: build short challenges around documented failure modes and see whether a given model fails on your specific instance, right now.

a time arithmetic problem generated at runtime — start 11:45 AM, add 2 hours and 35 minutes — was never in any training dataset. the specific instance is always novel. a calendar hop question with 237 days cannot have been memorized. letter counts over arbitrary sentences are trivially correct in JS and consistently wrong for a model that tokenizes rather than reads character by character. these aren't random tasks. they're targeted at exact mechanisms where models fail:

- **tokenization artifacts:** letter counting, palindrome detection, anagram solving — all require character-level access that tokenized models don't have natively. models construct an approximation from token statistics, and that approximation fails predictably on edge cases.
- **modular arithmetic:** direction tracking and calendar hop require applying mod-N arithmetic over a chain of operations. models usually get the first few steps right but accumulate errors as chain length grows — the "lost in the middle" effect applied to arithmetic.
- **sycophancy under live pressure:** roulette puts you in the role of the adversarial user. you see exactly what phrasing makes the model cave. the benchmark suite measures average cave rates; the game shows you the mechanism.
- **AM/PM and carry-over arithmetic:** time arithmetic requires tracking unit boundaries (60 minutes → 1 hour, 12 PM → 12 AM transitions). models trained on prose representations of time get this wrong at rates that surprise people who assume models are good at arithmetic.

what the behavioral probes provide that the formal pipeline doesn't: you personally know the correct answer and can watch the model get it wrong. that closes a loop that batch scores don't. a model with a 73% pass rate on instruction tasks is an abstraction. a model that can't tell you whether "defied" is a palindrome is a concrete observation.

these are complements, not substitutes. the formal eval tracks capability across many tasks with statistical reliability. the behavioral probes let you probe specific failure modes interactively before deciding whether to trust a model in a context where that failure mode matters.

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
