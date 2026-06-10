import { NextResponse } from "next/server"
import { createBattle } from "@/lib/battle-store"
import { pickRandomModels } from "@/lib/models"
import { pickRandomPrompt } from "@/lib/prompts"
import { checkRateLimit } from "@/lib/rate-limit"

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local"
  )
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limit = checkRateLimit(`battle-new:${ip}`)

  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate limit hit, try again later" },
      { status: 429 }
    )
  }

  let promptOverride: string | undefined

  try {
    const body = await request.json()
    if (body?.prompt && typeof body.prompt === "string") {
      promptOverride = body.prompt.trim()
    }
  } catch {
    // empty body is fine
  }

  const prompt = promptOverride || pickRandomPrompt().content
  const [modelA, modelB] = pickRandomModels(2)
  const battle = createBattle(prompt, modelA, modelB)

  return NextResponse.json({
    battleId: battle.id,
    prompt: battle.prompt,
  })
}
