# Deep Research Brief: Next-Generation AI Benchmarking Methods

## Context (read before researching)

This brief is for a deep research agent investigating what actually works in AI benchmarking — specifically, what capability gaps modern LLMs still have that can be measured objectively, and what scoring/verifier designs hold up as models get stronger.

The output of this research will directly inform the build roadmap for **slopmark**, an open AI benchmark platform. Slopmark's existing principles:
- No LLM-as-judge (verbosity bias, self-preference)
- Fixed harness (same system prompt, same max_tokens, same temperature for all models)
- Deterministic or near-deterministic verifiers only
- Contamination awareness (tasks labeled seed vs community, human review gate)
- Cost is a first-class metric alongside quality

Current live domain: instruction-following (rule-based: word count, paragraph count, forbidden substrings, etc.)

Planned domains: JSON/tool-use, math, coding, writing, SWE.

The research should help expand and deepen all of these with real findings about where models fail and how to detect that failure objectively.

---

## Research Mission

Answer: **What benchmarking tasks and scoring methods actually surface real model weaknesses in 2025–2026, resist contamination, and can be verified without an LLM judge?**

This is not a survey of existing leaderboards. It is an investigation into the mechanics of good benchmark design, the specific capability gaps that remain hard for frontier and mid-tier models, and concrete task patterns that can be implemented.

---

## Research Questions (investigate all of these)

### 1. Contamination-Resistant Task Design

- What makes a benchmark task hard to contaminate? (parameterization, procedural generation, private test sets, dynamic tasks, novel format)
- How do LiveCodeBench, BIG-Bench Hard, ARC-AGI, FrontierMath, and SWE-bench approach contamination resistance? What works and what fails?
- What is the difference between a task that tests memorization vs. a task that tests capability? How do you operationalize that distinction?
- What are the known contamination failure modes of MMLU, HumanEval, GSM8K, and HellaSwag? What specifically broke them?
- Can procedurally generated tasks (parameterized math, shuffled code logic, synthetic instruction stacks) prevent contamination at scale? What are their limits?

### 2. Capability Gaps That Persist in 2025–2026

Focus on capabilities where **even strong frontier models (GPT-4o, Claude 3.5+, Gemini 1.5+)** still have measurable failure rates, and especially where **smaller/cheaper models (7B–70B)** diverge sharply from frontier.

Investigate each of these:

**Instruction Following (beyond simple rules)**
- Multi-constraint composition: what happens when 4–8 constraints must all be satisfied simultaneously? Where does the failure rate spike?
- Constraint negation: "do not use passive voice, do not use the word 'the', do not start any sentence with 'I'" — how do models handle negation chains?
- Underspecified constraints: when a rule is ambiguous, do models ask for clarification or hallucinate an interpretation?
- Priority conflict: when two constraints contradict each other, how do models behave?
- Persistent constraints across multi-turn: does a constraint given in turn 1 survive 10 turns later?
- What is the relationship between constraint count and compliance rate? At what constraint count do frontier models break?

**Format and Schema Adherence**
- JSON output with deep nesting, required fields, specific types — how often do models produce structurally invalid JSON? How often valid JSON but wrong schema?
- Tool call schema: function name typos, wrong argument types, missing required fields, hallucinated optional fields
- Structured output under adversarial conditions: what if the task prompt itself contains JSON that the model might copy? What if the instructions conflict with the schema?
- What is the actual failure taxonomy for JSON output? (malformed, extra fields, missing fields, wrong types, hallucinated keys — what frequency?)

**Mathematical Reasoning**
- What categories of math still trip frontier models? (multi-step arithmetic, combinatorics, modular arithmetic, geometric proofs, inequality reasoning)
- FrontierMath: what was the pass rate on this benchmark for frontier models? What categories of problems failed most?
- Does symbolic math (CAS-verifiable answers) degrade at higher difficulty? Where is the cliff?
- What is the difference in performance between "solve step by step" and "give only the final answer"? Does chain-of-thought actually help on novel problems?
- How do models perform on math problems that require holding and updating state across many steps (e.g., 20-step algebra, recursive sequences)?

