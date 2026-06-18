import { NextResponse } from "next/server";
import { evalSuite } from "@/lib/eval";
import type { Domain } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const modelSlug = body.modelSlug as string;
    const domain = (body.domain ?? "instruction") as Domain;

    if (!modelSlug) {
      return NextResponse.json({ error: "modelSlug required" }, { status: 400 });
    }

    const res = await evalSuite(modelSlug, domain);
    return NextResponse.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "suite failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
