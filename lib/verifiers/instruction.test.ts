import { describe, expect, it } from "vitest";
import { verifyInstruction } from "./instruction";

describe("instruction verifier", () => {
  it("checks exact word count", () => {
    const out = "one two three four five";
    const r = verifyInstruction(out, [{ type: "word_count", exact: 5 }]);
    expect(r.passed).toBe(true);
    expect(r.score).toBe(100);
  });

  it("fails wrong word count", () => {
    const r = verifyInstruction("one two", [{ type: "word_count", exact: 5 }]);
    expect(r.passed).toBe(false);
  });

  it("checks paragraphs", () => {
    const out = "first block\n\nsecond block\n\nthird block";
    const r = verifyInstruction(out, [{ type: "paragraph_count", exact: 3 }]);
    expect(r.passed).toBe(true);
  });

  it("blocks forbidden substrings", () => {
    const r = verifyInstruction("hello world", [
      { type: "forbidden_substring", values: ["world"] },
    ]);
    expect(r.passed).toBe(false);
  });

  it("requires phrases", () => {
    const r = verifyInstruction("the quantum field", [
      { type: "required_phrase", values: ["quantum"] },
    ]);
    expect(r.passed).toBe(true);
  });

  it("checks prefix and suffix", () => {
    const out = "Summary: all good here.\nDone.";
    const r = verifyInstruction(out, [
      { type: "starts_with", value: "Summary:" },
      { type: "ends_with", value: "Done." },
    ]);
    expect(r.passed).toBe(true);
  });

  it("scores partial multi-rule pass", () => {
    const r = verifyInstruction("short", [
      { type: "word_count", exact: 1 },
      { type: "max_chars", value: 3 },
    ]);
    expect(r.passed).toBe(false);
    expect(r.score).toBe(50);
  });
});
