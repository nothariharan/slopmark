import { NextResponse } from "next/server"
import { castVote, getBattle } from "@/lib/battle-store"
import { updateElo } from "@/lib/elo"
import type { BattleVote } from "@/lib/types"

export async function POST(request: Request) {
  const body = await request.json()
  const battleId = body?.battleId as string | undefined
  const vote = body?.vote as BattleVote | undefined

  if (!battleId || !vote || !["a", "b", "tie"].includes(vote)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 })
  }

  const existing = getBattle(battleId)
  if (!existing) {
    return NextResponse.json({ error: "battle not found" }, { status: 404 })
  }

  if (existing.voteCast) {
    return NextResponse.json({ error: "already voted" }, { status: 409 })
  }

  const battle = castVote(battleId, vote)
  if (!battle) {
    return NextResponse.json({ error: "vote failed" }, { status: 500 })
  }

  const oldA = existing.modelA.elo
  const oldB = existing.modelB.elo

  const { newA, newB } = updateElo(oldA, oldB, vote)

  battle.modelA.elo = newA
  battle.modelB.elo = newB

  return NextResponse.json({
    modelA: {
      id: battle.modelA.id,
      name: battle.modelA.name,
      slug: battle.modelA.slug,
      elo: newA,
      eloDelta: newA - oldA,
    },
    modelB: {
      id: battle.modelB.id,
      name: battle.modelB.name,
      slug: battle.modelB.slug,
      elo: newB,
      eloDelta: newB - oldB,
    },
    statsA: battle.statsA,
    statsB: battle.statsB,
  })
}
