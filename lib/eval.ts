import { randomUUID } from "crypto";
import { pasteMeta, runModel, runModelMultiTurn } from "./openrouter";
import * as store from "./store";
import type { BenchTask, ChatMessage, Domain, EvalRun } from "./types";
import { runVerifier } from "./verifiers";
import { sysPrompt } from "./harness";

type RunInput = {
  taskId: string;
  modelSlug: string;
  output?: string;
};

export async function evalTask(inp: RunInput) {
  const task = await store.getTask(inp.taskId);
  if (!task) throw new Error("task not found");

  const slug = inp.modelSlug || "paste/dev";

  // sycophancy runs two turns — answer first, then get challenged
  if (task.verifier.type === "sycophancy_check") {
    if (inp.output) {
      // paste mode: skip the model, score whatever they pasted as turn 2
      const vr = runVerifier(inp.output, task.verifier);
      const run = mkRun(task, slug, inp.output, vr, pasteMeta());
      await store.addRun(run);
      return { ...vr, output: inp.output, meta: pasteMeta(), run };
    }

    const turn1 = await runModel(task.prompt, inp.modelSlug);
    const messages: ChatMessage[] = [
      { role: "system", content: sysPrompt },
      { role: "user", content: task.prompt },
      { role: "assistant", content: turn1.output },
      { role: "user", content: task.verifier.challenge },
    ];
    const turn2 = await runModelMultiTurn(messages, inp.modelSlug);
    const vr = runVerifier(turn2.output, task.verifier);
    const enrichedDetails = `[turn1]\n${turn1.output}\n[/turn1]\n${vr.details}`;
    const run = mkRun(task, slug, turn2.output, { ...vr, details: enrichedDetails }, turn2.meta);
    await store.addRun(run);
    return { ...vr, details: enrichedDetails, output: turn2.output, meta: turn2.meta, run };
  }

  // everything else is one shot
  let output = inp.output ?? "";
  let meta = pasteMeta();

  if (!inp.output) {
    const res = await runModel(task.prompt, inp.modelSlug);
    output = res.output;
    meta = res.meta;
  }

  const vr = runVerifier(output, task.verifier);
  const run = mkRun(task, slug, output, vr, meta);
  await store.addRun(run);

  return { ...vr, output, meta, run };
}

export async function evalSuite(modelSlug: string, domain: Domain = "instruction") {
  const tasks = await store.getTasks(domain);
  const runs: EvalRun[] = [];
  let passed = 0;
  let scoreSum = 0;

  for (const task of tasks) {
    const r = await evalTask({ taskId: task.id, modelSlug });
    runs.push(r.run);
    if (r.passed) passed += 1;
    scoreSum += r.score;
  }

  const total = tasks.length;
  return {
    modelSlug,
    domain,
    total,
    passed,
    passRate: total ? passed / total : 0,
    avgScore: total ? Math.round(scoreSum / total) : 0,
    runs,
  };
}

function mkRun(
  task: BenchTask,
  slug: string,
  output: string,
  vr: { passed: boolean; score: number; details: string },
  meta: { latency_ms: number; input_tokens: number; output_tokens: number; cost_usd: number },
): EvalRun {
  return {
    id: randomUUID(),
    task_id: task.id,
    domain: task.domain,
    model_slug: slug,
    output,
    passed: vr.passed,
    score: vr.score,
    details: vr.details,
    latency_ms: meta.latency_ms,
    input_tokens: meta.input_tokens,
    output_tokens: meta.output_tokens,
    cost_usd: meta.cost_usd,
    created_at: new Date().toISOString(),
  };
}
