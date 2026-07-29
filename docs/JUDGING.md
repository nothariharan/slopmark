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

### json_schema (live)

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

### exact_number (live)

extract the final numeric answer from model output via regex (targeting the last number-like pattern, optionally prefixed by "answer:", "=", "is", or similar). compare against ground truth as a normalized string/number match.

---

### code_exec (live)

run model output in an isolated python harness. prefer docker (`python:3.9-slim`, no network, memory/cpu caps). if docker is unavailable, fall back to local `python`/`python3`. on serverless without either, the verifier returns a clear skip failure instead of hanging.

**security:** never execute model-generated code without isolation when docker is present. local-python fallback is for developer machines only.

**known gap:** unit tests verify functional correctness, not efficiency. Judge0 / WASM remains a future hardening path for multi-tenant prod.

---

### human_vote (live)

for writing and creative tasks. word-bound checks run automatically; quality scoring goes through the `/review` queue. absolute rubric scoring, not pairwise battle ranking.

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
- minimum run threshold before ranking displays: `MIN_RUNS` (currently **3**) in `lib/types.ts`

---

## what doesn't work

**embedding similarity (cosine, BERTScore, etc.):** sound appealing for open-ended scoring but introduce biases that are hard to characterize. the embedding model's own preferences propagate into scores. technically a form of model-based judgment. FrugalScore retains 96.8% of BERTScore's performance at 24x speed — but that's 96.8% of a biased signal, not 96.8% accuracy. use only as a last resort when no deterministic verifier exists and human review is unavailable.

**AST comparison as a code correctness proxy:** AST checks strip formatting variation and detect structural similarity. they're completely blind to runtime correctness. a single operator swap (`<` vs `<=`) produces similar ASTs but introduces a critical off-by-one error. swapping a recursive implementation for an iterative one that's functionally identical produces a completely different AST, triggering a false negative. AST is useful for anti-contamination checks (detecting memorized solutions), not for correctness scoring.

**averaging correlated task scores:** when multiple tasks share a source template, random seed, or reference document, their scores are correlated. treating them as independent inflates the effective sample size and underestimates variance by up to 35%. if 10 tasks were generated from the same template, treat them as ~4-5 independent observations for confidence interval calculations.

---

## anti-gaming rules

- verifier config is server-side only — clients receive task prompt and ID, never the scoring rules
- `approved: true` must be set before a task appears in the API
- rate limits on eval / goal / arena / thunderdome / realshot routes (in-memory + cookie; KV/Upstash still preferred for multi-instance)
- no hidden test content or expected output is ever returned in API responses
- verifier runs after harness, never before — prevents any pre-run optimization based on score criteria
