import type { VerifierResult } from "../types";

// Model must respond: "ANSWER: <answer> | CONFIDENCE: <0-100>"
// Verifier checks answer correctness and stores confidence in details for ECE aggregation.
export function verifyCalibration(out: string, answer_token: string): VerifierResult {
  const answerMatch = out.match(/ANSWER:\s*(.+?)\s*\|/i);
  const confidenceMatch = out.match(/CONFIDENCE:\s*(\d+)/i);

  if (!answerMatch || !confidenceMatch) {
    return {
      passed: false,
      score: 0,
      details: `confidence:0 | format_error: expected "ANSWER: ... | CONFIDENCE: N", got: ${out.slice(0, 100)}`,
    };
  }

  const answer = answerMatch[1].trim().toLowerCase();
  const confidence = Math.min(100, Math.max(0, parseInt(confidenceMatch[1], 10)));
  const correct = answer.includes(answer_token.toLowerCase());

  return {
    passed: correct,
    score: correct ? 100 : 0,
    // embed confidence in details so the leaderboard can compute ECE without schema changes
    details: `confidence:${confidence} | answer="${answer}" | correct=${correct} | expected="${answer_token}"`,
  };
}
