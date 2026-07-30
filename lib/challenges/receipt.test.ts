import { describe, expect, it } from "vitest";
import {
  buildChallengeReceipt,
  pickSpecimenFail,
  taskFieldScores,
} from "./receipt";
import type { ChallengeResults } from "./types";

function fixture(): ChallengeResults {
  return {
    completed_at: "2026-07-29T12:00:00.000Z",
    manifest: {
      slug: "demo",
      title: "Demo Chaos",
      subtitle: "tiny fixture",
      description:
        "Haunted toasters. No e's. Mayonnaise JSON. Rules score — not another LLM.",
      harness_mode: "zero_context",
      created_at: "2026-07-29T00:00:00.000Z",
      models: [
        { slug: "a", label: "Model A" },
        { slug: "b", label: "Model B" },
      ],
      tasks: [
        { id: "wipe", label: "haunted toaster", category: "cursed", blurb: "stacked bans" },
        { id: "clear", label: "21 meme", category: "meme", blurb: "obey the meme" },
        { id: "split", label: "goose caps", category: "caps", blurb: "ALL CAPS" },
      ],
    },
    summaries: [
      {
        model_slug: "a",
        model_label: "Model A",
        runs: 3,
        passed: 2,
        pass_rate: 2 / 3,
        avg_score: 60,
        avg_latency_ms: 100,
      },
      {
        model_slug: "b",
        model_label: "Model B",
        runs: 3,
        passed: 1,
        pass_rate: 1 / 3,
        avg_score: 40,
        avg_latency_ms: 120,
      },
    ],
    runs: [
      {
        id: "1",
        challenge_slug: "demo",
        task_id: "wipe",
        task_label: "haunted toaster",
        task_category: "cursed",
        task_prompt: "ATTENTION…",
        model_slug: "a",
        model_label: "Model A",
        output: "Sorry I cannot help with that request.",
        passed: false,
        score: 0,
        details: "fail: word_count | got 7 words, need exactly 17\npass: forbidden_substring | ok",
        latency_ms: 10,
        input_tokens: 1,
        output_tokens: 1,
        created_at: "2026-07-29T12:00:00.000Z",
      },
      {
        id: "2",
        challenge_slug: "demo",
        task_id: "wipe",
        task_label: "haunted toaster",
        task_category: "cursed",
        task_prompt: "ATTENTION…",
        model_slug: "b",
        model_label: "Model B",
        output: "",
        passed: false,
        score: 0,
        details: "fail: starts_with | must start with \"ATTENTION:\"",
        latency_ms: 10,
        input_tokens: 1,
        output_tokens: 1,
        created_at: "2026-07-29T12:00:00.000Z",
      },
      {
        id: "3",
        challenge_slug: "demo",
        task_id: "clear",
        task_label: "21 meme",
        task_category: "meme",
        task_prompt: "9+10",
        model_slug: "a",
        model_label: "Model A",
        output: "21 meme",
        passed: true,
        score: 100,
        details: "pass: word_count | 2 words ok",
        latency_ms: 10,
        input_tokens: 1,
        output_tokens: 1,
        created_at: "2026-07-29T12:00:00.000Z",
      },
      {
        id: "4",
        challenge_slug: "demo",
        task_id: "clear",
        task_label: "21 meme",
        task_category: "meme",
        task_prompt: "9+10",
        model_slug: "b",
        model_label: "Model B",
        output: "21 meme",
        passed: true,
        score: 100,
        details: "pass: word_count | 2 words ok",
        latency_ms: 10,
        input_tokens: 1,
        output_tokens: 1,
        created_at: "2026-07-29T12:00:00.000Z",
      },
      {
        id: "5",
        challenge_slug: "demo",
        task_id: "split",
        task_label: "goose caps",
        task_category: "caps",
        task_prompt: "HONK",
        model_slug: "a",
        model_label: "Model A",
        output: "HONK POLICY LUNCH",
        passed: true,
        score: 100,
        details: "pass: required_phrase | ok",
        latency_ms: 10,
        input_tokens: 1,
        output_tokens: 1,
        created_at: "2026-07-29T12:00:00.000Z",
      },
      {
        id: "6",
        challenge_slug: "demo",
        task_id: "split",
        task_label: "goose caps",
        task_category: "caps",
        task_prompt: "HONK",
        model_slug: "b",
        model_label: "Model B",
        output: "honk policy",
        passed: false,
        score: 0,
        details: "fail: forbidden_substring | lowercase present",
        latency_ms: 10,
        input_tokens: 1,
        output_tokens: 1,
        created_at: "2026-07-29T12:00:00.000Z",
      },
    ],
  };
}

describe("challenge receipt", () => {
  it("flags universal wipeouts and clears", () => {
    const fields = taskFieldScores(fixture());
    expect(fields.find((f) => f.task.id === "wipe")?.pct).toBe(0);
    expect(fields.find((f) => f.task.id === "clear")?.pct).toBe(100);
    expect(fields.find((f) => f.task.id === "split")?.pct).toBe(50);
  });

  it("prefers wipeout + winner + non-empty output for specimen", () => {
    const specimen = pickSpecimenFail(fixture());
    expect(specimen?.task.id).toBe("wipe");
    expect(specimen?.run.model_slug).toBe("a");
    expect(specimen?.failLine).toMatch(/^fail: word_count/);
  });

  it("builds shareable receipt summary", () => {
    const receipt = buildChallengeReceipt(fixture());
    expect(receipt.winner?.model_slug).toBe("a");
    expect(receipt.wipeouts.map((w) => w.task.id)).toEqual(["wipe"]);
    expect(receipt.clears.map((c) => c.task.id)).toEqual(["clear"]);
    expect(receipt.specimen?.task.id).toBe("wipe");
    expect(receipt.shareText).toContain("Demo Chaos");
    expect(receipt.shareText).toContain("0 LLM judges");
  });
});
