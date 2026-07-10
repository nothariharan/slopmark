import { randomUUID } from "crypto";
import { evalTask } from "../eval";
import { resolveRealshotTask } from "../realshot/tasks";
import * as store from "../store";
import type { ByokAgent } from "../byok";
import { byokSlug } from "../byok";
import { smokeTestProvider } from "../openrouter";
import { summarizeRuns } from "./store-json";
import type {
  ChallengeManifest,
  ChallengeModelRef,
  ChallengeResults,
  ChallengeRunRow,
} from "./types";

export type ChallengeModelInput =
  | { kind: "slug"; slug: string; label: string }
  | { kind: "byok"; agent: ByokAgent; label: string };

async function resolveTask(id: string) {
  const rs = await resolveRealshotTask(id);
  if (rs) return rs.task;
  return store.getTask(id);
}

export async function smokeChallengeModels(models: ChallengeModelInput[]) {
  for (const m of models) {
    if (m.kind === "slug") {
      const pong = await smokeTestProvider(m.slug);
      if (!pong.ok) throw new Error(`model ${m.slug} failed smoke: ${pong.error}`);
    } else {
      const { smokeTestDirect } = await import("../openrouter");
      const { providerConfig } = await import("../byok");
      const pong = await smokeTestDirect(m.agent.model, providerConfig(m.agent));
      if (!pong.ok) throw new Error(`model ${m.label} failed smoke: ${pong.error}`);
    }
  }
}

export async function runChallengeGrid(
  manifest: ChallengeManifest,
  models: ChallengeModelInput[],
): Promise<ChallengeResults> {
  const runs: ChallengeRunRow[] = [];
  let done = 0;
  const total = manifest.tasks.length * models.length;

  for (const model of models) {
    for (const tref of manifest.tasks) {
      done += 1;
      const task = await resolveTask(tref.id);
      if (!task) continue;

      const slug = model.kind === "byok" ? byokSlug(model.agent) : model.slug;
      const provider = model.kind === "byok" ? model.agent : undefined;

      try {
        const res = await evalTask({
          taskId: task.id,
          modelSlug: slug,
          harnessMode: manifest.harness_mode,
          provider,
        });
        runs.push({
          id: res.run?.id ?? randomUUID(),
          challenge_slug: manifest.slug,
          task_id: tref.id,
          task_label: tref.label,
          task_category: tref.category,
          task_prompt: task.prompt,
          model_slug: slug,
          model_label: model.label,
          output: res.output,
          passed: res.passed,
          score: res.score,
          details: res.details,
          latency_ms: res.meta.latency_ms,
          input_tokens: res.meta.input_tokens,
          output_tokens: res.meta.output_tokens,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "eval failed";
        runs.push({
          id: randomUUID(),
          challenge_slug: manifest.slug,
          task_id: tref.id,
          task_label: tref.label,
          task_category: tref.category,
          task_prompt: task.prompt,
          model_slug: slug,
          model_label: model.label,
          output: "",
          passed: false,
          score: 0,
          details: msg,
          latency_ms: 0,
          input_tokens: 0,
          output_tokens: 0,
          error: msg,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  const modelRefs: ChallengeModelRef[] = models.map((m) => ({
    slug: m.kind === "byok" ? byokSlug(m.agent) : m.slug,
    label: m.label,
  }));

  const fullManifest = { ...manifest, models: modelRefs };

  return {
    manifest: fullManifest,
    runs,
    summaries: summarizeRuns(runs, fullManifest),
    completed_at: new Date().toISOString(),
  };
}

export function manifestModelRefs(models: ChallengeModelInput[]): ChallengeModelRef[] {
  return models.map((m) => ({
    slug: m.kind === "byok" ? byokSlug(m.agent) : m.slug,
    label: m.label,
  }));
}

// re-export progress shape for cli logging
export type ChallengeProgress = { done: number; total: number; label: string; passed: boolean; score: number };
