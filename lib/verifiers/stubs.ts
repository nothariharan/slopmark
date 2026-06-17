import type { VerifierResult } from "../types";

export function notReady(kind: string): VerifierResult {
  return { passed: false, score: 0, details: `${kind} verifier not built yet` };
}
