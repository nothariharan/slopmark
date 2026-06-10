import type { ModelConfig } from "./types"

export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: "claude-haiku",
    name: "Claude Haiku 3.5",
    slug: "anthropic/claude-3.5-haiku",
    provider: "Anthropic",
    costInput: 0.8,
    costOutput: 4,
    elo: 1000,
    active: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    slug: "openai/gpt-4o-mini",
    provider: "OpenAI",
    costInput: 0.15,
    costOutput: 0.6,
    elo: 1000,
    active: true,
  },
  {
    id: "llama-3.1-8b",
    name: "Llama 3.1 8B",
    slug: "meta-llama/llama-3.1-8b-instruct",
    provider: "Meta",
    costInput: 0.06,
    costOutput: 0.06,
    elo: 1000,
    active: true,
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B",
    slug: "mistralai/mistral-7b-instruct",
    provider: "Mistral",
    costInput: 0.06,
    costOutput: 0.06,
    elo: 1000,
    active: true,
  },
  {
    id: "qwen-2.5-7b",
    name: "Qwen 2.5 7B",
    slug: "qwen/qwen-2.5-7b-instruct",
    provider: "Qwen",
    costInput: 0.04,
    costOutput: 0.1,
    elo: 1000,
    active: true,
  },
]

export function pickRandomModels(count = 2): ModelConfig[] {
  const pool = DEFAULT_MODELS.filter((m) => m.active)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function estimateCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1_000_000) * model.costInput +
    (outputTokens / 1_000_000) * model.costOutput
  )
}
