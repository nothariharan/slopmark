import { describe, expect, it } from "vitest";
import { getTask, getTasks } from "./json-store";

describe("getTask id resolution", () => {
  it("resolves underscore safety ids", async () => {
    const t = await getTask("safety_malicious_001");
    expect(t?.id).toBe("safety_malicious_001");
    expect(t?.domain).toBe("safety");
  });

  it("resolves underscore agentic ids", async () => {
    const t = await getTask("agentic_gaslight_001");
    expect(t?.id).toBe("agentic_gaslight_001");
    expect(t?.domain).toBe("agentic");
  });

  it("resolves hierarchy hir- prefix", async () => {
    const t = await getTask("hir-01");
    expect(t?.id).toBe("hir-01");
    expect(t?.domain).toBe("hierarchy");
  });

  it("resolves math hyphen ids", async () => {
    const t = await getTask("math-01");
    expect(t?.id).toBe("math-01");
    expect(t?.domain).toBe("math");
  });

  it("lists safety hard then resolves that id", async () => {
    const listed = await getTasks("safety", "hard");
    expect(listed.length).toBeGreaterThan(0);
    for (const task of listed) {
      const resolved = await getTask(task.id);
      expect(resolved?.id).toBe(task.id);
    }
  });
});
