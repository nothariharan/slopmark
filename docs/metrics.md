# metrics & leaderboard

quality and efficiency both matter. cost is logged alongside pass rate on every run.

---

## per-run metrics

| metric | meaning | source |
|---|---|---|
| passed | all verifier rules/tests pass | verifier |
| score | 0-100 normalized | verifier |
| latency_ms | wall clock: request sent → response received | harness |
| input_tokens | prompt tokens billed | OpenRouter |
| output_tokens | completion tokens billed | OpenRouter |
| cost_usd | run cost | OpenRouter (when available) |

paste mode (dev) logs 0 for latency and cost. these runs are excluded from leaderboard latency and cost aggregates but count toward pass_rate and avg_score.

---

## leaderboard aggregates

per model, per domain:

- **pass_rate** = passed_runs / total_runs
- **avg_score** = mean score across all runs
- **avg_latency_ms** = mean wall-clock latency (paste runs excluded)
- **avg_cost_usd** = mean cost per run (paste runs excluded)

sort order: pass_rate descending, then avg_score descending as tiebreaker.

minimum run threshold before a ranking displays: 10 runs per model per domain. below this, variance is too high to trust the ordering. a model with 3 runs and 100% pass rate is not meaningfully ahead of one with 25 runs and 92% pass rate.

---

## statistical sample size requirements

benchmarks require enough tasks to produce reliable rankings. the required sample size depends on variance in the scoring domain. using a 95% confidence interval at ±3% margin of error (n = (z·σ/E)², z=1.96):

| domain | est. std dev (σ) | required tasks |
|---|---|---|
| instruction follow | 0.20 | ~171 |
| json schema | 0.15 | ~216 |
| sycophancy | 0.22 | ~206 |
| multi-step state | 0.24 | ~181 |
| instruction hierarchy | 0.25 | ~196 |
| refusal calibration | 0.20 | ~171 |

domains with higher variance across model families require more tasks, not fewer. sycophancy and instruction hierarchy have the highest variance because different model families diverge sharply — some models are nearly immune, others acquiesce almost universally.

these numbers apply to the task pool, not the run count. you need 171+ distinct tasks to be confident in the pass rate distribution. running one model on 5000 tasks from a pool of 25 doesn't improve the sample size problem.

---

## the correlated score problem

when multiple tasks share a common source — the same template, the same base document, the same random seed — their scores are correlated. treating them as independent observations inflates the effective sample size.

if you generate 10 task variants from the same constraint template, the actual information content is closer to 4-5 independent observations than 10. this matters when constructing confidence intervals around leaderboard differences.

practical rule: when the task pool uses procedural generation from a fixed template set, account for the template count as the unit of analysis, not the individual task count. a pool of 50 templates × 3 variants each is a pool of ~150 tasks but ~50 independent observations for statistical purposes.

failing to correct for this can cause platforms to underestimate evaluation uncertainty by up to 35% — which leads to declaring statistically insignificant model differences as meaningful performance gaps.

---

## calibration

models are poorly calibrated. a calibrated model would have expressed confidence that tracks accuracy across a large sample: 80% confidence should predict 80% accuracy over many trials.

empirical data shows consistent overconfidence at lower capability tiers. Qwen2-7B in one study showed 46% accuracy alongside 75.5% expressed confidence. GPT-4o showed 73.8% accuracy with 63% expressed confidence — better calibrated, but still overconfident at the margins. the pattern is common: worse-performing models tend to express higher confidence, not lower.

slopmark doesn't currently measure calibration directly — the benchmark records pass/fail outcomes, not model confidence. a calibration domain (where models state a confidence score alongside each answer and calibration error is the primary metric) is on the roadmap.

---

## what the leaderboard is not

**not a vibes contest.** scores are pass/fail or partial credit on defined tasks under identical conditions. preference and competence diverge substantially on precision tasks.

**not comparable across domains.** a 90% pass rate on instruction-follow and a 90% pass rate on math don't mean the same thing. difficulty distributions differ by domain, task count differs, and the capability being measured is different.

**not a claim that seed scores reflect real capability.** seed tasks are labeled as seed. if contamination inflated them, that's expected — it's why the label exists. compare models using original-source task scores when you want the strongest signal.

**not a reflection of real-world production performance.** a high pass rate on instruction-follow tasks under a 600-token cap with temperature 0 tells you the model follows constrained instructions reliably in a controlled evaluation context. it doesn't tell you how that model behaves in production at higher temperatures, longer outputs, multi-turn conversations, or tasks not represented in the current pool.

---

## cost-capability view (planned)

x-axis: avg cost per eval run (or per 1M tokens). y-axis: pass rate. filterable by domain.

this is the chart that matters most for practitioners choosing models for production use. not which model is best in absolute terms, but which model gives the best result for a given budget.

a model achieving 88% pass rate at $0.001/run is a categorically different decision from one achieving 90% at $0.05/run. the cost difference is 50x. a 2-point quality improvement doesn't justify that for most applications. the leaderboard should make this tradeoff visible, not leave it to manual calculation.

---

## exporting results (planned)

- JSON export of full suite run: task-level results, scores, latency, cost per model
- CSV export of leaderboard aggregates
- API access for CI integration: poll leaderboard programmatically, set pass rate thresholds as CI gates

---

## interpreting scores correctly

**small run count = noisy.** below 10 runs per model per domain, don't trust the ranking. below 5, don't display it.

**compare models only on identical task sets.** if model A ran on tasks 1-25 and model B ran on tasks 1-20, the averages aren't comparable. the leaderboard enforces this by aggregating over whatever each model has actually run — always check task coverage before drawing conclusions from cross-model comparisons.

**score ≠ real-world product quality.** the benchmark is a signal about capability under defined constraints. treat it as one input among several when making model selection decisions, not as a complete evaluation.
