import { NextRequest, NextResponse } from "next/server";
import { runModel } from "@/lib/openrouter";
import { checkRunLimit, getIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limit = checkRunLimit(getIp(req));
    if (!limit.ok) {
      return NextResponse.json({ error: `rate limit — try again in ${limit.retryIn}s` }, { status: 429 });
    }
    const { subject, modelSlug } = await req.json();
    if (!subject || !modelSlug) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const prompt = `Draw "${subject}" using only ASCII art and keyboard characters. Make it recognizable. Output only the drawing, nothing else.`;
    const { output, meta } = await runModel(prompt, modelSlug);
    return NextResponse.json({ output, meta });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
