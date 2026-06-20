# scoring & verifiers

see also: [domains](/docs/domains), [harness](/docs/harness)

---

## core principle

auto-score when possible. human review when no objective ground truth exists. never use an LLM to judge another LLM's output.

the LLM-as-judge failure modes are documented and consistent: verbosity bias (longer responses rated higher regardless of accuracy), self-preference bias (models rate stylistically similar outputs higher than semantically equivalent alternatives), and measurement error propagation (the judge model's own inaccuracies add noise to every score it produces). the practical effect is that leaderboard rankings built on model-evaluated scores reflect the judge's preferences, not ground-truth capability.

latency and cost are logged alongside quality on every run. they're not quality metrics — a model that answers correctly in 3 seconds isn't better than one that answers correctly in 800ms just because it's slower. but the tradeoff matters for practitioners choosing models, so both dimensions surface on the leaderboard.

---

## verifier result shape

every verifier plugin returns the same contract:

```typescript
type VerifierResult = {
  passed: boolean      // all rules/tests satisfied
  score: number        // 0–100 normalized
  details: string      // human-readable breakdown
  rules?: RuleResult[] // per-rule pass/fail (instruction domain only)
}
```

the harness hands the verifier exactly one thing: the raw model output string. the verifier has no access to chat history, the task prompt, or harness configuration. pure function, no side effects, no external calls.

---

## plugin contract

- one file under `lib/verifiers/`
- dispatched by `verifier.type` in `lib/verifiers/index.ts`
- input: model output string + verifier config object
- output: `VerifierResult`
- stateless — same input always produces same output

---

## verifier types

### instruction_rules (live)

regex and counter checks against a list of constraint rules. partial scoring: rules_passed / total_rules × 100. each rule returns its own pass/fail with a human-readable message for debugging on the `/bench` console.

**edge cases to handle:**
- preamble stripping: models often prepend "Sure! Here is..." before the actual content. the verifier strips known preamble patterns before scoring — otherwise word-count and starts-with rules fail on valid outputs
- markdown wrappers: model wraps output in a code block when none was requested. strip fences before rule checks
- trailing newlines affecting line count: normalize before counting

---

### json_schema (planned)

AJV schema validation. structural errors (missing required fields, wrong types, malformed JSON) return `passed: false` with a specific error path. silent failures — valid JSON with logically inconsistent values — require custom invariant functions alongside the schema.

**failure taxonomy (empirical):**
- syntax errors: ~38% of all production agent JSON failures are parse-level (model produced invalid JSON)
- structural errors: wrong keys, wrong types, missing required fields — ~42% of failures
- silent/semantic failures: valid JSON, logically wrong values — ~20% of failures

syntax failures are immediate 0. structural errors can produce partial credit at the field level. semantic failures require invariant functions (e.g. "sum of all node capacities must equal 100").

**edge cases:**
- models sometimes wrap JSON in markdown fences (` ```json ... ``` `). strip standard fences before `JSON.parse`
- recursive schemas and complex `$ref` patterns cause some parsers to fail — validate any schema definition against AJV before deploying it
- some models produce trailing commas, which are invalid JSON. strip or reject explicitly

---

### exact_number (planned)

extract the final numeric answer from model output via regex (targeting the last number-like pattern, optionally prefixed by "answer:", "=", "is", or similar). compare against ground truth. route through SymPy for symbolic equivalence if the answer is a non-integer expression.

**SymPy limit:** Richardson's Theorem makes zero-equivalence undecidable for expressions containing nested trigonometric, exponential, or absolute value functions. SymPy's `simplify()` and `equals()` routines can hang or return incorrect results on valid but complex symbolic expressions. the Gruntz algorithm and Risch-Norman algorithm that SymPy uses for limits and integration hit fundamental decidability walls in the general case.

practical mitigation: set a 2-second timeout on SymPy evaluation. on timeout, fall back to numeric comparison with tolerance. flag problems where this fallback fires frequently — they may be underspecified or too complex to score reliably.

**edge cases:** models producing "x ≈ 3.14" when the answer is π, expressing integers in scientific notation, or including units in the answer string. normalize before comparison.

---

### code_exec (planned)

submit model output to Judge0 (or equivalent isolated sandbox). run hidden unit tests. pass = all tests green. partial score = tests_passed / total_tests.

**security requirement:** never execute model-generated code outside a sandboxed environment. model output can contain arbitrary shell commands, network calls, or file system operations. the sandbox must restrict all of these. timeout and memory limits must be enforced per-problem.

**known gap:** unit tests verify functional correctness, not efficiency. a model that passes all tests with an O(n³) algorithm on a problem that requires O(n log n) scores the same as an optimal solution. if efficiency matters for a specific task, add explicit complexity constraints to the problem spec and test for them.

**the maintainer gap:** SWE-bench found a 24-point difference between automated test-pass rates and human maintainer merge decisions. unit tests accept patches that introduce regressions, violate code style, or misalign with architecture. for function-level coding tasks this is less severe than for repo-level tasks — single functions have limited surface area for architecture violations. but it's worth knowing the limit.

---

### human_vote (planned)

for writing and creative tasks. reviewers score on three axes: clarity (is the writing coherent?), factuality (are verifiable claims correct?), instruction adherence (did the model follow all stated constraints?). absolute rubric scoring, not pairwise battle ranking.

minimum two reviews per task before a score is published. scores are averaged across reviewers. disagreements above a threshold flag the task for re-review — high reviewer disagreement usually means the task is ambiguous and should be revised.

---

## eval flow

```
load task → run harness → runVerifier → save eval_run → update leaderboard
```

paste mode (dev): skips the harness step. takes raw output string directly. latency and cost log as 0.

suite mode: runs all tasks in a domain for a single model. results aggregate to the leaderboard view under that model slug.

---

## rankings

- pass_rate = passed runs / total runs
- avg_score = mean of score across all runs
- sort: pass_rate descending, then avg_score descending
- minimum run threshold before ranking displays: 10 runs per model per domain (planned)

---

## what doesn't work

**embedding similarity (cosine, BERTScore, etc.):** sound appealing for open-ended scoring but introduce biases that are hard to characterize. the embedding model's own preferences propagate into scores. technically a form of model-based judgment. FrugalScore retains 96.8% of BERTScore's performance at 24x speed — but that's 96.8% of a biased signal, not 96.8% accuracy. use only as a last resort when no deterministic verifier exists and human review is unavailable.

**AST comparison as a code correctness proxy:** AST checks strip formatting variation and detect structural similarity. they're completely blind to runtime correctness. a single operator swap (`<` vs `<=`) produces similar ASTs but introduces a critical off-by-one error. swapping a recursive implementation for an iterative one that's functionally identical produces a completely different AST, triggering a false negative. AST is useful for anti-contamination checks (detecting memorized solutions), not for correctness scoring.

**averaging correlated task scores:** when multiple tasks share a source template, random seed, or reference document, their scores are correlated. treating them as independent inflates the effective sample size and underestimates variance by up to 35%. if 10 tasks were generated from the same template, treat them as ~4-5 independent observations for confidence interval calculations.

---

## anti-gaming rules

- verifier config is server-side only — clients receive task prompt and ID, never the scoring rules
- `approved: true` must be set before a task appears in the API
- rate limits on `/api/eval/run` prevent automated score farming (planned)
- no hidden test content or expected output is ever returned in API responses
- verifier runs after harness, never before — prevents any pre-run optimization based on score criteria
