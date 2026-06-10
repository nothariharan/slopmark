import { NextResponse } from "next/server"
import { getLeaderboard } from "@/lib/battle-store"
import { DEFAULT_MODELS } from "@/lib/models"

export async function GET() {
  const fromBattles = getLeaderboard()
  const rows = fromBattles.length > 0 ? fromBattles : DEFAULT_MODELS

  return NextResponse.json({
    models: rows.map((model) => ({
      id: model.id,
      name: model.name,
      slug: model.slug,
      provider: model.provider,
      elo: model.elo,
      costInput: model.costInput,
      costOutput: model.costOutput,
    })),
  })
}
