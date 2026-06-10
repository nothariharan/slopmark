import type { VerifierConfig, VerifierResult } from "../types"

export async function scoreExactNumber(
  _output: string,
  _config: Extract<VerifierConfig, { type: "exact_number" }>
): Promise<VerifierResult> {
  return { passed: false, score: 0, details: "not implemented yet" }
}
