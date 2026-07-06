import { describe, it, expect } from "vitest";
import { verifyProcedural } from "./procedural";

describe("verifyProcedural", () => {
  it("yes_no", () => {
    expect(verifyProcedural("yes", { type: "procedural_answer", expected: "yes", mode: "yes_no" }).passed).toBe(true);
    expect(verifyProcedural("no", { type: "procedural_answer", expected: "yes", mode: "yes_no" }).passed).toBe(false);
  });

  it("exact_number", () => {
    expect(verifyProcedural("The answer is 42", { type: "procedural_answer", expected: "42", mode: "exact_number" }).passed).toBe(true);
  });

  it("contains direction", () => {
    expect(verifyProcedural("north", { type: "procedural_answer", expected: "north", mode: "contains" }).passed).toBe(true);
  });

  it("time", () => {
    expect(verifyProcedural("3:45 PM", { type: "procedural_answer", expected: "3:45 PM", mode: "time" }).passed).toBe(true);
  });
});
