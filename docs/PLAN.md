# PLAN.md — Arena Benchmark Platform
*Last updated: June 2026*

---

## The One-Line Version

An open AI evaluation platform with novel tasks, behavioral verifiers, and a fixed harness — built for developers who need trustworthy model scores.

---

## The Problem (Why This Exists)

Every major AI benchmark is either saturated, contaminated, or gamed:

- **MMLU, HumanEval, GSM8K, HellaSwag** — all effectively dead. Models train on the test data and hit 90%+. They measure memorization, not capability.
- **Goodhart's Law** — the moment a benchmark goes public, labs optimize for it. The metric stops measuring what we care about.
- **Existing platforms** — LMSYS went semi-closed. HF Leaderboard has week-long queues. Scale SEAL is enterprise-only. Artificial Analysis aggregates other people's numbers. Nobody lets a developer test their actual use case and get a trustworthy answer in under a minute.
- **LLM-as-judge is biased** — GPT-4 judges prefer verbose, markdown-heavy, GPT-4-style outputs. It's not neutral.
- **Cost is invisible** — every leaderboard shows capability scores but not what it costs to get them. That's half the information missing.

**The gap:** No platform that is fast, open, cost-aware, and built for developers who need real eval signal — not researchers waiting in queue.

---

## Phase 1 — Arena (Weeks 1–8)

### What It Is

A multi-domain AI model evaluation platform where models compete head-to-head in real time. Community-generated prompts. Execution-based scoring where possible. ELO rankings that update live. Cost-capability matrix that no one else has built.

---

### The Four Layers (from architecture diagram)

```
Layer 1 — Frontend         The UI. Arena battles, leaderboard, prompt submission, results viewer.
Layer 2 — API Gateway      Routes requests, handles auth, rate limits, queues evaluation jobs.
Layer 3 — Eval Engine      Runs tests, scores outputs, tracks latency + cost per model.
Layer 4 — Data Layer       Stores prompts, results, ELO ratings, vote history, cost logs.
```

---

### Domain Modules — What Gets Built and When

#### AUTO-SCORED (no judge needed — build these first)

**Coding Arena** `MVP Week 3–4`
- Input: problem + hidden test cases
- Output: runnable code
- Scorer: Judge0 API (sandboxed execution) — pass/fail per test case
- Cost: free tier available
- Dataset: BigCodeBench (Apache 2.0), APPS, HumanEval variants

**Math + Logic** `MVP Week 3–4`
- Input: problem from MATH-500 or GSM8K variants
- Scorer: extract number → exact match / SymPy verification
- Output: correct / incorrect
- Cost: zero — pure regex extraction

**JSON + Tool Use** `MVP Week 5–6`
- Input: schema + task description
- Output: structured JSON
- Scorer: Ajv (JSON schema validator) + field error count
- Cost: fully local validation
- Dataset: BFCL, IFEval

**Instruction Follow** `MVP Week 5–6`
- Input: constrained prompt (e.g. "respond in exactly 3 paragraphs, no word 'the'")
- Scorer: deterministic string parsing
- Output: constraints met / broken

#### HUMAN-VOTED (needs a judge — build after auto-scored)

**Writing Battle** `MVP Week 4–5`
- Input: open prompt
- Scorer: blind A/B vote by user
- Output: ELO data for both models
- Anti-game: model names hidden until vote is cast

**Summarisation** `Post-MVP`
- Input: long document
- Output: summary
- Score: ROUGE or human vote
- Axes: faithfulness, coverage, conciseness

#### ALWAYS ON (no scoring needed — wire in from day one)

**Speed + Cost Tracking**
- TTFT (time to first token)
- Tokens/sec throughput
- Total response time
- Input + output token count via OpenRouter API
- Price per 1000 evaluations
- Shown on every result + leaderboard. No extra work — middleware logs it.

#### SKIP FOR MVP

- Image generation (needs CLIP scoring, completely different ML infra)
- Image understanding (VQAv2, MMBench — add in month 2)
- Agentic / multi-step (needs Docker sandboxes, OSWorld-style server — way too complex early)

---

### The Core User Flow (Single Arena Battle)

```
User submits prompt
      ↓
API picks 2 random models (from pool of 5–8 active models)
      ↓
Parallel calls via OpenRouter (SSE streaming)
      ↓
Stream tokens to UI — both models typing side by side, live
      ↓
User votes blind (doesn't know which model is which)
      ↓
Reveal model names + scores
      ↓
Update ELO in DB (Bradley-Terry model, not simple Elo)
      ↓
Leaderboard updates live (Supabase Realtime)
```

All latency + cost logging happens in one API call handler. Single async function — don't overcomplicate it early.

---

### Key Differentiators vs Existing Platforms

| Feature | LMSYS | HF Leaderboard | Artificial Analysis | Arena |
|---|---|---|---|---|
| Live streaming battles | No | No | No | **Yes** |
| Cost/token on leaderboard | No | No | Partial | **Yes** |
| Cost-capability matrix | No | No | No | **Yes** |
| Community prompt submission | Limited | No | No | **Yes** |
| Results in < 60 seconds | No (queue) | No (weeks) | N/A | **Yes** |
| Open source everything | No | Partial | No | **Yes** |

