import type { VerifierConfig, VerifierResult } from "../types"

export async function scoreInstruction(
  _output: string,
  _config: Extract<VerifierConfig, { type: "instruction_rules" }>
): Promise<VerifierResult> {
  return { passed: false, score: 0, details: "not implemented yet" }
}
