# JUDGING.md — How Slopmark Scores Model Outputs

How Slopmark decides pass/fail and updates benchmark rankings. Verifier types, trust rules, what gets logged.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [benchmarks.md](./benchmarks.md), [deepswe.md](./deepswe.md)

---

## Core Principle

Slopmark does **not** use one judge for everything. Split by domain:

| When possible | When not possible |
|---|---|
| **Deterministic verifiers** — programmatic pass/fail | **Human review** — subjective quality (planned) |
| No LLM-as-judge | Structured rubrics, not vibes |

Rule: **auto-score when you can; human review when you must.**

Every run logs **latency** and **cost** alongside quality score.

---

## DeepSWE Spine

```
novel task  →  fixed harness  →  behavioral verifier  →  human quality gate
```

| Step | Role |
|---|---|
| Novel task | reduces contamination |
| Fixed harness | same prompt, cap, tools for every model |
| Behavioral verifier | output works, not gold-patch match |
| Quality gate | human approves task before it goes live |

---

## Task Shape

```typescript
BenchTask = {
  id: string
  domain: "swe" | "coding" | "math" | "json" | "instruction" | "writing"
  prompt: string
  verifier: VerifierConfig
  source: "seed" | "community"
  approved: boolean
}

VerifierResult = {
  passed: boolean
  score: number      // 0-100
  details: string
}
```

---

## Eval Flow (live)

```
Load BenchTask
  → Call model via OpenRouter (fixed harness)
  → runVerifier(output, task.verifier)
  → Persist result + latency + tokens + cost
  → Update domain leaderboard
```

---

## Verifier Types

### `instruction_rules` — live

Deterministic rule parser: word count, paragraphs, forbidden text, required phrases, etc.

Plugin: `lib/verifiers/instruction.ts`

### `json_schema` — planned

Ajv schema validation. Plugin: `lib/verifiers/json-schema.ts`

### `exact_number` — planned

Regex extract + exact match or SymPy. Plugin: `lib/verifiers/exact-number.ts`

### `code_exec` — planned

Judge0 hidden tests. Plugin: `lib/verifiers/code-exec.ts`

### `human_vote` — planned

Human rubric review for writing/creative domains. No LLM judge.

---

## Rankings

Auto-scored domains rank by:
- **pass rate** per model
- **avg normalized score** (0-100)
- **avg latency** and **avg cost** shown alongside

---

## Trust & Anti-Gaming

| Source tag | Meaning |
|---|---|
| `seed` | public dataset — possibly contaminated |
| `community` | human-reviewed submission |

Before tasks go live:
1. prompt clarity check
2. verifier config validated
3. `approved: true` set

No LLM-as-judge. Label seed data honestly.

---

## Domain Rollout

| Priority | Domain | Judge | Status |
|---|---|---|---|
| 1 | Instruction follow | `instruction_rules` | **live** |
| 2 | JSON | `json_schema` | planned |
| 3 | Math | `exact_number` | planned |
| 4 | Coding | `code_exec` | planned |
| 5 | Writing | `human_vote` | planned |
| 6 | SWE | `code_exec` + agent harness | later |

---

## Plugin Contract

New domain = one file under `lib/verifiers/`:

```typescript
function runVerifier(output: string, config: VerifierConfig): VerifierResult
```

UI, API, and leaderboard stay the same.
