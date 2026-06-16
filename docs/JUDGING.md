# JUDGING.md â€” How Arena Scores and Picks Winners


This document explains how Arena decides pass/fail, picks battle winners, and updates rankings. It covers verifier types, human voting, anti-bias rules, and what gets logged on every run.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [deepswe.md](./deepswe.md), [PLAN.md](./PLAN.md)

---

## The Core Principle

Arena does **not** use a single judge for everything. Judging is split by domain:

| When possible | When not possible |
|---|---|
| **Deterministic verifiers** â€” programmatic pass/fail | **Human blind voting** â€” community picks the better output |
| No LLM-as-judge | Bradley-Terry ELO from pairwise votes |

The rule: **auto-score when you can; human vote when you must.** LLM-as-judge is avoided because it favors verbose, markdown-heavy, GPT-style outputs and is not neutral.

Every run also logs **latency** and **cost** â€” those are not â€œjudgesâ€ for quality, but they are first-class metrics on every result and the leaderboard.

---

## The DeepSWE Judging Spine

All domains follow the same four-step pattern (from DeepSWE):

```
novel task  â†’  fixed harness  â†’  behavioral verifier  â†’  human quality gate
```

| Step | Role in judging |
|---|---|
| **Novel task** | Reduces contamination â€” models can't memorize the test |
| **Fixed harness** | Same system prompt, token cap, and tools for every model â€” leaderboard reflects model capability, not scaffolding |
| **Behavioral verifier** | Checks whether output *works*, not whether it matches one gold patch or structure |
| **Quality gate** | Human review before a task enters the live pool |

For coding/SWE, â€œbehavioralâ€ means hidden tests pass. For instruction follow, it means constraints are met. For writing, there is no objective verifier â€” humans judge preference instead.

---

## Unified Task Shape

Every judged task uses the same schema. Only the verifier config changes.

```typescript
ArenaTask = {
  id: string
  domain: "swe" | "coding" | "math" | "json" | "instruction" | "writing"
  prompt: string
  metadata?: object
  verifier: VerifierConfig
  source: "seed" | "community" | "deepswe"
  approved: boolean
}
```

Every verifier returns the same result shape:

```typescript
VerifierResult = {
  passed: boolean
  score: number      // 0â€“100 normalized
  details: string    // human-readable explanation
}
```

---

## Verifier Types

### 1. `code_exec` â€” Coding & SWE

**Domains:** function-level coding (MVP), repo-level SWE (later)

| Field | Detail |
|---|---|
| **Input** | Problem spec + function signature (coding) or issue + repo snapshot (SWE) |
| **Output** | Runnable code or patch |
| **Judge** | Sandboxed execution against hidden test cases |
| **Pass condition** | All hidden tests pass |
| **Implementation** | Judge0 API (MVP) â†’ Docker worker (complex cases) |
| **Plugin** | `lib/verifiers/code-exec.ts` |

**Behavioral, not structural:** A solution passes if it implements the requested behavior. Different file structure or refactor strategy is fine â€” same idea as DeepSWE verifiers vs SWE-bench gold-diff matching.

**SWE (later):** Fixed agent harness (mini-swe-agent pattern). Verifier runs project tests; patch shape does not matter.

---

### 2. `exact_number` â€” Math & Logic

**Domain:** math, numeric logic puzzles

| Field | Detail |
|---|---|
| **Input** | Word problem or logic puzzle |
| **Output** | Numeric or symbolic answer |
| **Judge** | Extract final answer from model output â†’ compare |
| **Pass condition** | Exact match, or SymPy equivalence for symbolic answers |
| **Implementation** | Regex extraction first; SymPy in Python worker when needed |
| **Plugin** | `lib/verifiers/exact-number.ts` |
| **Extra API cost** | None â€” local parsing only |

---

### 3. `json_schema` â€” JSON & Tool Use

**Domain:** structured output, function calling

