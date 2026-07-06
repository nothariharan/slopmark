import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function GET() {
  const items = await store.getReviewItems(20);
  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, score, runId } = body as { id: string; score: number; runId: string };

    if (!id || !runId || typeof score !== "number") {
      return NextResponse.json({ error: "id, runId, and score are required" }, { status: 400 });
    }
    if (score < 1 || score > 5) {
      return NextResponse.json({ error: "score must be between 1 and 5" }, { status: 400 });
    }

    await store.voteReview(id, score, runId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "vote failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
