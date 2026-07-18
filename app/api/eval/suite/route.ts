import { NextResponse } from "next/server";
import { validateByokAgent } from "@/lib/byok";
import { evalSuite } from "@/lib/eval";
import { checkLlmLimit } from "@/lib/rate-limit";
import type { Domain, HarnessMode } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const modelSlug = body.modelSlug as string | undefined;
    const domain = (body.domain ?? "instruction") as Domain;
    const harnessMode = body.harnessMode as HarnessMode | undefined;
    const provider = body.provider ? validateByokAgent(body.provider) : undefined;

    if (!modelSlug && !provider) {
      return NextResponse.json({ error: "modelSlug or provider required" }, { status: 400 });
    }

    // full suite burns many completions — host free tier is single-task only
    if (!provider) {
      return NextResponse.json(
        {
          error:
            "full suite on the free host tier is disabled (1 req/min). enable BYOK to run a suite, or run one task at a time",
        },
        { status: 429 },
      );
    }

    const limit = checkLlmLimit(req, { hostFunded: false, kind: "suite" });
    if (!limit.ok) {
      return NextResponse.json(
        { error: `rate limit — suite runs are limited to 3/min, try again in ${limit.retryIn}s` },
        { status: 429 },
      );
    }

    const res = await evalSuite(modelSlug ?? "", domain, harnessMode, provider);
    return NextResponse.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "suite failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
