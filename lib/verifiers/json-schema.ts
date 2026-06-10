import type { VerifierConfig, VerifierResult } from "../types"

export async function scoreJsonSchema(
  _output: string,
  _config: Extract<VerifierConfig, { type: "json_schema" }>
): Promise<VerifierResult> {
  return { passed: false, score: 0, details: "not implemented yet" }
}
