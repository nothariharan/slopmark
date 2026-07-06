import { NextResponse } from "next/server";
import { evalSuite } from "@/lib/eval";
import { checkSuiteLimit, getIp } from "@/lib/rate-limit";
import type { Domain } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const limit = checkSuiteLimit(ip);
    if (!limit.ok) {
      return NextResponse.json(
        { error: `rate limit — suite runs are limited to 3/min, try again in ${limit.retryIn}s` },
        { status: 429 }
      );
    }

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
