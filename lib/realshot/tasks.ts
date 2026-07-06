import fs from "fs/promises";
import path from "path";
import type { BenchTask } from "../types";
import {
  generateProceduralTask,
  listProceduralTasks,
  PROCEDURAL_TEMPLATES,
  type ProceduralTemplate,
} from "../tasks/procedural";
import type { RealshotCategory } from "./types";

export type RealshotTask = BenchTask & {
  category?: RealshotCategory;
  label?: string;
};

const REALSHOT_CATEGORIES: RealshotCategory[] = [
  "constraint",
  "procedural",
  "json",
  "html",
  "extract",
  "regex",
];

let realshotCache: RealshotTask[] | null = null;

async function loadRealshotTasks(): Promise<RealshotTask[]> {
  if (realshotCache) return realshotCache;
  const raw = await fs.readFile(path.join(process.cwd(), "data", "tasks", "realshot.json"), "utf8");
  realshotCache = JSON.parse(raw) as RealshotTask[];
  return realshotCache;
}

async function loadJsonTasks(): Promise<BenchTask[]> {
  const raw = await fs.readFile(path.join(process.cwd(), "data", "tasks", "json.json"), "utf8");
  return JSON.parse(raw) as BenchTask[];
}

async function loadInstructionTasks(): Promise<BenchTask[]> {
  const raw = await fs.readFile(path.join(process.cwd(), "data", "tasks", "instruction.json"), "utf8");
  return JSON.parse(raw) as BenchTask[];
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function taskLabel(task: RealshotTask): string {
  if (task.label) return task.label;
  if (task.template_id) return task.template_id;
  return task.id;
}

export async function resolveRealshotTask(
  taskId: string,
): Promise<{ task: RealshotTask; category: RealshotCategory; seed: number } | null> {
  const parsed = taskId.match(/^proc-(.+)-(\d+)$/);
  if (parsed) {
    const template = parsed[1] as ProceduralTemplate;
    const seed = parseInt(parsed[2], 10);
    const task = generateProceduralTask(template, seed);
    return { task, category: "procedural", seed };
  }

  const realshot = await loadRealshotTasks();
  const rs = realshot.find((t) => t.id === taskId);
  if (rs) {
    return {
      task: rs,
      category: rs.category ?? "constraint",
      seed: 0,
    };
  }

  const json = await loadJsonTasks();
  const j = json.find((t) => t.id === taskId);
  if (j) return { task: j, category: "json", seed: 0 };

  return null;
}

export async function pickRealshotTask(
  category: RealshotCategory,
  seedInput?: number,
): Promise<{ task: RealshotTask; category: RealshotCategory; seed: number }> {
  const seed = seedInput ?? Math.floor(Math.random() * 1_000_000);
  const rnd = mulberry32(seed);

  let cat = category;
  if (cat === "random") {
    cat = pick(REALSHOT_CATEGORIES, rnd);
  }

  if (cat === "procedural") {
    const template = pick(
      PROCEDURAL_TEMPLATES.map((t) => t.id),
      rnd,
    ) as ProceduralTemplate;
    const meta = PROCEDURAL_TEMPLATES.find((t) => t.id === template)!;
    const procSeed = (seed % meta.seeds) + 1;
    const task = generateProceduralTask(template, procSeed);
    return { task, category: "procedural", seed: procSeed };
  }

  if (cat === "json") {
    const tasks = await loadJsonTasks();
    const pool = tasks.filter((t) => t.difficulty !== "easy" || rnd() > 0.3);
    const task = pick(pool.length ? pool : tasks, rnd);
    return { task, category: "json", seed };
  }

  if (cat === "constraint") {
    const realshot = await loadRealshotTasks();
    const curated = realshot.filter((t) => t.category === "constraint");
    if (curated.length && rnd() > 0.4) {
      const task = pick(curated, rnd);
      return { task, category: "constraint", seed };
    }
    const instructions = await loadInstructionTasks();
    const pool = instructions.filter(
      (t) => t.difficulty === "hard" || t.difficulty === "medium",
    );
    const task = pick(pool.length ? pool : instructions, rnd);
    return { task, category: "constraint", seed };
  }

  const realshot = await loadRealshotTasks();
  const pool = realshot.filter((t) => t.category === cat);
  if (!pool.length) {
    throw new Error(`no tasks for category ${cat}`);
  }
  const task = pick(pool, rnd);
  return { task, category: cat, seed };
}

export function maxTokensForCategory(category: RealshotCategory): number {
  if (category === "html") return 1200;
  return 600;
}

export { taskLabel, listProceduralTasks };
