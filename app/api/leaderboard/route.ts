import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { getSessionLeaderboard } from "@/lib/leaderboard";
import type { Domain } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const aggregate = url.searchParams.get("aggregate") === "true";

  if (url.searchParams.get("source") === "sessions") {
    const rows = await getSessionLeaderboard();
    return NextResponse.json({ source: "sessions", rows });
  }

  if (aggregate) {
    const rows = await store.getLeaderboardAggregate();
    return NextResponse.json({ aggregate: true, rows });
  }

  const domain = (url.searchParams.get("domain") ?? "instruction") as Domain;
  const rows = await store.getLeaderboard(domain);
  return NextResponse.json({ domain, rows });
}
