import type { InstructionRule, VerifierResult } from "../types";
import { verifyInstruction } from "./instruction";

type HierarchyConfig = {
  type: "hierarchy_check";
  rules: InstructionRule[];
  system_override?: string;
};

export function verifyHierarchy(out: string, cfg: HierarchyConfig): VerifierResult {
  // system_override is injected into the user prompt at eval time — verifier only checks output rules
  const vr = verifyInstruction(out, cfg.rules);
  return {
    ...vr,
    details: `hierarchy rules:\n${vr.details}`,
  };
}

export function buildHierarchyPrompt(base: string, systemOverride?: string): string {
  if (!systemOverride) return base;
  return `[SYSTEM NOTE — overrides default formatting]\n${systemOverride}\n\n[USER TASK]\n${base}`;
}