---

### Tech Stack (Final Decisions)

**Frontend + API Gateway**
- Next.js 15 (App Router)
- Tailwind CSS + shadcn/ui
- Vercel deploy
- Next.js API routes for now — extract to FastAPI when code execution sandbox is needed (Week 4+)

**Database + Realtime**
- Supabase (Postgres) — free tier, managed, no ops
- Supabase Realtime — live ELO updates to leaderboard without polling
- Prisma ORM for type-safe queries

**Model Access**
- OpenRouter — 100%. One API key, one SDK, 300+ models, unified OpenAI-compatible format
- OpenAI SDK (works with OpenRouter base URL)
- SSE streaming for token-by-token race effect
- 5.5% platform markup is worth avoiding 10 different billing dashboards

**Code Execution (Week 4+)**
- Judge0 API (free tier for MVP) — sandboxed code runner
- OR Docker sandbox + FastAPI worker — more control, needed for complex cases
- FastAPI (Python) backend extracted from Next.js when eval logic needs DeepEval / SymPy

**Rate Limiting + Budget Protection**
- Max 600 tokens output per model per battle (prevents runaway costs)
- Max 10 evaluations per prompt per user session
- Only run 2 models per battle, not all at once
- IP-based rate limiting on arena endpoint
- OpenRouter spend cap set in dashboard

**No user accounts for MVP**
- Anonymous voting works fine for ELO
- Add accounts in Week 5–6 for persistent vote history and prompt submission with attribution
- Supabase auth handles this cleanly when needed

---

### 8-Week Build Timeline

**Week 1–2: Infrastructure + Core API**
- [ ] Init Next.js 15 + Supabase project
- [ ] OpenRouter integration — can call 5 models, get responses back
- [ ] Basic DB schema: models, prompts, battles, votes, elo_ratings
- [ ] SSE streaming working end-to-end (prompt in → tokens streaming out)
- [ ] Rate limiting middleware

**Week 3–4: Coding Arena + Battle UI**
- [ ] Side-by-side streaming battle interface (the core product — make it look incredible)
- [ ] Judge0 integration for code execution scoring
- [ ] Seed 100 coding problems from BigCodeBench
- [ ] Bradley-Terry ELO calculation on each vote
- [ ] Basic leaderboard page with model rankings

**Week 5–6: Cost Matrix + More Domains**
- [ ] Cost-capability scatter plot (X: cost/1M tokens, Y: ELO) — interactive, filterable
- [ ] Math + Logic domain (SymPy scorer)
- [ ] JSON/tool use domain (Ajv validator)
- [ ] Instruction follow domain (deterministic parser)
- [ ] Run 500 pre-seeded evaluations to populate leaderboard before launch

**Week 7–8: Polish + Viral Mechanics**
- [ ] Shareable "Evaluation Cards" — auto-generated image/HTML summary of a battle result
- [ ] Community prompt submission (with basic vetting queue)
- [ ] BYOP mode — paste your own prompt, run against 5 models simultaneously
- [ ] Deploy: Vercel (frontend) + Supabase (DB) + Railway/Render (FastAPI workers if needed)
---

### Datasets (Open License, Safe to Use)

| Dataset | Domain | License | Notes |
|---|---|---|---|
| BigCodeBench | Coding | Apache 2.0 | 148+ diverse tasks, ED=29 |
| MATH-500 | Math | Open | Curated subset, hard |
| GSM8K variants | Math | MIT | Use GSM1K-style variants, not base |
| IFEval | Instruction follow | Open | Deterministic constraint parsing |
| BFCL | JSON/tool use | Open | Berkeley function calling |
| OIG Dataset | General | Apache 2.0 | Community instruction tuning |
| RedPajama | General | Apache 2.0 | Large open dataset |

**Avoid:** Datasets with Non-Commercial or restrictive ethical licenses unless operating as a non-profit academic tool.

---

## Project Identity

**Working title:** Arena  
**Tagline:** Open evaluation for AI models — novel tasks, behavioral verifiers, fixed harness.  
**Open source:** Yes  

---

## What Success Looks Like

- instruction follow benchmark runs end-to-end with deterministic scoring
- multiple models evaluated on the same task set with comparable results
- community can submit and review new tasks
- cost and latency logged on every run

---

## Open Questions (To Resolve During Build)

1. **Model pool for MVP** — which 5–8 models on OpenRouter give the best coverage without blowing budget? Suggested: Claude Haiku, GPT-4o-mini, Llama 3.1 8B, Mistral 7B, Qwen 2.5 7B.

2. **Prompt vetting** — lightweight review queue for community submissions before tasks go live.

3. **Name** — "Arena" is a working title. Alternatives: ModelClash, BenchWar, EvalArena, Crucible.

---

## Domain scoring summary

| domain | scorer |
|---|---|
| writing | human vote |
| coding | hidden tests pass |
| swe | repo behavioral tests |
| math | extracted answer match |
| instruction | deterministic rule parser |
| json | schema validation |

DeepSWE spine: novel task → fixed harness → behavioral verifier → human quality gate.
