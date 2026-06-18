# metrics & leaderboard

> outline doc — what we measure and how rankings work.

quality and efficiency both matter. this page defines what shows up where.

---

## per-run metrics

> explain: captured on every eval_run

| metric | meaning | source |
|---|---|---|
| passed | all verifier rules/tests pass | verifier |
| score | 0-100 normalized | verifier |
| latency_ms | wall clock for model call | harness |
| input_tokens | prompt tokens | openrouter |
| output_tokens | completion tokens | openrouter |
| cost_usd | run cost | openrouter (when available) |

- [ ] which metrics are quality vs operational
- [ ] paste mode zeros for latency/cost

---

## leaderboard aggregates

> explain: how rows are computed per model per domain

- [ ] pass_rate = passed runs / total runs
- [ ] avg_score = mean of score
- [ ] avg_latency_ms, avg_cost_usd
- [ ] runs count — minimum threshold before display? (decide)
- [ ] sort: pass_rate desc, then avg_score desc

---

## what the leaderboard is not

> explain: set expectations

- [ ] not a vibes contest
- [ ] not pairwise elo / battle rankings
- [ ] not comparable across domains without context
- [ ] seed task results labeled as such

---

## cost-capability view (planned)

> explain: scatter plot vision

- [ ] x-axis: cost per eval or per 1m tokens
- [ ] y-axis: pass rate or avg score
- [ ] filter by domain
- [ ] why devs care about this matrix

---

## latency breakdown (planned)

> explain: deeper perf metrics

- [ ] ttft — time to first token
- [ ] tokens per second
- [ ] where to surface (run detail vs leaderboard column)

---

## exporting results (planned)

> explain: how teams use benchmark data

- [ ] json export of suite run
- [ ] csv for leaderboard
- [ ] api access for ci integration

---

## interpreting scores

> explain: how to read results without fooling yourself

- [ ] small run count = noisy
- [ ] seed contamination caveat
- [ ] compare models on same task set only
- [ ] score != real-world product quality
