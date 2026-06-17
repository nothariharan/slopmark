import OpenAI from "openai";
import { maxTok, sysPrompt, temp } from "./harness";
import type { RunMeta } from "./types";

const mk = () =>
  new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
  });

export async function runModel(prompt: string, slug: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("missing OPENROUTER_API_KEY");
  }

  const t0 = Date.now();
  const res = await mk().chat.completions.create({
    model: slug,
    temperature: temp,
    max_tokens: maxTok,
    messages: [
      { role: "system", content: sysPrompt },
      { role: "user", content: prompt },
    ],
  });

  const usage = res.usage;
  const meta: RunMeta = {
    latency_ms: Date.now() - t0,
    input_tokens: usage?.prompt_tokens ?? 0,
    output_tokens: usage?.completion_tokens ?? 0,
    cost_usd: 0,
  };

  return { output: res.choices[0]?.message?.content ?? "", meta };
}

export function pasteMeta(): RunMeta {
  return { latency_ms: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0 };
}
