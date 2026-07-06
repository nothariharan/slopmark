import { describe, it, expect } from "vitest";
import { verifyHtml } from "./html";

describe("verifyHtml", () => {
  it("checks tags and attributes", () => {
    const html = `<!DOCTYPE html><html><body><nav><a>1</a><a>2</a><a>3</a></nav><form><input type="email"><button type="submit">go</button></form></body></html>`;
    const vr = verifyHtml(html, [
      { type: "contains_tag", tag: "nav", min_count: 1 },
      { type: "contains_tag", tag: "a", min_count: 3 },
      { type: "attribute_exists", tag: "input", attr: "type" },
      { type: "required_substring", value: 'type="email"', case_insensitive: true },
    ]);
    expect(vr.passed).toBe(true);
  });

  it("strips markdown fences", () => {
    const vr = verifyHtml("```html\n<h1>hi</h1>\n```", [
      { type: "contains_tag", tag: "h1" },
    ]);
    expect(vr.passed).toBe(true);
  });
});
