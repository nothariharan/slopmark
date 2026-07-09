/** AI/ML API — OpenAI-compatible. Docs: https://docs.aimlapi.com/  came in clutch coz i remebred i had credits here js to give a brief aiml api is js a provider company giving access to all mdoels witha single api*/

export const AIMLAPI_BASE = process.env.AIMLAPI_BASE ?? "https://api.aimlapi.com/v1";

/** never use Claude/Anthropic on AIML for bench runs — not trying to go broke :/ */
export const AIML_BLOCKED = [/claude/i, /anthropic/i];

/** low-tier models approved for slopmark testing via aiml/ slugs */
export const aimlTestModels = [
  { name: "gpt-4o mini (aiml)", slug: "aiml/openai/gpt-4o-mini", model: "openai/gpt-4o-mini" },
  { name: "llama 3.1 8b (aiml)", slug: "aiml/aion-labs/aion-rp-llama-3.1-8b", model: "aion-labs/aion-rp-llama-3.1-8b" },
  { name: "ministral 3b (aiml)", slug: "aiml/mistralai/ministral-3b-2512", model: "mistralai/ministral-3b-2512" },
  { name: "qwen 2.5 7b (aiml)", slug: "aiml/Qwen/Qwen2.5-7B-Instruct-Turbo", model: "Qwen/Qwen2.5-7B-Instruct-Turbo" },
  { name: "gemini 2.5 flash (aiml)", slug: "aiml/google/gemini-2.5-flash", model: "google/gemini-2.5-flash" },
  { name: "deepseek v3 (aiml)", slug: "aiml/deepseek/deepseek-chat", model: "deepseek/deepseek-chat" },
] as const;

export function aimlProvider() {
  const apiKey = process.env.AIMLAPI_KEY ?? "";
  if (!apiKey) return null;
  return { baseURL: AIMLAPI_BASE.replace(/\/$/, ""), apiKey };
}

export function assertAimlModelAllowed(model: string) {
  if (AIML_BLOCKED.some((re) => re.test(model))) {
    throw new Error(`model blocked for aiml testing (credit policy): ${model}`);
  }
}

export function isAimlSlug(slug: string) {
  return slug.startsWith("aiml/");
}
