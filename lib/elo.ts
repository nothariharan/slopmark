import type { BattleVote } from "./types"

const K = 32

export function updateElo(
  ratingA: number,
  ratingB: number,
  outcome: BattleVote
): { newA: number; newB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  const expectedB = 1 - expectedA

  const scoreA = outcome === "a" ? 1 : outcome === "tie" ? 0.5 : 0
  const scoreB = 1 - scoreA

  return {
    newA: Math.round(ratingA + K * (scoreA - expectedA)),
    newB: Math.round(ratingB + K * (scoreB - expectedB)),
  }
}
