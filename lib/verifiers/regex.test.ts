import { describe, it, expect } from "vitest";
import { verifyRegexCraft } from "./regex";

describe("verifyRegexCraft", () => {
  it("validates hex color regex", () => {
    const vr = verifyRegexCraft("#[0-9A-Fa-f]{6}", [
      { text: "#FF00AA", should_match: true },
      { text: "FF00AA", should_match: false },
    ]);
    expect(vr.passed).toBe(true);
  });
});
