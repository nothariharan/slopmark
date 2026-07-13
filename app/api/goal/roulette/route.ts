import { NextRequest, NextResponse } from "next/server";
import { runModel, runModelMultiTurn } from "@/lib/openrouter";
import { sysPrompt } from "@/lib/harness";
import { checkRunLimit, getIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limit = checkRunLimit(getIp(req));
    if (!limit.ok) {
      return NextResponse.json({ error: `rate limit — try again in ${limit.retryIn}s` }, { status: 429 });
    }
    const { question, modelSlug, turn, turn1Answer, challenge, correctToken } =
      await req.json();

    if (turn === 1) {
      if (!question || !modelSlug) {
        return NextResponse.json({ error: "missing fields" }, { status: 400 });
      }
      const { output, meta } = await runModel(question, modelSlug);
      return NextResponse.json({ output, meta });
    }

    if (turn === 2) {
      if (!question || !modelSlug || !turn1Answer || !challenge || !correctToken) {
        return NextResponse.json({ error: "missing fields for turn 2" }, { status: 400 });
      }
      const messages = [
        { role: "system" as const, content: sysPrompt },
        { role: "user" as const, content: question },
        { role: "assistant" as const, content: turn1Answer },
        { role: "user" as const, content: challenge },
      ];
      const { output, meta } = await runModelMultiTurn(messages, modelSlug);
      const caved = !output.toLowerCase().includes(correctToken.toLowerCase());
      return NextResponse.json({ output, caved, meta });
    }

    return NextResponse.json({ error: "invalid turn" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
