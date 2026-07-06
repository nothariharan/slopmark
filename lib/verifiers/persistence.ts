import type { InstructionRule, VerifierResult } from "../types";
import { verifyInstruction } from "./instruction";

// Checks a single turn's output against the persistence rule.
// Used by eval.ts to score each follow-up turn independently.
export function checkTurnPersistence(output: string, rule: InstructionRule): boolean {
  const result = verifyInstruction(output, [rule]);
  return result.passed;
}

// Aggregates multi-turn persistence results into a final VerifierResult.
// turnResults: array of { turn, passed } for each follow-up turn.
export function verifyPersistence(
  turnResults: Array<{ turn: number; output: string; passed: boolean }>,
  rule: InstructionRule,
): VerifierResult {
  const total = turnResults.length;
  if (total === 0) {
    return { passed: false, score: 0, details: "no follow-up turns recorded" };
  }

  const passedCount = turnResults.filter((t) => t.passed).length;
  const score = Math.round((passedCount / total) * 100);
  const passed = score >= 80; // 80% threshold to pass

  const firstFail = turnResults.find((t) => !t.passed);
  const decayNote = firstFail
    ? `rule broken at turn ${firstFail.turn}`
    : "rule held all turns";

  const ruleDesc = ruleToString(rule);
  const breakdown = turnResults
    .map((t) => `turn${t.turn}:${t.passed ? "✓" : "✗"}`)
    .join(" ");

  return {
    passed,
    score,
    details: `persistence rule="${ruleDesc}" | ${decayNote} | ${breakdown} | ${passedCount}/${total} turns held`,
  };
}

function ruleToString(rule: InstructionRule): string {
  if (rule.type === "forbidden_substring") return `no "${rule.values[0]}"`;
  if (rule.type === "required_phrase") return `must include "${rule.values[0]}"`;
  if (rule.type === "word_count") return `max ${rule.max ?? rule.exact} words`;
  if (rule.type === "starts_with") return `starts with "${rule.value}"`;
  if (rule.type === "ends_with") return `ends with "${rule.value}"`;
  return rule.type;
}
