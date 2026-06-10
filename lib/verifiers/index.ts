import type { VerifierConfig, VerifierResult } from "../types"
import { scoreCodeExec } from "./code-exec"
import { scoreExactNumber } from "./exact-number"
import { scoreInstruction } from "./instruction"
import { scoreJsonSchema } from "./json-schema"

export async function runVerifier(
  output: string,
  config: VerifierConfig
): Promise<VerifierResult> {
  switch (config.type) {
    case "code_exec":
      return scoreCodeExec(output, config)
    case "exact_number":
      return scoreExactNumber(output, config)
    case "json_schema":
      return scoreJsonSchema(output, config)
    case "instruction_rules":
      return scoreInstruction(output, config)
    case "human_vote":
      return { passed: false, score: 0, details: "use battle voting" }
    default:
      return { passed: false, score: 0, details: "unknown verifier" }
  }
}
