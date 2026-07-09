#!/usr/bin/env npx tsx
/**
 * Run a persisted benchmark challenge across AIML models.
 * usage: npx tsx scripts/run-challenge.ts [slug]
 */
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { evalTask } from "../lib/eval";
import * as store from "../lib/store";
import { resolveRealshotTask } from "../lib/realshot/tasks";
import { smokeTestProvider } from "../lib/openrouter";
import {
  exportChallengeJson,
  loadManifest,
  saveChallengeToSqlite,
  summarizeRuns,
} from "../lib/challenges/store";
import type { ChallengeManifest, ChallengeResults, ChallengeRunRow } from "../lib/challenges/types";

function loadEnvLocal() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env.local */
  }
}

async function resolveTask(id: string) {
  const rs = await resolveRealshotTask(id);
  if (rs) return rs.task;
  return store.getTask(id);
}

async function main() {
  loadEnvLocal();
  const slug = process.argv[2] ?? "niche-sprint-v1";
  const manifest = await loadManifest(slug);
  if (!manifest) throw new Error(`challenge manifest not found: ${slug}`);
  if (!process.env.AIMLAPI_KEY) throw new Error("AIMLAPI_KEY not set in .env.local");

  console.log(`\n=== challenge: ${manifest.title} ===`);
  console.log(`${manifest.tasks.length} tasks × ${manifest.models.length} models\n`);

  for (const m of manifest.models) {
    process.stdout.write(`smoke ${m.label}… `);
    const pong = await smokeTestProvider(m.slug);
    if (!pong.ok) {
      console.log(`FAIL — ${pong.error}`);
      throw new Error(`model ${m.slug} failed smoke test`);
    }
    console.log("ok");
  }

  const runs: ChallengeRunRow[] = [];
  let done = 0;
  const total = manifest.tasks.length * manifest.models.length;

  for (const model of manifest.models) {
    console.log(`\n--- ${model.label} ---`);
    for (const tref of manifest.tasks) {
      done += 1;
      process.stdout.write(`[${done}/${total}] ${tref.label}… `);
      const task = await resolveTask(tref.id);
      if (!task) {
        console.log("SKIP (task missing)");
        continue;
      }

      try {
        const res = await evalTask({
          taskId: task.id,
          modelSlug: model.slug,
          harnessMode: manifest.harness_mode,
        });
        const row: ChallengeRunRow = {
          id: res.run?.id ?? randomUUID(),
          challenge_slug: slug,
          task_id: tref.id,
          task_label: tref.label,
          task_category: tref.category,
          task_prompt: task.prompt,
          model_slug: model.slug,
          model_label: model.label,
          output: res.output,
          passed: res.passed,
          score: res.score,
          details: res.details,
          latency_ms: res.meta.latency_ms,
          input_tokens: res.meta.input_tokens,
          output_tokens: res.meta.output_tokens,
          created_at: new Date().toISOString(),
        };
        runs.push(row);
        console.log(res.passed ? `PASS ${res.score}%` : `fail ${res.score}%`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "eval failed";
        runs.push({
          id: randomUUID(),
          challenge_slug: slug,
          task_id: tref.id,
          task_label: tref.label,
          task_category: tref.category,
          task_prompt: task.prompt,
          model_slug: model.slug,
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
        console.log(`ERROR — ${msg}`);
      }
    }
  }

  const results: ChallengeResults = {
    manifest,
    runs,
    summaries: summarizeRuns(runs, manifest),
    completed_at: new Date().toISOString(),
  };

  await saveChallengeToSqlite(results);
  await exportChallengeJson(results);

  console.log("\n=== summaries ===");
  for (const s of results.summaries.sort((a, b) => b.pass_rate - a.pass_rate)) {
    console.log(
      `  ${s.model_label.padEnd(18)} ${s.passed}/${s.runs} (${Math.round(s.pass_rate * 100)}%) avg ${s.avg_score}`,
    );
  }
  console.log(`\nsaved: data/challenges/${slug}/results.json`);
  console.log(`view:  http://localhost:3000/challenge/${slug}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
