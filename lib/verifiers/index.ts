import type { VerifierConfig, VerifierResult } from "../types";
import { verifyInstruction } from "./instruction";
import { verifyJSON } from "./json";
import { verifyExactNumber } from "./math";
import { notReady } from "./stubs";

export function runVerifier(out: string, cfg: VerifierConfig): VerifierResult {
  switch (cfg.type) {
    case "instruction_rules":
      return verifyInstruction(out, cfg.rules);
    case "json_schema":
      return verifyJSON(out, cfg.schema);
    case "exact_number":
      return verifyExactNumber(out, cfg.expected);
    case "code_exec":
      return notReady("code_exec");
    case "human_vote":
      return notReady("human_vote");
    default:
      return notReady("unknown");
  }
}
