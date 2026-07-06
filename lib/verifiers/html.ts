import type { HtmlRule, VerifierResult } from "../types";

function stripFences(raw: string): string {
  const m = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : raw.trim();
}

function countTag(html: string, tag: string): number {
  const re = new RegExp(`<${tag}[\\s>]`, "gi");
  return (html.match(re) ?? []).length;
}

function hasAttr(html: string, tag: string, attr: string): boolean {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}\\s*=`, "i");
  return re.test(html);
}

function checkRule(html: string, r: HtmlRule): { ok: boolean; msg: string } {
  if (r.type === "contains_tag") {
    const n = countTag(html, r.tag);
    const need = r.min_count ?? 1;
    return n >= need
      ? { ok: true, msg: `<${r.tag}> x${n}` }
      : { ok: false, msg: `need ${need} <${r.tag}>, got ${n}` };
  }
  if (r.type === "attribute_exists") {
    const ok = hasAttr(html, r.tag, r.attr);
    return { ok, msg: ok ? `${r.tag}[${r.attr}] ok` : `missing ${r.attr} on <${r.tag}>` };
  }
  if (r.type === "required_substring") {
    const hay = r.case_insensitive ? html.toLowerCase() : html;
    const needle = r.case_insensitive ? r.value.toLowerCase() : r.value;
    const ok = hay.includes(needle);
    return { ok, msg: ok ? `found "${r.value}"` : `missing "${r.value}"` };
  }
  if (r.type === "forbidden_pattern") {
    const re = new RegExp(r.pattern, "i");
    const ok = !re.test(html);
    return { ok, msg: ok ? "forbidden pattern absent" : `matched forbidden /${r.pattern}/` };
  }
  return { ok: false, msg: "unknown rule" };
}

export function verifyHtml(out: string, rules: HtmlRule[]): VerifierResult {
  const html = stripFences(out);
  const rs = rules.map((r) => ({ rule: r.type, ...checkRule(html, r) }));
  const okN = rs.filter((x) => x.ok).length;
  const passed = okN === rs.length;
  const score = rs.length ? Math.round((okN / rs.length) * 100) : 0;
  const details = rs.map((x) => `${x.ok ? "pass" : "fail"}: ${x.rule} | ${x.msg}`).join("\n");
  return { passed, score, details };
}
