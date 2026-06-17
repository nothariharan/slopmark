import { NextResponse } from "next/server";
import { evalSuite } from "@/lib/eval";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const modelSlug = body.modelSlug as string;

    if (!modelSlug) {
      return NextResponse.json({ error: "modelSlug required" }, { status: 400 });
    }

    const res = await evalSuite(modelSlug);
    return NextResponse.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "suite failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
