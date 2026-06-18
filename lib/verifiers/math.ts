import type { VerifierResult } from "../types";

export function verifyExactNumber(output: string, expected: string): VerifierResult {
  const trimmed = output.trim();

  // direct match first (model outputted exactly the number)
  if (trimmed === expected) {
    return { passed: true, score: 100, details: `correct: ${expected}` };
  }

  // pull the first number-shaped thing out of the output
  const match = trimmed.match(/-?\d+(\.\d+)?/);
  if (!match) {
    return { passed: false, score: 0, details: `no number found in output` };
  }

  const got = match[0];
  const ok = got === expected;
  return {
    passed: ok,
    score: ok ? 100 : 0,
    details: ok ? `correct: ${expected}` : `got ${got}, expected ${expected}`,
  };
}
