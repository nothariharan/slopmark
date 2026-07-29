import type { VerifierResult } from "../types";

function parseCalibration(out: string): { answer: string; confidence: number } | null {
  const formal = out.match(/ANSWER:\s*(.+?)\s*\|\s*CONFIDENCE:\s*(\d+)/i);
  if (formal) {
    return {
      answer: formal[1].trim().toLowerCase(),
      confidence: Math.min(100, Math.max(0, parseInt(formal[2], 10))),
    };
  }

  // freeform: first non-empty line = answer, second line contains 0-100
  const lines = out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length >= 2) {
    const confMatch = lines[1].match(/\b(\d{1,3})\b/);
    if (confMatch) {
      return {
        answer: lines[0].toLowerCase().replace(/^answer:\s*/i, ""),
        confidence: Math.min(100, Math.max(0, parseInt(confMatch[1], 10))),
      };
    }
  }

  // single-line trailing confidence: "paris 90"
  const trimmed = out.trim();
  const oneLine = trimmed.match(/^([\s\S]+?)\s+(\d{1,3})$/);
  if (oneLine) {
    return {
      answer: oneLine[1].trim().toLowerCase().replace(/^answer:\s*/i, ""),
      confidence: Math.min(100, Math.max(0, parseInt(oneLine[2], 10))),
    };
  }

  return null;
}

// Accepts formal "ANSWER: x | CONFIDENCE: N" or freeform answer + confidence lines.
export function verifyCalibration(out: string, answer_token: string): VerifierResult {
  const parsed = parseCalibration(out);
  if (!parsed) {
    return {
      passed: false,
      score: 0,
      details: `confidence:0 | format_error: expected "ANSWER: ... | CONFIDENCE: N" or answer then confidence 0-100, got: ${out.slice(0, 100)}`,
    };
  }

  const { answer, confidence } = parsed;
  const correct = answer.includes(answer_token.toLowerCase());

  return {
    passed: correct,
    score: correct ? 100 : 0,
    details: `confidence:${confidence} | answer="${answer}" | correct=${correct} | expected="${answer_token}"`,
  };
}
