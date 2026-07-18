/**
 * OpenRouter free-tier models used as the host-funded default.
 * Docs: https://openrouter.ai/models?order=pricing-low-to-high
 *
 * Set OPENROUTER_API_KEY in .env.local / Vercel — never commit the key.
 */
export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/** chat-capable free models (excludes audio / classifier-only free SKUs) */
export const openRouterFreeModels = [
  { name: "openrouter free router", slug: "openrouter/free" },
  { name: "tencent hy3 (free)", slug: "tencent/hy3:free" },
  { name: "nemotron 3 ultra (free)", slug: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  { name: "nemotron 3 super (free)", slug: "nvidia/nemotron-3-super-120b-a12b:free" },
  { name: "nemotron 3 nano (free)", slug: "nvidia/nemotron-3-nano-30b-a3b:free" },
  { name: "nemotron nano 9b (free)", slug: "nvidia/nemotron-nano-9b-v2:free" },
  { name: "gpt-oss 20b (free)", slug: "openai/gpt-oss-20b:free" },
  { name: "qwen3 next 80b (free)", slug: "qwen/qwen3-next-80b-a3b-instruct:free" },
  { name: "qwen3 coder (free)", slug: "qwen/qwen3-coder:free" },
  { name: "gemma 4 31b (free)", slug: "google/gemma-4-31b-it:free" },
  { name: "gemma 4 26b (free)", slug: "google/gemma-4-26b-a4b-it:free" },
  { name: "llama 3.3 70b (free)", slug: "meta-llama/llama-3.3-70b-instruct:free" },
  { name: "llama 3.2 3b (free)", slug: "meta-llama/llama-3.2-3b-instruct:free" },
  { name: "hermes 3 405b (free)", slug: "nousresearch/hermes-3-llama-3.1-405b:free" },
  { name: "dolphin mistral 24b (free)", slug: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free" },
  { name: "north mini code (free)", slug: "cohere/north-mini-code:free" },
  { name: "laguna m.1 (free)", slug: "poolside/laguna-m.1:free" },
  { name: "laguna xs 2.1 (free)", slug: "poolside/laguna-xs-2.1:free" },
  { name: "nemotron nano 12b vl (free)", slug: "nvidia/nemotron-nano-12b-v2-vl:free" },
  { name: "nemotron 3 nano omni (free)", slug: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
] as const;

const FREE_SLUGS = new Set<string>(openRouterFreeModels.map((m) => m.slug));

export function isOpenRouterFreeSlug(slug: string) {
  return FREE_SLUGS.has(slug) || slug.endsWith(":free") || slug === "openrouter/free";
}

export function assertHostOpenRouterModelAllowed(model: string) {
  if (!isOpenRouterFreeSlug(model)) {
    throw new Error(
      `host key is limited to OpenRouter free models — pick a :free model or enable BYOK (got ${model})`,
    );
  }
}

export function openRouterApiKey() {
  return (process.env.OPENROUTER_API_KEY ?? "").trim();
}
