import { NextResponse } from "next/server";
import { getShameRuns } from "@/lib/store/sqlite-store";
import { listChallengeSlugs, loadChallengeResults } from "@/lib/challenges/store-json";
import { listSessions, loadSession } from "@/lib/challenges/sessions";

/**
 * hall of shame — worst failures first. merges live sqlite runs with failures
 * from persisted challenges/sessions so the wall is never empty on a fresh
 * deploy (sqlite is ephemeral on serverless, results.json is committed).
 */
export async function GET() {
  const sqliteRuns = (await getShameRuns(50)) as Array<Record<string, unknown>>;
  const seen = new Set(sqliteRuns.map((r) => String(r.id)));
  const merged = [...sqliteRuns];

  const sources = [
    ...(await listChallengeSlugs()).map((slug) => () => loadChallengeResults(slug)),
    ...(await listSessions()).map((s) => () => loadSession(s.slug)),
  ];

  for (const load of sources) {
    const res = await load();
    if (!res) continue;
    for (const r of res.runs) {
      if (r.passed || seen.has(r.id)) continue;
      seen.add(r.id);
      merged.push({
        id: r.id,
        task_id: r.task_id,
        domain: r.task_category,
        model_slug: r.model_label || r.model_slug,
        output: r.output || r.error || "(no output)",
        passed: false,
        score: r.score,
        details: r.details,
        latency_ms: r.latency_ms,
        input_tokens: r.input_tokens,
        output_tokens: r.output_tokens,
        cost_usd: 0,
        created_at: r.created_at,
        upvotes: 0,
      });
    }
  }

  // lowest score + most upvoted floats to the top of the wall
  merged.sort(
    (a, b) =>
      Number(b.upvotes ?? 0) - Number(a.upvotes ?? 0) ||
      Number(a.score ?? 0) - Number(b.score ?? 0),
  );

  return NextResponse.json({ runs: merged.slice(0, 50) });
}
