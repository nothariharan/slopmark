# tasks & contamination

---

## the contamination problem

public benchmarks stop measuring capability when models train on the test data. this isn't a theoretical concern — it has happened to every major public benchmark.

**MMLU:** question-answer pairs from MMLU appeared in web crawls used for pretraining. models scoring 90%+ on MMLU frequently fail on reformulations of the same questions with changed answer ordering or paraphrased options. the capability being measured is retrieval, not cross-domain reasoning.

**HumanEval:** function docstrings and problem descriptions from HumanEval appeared in GitHub crawls included in code training datasets. contaminated models produce correct implementations by recalling training examples. the score reflects exposure, not problem-solving skill.

**GSM8K:** grade school math problems from GSM8K appeared in instruction-tuning datasets. contaminated models guessed missing answer options at 52-57% accuracy without seeing the original question — a signal that answers were memorized, not computed.

the pattern is consistent: a benchmark goes public, it enters training pipelines, scores rise, the benchmark stops measuring anything. this is Goodhart's Law applied to model evaluation. once the metric is known, models optimize for it without necessarily improving the underlying capability.

slopmark's response: label every task with its origin, use procedural generation to create novel variants, gate evaluation tasks behind a human review process, and be honest that seed tasks are probably contaminated to some degree. the labeling is more useful than pretending the problem doesn't exist.

---

## task sources

| source | trust | label |
|---|---|---|
| seed | low-medium | hand-written or adapted starter set |
| community | medium-high | human-reviewed external submission |
| original | high | verified novel, never published publicly |

every task carries its source label visibly on the bench UI and in API responses. leaderboard views filter by source where relevant. a model achieving 95% on seed tasks and 40% on original tasks is a completely different story from 95% on both. the label makes that comparison possible.

never treat seed task scores as contamination-free. they aren't. label them and move on.

---

## task lifecycle

1. author writes task: prompt + verifier config
2. verifier config is validated: rules parse correctly, schemas are valid, test cases compile
3. human reviewer checks: is the task unambiguous? is there one correct answer? does it discriminate between model tiers?
4. `approved: true` is set in the database
5. task appears in `/api/tasks` responses and the bench UI
6. retirement when the task is gamed, stale, or confirmed contaminated

tasks with `approved: false` never appear in public API responses or leaderboard aggregates. the approval flag is a gate, not a default. a task that's been written but not reviewed is invisible to the platform.

---

## writing good tasks

**one clear objective.** the task should have a single correct answer or an enumerable set of correct answers. tasks with two defensible interpretations don't belong in an auto-scored domain — if a human reviewer can construct two valid responses that would score differently, the task needs to be rewritten.

**constraints must be programmatically checkable.** if you can't write the verifier rule before you write the task, the task isn't ready. "write a short response" isn't a constraint. "write a response under 80 words" is.

**difficulty should be real and discriminating.** a task where all models score 100% or all models score 0% provides no information about capability differences between models. before approving a task, test it against at least two models of different capability tiers and confirm the scores diverge. if a 7B model and a frontier model score identically, the task has no discriminability and should be rejected.

**avoid ambiguous wording.** models exploit ambiguity. "write a summary" doesn't specify length, format, or which facts to include. "write a summary in exactly 50 words that includes the name of the main subject" does.

**no trick questions.** the benchmark tests model capability, not parsing skill. a task that requires noticing a deliberate ambiguity in the phrasing, catching a hidden instruction embedded in the prompt structure, or interpreting an unusual formatting trick tests something other than the stated capability.

---

## anti-gaming techniques

**procedural parameterization** (highest leverage, lowest cost). generate task variants at runtime by populating templates with values drawn from randomized pools. the exact prompt changes per evaluation — models can't memorize the specific output needed because it didn't exist when they were trained. works for constraint sets, math problems, state-tracking sequences, JSON schemas. the hard benchmarks that have maintained signal longest (ARC-AGI, FrontierMath) use procedural or expert-crafted novel tasks, not fixed question banks.

**public vs private task splits.** keep evaluation tasks out of public repositories. a task that's been published is a task that can appear in fine-tuning data within weeks. slopmark's seed tasks are labeled as such and treated as possibly contaminated. evaluation-grade tasks — the ones that determine leaderboard rankings — should be procedurally generated per run or maintained behind an access gate that isn't the same as the public docs.

**paraphrase invariance testing (reliable@k).** re-evaluate each task with k rephrased variants of the same underlying question. require the model to pass all k variants for full credit. a model that passes one phrasing and fails a semantically equivalent one is showing surface-level pattern matching, not genuine capability. cost: increases API usage by a factor of k. start with k=3.

**timestamp-based novelty tagging.** tasks sourced after a model's knowledge cutoff date get a `novel: true` tag. the performance gap between novel and non-novel tasks for a given model is a contamination signal. a large gap (high on old problems, low on new ones) suggests old-problem scores are retrieval-inflated. small gaps suggest the model is actually reasoning.

**perplexity probing.** models that have seen benchmark content in training exhibit anomalously low token-level perplexity on partial benchmark prompt inputs. this requires access to model logits, which commercial API providers don't expose. applicable only to open-weight models running locally. useful for auditing open-source models before adding them to the pool.

**benchmark watermarking.** embed unique, non-obvious tokens or structural patterns in task prompts — patterns that wouldn't appear naturally but are detectable if a model reproduces them verbatim. if a model outputs the watermark string unprompted, it saw the task during training. still experimental, but useful for flagging blatant leaks.

---

## human review gate

the review queue exists to catch what automated validation misses.

**discriminability check.** run the submitted task against a frontier model and a smaller model before approving. if both score identically (both pass or both fail), the task has no discriminatory power. reject it and ask the author to increase difficulty or redesign.

**contamination check.** fuzzy string match against known public benchmark datasets (MMLU, HumanEval, GSM8K, BIG-Bench, etc.) and against public web crawl samples. tasks with high n-gram overlap with existing benchmarks get flagged. tasks from known benchmark sources get rejected outright — they're marked contaminated at submission.

**output validation.** the task must have a single, unambiguous correct output determinable without running the model. if a reviewer needs to see the model's output to judge correctness, the verifier is insufficient for that task's domain and the task should move to a human-review domain (writing) or be redesigned.

rejection reasons logged for every rejected submission: vague (multiple valid interpretations), unverifiable (no deterministic scorer possible), duplicate (semantically equivalent to an existing task), contaminated (fuzzy match hit on known benchmark data).

---

## hiding verifier config

clients receive task prompt and task ID. they never receive the verifier config — the scoring rules, the expected answer, the schema, the test cases.

this is enforced at the API layer: `/api/tasks` returns `{ id, domain, prompt, source }`. the verifier config lives in the database and is accessed only by the eval engine at score time.

why: a model that knows the exact rule set before generating can optimize for the rules rather than the task. this doesn't require adversarial fine-tuning — a model running at inference time that can "see" the word-count constraint will produce outputs that hit the target count by adjusting generation, not by following the instruction correctly.

---

## dataset honesty

slopmark publishes methodology, not just scores. the docs explain exactly how each domain is scored, what the verifier checks for, and what the contamination risk level is for each source tier.

when the evaluation data migrates from seed to community to original pool, that's documented as a versioning event. scores from different pool compositions aren't silently merged — they're labeled with which pool they came from.

the honest position on the current state: the seed tasks in `data/tasks/instruction.json` are a starting point. they're hand-written and not copies of known benchmarks, but they've been published in this repository. treat them as potentially contaminatable and weight original-source scores more heavily when comparing models.
