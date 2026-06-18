import { describe, expect, it } from "vitest";
import { verifyExactNumber } from "./math";

describe("math verifier", () => {
  it("passes on exact match", () => {
    const r = verifyExactNumber("56", "56");
    expect(r.passed).toBe(true);
    expect(r.score).toBe(100);
  });

  it("extracts number from prose", () => {
    const r = verifyExactNumber("The answer is 1024.", "1024");
    expect(r.passed).toBe(true);
  });

  it("fails on wrong number", () => {
    const r = verifyExactNumber("42", "55");
    expect(r.passed).toBe(false);
    expect(r.score).toBe(0);
  });

  it("fails when no number in output", () => {
    const r = verifyExactNumber("no idea", "12");
    expect(r.passed).toBe(false);
    expect(r.details).toMatch(/no number found/);
  });

  it("handles negative numbers", () => {
    const r = verifyExactNumber("-5", "-5");
    expect(r.passed).toBe(true);
  });
});
