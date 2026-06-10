import {
  getOpenRouterClient,
  hasOpenRouterKey,
  MAX_OUTPUT_TOKENS,
} from "@/lib/openrouter"
import { getBattle, saveSlotStats } from "@/lib/battle-store"
import { estimateCost } from "@/lib/models"

export async function POST(request: Request) {
  const body = await request.json()
  const battleId = body?.battleId as string | undefined
  const slot = body?.slot as "a" | "b" | undefined

  if (!battleId || (slot !== "a" && slot !== "b")) {
    return new Response("bad request", { status: 400 })
  }

  const battle = getBattle(battleId)
  if (!battle) {
    return new Response("battle not found", { status: 404 })
  }

  if (!hasOpenRouterKey()) {
    const fake =
      slot === "a"
        ? "Model A would respond here once OPENROUTER_API_KEY is set."
        : "Model B would respond here once OPENROUTER_API_KEY is set."

    saveSlotStats(battleId, slot, {
      latencyMs: 0,
      tokens: fake.length,
      costUsd: 0,
    })

    return new Response(fake, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  const model = slot === "a" ? battle.modelA : battle.modelB
  const started = Date.now()

  try {
    const client = getOpenRouterClient()
    const stream = await client.chat.completions.create({
      model: model.slug,
      messages: [{ role: "user", content: battle.prompt }],
      stream: true,
      max_tokens: MAX_OUTPUT_TOKENS,
    })

    let output = ""
    let inputTokens = 0
    let outputTokens = 0

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? ""
            if (token) {
              output += token
              controller.enqueue(encoder.encode(token))
            }

            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? inputTokens
              outputTokens = chunk.usage.completion_tokens ?? outputTokens
            }
          }

          if (!outputTokens) {
            outputTokens = Math.ceil(output.length / 4)
          }
          if (!inputTokens) {
            inputTokens = Math.ceil(battle.prompt.length / 4)
          }

          saveSlotStats(battleId, slot, {
            latencyMs: Date.now() - started,
            tokens: outputTokens,
            costUsd: estimateCost(model, inputTokens, outputTokens),
          })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "stream failed"
          controller.enqueue(encoder.encode(`\n[error: ${message}]`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed"
    return new Response(message, { status: 500 })
  }
}
