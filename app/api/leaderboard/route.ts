import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import type { Domain } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const domain = (url.searchParams.get("domain") ?? "instruction") as Domain;
  const rows = await store.getLeaderboard(domain);
  return NextResponse.json({ domain, rows });
}
