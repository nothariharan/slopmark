import { NextRequest, NextResponse } from "next/server";
import { runModel } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { prompt, modelSlug } = await req.json();
    if (!prompt || !modelSlug) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const { output, meta } = await runModel(prompt, modelSlug);
    return NextResponse.json({ output, meta });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
