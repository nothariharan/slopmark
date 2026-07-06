import { NextResponse } from "next/server";
import { smokeTestProvider } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { modelSlug } = await req.json();
    if (!modelSlug) {
      return NextResponse.json({ error: "modelSlug required" }, { status: 400 });
    }
    const result = await smokeTestProvider(modelSlug);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "smoke test failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