| Field | Detail |
|---|---|
| **Input** | JSON schema + task description |
| **Output** | JSON object or function-call payload |
| **Judge** | Schema validation + field-level error count |
| **Pass condition** | Valid against schema; score reflects number/severity of field errors |
| **Implementation** | Ajv (JSON Schema validator) |
| **Plugin** | `lib/verifiers/json-schema.ts` |
| **Later extension** | AST match for Berkeley BFCL-style function calling |

---

### 4. `instruction_rules` â€” Instruction Following

**Domain:** constrained text generation

| Field | Detail |
|---|---|
| **Input** | Prompt with hard, verifiable constraints (e.g. â€œexactly 3 paragraphs, no letter *e*â€) |
| **Output** | Constrained text |
| **Judge** | Deterministic rule parser |
| **Checks** | Word count, paragraph count, forbidden words, required phrases, format rules |
| **Pass condition** | All constraints satisfied |
| **Implementation** | Programmatic string parsing â€” no LLM |
| **Plugin** | `lib/verifiers/instruction.ts` |

This is the **first auto-scored domain** planned for implementation â€” easiest to ship and hardest to game.

---

### 5. `human_vote` â€” Writing & Creative

**Domain:** writing (live today in the original app design), summarisation (post-MVP)

| Field | Detail |
|---|---|
| **Input** | Open prompt or long document |
| **Output** | Prose or summary |
| **Judge** | Blind human pairwise vote (A / B / tie) |
| **Ranking** | Bradley-Terry ELO per model |
| **Anti-bias** | Model names hidden until vote is cast |
| **Plugin** | Battle flow + `lib/elo.ts` â€” no programmatic verifier |

There is no objective ground truth for creative quality. Community preference over many battles produces a stable ranking â€” same approach as Chatbot Arena, with Bradley-Terry instead of simple Elo for better confidence intervals.

**Summarisation (post-MVP):** ROUGE as a weak automatic signal optional; human vote preferred for faithfulness and coverage.

---

## Two Judging Flows

### Flow A â€” Auto-scored evaluation

Used for: instruction follow, JSON, math, coding, SWE.

```
Load ArenaTask (approved, from DB)
  â†’ Call model via OpenRouter
      fixed system prompt
      max 600 output tokens
      same config for every model
  â†’ runVerifier(modelOutput, task.verifier)
  â†’ VerifierResult { passed, score, details }
  â†’ Persist result + latency + token count + cost
  â†’ Update domain leaderboard
```

No human required. Head-to-head battles between two models on the same task are optional â€” winner = higher score or pass vs fail.

---

### Flow B â€” Human battle (writing)

Used for: writing and other preference domains.

```
POST /api/battle/new
  â†’ Pick 2 random models from pool (names stay server-side)
  â†’ Pick prompt (user custom or seed)
  â†’ Return { battleId, prompt } only â€” no model identities

POST /api/battle/stream (slot A)  â”€â”
POST /api/battle/stream (slot B)  â”€â”¤ parallel OpenRouter SSE
  â†’ Stream tokens to UI
  â†’ Log latency, tokens, cost per slot

User votes: A wins | B wins | tie
  â†’ POST /api/battle/vote
  â†’ Update Bradley-Terry ELO (K=32)
  â†’ Reveal model names + ELO delta
  â†’ Leaderboard updates (Supabase Realtime when wired)
```

The **human is the judge**. The platform only enforces blindness, records the vote, and updates ratings.

---

## Head-to-head on auto-scored domains

When two models run the same auto-scored task:

| Outcome | Winner |
|---|---|
| One passes, one fails | Pass wins |
| Both pass | Higher normalized score (0â€“100) |
| Both fail | Tie, or higher partial score if scored |
| Identical outcome | Tie |

Same fixed harness applies to both â€” no per-model tuning.

---

## ELO and Rankings

### Human domains (writing)

