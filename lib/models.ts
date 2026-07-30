import { aimlTestModels } from "./aimlapi";
import {
  fireworksCursePanel,
  fireworksCursePanelExtras,
  fireworksFrontierModels,
  isFireworksSlug,
} from "./fireworks-models";
import { openRouterFreeModels } from "./openrouter-free";

/** public UI default — OpenRouter free models (host-funded) */
export const models = openRouterFreeModels.map(({ name, slug }) => ({ name, slug }));

export const openRouterFreeModelsList = openRouterFreeModels;

/** paid / non-free OpenRouter slugs — only via BYOK or explicit OPENROUTER_ALLOWLIST */
export const openRouterPaidModels = [
  { name: "claude 3.5 haiku", slug: "anthropic/claude-3.5-haiku" },
  { name: "claude 3.5 sonnet", slug: "anthropic/claude-3.5-sonnet" },
  { name: "gpt-4o mini", slug: "openai/gpt-4o-mini" },
  { name: "gpt-4o", slug: "openai/gpt-4o" },
  { name: "gemini flash 1.5", slug: "google/gemini-flash-1.5" },
  { name: "llama 3.1 8b", slug: "meta-llama/llama-3.1-8b-instruct" },
  { name: "mistral 7b", slug: "mistralai/mistral-7b-instruct" },
  { name: "qwen 2.5 7b", slug: "qwen/qwen-2.5-7b-instruct" },
] as const;

/** @deprecated use openRouterPaidModels — kept for older imports */
export const openRouterModels = openRouterPaidModels;

export {
  aimlTestModels,
  fireworksCursePanel,
  fireworksCursePanelExtras,
  fireworksFrontierModels,
  isFireworksSlug,
  openRouterFreeModels,
};

/** default bench / game slug — free OpenRouter router */
export const defaultBenchSlug = openRouterFreeModels[0].slug;
