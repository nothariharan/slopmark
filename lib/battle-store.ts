import { randomUUID } from "crypto"
import type { BattleRecord, BattleSlotStats, BattleVote, ModelConfig } from "./types"

const globalForBattles = globalThis as unknown as {
  battles?: Map<string, BattleRecord>
}

const battles = globalForBattles.battles ?? new Map<string, BattleRecord>()
globalForBattles.battles = battles

export function createBattle(
  prompt: string,
  modelA: ModelConfig,
  modelB: ModelConfig
): BattleRecord {
  const record: BattleRecord = {
    id: randomUUID(),
    prompt,
    modelA: { ...modelA },
    modelB: { ...modelB },
    voteCast: false,
  }

  battles.set(record.id, record)
  return record
}

export function getBattle(id: string) {
  return battles.get(id)
}

export function saveSlotStats(
  id: string,
  slot: "a" | "b",
  stats: BattleSlotStats
) {
  const battle = battles.get(id)
  if (!battle) return

  if (slot === "a") battle.statsA = stats
  else battle.statsB = stats

  battles.set(id, battle)
}

export function castVote(id: string, vote: BattleVote) {
  const battle = battles.get(id)
  if (!battle || battle.voteCast) return null

  battle.voteCast = true
  battle.winner = vote
  battles.set(id, battle)
  return battle
}

export function getLeaderboard(): ModelConfig[] {
  const byId = new Map<string, ModelConfig>()

  for (const battle of battles.values()) {
    byId.set(battle.modelA.id, battle.modelA)
    byId.set(battle.modelB.id, battle.modelB)
  }

  return [...byId.values()].sort((a, b) => b.elo - a.elo)
}
