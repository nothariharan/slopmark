export type Domain =
  | "swe"
  | "coding"
  | "math"
  | "json"
  | "instruction"
  | "writing"

export type VerifierType =
  | "code_exec"
  | "exact_number"
  | "json_schema"
  | "instruction_rules"
  | "human_vote"

export type VerifierConfig =
  | { type: "code_exec"; tests: { input: string; expected_output: string }[] }
  | { type: "exact_number"; answer: string }
  | { type: "json_schema"; schema: Record<string, unknown> }
  | { type: "instruction_rules"; rules: InstructionRule[] }
  | { type: "human_vote" }

export type InstructionRule =
  | { kind: "min_words"; n: number }
  | { kind: "max_paragraphs"; n: number }
  | { kind: "forbidden_word"; word: string }
  | { kind: "must_include"; phrase: string }

export type ArenaTask = {
  id: string
  domain: Domain
  prompt: string
  metadata?: Record<string, unknown>
  verifier: VerifierConfig
  source: "seed" | "community" | "deepswe"
  approved: boolean
}

export type ModelConfig = {
  id: string
  name: string
  slug: string
  provider: string
  costInput: number
  costOutput: number
  elo: number
  active: boolean
}

export type BattleVote = "a" | "b" | "tie"

export type BattleSlotStats = {
  latencyMs: number
  tokens: number
  costUsd: number
}

export type BattleRecord = {
  id: string
  prompt: string
  modelA: ModelConfig
  modelB: ModelConfig
  voteCast: boolean
  winner?: BattleVote
  statsA?: BattleSlotStats
  statsB?: BattleSlotStats
}

export type VerifierResult = {
  passed: boolean
  score: number
  details: string
}
