import fs from "fs/promises";
import path from "path";
import type {
  BenchTask,
  Domain,
  EvalRun,
  LeaderboardRow,
  TaskPublic,
} from "../types";
import { MIN_RUNS } from "../types";

import { listProceduralTasks, resolveProceduralTask } from "../tasks/procedural";

const root = process.cwd();
const runsPath = path.join(root, "data", "eval-runs.json");

function taskFile(domain: Domain) {
  return path.join(root, "data", "tasks", `${domain}.json`);
}

let memRuns: EvalRun[] = [];
let loaded = false;

async function loadRuns() {
  if (loaded) return;
  try {
    const raw = await fs.readFile(runsPath, "utf8");
    memRuns = JSON.parse(raw) as EvalRun[];
  } catch {
    memRuns = [];
  }
  loaded = true;
}

async function saveRuns() {
  await fs.mkdir(path.dirname(runsPath), { recursive: true });
  await fs.writeFile(runsPath, JSON.stringify(memRuns, null, 2));
}

export async function getTasks(domain: Domain, difficulty?: string): Promise<BenchTask[]> {
  if (domain === "procedural") {
    return listProceduralTasks().filter((t) => !difficulty || t.difficulty === difficulty);
  }
  try {
    const raw = await fs.readFile(taskFile(domain), "utf8");
    return (JSON.parse(raw) as BenchTask[])
      .filter((t) => t.approved)
      .filter((t) => !difficulty || t.difficulty === difficulty);
  } catch {
    return [];
  }
}

export async function getTask(id: string): Promise<BenchTask | null> {
  if (id.startsWith("proc-")) {
    return resolveProceduralTask(id);
  }
  if (id.startsWith("rs-")) {
    const { resolveRealshotTask } = await import("../realshot/tasks");
    const resolved = await resolveRealshotTask(id);
    return resolved?.task ?? null;
  }
  const prefix = id.split("-")[0];
  const domainMap: Record<string, Domain> = {
    ins: "instruction",
    json: "json",
    math: "math",
    code: "coding",
    swe: "swe",
    wri: "writing",
    syc: "sycophancy",
    age: "agentic",
    saf: "safety",
    cal: "calibration",
    per: "persistence",
    ref: "refusal",
    zctx: "zero_ctx",
  };
  const domain = domainMap[prefix] ?? "instruction";
  const tasks = await getTasks(domain);
  return tasks.find((t) => t.id === id) ?? null;
}

export function toPublic(t: BenchTask): TaskPublic {
  return { id: t.id, domain: t.domain, prompt: t.prompt, source: t.source, difficulty: t.difficulty };
}

export async function addRun(run: EvalRun) {
  await loadRuns();
  memRuns.unshift(run);
  await saveRuns();
}

export async function updateRun(id: string, score: number, passed: boolean) {
  await loadRuns();
  const run = memRuns.find((r) => r.id === id);
  if (run) {
    run.score = score;
    run.passed = passed;
    await saveRuns();
  }
}

export async function listRuns(limit = 10): Promise<EvalRun[]> {
  await loadRuns();
  return memRuns.slice(0, limit);
}

export async function getLeaderboard(domain: Domain): Promise<LeaderboardRow[]> {
  await loadRuns();
  const map = new Map<string, LeaderboardRow>();

  for (const r of memRuns) {
    if (r.domain !== domain) continue;
    const cur = map.get(r.model_slug) ?? {
      model_slug: r.model_slug,
      domain,
      runs: 0,
      pass_rate: 0,
      avg_score: 0,
      avg_latency_ms: 0,
      avg_cost_usd: 0,
      avg_output_tokens: 0,
    };
    cur.runs += 1;
    cur.pass_rate += r.passed ? 1 : 0;
    cur.avg_score += r.score;
    cur.avg_latency_ms += r.latency_ms;
    cur.avg_cost_usd += r.cost_usd;
    cur.avg_output_tokens += r.output_tokens;
    map.set(r.model_slug, cur);
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      pass_rate: row.runs ? row.pass_rate / row.runs : 0,
      avg_score: row.runs ? row.avg_score / row.runs : 0,
      avg_latency_ms: row.runs ? row.avg_latency_ms / row.runs : 0,
      avg_cost_usd: row.runs ? row.avg_cost_usd / row.runs : 0,
      avg_output_tokens: row.runs ? row.avg_output_tokens / row.runs : 0,
    }))
    .filter((row) => row.runs >= MIN_RUNS)
    .sort((a, b) => b.pass_rate - a.pass_rate || b.avg_score - a.avg_score);
}

export async function getLeaderboardAggregate(): Promise<LeaderboardRow[]> {
  await loadRuns();
  const map = new Map<string, LeaderboardRow>();

  for (const r of memRuns) {
    const cur = map.get(r.model_slug) ?? {
      model_slug: r.model_slug,
      domain: "instruction" as Domain,
      runs: 0,
      pass_rate: 0,
      avg_score: 0,
      avg_latency_ms: 0,
      avg_cost_usd: 0,
      avg_output_tokens: 0,
    };
    cur.runs += 1;
    cur.pass_rate += r.passed ? 1 : 0;
    cur.avg_score += r.score;
    cur.avg_latency_ms += r.latency_ms;
    cur.avg_cost_usd += r.cost_usd;
    cur.avg_output_tokens += r.output_tokens;
    map.set(r.model_slug, cur);
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      pass_rate: row.runs ? row.pass_rate / row.runs : 0,
      avg_score: row.runs ? row.avg_score / row.runs : 0,
      avg_latency_ms: row.runs ? row.avg_latency_ms / row.runs : 0,
      avg_cost_usd: row.runs ? row.avg_cost_usd / row.runs : 0,
      avg_output_tokens: row.runs ? row.avg_output_tokens / row.runs : 0,
    }))
    .filter((row) => row.runs >= MIN_RUNS)
    .sort((a, b) => b.pass_rate - a.pass_rate);
}

// review queue — json-store uses a flat file for these too
const reviewPath = path.join(root, "data", "review-queue.json");
type ReviewItem = import("./sqlite-store").ReviewItem;

let memReview: ReviewItem[] = [];
let reviewLoaded = false;

async function loadReview() {
  if (reviewLoaded) return;
  try {
    const raw = await fs.readFile(reviewPath, "utf8");
    memReview = JSON.parse(raw) as ReviewItem[];
  } catch {
    memReview = [];
  }
  reviewLoaded = true;
}

async function saveReview() {
  await fs.mkdir(path.dirname(reviewPath), { recursive: true });
  await fs.writeFile(reviewPath, JSON.stringify(memReview, null, 2));
}

export async function addReviewItem(item: ReviewItem) {
  await loadReview();
  memReview.unshift(item);
  await saveReview();
}

export async function getReviewItems(limit = 20): Promise<ReviewItem[]> {
  await loadReview();
  return memReview.filter((i) => i.status === "pending").slice(0, limit);
}

export async function voteReview(id: string, score: number, runId: string) {
  await loadReview();
  const item = memReview.find((i) => i.id === id);
  if (!item) return;

  item.vote_sum = (item.vote_sum ?? 0) + score;
  item.vote_count = (item.vote_count ?? 0) + 1;

  const FINALIZE_AT = 3;
  if (item.vote_count >= FINALIZE_AT) {
    const finalScore = Math.round((item.vote_sum / item.vote_count / 5) * 100);
    item.status = "reviewed";
    await updateRun(runId, finalScore, finalScore >= 60);
  }

  await saveReview();
}
