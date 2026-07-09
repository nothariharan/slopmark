import fs from "fs/promises";
import path from "path";
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

/** read committed results.json — safe for Vercel serverless (no sqlite) */
export async function loadChallengeResults(slug: string): Promise<ChallengeResults | null> {
  try {
    const raw = await fs.readFile(path.join(challengeDir(slug), "results.json"), "utf8");
    return JSON.parse(raw) as ChallengeResults;
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
