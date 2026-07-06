import type { VerifierResult } from "../types";

export function verifyWriting(
  output: string,
  cfg: { min_words?: number; max_words?: number }
): VerifierResult {
  const trimmed = output.trim();
  if (!trimmed) return { passed: false, score: 0, details: "output is empty" };

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const min = cfg.min_words ?? 50;
  const max = cfg.max_words ?? 1000;

  type Check = { ok: boolean; msg: string };
  const checks: Check[] = [];

  const minOk = wc >= min;
  checks.push({ ok: minOk, msg: minOk ? `${wc} words (≥ ${min})` : `only ${wc} words — need ≥ ${min}` });

  const maxOk = wc <= max;
  checks.push({ ok: maxOk, msg: maxOk ? `within ${max}-word limit` : `${wc} words — exceeds ${max} limit` });

  // at least 2 substantive sentences
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 8);
  const multiSentence = sentences.length >= 2;
  checks.push({
    ok: multiSentence,
    msg: multiSentence ? `${sentences.length} sentences detected` : "fewer than 2 sentences",
  });

  // not dominated by bullet points (prose check)
  const lines = trimmed.split("\n").filter((l) => l.trim());
  const bulletLines = lines.filter((l) => /^[-*•]\s/.test(l.trim())).length;
  const hasProse = lines.length === 0 || bulletLines < lines.length * 0.8;
  checks.push({ ok: hasProse, msg: hasProse ? "contains prose content" : "output is mostly bullet points" });

  const passing = checks.filter((c) => c.ok).length;
  const score = Math.round((passing / checks.length) * 100);
  // need ≥ 3/4 checks to pass
  const passed = passing >= 3;

  const summary = checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.msg}`).join("\n");
  return {
    passed,
    score,
    details: `${summary}\n\n[queued for human review — score may be updated]`,
  };
}
