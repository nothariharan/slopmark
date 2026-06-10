export const SEED_PROMPTS = [
  {
    id: "writing-1",
    content:
      "Explain why static AI benchmarks get contaminated over time. Keep it under 150 words.",
    domain: "writing" as const,
  },
  {
    id: "writing-2",
    content:
      "Write a short product pitch for a platform where AI models battle head to head.",
    domain: "writing" as const,
  },
  {
    id: "writing-3",
    content:
      "A developer asks which model to pick for a startup with a tight API budget. Give practical advice.",
    domain: "writing" as const,
  },
]

export function pickRandomPrompt() {
  return SEED_PROMPTS[Math.floor(Math.random() * SEED_PROMPTS.length)]
}
