# harness

the harness is the fixed execution environment every model runs through. it isolates model capability from scaffolding quality. when the harness varies per model, the leaderboard measures the tuning effort, not the model.

---

## why fixed matters

the SWE-bench maintainer audit is the clearest evidence of what happens without a fixed harness. when different scaffolding strategies were applied to different model families, the apparent performance gap between models partly reflected those scaffolding differences, not underlying capability. automated test-pass rates diverged from maintainer merge decisions by 24 percentage points — a gap that's partly explained by evaluation conditions varying per model.

slopmark holds the harness constant across all models. every model gets the same system prompt, the same generation parameters, the same provider path. if you're comparing model A to model B, the only variable is the model.

a second reason is reproducibility. the same task run twice with the same model under the same harness should produce the same result. temperature 0 is a prerequisite for this. at non-zero temperature, you're measuring a distribution of outputs, not a consistent capability level.

any change to harness constants is a versioning event. scores from before and after a harness change aren't on the same scale and shouldn't be combined in the same leaderboard view.

---

## system prompt

```
Follow the user instructions exactly. Output only what is asked, no preamble.
```

no chain-of-thought injection. no "you are a helpful assistant" framing. no per-domain additions.

the "no preamble" clause exists because rule-based verifiers fail on valid outputs that are wrapped in polite lead-ins. if a model outputs "Sure! Here is your response: ..." before the actual content, word-count rules, starts-with rules, and character-cap rules all misfire on otherwise correct outputs. suppressing preamble at the harness level is cleaner than building workarounds into every verifier.

chain-of-thought is excluded from the harness intentionally. CoT injection would benefit some model families more than others, introducing a systematic advantage that has nothing to do with the underlying capability being measured. if a task explicitly asks for step-by-step reasoning as part of the output, that's a task-level instruction. it's not baked into the harness.

---

## generation parameters

| param | value | reason |
|---|---|---|
| max_tokens | 600 | bounds cost, keeps tasks focused, eliminates padding |
| temperature | 0 | reproducibility across runs |
| top_p | provider default | not set explicitly |

600 token cap is a deliberate constraint on task design. tasks requiring longer outputs don't belong in the eval suite at this stage. the cap also makes worst-case cost per run predictable.

when a model ignores the token cap (some do), the verifier receives the full output. the verifier doesn't enforce the token budget — it scores what it receives. this is intentional: a model that produces a correct 800-token output when 600 was the cap isn't being penalized for correct content.

---

## provider path

all models run through OpenRouter using the OpenAI-compatible SDK. one API key, one endpoint, the same request format for every model slug.

current model pool (`lib/models.ts`):

| slug | tier |
|---|---|
| `anthropic/claude-3.5-haiku` | frontier small |
| `openai/gpt-4o-mini` | frontier small |
| `meta-llama/llama-3.1-8b-instruct` | open 8B |
| `mistralai/mistral-7b-instruct` | open 7B |
| `qwen/qwen-2.5-7b-instruct` | open 7B |

adding a model doesn't change the harness — add the slug to `lib/models.ts`. removing a model doesn't invalidate historical runs. existing scores persist with the original model slug.

paste mode (dev): when `OPENROUTER_API_KEY` is not set, `/bench` accepts a raw model output paste and scores it directly. latency logs as 0, cost logs as 0. useful for testing verifiers without API credits.

---

## per-run logging

every eval run captures:

| field | source |
|---|---|
| latency_ms | wall clock: request sent → first byte received |
| input_tokens | from OpenRouter response header |
| output_tokens | from OpenRouter response header |
| cost_usd | from OpenRouter response (when provider exposes it) |
| model_slug | from request |
| task_id | from request |
| timestamp | server time at run start |

not yet logged: time to first token (TTFT), tokens per second. these require streaming mode, which the current harness doesn't use.

cost is a first-class output, not a footnote. the leaderboard shows cost alongside pass rate. a model achieving 88% pass rate at $0.001/run and one achieving 90% at $0.05/run are different value propositions. the data to distinguish them should be surfaced, not hidden.

paste mode runs log 0 for latency and cost and are excluded from leaderboard latency/cost aggregates.

---

## harness vs verifier boundary

the harness produces exactly one thing: the raw model output string.

the verifier receives that string and the task's verifier config. it knows nothing about the prompt, the system message, or the chat history.

this boundary is maintained deliberately. it means:

- the same verifier code scores both live API outputs and pasted outputs identically
- verifiers are independently testable with static strings, no OpenRouter dependency
- verifier bugs can't access or manipulate harness state
- the eval flow is auditable: harness output goes in, verifier result comes out

---

## future: domain-specific extensions

some domains require more than a prompt-in / output-out flow:

**coding:** task provides a function spec, hidden unit tests run in a sandbox. the harness extension passes function output to Judge0. still fixed — every model gets the same test suite.

**swe / repo level:** requires a standardized agent loop (mini-swe-agent pattern). the "harness" here is the agent binary + Docker environment. keeping this fixed is what makes SWE results comparable across models — not the model's own scaffolding choices.

**json / tool use:** optional `response_format` hint in the user prompt (not system prompt) is acceptable. this aligns with how these models are actually used in production and doesn't change the fundamental harness constants.

any extension that changes conditions per model is not a harness extension — it's a different evaluation and shouldn't be mixed with fixed-harness results.
