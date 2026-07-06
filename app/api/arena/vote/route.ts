import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { arenaVotes } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, modelA, modelB, winner } = body;

    if (!taskId || !modelA || !modelB || !winner) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    // store the vote
    await db.insert(arenaVotes).values({
      id: randomUUID(),
      task_id: taskId,
      model_a: modelA,
      model_b: modelB,
      winner,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "vote failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