**Code Generation and Debugging**
- LiveCodeBench: what is the actual pass rate for frontier models? What categories fail?
- What distinguishes a coding problem that benchmarks well from one that is contaminated?
- How do models perform on code debugging vs. code generation? Which is harder?
- What about code correctness under adversarial constraints (e.g., "solve this without using recursion", "solve in O(n log n)")?
- How do models handle incomplete specs (missing edge cases)? Do they ask or hallucinate?

**Long-Context and Multi-Step Reasoning**
- At what context length does reasoning accuracy degrade measurably? What is the "lost in the middle" failure pattern?
- Multi-hop reasoning: how does accuracy drop as the number of reasoning hops increases?
- Temporal reasoning and ordering: do models struggle with event sequences, causal chains, counterfactuals?
- What are the best tasks for surfacing long-context failures without requiring 128k tokens?

**Calibration and Uncertainty**
- Do models know when they don't know? What benchmarks measure calibration (confidence vs. accuracy)?
- What is the sycophancy rate under adversarial pressure? If you tell a model its answer is wrong (when it isn't), how often does it capitulate? How does this vary by model?
- What specific phrasings reliably induce sycophantic reversals?

**Consistency and Paraphrase Invariance**
- If you rephrase the same question 5 ways, how often does a model give a different answer? How does this vary by domain?
- What is the practical failure mode here and can it be measured objectively?

**Agentic and Tool-Use Chains**
- Multi-turn tool use: how does accuracy degrade when a task requires 5+ tool calls with error recovery?
- What is the actual reliability of function-calling APIs under varied tool schemas?
- Do models propagate errors through tool chains or catch and recover?

### 3. Verifier and Scoring Design

- What are all known classes of deterministic or near-deterministic verifiers that do not require an LLM judge?
  - Exact match, regex match, AST comparison, unit tests, type checkers, schema validators (AJV), symbolic math verifiers (SymPy/Mathematica), formal proof checkers
  - What are each one's limits?
- What is the gold standard approach for scoring partial credit on structured outputs (JSON, code, math)?
- How do you score consistency across paraphrase variants without an LLM judge?
- What is the best-practice design for a rubric that a non-LLM can evaluate?
- Are there embedding-based similarity metrics that are both reliable and bias-free? What does the research say?
- How do platforms like Eleuther AI LM Eval Harness, BIG-Bench, and HELM structure their verifier layer? What patterns work best?

### 4. Anti-Gaming and Benchmark Integrity

- What does "teaching to the test" look like for LLMs? How do models overfit to benchmark style even without direct data contamination?
- What are the known techniques for detecting if a model has been trained on benchmark data? (n-gram overlap, perplexity spikes, memorization probing)
- How can task parameterization prevent gaming while keeping tasks equivalent in difficulty?
- What is the minimum viable approach to task watermarking or fingerprinting?
- How do ARC-AGI and FrontierMath keep tasks private while allowing public leaderboards?
- What does a human review queue for task submission need to catch to prevent benchmark degradation?

### 5. Novel/Underexplored Benchmark Domains

What capability domains are measurably important, largely unbenchmarked (or benchmarked badly), and can be scored without an LLM judge?

Candidates to investigate:
- **Constraint satisfaction** (satisfying N simultaneous constraints across domains)
- **Format-aware generation** (markdown, LaTeX, code blocks, structured prose — compliant vs. non-compliant)
- **Error recovery** (given broken input, produce correct output without hallucinating)
- **Schema inference** (infer a schema from examples, then produce conforming output)
- **Refusal calibration** (tasks the model should refuse vs. tasks it shouldn't — false positive and false negative refusals)
- **Compression tasks** (summarize to exact N words while preserving specific named entities)
- **Instruction precedence** (system prompt says X, user says Y — does the model respect precedence correctly?)
- **Adversarial format injection** (task contains embedded format instructions designed to override the real instructions)
- **Multi-language instruction following** (instructions in one language, output in another)

For each candidate: what is the current state of benchmarking in this area, what is the known model failure rate, and can it be scored deterministically?

### 6. Benchmark Platform Design

- How does Arena (LMSYS Chatbot Arena / lmarena.ai) produce signal that other benchmarks miss? What are its specific blind spots?
- How does Scale AI's SEAL leaderboard approach private vs. public task splits?
- What is the minimum task count per domain to produce statistically reliable rankings? What is the confidence interval math?
- How should a benchmark handle model version drift (same model slug, updated weights)?
- What is the industry standard for minimum run count before a leaderboard ranking is considered valid?
- How do you measure and display cost-efficiency (quality per dollar) in a way that is meaningful to practitioners?

---

## Specific Things to Find

For each of the following, return concrete data, not general statements:

1. **The exact constraint count at which frontier models start failing instruction-following tasks** — find a paper or empirical study that pins this number.
2. **FrontierMath pass rates** by category and model — find the actual published numbers.
3. **SWE-bench verified vs. unverified pass rates** and what distinguishes the hard instances.
4. **ARC-AGI 2 failure patterns** — what types of tasks still fail post-o3?
5. **The sycophancy reversal rate** for major models under adversarial pressure — find published numbers.
6. **LiveCodeBench current leaderboard** — what models pass what percentage, and what task categories remain hard?
7. **The "lost in the middle" phenomenon** — find the original paper and its key quantitative finding.
8. **JSON schema adherence failure taxonomy** — find empirical data on which failure types are most common.
9. **MMLU contamination evidence** — find the specific papers or analyses that documented this.
10. **IFEval benchmark design** — how does it structure multi-constraint instruction following? What are its scoring rules?

---

## Output Format

Return a structured report with the following sections:

### Section 1: Capability Gap Map
A table or structured list: capability → known failure rate or evidence → best existing benchmark for it → deterministic verifier approach → contamination risk.

### Section 2: Verifier Design Patterns
For each verifier class (exact match, schema validation, symbolic math, unit tests, rule-based, etc.): strengths, weaknesses, what domains it covers, known edge cases that break it.

### Section 3: Benchmark Domain Recommendations for Slopmark
Concrete recommendations for 5–8 new or expanded domains with:
- Why this domain surfaces real model weaknesses
- How to design tasks that resist contamination
- What the verifier looks like (pseudocode or description)
- Difficulty tiers (easy/medium/hard task examples)
- Estimated task count needed for statistical reliability

### Section 4: Anti-Gaming Techniques
Ranked by implementation cost vs. effectiveness. Concrete techniques, not principles.

### Section 5: Things That Don't Work
Benchmark approaches, verifier types, or domain choices that seem good but empirically fail. What to avoid and why.

### Section 6: Open Research Questions
What is genuinely unknown in this space — questions where the research is actively contested or where no good solution exists yet.

---

## Research Depth and Sources

- Prefer primary sources: arXiv papers, official benchmark papers, empirical evaluations with numbers.
- Acceptable: detailed blog posts from AI labs (Anthropic, OpenAI, DeepMind, EleutherAI, Scale AI) with empirical backing.
- Avoid: opinion pieces, benchmark marketing copy, leaderboard summaries without methodology.
- For every major claim, note the source and whether it is from a controlled study or an informal report.
- Where numbers conflict across sources, note the conflict and give the range.

Cover the period 2023–2026. Earlier foundational work is relevant if it explains something still in use.

---

## Constraints

- Do not suggest LLM-as-judge as a scoring method. The platform explicitly does not use it.
- Focus on verifiable, measurable capability gaps — not vibes about what models are good or bad at.
- Every domain recommendation should come with a verifier design, not just a task idea.
- Keep the practical constraint: slopmark runs evals server-side through OpenRouter with max_tokens=600 and temperature=0. Tasks that require 4096-token outputs or non-deterministic scoring are lower priority.
