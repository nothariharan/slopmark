import type { VerifierConfig, VerifierResult } from "../types";
import { verifyInstruction } from "./instruction";
import { notReady } from "./stubs";

export function runVerifier(out: string, cfg: VerifierConfig): VerifierResult {
  switch (cfg.type) {
    case "instruction_rules":
      return verifyInstruction(out, cfg.rules);
    case "json_schema":
      return notReady("json_schema");
    case "exact_number":
      return notReady("exact_number");
    case "code_exec":
      return notReady("code_exec");
    case "human_vote":
      return notReady("human_vote");
    default:
      return notReady("unknown");
  }
}
