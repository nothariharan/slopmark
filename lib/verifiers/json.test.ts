import { describe, expect, it } from "vitest";
import { verifyJSON } from "./json";

const schema = {
  type: "object",
  required: ["name", "age"],
  properties: {
    name: { type: "string" },
    age: { type: "number" },
  },
};

describe("json verifier", () => {
  it("passes valid JSON matching the schema", () => {
    const r = verifyJSON('{"name":"alice","age":30}', schema);
    expect(r.passed).toBe(true);
    expect(r.score).toBe(100);
  });

  it("strips markdown fences before parsing", () => {
    const r = verifyJSON('```json\n{"name":"bob","age":25}\n```', schema);
    expect(r.passed).toBe(true);
  });

  it("fails on invalid JSON", () => {
    const r = verifyJSON("not json at all", schema);
    expect(r.passed).toBe(false);
    expect(r.score).toBe(0);
    expect(r.details).toMatch(/not valid JSON/);
  });

  it("fails valid JSON that doesn't match schema", () => {
    const r = verifyJSON('{"name":"alice"}', schema); // missing age
    expect(r.passed).toBe(false);
    expect(r.score).toBe(0);
  });

  it("fails when field has wrong type", () => {
    const r = verifyJSON('{"name":"alice","age":"thirty"}', schema);
    expect(r.passed).toBe(false);
  });
});
