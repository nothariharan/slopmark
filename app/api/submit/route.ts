import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addCommunityTask } from "@/lib/store";
import type { InstructionRule } from "@/lib/types";

const DOMAINS = new Set([
  "instruction", "json", "math", "coding", "writing", "swe", "sycophancy",
  "agentic", "safety", "calibration", "persistence", "procedural", "refusal",
  "hierarchy", "zero_ctx", "drawing",
]);

function buildRule(ruleType: string, ruleVal: string): InstructionRule | null {
  if (ruleType === "word_count") {
    const max = parseInt(ruleVal, 10);
    if (Number.isNaN(max)) return null;
    return { type: "word_count", max };
  }
  if (ruleType === "forbidden_substring") {
    return { type: "forbidden_substring", values: [ruleVal], case_insensitive: true };
  }
  if (ruleType === "required_phrase") {
    return { type: "required_phrase", values: [ruleVal], case_insensitive: true };
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { domain, prompt, ruleType, ruleVal } = await req.json();

    if (!domain || !prompt || !ruleType || !ruleVal) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }
    if (!DOMAINS.has(domain)) {
      return NextResponse.json({ error: "unknown domain" }, { status: 400 });
    }

    const rule = buildRule(ruleType, String(ruleVal));
    if (!rule) {
      return NextResponse.json({ error: "invalid rule" }, { status: 400 });
    }

    // store as a full VerifierConfig, not a bare rule array
    const verifier = JSON.stringify({ type: "instruction_rules", rules: [rule] });
    const id = `comm-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

    await addCommunityTask({ id, domain, prompt, verifier });

    return NextResponse.json({ success: true, id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "submission failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