- **Model:** Bradley-Terry pairwise preference
- **K-factor:** 32
- **Initialization:** All models start at 1000 (or seeded from known rankings â€” TBD)
- **Input:** Blind A/B/tie votes from battles
- **Output:** Per-model ELO on leaderboard; history in `elo_history` table

Bradley-Terry is used instead of classic Elo because it handles pairwise choice probabilities more stably and supports meaningful confidence intervals as battle count grows.

### Auto-scored domains

- **Primary metric:** Pass rate and/or mean normalized score per model
- **Leaderboard:** Per-domain tabs plus composite view
- **Optional:** ELO from head-to-head pass/fail battles within domain

### Always shown alongside quality

| Metric | Source |
|---|---|
| TTFT | Time to first token |
| Total latency | End-to-end response time |
| Throughput | Tokens per second |
| Cost | Input + output tokens Ã— OpenRouter pricing |

Cost-capability scatter plot (planned): X = cost per 1M tokens, Y = domain score or ELO.

---

## Anti-Gaming and Trust

### Contamination

Public seed datasets (BigCodeBench, GSM8K, IFEval, etc.) may be in training data. Arena labels them honestly:

| Source tag | Meaning |
|---|---|
| `seed` | Public dataset â€” possibly contaminated |
| `community` | Human-reviewed submission â€” fresher |
| `deepswe` | Original, verified novel â€” highest trust |

Rollout: seed data for MVP infrastructure â†’ community tasks â†’ original-only pool.

### Battle integrity

- Model identities never sent to client before vote
- Rate limit: 10 new battles per hour per IP
- Max 600 output tokens per model per battle (cost cap)
- Max 10 evaluations per prompt per user session (planned)

### No LLM-as-judge

Quality for subjective tasks comes from **human votes**, not from asking GPT-4 to score GPT-4. Objective tasks use **deterministic verifiers** only.

### Task quality gate

Before any task enters the live pool:

1. Human or reviewer checks prompt clarity
2. Verifier config validated (tests run, schema valid, constraints parseable)
3. `approved: true` set in DB

Community submissions sit in a queue until approved.

---

## Domain Rollout Order

| Priority | Domain | Judge type | Status |
|---|---|---|---|
| 1 | Instruction follow | `instruction_rules` | First auto-score target |
| 2 | JSON / tool use | `json_schema` | Planned |
| 3 | Math + logic | `exact_number` | Planned |
| 4 | Coding (function-level) | `code_exec` (Judge0) | Planned |
| 5 | Writing | `human_vote` | Planned |
| 6 | SWE / repo-level | `code_exec` + agent harness | Later (Docker) |
| 7 | Summarisation | `human_vote` or ROUGE | Post-MVP |
| 8 | Image / agentic | TBD | Skipped for MVP |

---

## Verifier Plugin Contract

Adding a new judged domain = one new file under `lib/verifiers/` implementing:

```typescript
async function runVerifier(
  output: string,
  config: VerifierConfig
): Promise<VerifierResult>
```

The eval engine dispatches by `task.verifier.type`. UI, API, and leaderboard stay the same.

---

## Quick Reference

```
Deterministic judges          Human judges
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€         â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
coding     â†’ Judge0 tests     writing    â†’ blind vote
math       â†’ exact / SymPy     summarisation â†’ vote (preferred)
json       â†’ Ajv schema
instruction â†’ rule parser

Every run also logs: latency, tokens, cost
Rankings: pass rate / score (auto) Â· Bradley-Terry ELO (human)
Harness: fixed prompt, 600 token cap, OpenRouter, same for all models
Trust: label seed data Â· approve tasks Â· behavioral not structural
```




judging md is the main doc to be reffered further to get an idea of how stuff are going to be judged 




we aer mainly going to build around the benchmark part but integrating api as well




for now software decisions are clean 


we need to work more towards how to evaluate the other domain benchmakrs mainly now 




