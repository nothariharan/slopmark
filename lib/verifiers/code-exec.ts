import type { VerifierConfig, VerifierResult } from "../types"

export async function scoreCodeExec(
  _output: string,
  _config: Extract<VerifierConfig, { type: "code_exec" }>
): Promise<VerifierResult> {
  return { passed: false, score: 0, details: "not implemented yet" }
}
