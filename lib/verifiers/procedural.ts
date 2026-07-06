import type { VerifierResult } from "../types";

type ProceduralConfig = {
  type: "procedural_answer";
  expected: string;
  mode: "contains" | "exact_number" | "time" | "yes_no";
};

function parseTime(s: string): string | null {
  const m = s.trim().match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (h < 1 || h > 12 || min < 0 || min > 59) return null;
  return `${h}:${String(min).padStart(2, "0")} ${ampm}`;
}

function extractNumber(s: string): string | null {
  const m = s.trim().match(/\d+/);
  return m ? m[0] : null;
}

export function verifyProcedural(out: string, cfg: ProceduralConfig): VerifierResult {
  const lower = out.toLowerCase().trim();

  if (cfg.mode === "yes_no") {
    const wantsYes = cfg.expected.toLowerCase() === "yes";
    const saidYes = /\byes\b/.test(lower) && !/\bno\b/.test(lower);
    const saidNo = /\bno\b/.test(lower) && !/\byes\b/.test(lower);
    const ok = wantsYes ? saidYes : saidNo;
    return {
      passed: ok,
      score: ok ? 100 : 0,
      details: ok ? `correct (${cfg.expected})` : `expected ${cfg.expected}, got "${out.trim().slice(0, 80)}"`,
    };
  }

  if (cfg.mode === "exact_number") {
    const n = extractNumber(out);
    const ok = n === cfg.expected;
    return {
      passed: ok,
      score: ok ? 100 : 0,
      details: ok ? `got ${n}` : `expected ${cfg.expected}, got ${n ?? "nothing numeric"}`,
    };
  }

  if (cfg.mode === "time") {
    const got = parseTime(out);
    const ok = got === cfg.expected;
    return {
      passed: ok,
      score: ok ? 100 : 0,
      details: ok ? `time ${got}` : `expected ${cfg.expected}, got ${got ?? "unparseable time"}`,
    };
  }

  // contains — direction, calendar day names, etc.
  const ok = lower.includes(cfg.expected.toLowerCase());
  return {
    passed: ok,
    score: ok ? 100 : 0,
    details: ok ? `found "${cfg.expected}"` : `expected token "${cfg.expected}" missing`,
  };
}
