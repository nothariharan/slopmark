import type { InstructionRule, RuleResult, VerifierResult } from "../types";

function words(s: string) {
  return s.trim().split(/\s+/).filter(Boolean);
}

function paras(s: string) {
  return s
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function lines(s: string) {
  return s.split("\n");
}

function norm(s: string, ci?: boolean) {
  return ci ? s.toLowerCase() : s;
}

function checkRule(out: string, r: InstructionRule): RuleResult {
  const lbl = r.type;

  if (r.type === "word_count") {
    const n = words(out).length;
    if (r.exact != null && n !== r.exact) {
      return { rule: lbl, ok: false, msg: `got ${n} words, need exactly ${r.exact}` };
    }
    if (r.min != null && n < r.min) {
      return { rule: lbl, ok: false, msg: `got ${n} words, min ${r.min}` };
    }
    if (r.max != null && n > r.max) {
      return { rule: lbl, ok: false, msg: `got ${n} words, max ${r.max}` };
    }
    return { rule: lbl, ok: true, msg: `${n} words ok` };
  }

  if (r.type === "paragraph_count") {
    const n = paras(out).length;
    if (r.exact != null && n !== r.exact) {
      return { rule: lbl, ok: false, msg: `got ${n} paragraphs, need ${r.exact}` };
    }
    if (r.min != null && n < r.min) {
      return { rule: lbl, ok: false, msg: `got ${n} paragraphs, min ${r.min}` };
    }
    if (r.max != null && n > r.max) {
      return { rule: lbl, ok: false, msg: `got ${n} paragraphs, max ${r.max}` };
    }
    return { rule: lbl, ok: true, msg: `${n} paragraphs ok` };
  }

  if (r.type === "forbidden_substring") {
    const hay = norm(out, r.case_insensitive);
    for (const v of r.values) {
      if (hay.includes(norm(v, r.case_insensitive))) {
        return { rule: lbl, ok: false, msg: `forbidden "${v}" found` };
      }
    }
    return { rule: lbl, ok: true, msg: "no forbidden substrings" };
  }

  if (r.type === "required_phrase") {
    const hay = norm(out, r.case_insensitive);
    for (const v of r.values) {
      if (!hay.includes(norm(v, r.case_insensitive))) {
        return { rule: lbl, ok: false, msg: `missing "${v}"` };
      }
    }
    return { rule: lbl, ok: true, msg: "required phrases present" };
  }

  if (r.type === "starts_with") {
    const ok = out.trimStart().startsWith(r.value);
    return {
      rule: lbl,
      ok,
      msg: ok ? `starts with "${r.value}"` : `must start with "${r.value}"`,
    };
  }

  if (r.type === "ends_with") {
    const ok = out.trimEnd().endsWith(r.value);
    return {
      rule: lbl,
      ok,
      msg: ok ? `ends with "${r.value}"` : `must end with "${r.value}"`,
    };
  }

  if (r.type === "max_chars") {
    const n = out.length;
    const ok = n <= r.value;
    return {
      rule: lbl,
      ok,
      msg: ok ? `${n} chars ok` : `${n} chars, max ${r.value}`,
    };
  }

  if (r.type === "line_count") {
    const n = lines(out).length;
    if (r.exact != null && n !== r.exact) {
      return { rule: lbl, ok: false, msg: `got ${n} lines, need ${r.exact}` };
    }
    if (r.min != null && n < r.min) {
      return { rule: lbl, ok: false, msg: `got ${n} lines, min ${r.min}` };
    }
    if (r.max != null && n > r.max) {
      return { rule: lbl, ok: false, msg: `got ${n} lines, max ${r.max}` };
    }
    return { rule: lbl, ok: true, msg: `${n} lines ok` };
  }

  return { rule: lbl, ok: false, msg: "unknown rule" };
}

export function verifyInstruction(
  out: string,
  rules: InstructionRule[],
): VerifierResult {
  const rs = rules.map((r) => checkRule(out, r));
  const okN = rs.filter((x) => x.ok).length;
  const passed = okN === rs.length;
  const score = rs.length ? Math.round((okN / rs.length) * 100) : 0;
  const details = rs
    .map((x) => `${x.ok ? "pass" : "fail"}: ${x.rule} | ${x.msg}`)
    .join("\n");

  return { passed, score, details, rules: rs };
}
