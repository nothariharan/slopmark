import { NextRequest, NextResponse } from "next/server";
import { runModel } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
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
