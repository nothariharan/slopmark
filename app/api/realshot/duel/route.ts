import { NextResponse } from "next/server";
import { validateByokAgent, providerConfig } from "@/lib/byok";
import { runRealshotDuel } from "@/lib/realshot/duel";
import type { RealshotCategory } from "@/lib/realshot/types";
import { smokeTestDirect } from "@/lib/openrouter";
import type { HarnessMode } from "@/lib/types";
import { checkDuelLimit, getIp } from "@/lib/rate-limit";

function validateAgent(a: unknown, label: string) {
  return validateByokAgent(a, label);
}

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const limit = checkDuelLimit(ip);
    if (!limit.ok) {
      return NextResponse.json(
        { error: `rate limit — try again in ${limit.retryIn}s` },
        { status: 429 },
      );
    }

    const body = await req.json();
    const agentA = validateAgent(body.agentA, "agentA");
    const agentB = validateAgent(body.agentB, "agentB");
    const category = (body.category ?? "random") as RealshotCategory;
    const harnessMode = (body.harnessMode ?? "zero_context") as HarnessMode;
    const seed = body.seed != null ? Number(body.seed) : undefined;
    const taskId = body.taskId as string | undefined;

    const result = await runRealshotDuel({
      agentA,
      agentB,
      category,
      harnessMode,
      seed,
      taskId,
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "duel failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const agent = validateAgent(body, "agent");
    const result = await smokeTestDirect(agent.model, {
      baseURL: agent.baseURL.replace(/\/$/, ""),
      apiKey: agent.apiKey,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "smoke test failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
