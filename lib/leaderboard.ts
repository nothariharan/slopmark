import { listChallengeSlugs, loadChallengeResults } from "./challenges/store-json";
import { listSessions, loadSession } from "./challenges/sessions";
import type { ChallengeResults } from "./challenges/types";

/**
 * cross-session leaderboard — folds every persisted challenge + playground
 * session into one per-model table. this is the wall that survives deploys:
 * it reads only committed/persisted results.json files, no sqlite required.
 */
export type SessionLeaderboardRow = {
  model_slug: string;
  model_label: string;
  sessions: number;
  wins: number;
  runs: number;
  passed: number;
  pass_rate: number;
  avg_score: number;
  avg_latency_ms: number;
};

async function allResults(): Promise<ChallengeResults[]> {
  const out: ChallengeResults[] = [];

  const challengeSlugs = await listChallengeSlugs();
  for (const slug of challengeSlugs) {
    const r = await loadChallengeResults(slug);
    if (r) out.push(r);
  }

  const sessionCards = await listSessions();
  for (const s of sessionCards) {
    const r = await loadSession(s.slug);
    if (r) out.push(r);
  }

  return out;
}

export async function getSessionLeaderboard(): Promise<SessionLeaderboardRow[]> {
  const results = await allResults();
  const byModel = new Map<string, SessionLeaderboardRow & { scoreSum: number; latencySum: number }>();

  for (const res of results) {
    // the session winner = best pass rate (ties share the win)
    const best = Math.max(...res.summaries.map((s) => s.pass_rate), 0);

    for (const s of res.summaries) {
      const key = s.model_label || s.model_slug;
      const row = byModel.get(key) ?? {
        model_slug: s.model_slug,
        model_label: s.model_label,
        sessions: 0,
        wins: 0,
        runs: 0,
        passed: 0,
        pass_rate: 0,
        avg_score: 0,
        avg_latency_ms: 0,
        scoreSum: 0,
        latencySum: 0,
      };
      row.sessions += 1;
      if (s.pass_rate >= best && best > 0) row.wins += 1;
      row.runs += s.runs;
      row.passed += s.passed;
      row.scoreSum += s.avg_score * s.runs;
      row.latencySum += s.avg_latency_ms * s.runs;
      byModel.set(key, row);
    }
  }

  return [...byModel.values()]
    .map(({ scoreSum, latencySum, ...row }) => ({
      ...row,
      pass_rate: row.runs ? row.passed / row.runs : 0,
      avg_score: row.runs ? Math.round(scoreSum / row.runs) : 0,
      avg_latency_ms: row.runs ? Math.round(latencySum / row.runs) : 0,
    }))
    .sort((a, b) => b.pass_rate - a.pass_rate || b.wins - a.wins);
}
