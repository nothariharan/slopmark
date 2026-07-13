import { NextResponse } from "next/server";
import { sqliteAvailable } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    // challenge-derived shame rows only live in committed JSON — no durable
    // upvote store on vercel yet. local sqlite still bumps when available.
    if (!sqliteAvailable) {
      return NextResponse.json({
        success: true,
        persisted: false,
        note: "upvotes are local-only until a durable store is wired",
      });
    }

    const { upvoteRun } = await import("@/lib/store/sqlite-store");
    await upvoteRun(id);
    return NextResponse.json({ success: true, persisted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "upvote failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
