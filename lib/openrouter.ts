import OpenAI from "openai";
import { aimlProvider, assertAimlModelAllowed } from "./aimlapi";
import { maxTok, systemPromptFor, temp } from "./harness";
import type { ChatMessage, HarnessMode, RunMeta } from "./types";

export type ProviderConfig = {
  baseURL: string;
  apiKey: string;
  defaultHeaders?: Record<string, string>;
};

function openRouterProvider(): ProviderConfig {
  return {
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
  };
}

function customProvider(): ProviderConfig | null {
  const base = process.env.CUSTOM_API_BASE;
  const key = process.env.CUSTOM_API_KEY;
  if (!base || !key) return null;
  return { baseURL: base, apiKey: key };
}

export function resolveProvider(modelSlug: string): { provider: ProviderConfig; model: string } {
  if (modelSlug.startsWith("aiml/")) {
    const aiml = aimlProvider();
    if (!aiml) throw new Error("AIMLAPI_KEY not set");
    const model = modelSlug.slice("aiml/".length);
    assertAimlModelAllowed(model);
    return { provider: aiml, model };
  }
  if (modelSlug.startsWith("custom/")) {
    const custom = customProvider();
    if (!custom) throw new Error("custom provider not configured — set CUSTOM_API_BASE and CUSTOM_API_KEY");
    return { provider: custom, model: modelSlug.slice("custom/".length) };
  }
  const or = openRouterProvider();
  if (!or.apiKey) throw new Error("missing OPENROUTER_API_KEY");
  return { provider: or, model: modelSlug };
}

function mk(cfg: ProviderConfig) {
  return new OpenAI({
    baseURL: cfg.baseURL,
    apiKey: cfg.apiKey,
    defaultHeaders: cfg.defaultHeaders,
  });
}

export async function runModel(prompt: string, slug: string, harnessMode: HarnessMode = "standard") {
  const { provider, model } = resolveProvider(slug);
  return runModelDirect(prompt, model, provider, harnessMode);
}

export async function runModelDirect(
  prompt: string,
  model: string,
  provider: ProviderConfig,
  harnessMode: HarnessMode = "standard",
  maxTokens = maxTok,
) {
  const t0 = Date.now();
  const res = await mk(provider).chat.completions.create({
    model,
    temperature: temp,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPromptFor(harnessMode) },
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

export async function runModelMultiTurn(messages: ChatMessage[], slug: string, harnessMode: HarnessMode = "standard") {
  const { provider, model } = resolveProvider(slug);

  const t0 = Date.now();
  const msgs =
    messages[0]?.role === "system"
      ? messages
      : [{ role: "system" as const, content: systemPromptFor(harnessMode) }, ...messages];
  const res = await mk(provider).chat.completions.create({
    model,
    temperature: temp,
    max_tokens: maxTok,
    messages: msgs,
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

export async function runModelStream(prompt: string, slug: string, harnessMode: HarnessMode = "standard") {
  const { provider, model } = resolveProvider(slug);

  const t0 = Date.now();
  const stream = await mk(provider).chat.completions.create({
    model,
    temperature: temp,
    max_tokens: maxTok,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: "system", content: systemPromptFor(harnessMode) },
      { role: "user", content: prompt },
    ],
  });

  return { stream, t0 };
}

/** one canonical task — confirms the endpoint accepts our harness shape */
export async function smokeTestProvider(slug: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await runModel('Reply with exactly the word "pong". Nothing else.', slug);
    const ok = res.output.trim().toLowerCase().includes("pong");
    return ok ? { ok: true } : { ok: false, error: `unexpected output: ${res.output.slice(0, 80)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "smoke test failed" };
  }
}

export async function smokeTestDirect(
  model: string,
  provider: ProviderConfig,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await runModelDirect(
      'Reply with exactly the word "pong". Nothing else.',
      model,
      provider,
      "zero_context",
    );
    const ok = res.output.trim().toLowerCase().includes("pong");
    return ok ? { ok: true } : { ok: false, error: `unexpected output: ${res.output.slice(0, 80)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "smoke test failed" };
  }
}



// openroouter may extend later 