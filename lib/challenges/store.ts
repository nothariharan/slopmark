import fs from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { challengeRuns, challenges } from "../db/schema";
import type {
  ChallengeManifest,
  ChallengeResults,
  ChallengeRunRow,
  ChallengeSummary,
} from "./types";

const root = path.join(process.cwd(), "data", "challenges");

export function challengeDir(slug: string) {
  return path.join(root, slug);
}

export async function loadManifest(slug: string): Promise<ChallengeManifest | null> {
  try {
    const raw = await fs.readFile(path.join(challengeDir(slug), "manifest.json"), "utf8");
    return JSON.parse(raw) as ChallengeManifest;
  } catch {
    return null;
  }
}

export function summarizeRuns(runs: ChallengeRunRow[], manifest: ChallengeManifest): ChallengeSummary[] {
  return manifest.models.map((m) => {
    const mr = runs.filter((r) => r.model_slug === m.slug);
    const passed = mr.filter((r) => r.passed).length;
    const runsN = mr.length;
    return {
      model_slug: m.slug,
      model_label: m.label,
      runs: runsN,
      passed,
      pass_rate: runsN ? passed / runsN : 0,
      avg_score: runsN ? Math.round(mr.reduce((s, r) => s + r.score, 0) / runsN) : 0,
      avg_latency_ms: runsN ? Math.round(mr.reduce((s, r) => s + r.latency_ms, 0) / runsN) : 0,
    };
  });
}

export async function saveChallengeToSqlite(results: ChallengeResults) {
  const m = results.manifest;
  await db.delete(challenges).where(eq(challenges.slug, m.slug));
  await db.insert(challenges).values({
    slug: m.slug,
    title: m.title,
    subtitle: m.subtitle,
    description: m.description,
    harness_mode: m.harness_mode,
    manifest_json: JSON.stringify(m),
    status: "complete",
    completed_at: results.completed_at,
    created_at: m.created_at,
  });

  await db.delete(challengeRuns).where(eq(challengeRuns.challenge_slug, m.slug));

  for (const r of results.runs) {
    await db.insert(challengeRuns).values({
      id: r.id,
      challenge_slug: r.challenge_slug,
      task_id: r.task_id,
      task_label: r.task_label,
      task_category: r.task_category,
      task_prompt: r.task_prompt,
      model_slug: r.model_slug,
      model_label: r.model_label,
      output: r.output,
      passed: r.passed,
      score: r.score,
      details: r.details,
      latency_ms: r.latency_ms,
      input_tokens: r.input_tokens,
      output_tokens: r.output_tokens,
      error: r.error ?? null,
      created_at: r.created_at,
    });
  }
}

export async function exportChallengeJson(results: ChallengeResults) {
  const dir = challengeDir(results.manifest.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "manifest.json"), JSON.stringify(results.manifest, null, 2));
  await fs.writeFile(path.join(dir, "results.json"), JSON.stringify(results, null, 2));
}

export async function loadChallengeResults(slug: string): Promise<ChallengeResults | null> {
  try {
    const raw = await fs.readFile(path.join(challengeDir(slug), "results.json"), "utf8");
    return JSON.parse(raw) as ChallengeResults;
  } catch {
    /* fall through to sqlite */
  }

  try {
    const [ch] = await db.select().from(challenges).where(eq(challenges.slug, slug));
    if (!ch) return null;
    const runs = await db.select().from(challengeRuns).where(eq(challengeRuns.challenge_slug, slug));
    const manifest = JSON.parse(ch.manifest_json) as ChallengeManifest;
    const rows: ChallengeRunRow[] = runs.map((r) => ({
      id: r.id,
      challenge_slug: r.challenge_slug,
      task_id: r.task_id,
      task_label: r.task_label,
      task_category: r.task_category,
      task_prompt: r.task_prompt,
      model_slug: r.model_slug,
      model_label: r.model_label,
      output: r.output,
      passed: r.passed,
      score: r.score,
      details: r.details,
      latency_ms: r.latency_ms,
      input_tokens: r.input_tokens,
      output_tokens: r.output_tokens,
      error: r.error ?? undefined,
      created_at: r.created_at,
    }));
    return {
      manifest,
      runs: rows,
      summaries: summarizeRuns(rows, manifest),
      completed_at: ch.completed_at ?? rows[0]?.created_at ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function listChallengeSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
