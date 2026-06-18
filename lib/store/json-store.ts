import fs from "fs/promises";
import path from "path";
import type {
  BenchTask,
  Domain,
  EvalRun,
  LeaderboardRow,
  TaskPublic,
} from "../types";

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

export async function getTasks(domain: Domain): Promise<BenchTask[]> {
  try {
    const raw = await fs.readFile(taskFile(domain), "utf8");
    return (JSON.parse(raw) as BenchTask[]).filter((t) => t.approved);
  } catch {
    return [];
  }
}

export async function getTask(id: string): Promise<BenchTask | null> {
  // figure out domain from id prefix (ins-, json-, math-, etc.)
  const prefix = id.split("-")[0];
  const domainMap: Record<string, Domain> = {
    ins: "instruction",
    json: "json",
    math: "math",
    code: "coding",
  };
  const domain = domainMap[prefix] ?? "instruction";
  const tasks = await getTasks(domain);
  return tasks.find((t) => t.id === id) ?? null;
}

export function toPublic(t: BenchTask): TaskPublic {
  return { id: t.id, domain: t.domain, prompt: t.prompt, source: t.source };
}

export async function addRun(run: EvalRun) {
  await loadRuns();
  memRuns.unshift(run);
  await saveRuns();
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
    };
    cur.runs += 1;
    cur.pass_rate += r.passed ? 1 : 0;
    cur.avg_score += r.score;
    cur.avg_latency_ms += r.latency_ms;
    cur.avg_cost_usd += r.cost_usd;
    map.set(r.model_slug, cur);
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      pass_rate: row.runs ? row.pass_rate / row.runs : 0,
      avg_score: row.runs ? row.avg_score / row.runs : 0,
      avg_latency_ms: row.runs ? row.avg_latency_ms / row.runs : 0,
      avg_cost_usd: row.runs ? row.avg_cost_usd / row.runs : 0,
    }))
    .sort((a, b) => b.pass_rate - a.pass_rate || b.avg_score - a.avg_score);
}
