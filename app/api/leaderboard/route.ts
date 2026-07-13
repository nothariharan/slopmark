import { NextResponse } from "next/server";
import { getSessionLeaderboard } from "@/lib/leaderboard";
import type { Domain } from "@/lib/types";

/**
 * sessions source is JSON-only (vercel-safe). domain/aggregate still go through
 * the store layer — which no-ops sqlite on vercel unless supabase is configured.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const aggregate = url.searchParams.get("aggregate") === "true";

    if (url.searchParams.get("source") === "sessions") {
      const rows = await getSessionLeaderboard();
      return NextResponse.json({ source: "sessions", rows });
    }

    // lazy import so the sessions path never touches the store module graph
    // more than it has to if someone later rewires imports
    const store = await import("@/lib/store");

    if (aggregate) {
      const rows = await store.getLeaderboardAggregate();
      return NextResponse.json({ aggregate: true, rows });
    }

    const domain = (url.searchParams.get("domain") ?? "instruction") as Domain;
    const rows = await store.getLeaderboard(domain);
    return NextResponse.json({ domain, rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "leaderboard failed";
    return NextResponse.json({ error: msg, rows: [] }, { status: 500 });
  }
}
