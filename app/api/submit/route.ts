import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addCommunityTask } from "@/lib/store/sqlite-store";

// keep the accepted domains tight so junk doesnt land in the pool
const DOMAINS = new Set([
  "instruction", "json", "math", "coding", "writing", "swe", "sycophancy",
  "agentic", "safety", "calibration", "persistence", "procedural", "refusal",
  "hierarchy", "zero_ctx", "drawing",
]);

export async function POST(req: Request) {
  try {
    const { domain, prompt, ruleType, ruleVal } = await req.json();

    if (!domain || !prompt || !ruleType || !ruleVal) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }
    if (!DOMAINS.has(domain)) {
      return NextResponse.json({ error: "unknown domain" }, { status: 400 });
    }

    // Convert rule to verifier array
    let verifierObj = null;
    if (ruleType === "word_count") verifierObj = { type: "word_count", max: parseInt(ruleVal, 10) };
    if (ruleType === "forbidden_substring") verifierObj = { type: "forbidden_substring", values: [ruleVal], case_insensitive: true };
    if (ruleType === "required_phrase") verifierObj = { type: "required_phrase", values: [ruleVal], case_insensitive: true };

    if (!verifierObj) {
      return NextResponse.json({ error: "invalid rule" }, { status: 400 });
    }

    const verifier = JSON.stringify([verifierObj]);
    // random suffix so two submits in the same ms dont collide on the pk
    const id = `comm-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

    await addCommunityTask({ id, domain, prompt, verifier });

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
