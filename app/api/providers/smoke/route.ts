import { NextResponse } from "next/server";
import { smokeTestProvider } from "@/lib/openrouter";
import { applyHostLimitCookie, checkLlmLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limit = checkLlmLimit(req, { hostFunded: true, kind: "run" });
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: `free host tier — 1 request/minute. try again in ${limit.retryIn}s` },
        { status: 429 },
      );
    }
    const { modelSlug } = await req.json();
    if (!modelSlug) {
      return NextResponse.json({ error: "modelSlug required" }, { status: 400 });
    }
    const result = await smokeTestProvider(modelSlug);
    const res = NextResponse.json(result, { status: result.ok ? 200 : 422 });
    applyHostLimitCookie(res, limit);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "smoke test failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
