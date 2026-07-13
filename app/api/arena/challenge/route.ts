import { NextResponse } from "next/server";
import { runModel } from "@/lib/openrouter";
import * as store from "@/lib/store";
import { models } from "@/lib/models";
import { randomUUID } from "crypto";
import { checkDuelLimit, getIp } from "@/lib/rate-limit";
import type { Domain } from "@/lib/types";

export async function GET(req: Request) {
  try {
    // this fires two model calls, so meter it like a duel
    const limit = checkDuelLimit(getIp(req));
    if (!limit.ok) {
      return NextResponse.json({ error: `rate limit — try again in ${limit.retryIn}s` }, { status: 429 });
    }
    const url = new URL(req.url);
    const domain = (url.searchParams.get("domain") ?? "instruction") as Domain;
    
    // fetch tasks for domain
    const tasks = await store.getTasks(domain);
    if (!tasks.length) return NextResponse.json({ error: "no tasks found" }, { status: 404 });
    
    // pick random task
    const task = tasks[Math.floor(Math.random() * tasks.length)];

    // pick 2 random distinct models
    let m1 = models[Math.floor(Math.random() * models.length)].slug;
    let m2 = models[Math.floor(Math.random() * models.length)].slug;
    while (m1 === m2) {
      m2 = models[Math.floor(Math.random() * models.length)].slug;
    }

    // randomize order
    const [modelA, modelB] = Math.random() > 0.5 ? [m1, m2] : [m2, m1];

    // run models concurrently
    const [resA, resB] = await Promise.all([
      runModel(task.prompt, modelA),
      runModel(task.prompt, modelB),
    ]);

    return NextResponse.json({
      challengeId: randomUUID(),
      task: store.toPublic(task),
      outputA: resA.output,
      outputB: resB.output,
      _hidden: { modelA, modelB } // in a real secure app this would be signed or stored in db session for now jus keepit it simple 
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "challenge failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
