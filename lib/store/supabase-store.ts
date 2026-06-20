import { createClient } from "@supabase/supabase-js";
import type {
  BenchTask,
  Domain,
  EvalRun,
  LeaderboardRow,
  TaskPublic,
} from "../types";
import * as json from "./json-store";

function sb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getTasks(domain: Domain, difficulty?: string): Promise<BenchTask[]> {
  const c = sb();
  if (!c) return json.getTasks(domain, difficulty);

  let q = c.from("tasks").select("*").eq("domain", domain).eq("approved", true);
  if (difficulty) q = q.eq("difficulty", difficulty);
  const { data, error } = await q;

  if (error || !data?.length) return json.getTasks(domain, difficulty);
  return (data as BenchTask[]).filter((t) => !difficulty || t.difficulty === difficulty);
}

export async function getTask(id: string): Promise<BenchTask | null> {
  const c = sb();
  if (!c) return json.getTask(id);

  const { data } = await c.from("tasks").select("*").eq("id", id).maybeSingle();
  if (!data) return json.getTask(id);
  return data as BenchTask;
}

export function toPublic(t: BenchTask): TaskPublic {
  return json.toPublic(t);
}

export async function addRun(run: EvalRun) {
  const c = sb();
  if (!c) return json.addRun(run);

  const { error } = await c.from("eval_runs").insert({
    id: run.id,
    task_id: run.task_id,
    domain: run.domain,
    model_slug: run.model_slug,
    output: run.output,
    passed: run.passed,
    score: run.score,
    details: run.details,
    latency_ms: run.latency_ms,
    input_tokens: run.input_tokens,
    output_tokens: run.output_tokens,
    cost_usd: run.cost_usd,
    created_at: run.created_at,
  });

  if (error) return json.addRun(run);
}

export async function listRuns(limit = 10): Promise<EvalRun[]> {
  const c = sb();
  if (!c) return json.listRuns(limit);

  const { data, error } = await c
    .from("eval_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return json.listRuns(limit);
  return data as EvalRun[];
}

export async function getLeaderboard(domain: Domain): Promise<LeaderboardRow[]> {
  const c = sb();
  if (!c) return json.getLeaderboard(domain);

  const { data, error } = await c
    .from("model_leaderboard")
    .select("*")
    .eq("domain", domain)
    .order("pass_rate", { ascending: false })
    .order("avg_score", { ascending: false });

  if (error || !data) return json.getLeaderboard(domain);
  return data as LeaderboardRow[];
}
