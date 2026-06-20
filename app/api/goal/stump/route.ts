import { NextRequest, NextResponse } from "next/server";
import { runModel } from "@/lib/openrouter";
import { verifyInstruction } from "@/lib/verifiers/instruction";
import type { InstructionRule } from "@/lib/types";

function buildPrompt(prompt: string, rules: InstructionRule[]): string {
  const lines: string[] = [prompt, "", "Constraints you must follow:"];
  for (const r of rules) {
    if (r.type === "word_count") {
      if (r.max != null) lines.push(`- Respond in ${r.max} words or fewer.`);
      if (r.min != null) lines.push(`- Respond in at least ${r.min} words.`);
      if (r.exact != null) lines.push(`- Respond in exactly ${r.exact} words.`);
    } else if (r.type === "forbidden_substring") {
      lines.push(`- Do not use any of these words or phrases: ${r.values.join(", ")}.`);
    } else if (r.type === "required_phrase") {
      lines.push(`- You must include the exact phrase: ${r.values.join(", ")}.`);
    } else if (r.type === "starts_with") {
      lines.push(`- Your response must start with: "${r.value}".`);
    } else if (r.type === "ends_with") {
      lines.push(`- Your response must end with: "${r.value}".`);
    } else if (r.type === "max_chars") {
      lines.push(`- Your response must be ${r.value} characters or fewer.`);
    }
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, rules, modelSlug } = (await req.json()) as {
      prompt: string;
      rules: InstructionRule[];
      modelSlug: string;
    };

    if (!prompt?.trim() || !rules?.length || !modelSlug) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const { output, meta } = await runModel(buildPrompt(prompt, rules), modelSlug);
    const result = verifyInstruction(output, rules);

    return NextResponse.json({ output, ...result, meta });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
