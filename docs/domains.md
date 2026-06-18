# domains

> outline doc — what to explain for each benchmark category.

one page per domain family. same task shape everywhere, different verifier.

---

## shared shape (all domains)

> explain: BenchTask schema and what stays constant

- [ ] `id`, `domain`, `prompt`, `verifier`, `source`, `approved`
- [ ] verifier plugin contract — same `VerifierResult` everywhere
- [ ] harness runs identically before verifier runs
- [ ] how a domain plugs in = one verifier file + seed tasks

---

## instruction follow (live)

> explain: constrained text generation, fully auto-scored

- [ ] what makes a good instruction task (hard, verifiable, not subjective)
- [ ] rule types: word_count, paragraph_count, forbidden_substring, required_phrase, starts_with, ends_with, max_chars, line_count
- [ ] multi-rule combos and difficulty tiers
- [ ] edge cases: preamble stripping, markdown wrappers, empty lines
- [ ] seed set philosophy (hand-written, not ifeval dump)
- [ ] example task + verifier config (json snippet)
- [ ] known failure modes models hit

---

## json / tool use (planned)

> explain: structured output and function calling accuracy

- [ ] input: schema + task description
- [ ] scorer: ajv validation + field-level error count
- [ ] pass condition vs partial score
- [ ] bfcl-inspired specs as reference, not copy
- [ ] nested objects, optional fields, array constraints
- [ ] later: ast match for function-call payloads

---

## math & logic (planned)

> explain: numeric and symbolic answers

- [ ] extract final answer from prose (regex patterns)
- [ ] exact match vs sympy equivalence
- [ ] contamination strategy: variant problems, new numbers same logic
- [ ] when regex is enough vs when sympy worker is needed
- [ ] word problems vs pure logic puzzles

---

## coding — function level (planned)

> explain: short functions, hidden unit tests

- [ ] input: spec + signature + hidden tests
- [ ] judge0 sandbox flow
- [ ] pass = all tests pass
- [ ] label public datasets as possibly contaminated
- [ ] timeout, memory, language support
- [ ] difference from swe (single function vs repo)

---

## swe / repo level (later)

> explain: deepswe-style behavioral verification on real codebases

- [ ] issue + repo snapshot input
- [ ] behavioral verifier: tests pass, not patch match
- [ ] fixed agent harness (mini-swe-agent pattern)
- [ ] docker worker infra requirements
- [ ] why this is separate from function-level coding
- [ ] link to [deepswe](/docs/deepswe)

---

## writing & creative (planned)

> explain: subjective quality without llm-as-judge

- [ ] why no deterministic verifier exists
- [ ] human review rubric (not pairwise battle)
- [ ] axes: clarity, factuality, instruction adherence
- [ ] how tasks get approved before going live
- [ ] aggregation without elo/battle mechanics

---

## summarisation (later)

> explain: faithfulness vs coverage vs conciseness

- [ ] rouge as weak signal only
- [ ] human rubric preferred
- [ ] long-document input handling
- [ ] merge into writing domain or stay separate — decision needed

---

## image / multimodal (later)

> explain: scope and blockers

- [ ] generation: clip score vs human review
- [ ] understanding: vqav2-style exact match
- [ ] multimodal models on openrouter
- [ ] ui and infra blockers — skip for now rationale

---

## agentic / multi-step (later)

> explain: tool use over long horizons

- [ ] reference benchmarks: webarena, osworld, gaia (external only)
- [ ] sandbox requirements
- [ ] gaming risks and why we defer
- [ ] relationship to swe domain
