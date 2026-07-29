import { describe, expect, it } from "vitest";
import { verifyCalibration } from "./calibration";

describe("verifyCalibration", () => {
  it("accepts formal ANSWER | CONFIDENCE format", () => {
    const r = verifyCalibration("ANSWER: Paris | CONFIDENCE: 90", "paris");
    expect(r.passed).toBe(true);
    expect(r.details).toContain("confidence:90");
  });

  it("accepts freeform answer then confidence line", () => {
    const r = verifyCalibration("Paris\n85", "paris");
    expect(r.passed).toBe(true);
    expect(r.details).toContain("confidence:85");
  });

  it("fails wrong answer even when format is valid", () => {
    const r = verifyCalibration("ANSWER: Lyon | CONFIDENCE: 70", "paris");
    expect(r.passed).toBe(false);
    expect(r.score).toBe(0);
  });

  it("rejects missing confidence", () => {
    const r = verifyCalibration("just paris", "paris");
    expect(r.passed).toBe(false);
    expect(r.details).toContain("format_error");
  });
});
