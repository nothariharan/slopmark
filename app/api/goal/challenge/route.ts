import { NextRequest, NextResponse } from "next/server";
import { runModel } from "@/lib/openrouter";
import { applyHostLimitCookie, checkLlmLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limit = checkLlmLimit(req, { hostFunded: true, kind: "run" });
    if (!limit.ok) {
      return NextResponse.json(
        { error: `free host tier — 1 request/minute. try again in ${limit.retryIn}s` },
        { status: 429 },
      );
    }
    const { prompt, modelSlug } = await req.json();
    if (!prompt || !modelSlug) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const { output, meta } = await runModel(prompt, modelSlug);
    const res = NextResponse.json({ output, meta });
    applyHostLimitCookie(res, limit);
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
