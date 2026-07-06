import { randomUUID } from "crypto";
import { runModelDirect, type ProviderConfig } from "../openrouter";
import { runVerifier } from "../verifiers";
import type { HarnessMode } from "../types";
import {
  maxTokensForCategory,
  pickRealshotTask,
  resolveRealshotTask,
  taskLabel,
} from "./tasks";
import type { RealshotAgent, RealshotCategory, RealshotDuelResult, RealshotSide } from "./types";

function agentProvider(agent: RealshotAgent): ProviderConfig {
  return { baseURL: agent.baseURL.replace(/\/$/, ""), apiKey: agent.apiKey };
}

function pickWinner(a: RealshotSide, b: RealshotSide): "a" | "b" | "tie" {
  if (a.error && b.error) return "tie";
  if (a.error) return "b";
  if (b.error) return "a";
  if (a.score > b.score) return "a";
  if (b.score > a.score) return "b";
  if (a.passed && !b.passed) return "a";
  if (b.passed && !a.passed) return "b";
  return "tie";
}

async function runSide(
  agent: RealshotAgent,
  prompt: string,
  harnessMode: HarnessMode,
  maxTokens: number,
  verifier: Parameters<typeof runVerifier>[1],
): Promise<RealshotSide> {
  try {
    const { output, meta } = await runModelDirect(
      prompt,
      agent.model,
      agentProvider(agent),
      harnessMode,
      maxTokens,
    );
    const vr = runVerifier(output, verifier);
    return {
      name: agent.name,
      output,
      passed: vr.passed,
      score: vr.score,
      details: vr.details,
      rules: vr.rules,
      meta: {
        latency_ms: meta.latency_ms,
        input_tokens: meta.input_tokens,
        output_tokens: meta.output_tokens,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "model call failed";
    return {
      name: agent.name,
      output: "",
      passed: false,
      score: 0,
      details: msg,
      meta: { latency_ms: 0, input_tokens: 0, output_tokens: 0 },
      error: msg,
    };
  }
}

export type RunDuelInput = {
  agentA: RealshotAgent;
  agentB: RealshotAgent;
  category: RealshotCategory;
  harnessMode?: HarnessMode;
  seed?: number;
  taskId?: string;
};

export async function runRealshotDuel(inp: RunDuelInput): Promise<RealshotDuelResult> {
  const harnessMode = inp.harnessMode ?? "zero_context";

  const picked = inp.taskId
    ? await resolveRealshotTask(inp.taskId)
    : await pickRealshotTask(inp.category, inp.seed);

  if (!picked) throw new Error("task not found");

  const { task, category, seed } = picked;
  const maxTokens = maxTokensForCategory(category);

  const [agentA, agentB] = await Promise.all([
    runSide(inp.agentA, task.prompt, harnessMode, maxTokens, task.verifier),
    runSide(inp.agentB, task.prompt, harnessMode, maxTokens, task.verifier),
  ]);

  return {
    duelId: randomUUID(),
    category,
    harnessMode,
    seed,
    task: {
      id: task.id,
      label: taskLabel(task),
      prompt: task.prompt,
    },
    agentA,
    agentB,
    winner: pickWinner(agentA, agentB),
  };
}
