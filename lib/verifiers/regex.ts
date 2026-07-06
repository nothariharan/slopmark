import type { VerifierResult } from "../types";

function extractPattern(raw: string): string {
  const line = raw.trim().split("\n")[0].trim();
  const fenced = line.match(/^`([^`]+)`$/);
  if (fenced) return fenced[1];
  if (line.startsWith("/") && line.lastIndexOf("/") > 0) {
    const end = line.lastIndexOf("/");
    return line.slice(1, end);
  }
  return line;
}

export function verifyRegexCraft(
  out: string,
  tests: { text: string; should_match: boolean }[],
): VerifierResult {
  const pattern = extractPattern(out);
  let re: RegExp;
  try {
    re = new RegExp(pattern);
  } catch {
    return { passed: false, score: 0, details: `invalid regex: ${pattern.slice(0, 60)}` };
  }

  const results = tests.map((t) => {
    const matched = re.test(t.text);
    const ok = matched === t.should_match;
    return {
      ok,
      msg: `"${t.text}" → ${matched ? "match" : "no match"} (want ${t.should_match ? "match" : "no match"})`,
    };
  });

  const okN = results.filter((r) => r.ok).length;
  const passed = okN === results.length;
  const score = results.length ? Math.round((okN / results.length) * 100) : 0;
  const details = results.map((r) => `${r.ok ? "pass" : "fail"}: ${r.msg}`).join("\n");
  return { passed, score, details };
}
