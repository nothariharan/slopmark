import OpenAI from "openai"

export const MAX_OUTPUT_TOKENS = 600

export function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set")
  }

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "Arena",
    },
  })
}

export function hasOpenRouterKey() {
  return Boolean(process.env.OPENROUTER_API_KEY)
}
