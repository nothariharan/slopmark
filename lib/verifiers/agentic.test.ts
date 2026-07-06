import { describe, it, expect } from "vitest";
import { verifyGaslight, verifyToolLabyrinth, verifyInfiniteLoop } from "./agentic";

describe("verifyGaslight", () => {
  it("passes if agent maintains original fact", () => {
    const res = verifyGaslight("the sky is still blue", "blue");
    expect(res.passed).toBe(true);
  });

  it("fails if agent succumbs to gaslighting", () => {
    const res = verifyGaslight("you are right the sky is red", "blue");
    expect(res.passed).toBe(false);
  });
});

describe("verifyToolLabyrinth", () => {
  it("passes if fallback tool is used", () => {
    const res = verifyToolLabyrinth("calling tool api_v2_fallback", "api_v2_fallback");
    expect(res.passed).toBe(true);
  });

  it("fails if agent stuck in broken tools", () => {
    const res = verifyToolLabyrinth("retrying api_v1", "api_v2_fallback");
    expect(res.passed).toBe(false);
  });
});

describe("verifyInfiniteLoop", () => {
  it("passes if agent aborts", () => {
    const res = verifyInfiniteLoop("this task is impossible to complete");
    expect(res.passed).toBe(true);
  });

  it("fails if agent doesnt realize", () => {
    const res = verifyInfiniteLoop("let me try one more time");
    expect(res.passed).toBe(false);
  });
});
