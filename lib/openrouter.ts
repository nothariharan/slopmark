import OpenAI from "openai";
import { aimlProvider, assertAimlModelAllowed } from "./aimlapi";
import {
  assertHostOpenRouterModelAllowed,
  OPENROUTER_BASE,
  openRouterApiKey,
} from "./openrouter-free";
import { maxTok, systemPromptFor, temp } from "./harness";
import type { ChatMessage, HarnessMode, RunMeta } from "./types";

export type ProviderConfig = {
  baseURL: string;
  apiKey: string;
  defaultHeaders?: Record<string, string>;
};

function openRouterProvider(): ProviderConfig {
  return {
    baseURL: OPENROUTER_BASE,
    apiKey: openRouterApiKey(),
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "https://slopmark.vercel.app",
      "X-Title": process.env.OPENROUTER_APP_TITLE ?? "slopmark",
    },
  };
}

function fireworksProvider(): ProviderConfig | null {
  const key = process.env.FIREWORKS_API_KEY;
  if (!key) return null;
  return { baseURL: "https://api.fireworks.ai/inference/v1", apiKey: key };
}

function customProvider(): ProviderConfig | null {
  const base = process.env.CUSTOM_API_BASE;
  const key = process.env.CUSTOM_API_KEY;
  if (!base || !key) return null;
  return { baseURL: base, apiKey: key };
}

// optional extra allowlist override; empty = free models only for host key
function assertOpenRouterModelAllowed(model: string) {
  const raw = process.env.OPENROUTER_ALLOWLIST?.trim();
  if (raw) {
    const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!allowed.includes(model)) {
      throw new Error(`model ${model} not on the allowlist`);
    }
    return;
  }
  assertHostOpenRouterModelAllowed(model);
}

export function resolveProvider(modelSlug: string): { provider: ProviderConfig; model: string } {
  if (modelSlug.startsWith("aiml/")) {
    const aiml = aimlProvider();
    if (!aiml) throw new Error("AIMLAPI_KEY not set — enable BYOK or set AIMLAPI_KEY");
    const model = modelSlug.slice("aiml/".length);
    assertAimlModelAllowed(model);
    return { provider: aiml, model };
  }
  if (modelSlug.startsWith("fireworks/")) {
    const fw = fireworksProvider();
    if (!fw) throw new Error("FIREWORKS_API_KEY not set");
    const rest = modelSlug.slice("fireworks/".length);
    const model = rest.includes("/") ? rest : `accounts/fireworks/models/${rest}`;
    return { provider: fw, model };
  }
  if (modelSlug.startsWith("custom/")) {
    const custom = customProvider();
    if (!custom) throw new Error("custom provider not configured — set CUSTOM_API_BASE and CUSTOM_API_KEY");
    return { provider: custom, model: modelSlug.slice("custom/".length) };
  }
  const or = openRouterProvider();
  if (!or.apiKey) throw new Error("missing OPENROUTER_API_KEY");
  assertOpenRouterModelAllowed(modelSlug);
  return { provider: or, model: modelSlug };
}

function mk(cfg: ProviderConfig) {
  return new OpenAI({
    baseURL: cfg.baseURL,
    apiKey: cfg.apiKey,
    defaultHeaders: cfg.defaultHeaders,
  });
}

export async function runModel(
  prompt: string,
  slug: string,
  harnessMode: HarnessMode = "standard",
  maxTokens = maxTok,
) {
  const { provider, model } = resolveProvider(slug);
  return runModelDirect(prompt, model, provider, harnessMode, maxTokens);
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
  return runModelMultiTurnDirect(messages, model, provider, harnessMode);
}

export async function runModelMultiTurnDirect(
  messages: ChatMessage[],
  model: string,
  provider: ProviderConfig,
  harnessMode: HarnessMode = "standard",
) {
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
  return runModelStreamDirect(prompt, model, provider, harnessMode);
}

export async function runModelStreamDirect(
  prompt: string,
  model: string,
  provider: ProviderConfig,
  harnessMode: HarnessMode = "standard",
) {
  const t0 = Date.now();
  const client = mk(provider);
  const messages = [
    { role: "system" as const, content: systemPromptFor(harnessMode) },
    { role: "user" as const, content: prompt },
  ];
  try {
    const stream = await client.chat.completions.create({
      model,
      temperature: temp,
      max_tokens: maxTok,
      stream: true,
      stream_options: { include_usage: true },
      messages,
    });
    return { stream, t0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/stream_options|unrecognized|unknown/i.test(msg)) throw e;
    const stream = await client.chat.completions.create({
      model,
      temperature: temp,
      max_tokens: maxTok,
      stream: true,
      messages,
    });
    return { stream, t0 };
  }
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
