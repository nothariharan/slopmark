import { createClient } from "@supabase/supabase-js";
import type {
  BenchTask,
  Domain,
  EvalRun,
  LeaderboardRow,
  TaskPublic,
} from "../types";
import { MIN_RUNS } from "../types";
import * as local from "./sqlite-store";
import type { ReviewItem } from "./sqlite-store";

function sb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getTasks(domain: Domain, difficulty?: string): Promise<BenchTask[]> {
  const c = sb();
  if (!c) return local.getTasks(domain, difficulty);

  let q = c.from("tasks").select("*").eq("domain", domain).eq("approved", true);
  if (difficulty) q = q.eq("difficulty", difficulty);
  const { data, error } = await q;

  if (error || !data?.length) return local.getTasks(domain, difficulty);
  return (data as BenchTask[]).filter((t) => !difficulty || t.difficulty === difficulty);
}

export async function getTask(id: string): Promise<BenchTask | null> {
  const c = sb();
  if (!c) return local.getTask(id);

  const { data } = await c.from("tasks").select("*").eq("id", id).maybeSingle();
  if (!data) return local.getTask(id);
  return data as BenchTask;
}

export function toPublic(t: BenchTask): TaskPublic {
  return local.toPublic(t);
}

export async function addRun(run: EvalRun) {
  const c = sb();
  if (!c) return local.addRun(run);

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
    harness_version: run.harness_version,
    task_pool_version: run.task_pool_version,
    created_at: run.created_at,
  });

  if (error) return local.addRun(run);
}

export async function updateRun(id: string, score: number, passed: boolean) {
  const c = sb();
  if (!c) return local.updateRun(id, score, passed);

  await c.from("eval_runs").update({ score, passed }).eq("id", id);
}

export async function listRuns(limit = 10): Promise<EvalRun[]> {
  const c = sb();
  if (!c) return local.listRuns(limit);

  const { data, error } = await c
    .from("eval_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return local.listRuns(limit);
  return data as EvalRun[];
}

export async function getLeaderboard(domain: Domain): Promise<LeaderboardRow[]> {
  const c = sb();
  if (!c) return local.getLeaderboard(domain);

  const { data, error } = await c
    .from("model_leaderboard")
    .select("*")
    .eq("domain", domain)
    .gte("runs", MIN_RUNS)
    .order("pass_rate", { ascending: false })
    .order("avg_score", { ascending: false });

  if (error || !data) return local.getLeaderboard(domain);
  return (data as LeaderboardRow[]).filter((r) => r.runs >= MIN_RUNS);
}

export async function getLeaderboardAggregate(): Promise<LeaderboardRow[]> {
  const c = sb();
  if (!c) return local.getLeaderboardAggregate();

  // Supabase: fall back to local aggregate since view is domain-specific
  return local.getLeaderboardAggregate();
}

export async function addReviewItem(item: ReviewItem) {
  const c = sb();
  if (!c) return local.addReviewItem(item);

  const { error } = await c.from("review_queue").insert(item);
  if (error) return local.addReviewItem(item);
}

export async function getReviewItems(limit = 20): Promise<ReviewItem[]> {
  const c = sb();
  if (!c) return local.getReviewItems(limit);

  const { data, error } = await c
    .from("review_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return local.getReviewItems(limit);
  return data as ReviewItem[];
}

export async function voteReview(id: string, score: number, runId: string) {
  const c = sb();
  if (!c) return local.voteReview(id, score, runId);
  // fall through to local for the full vote logic
  return local.voteReview(id, score, runId);
}

export async function addCommunityTask(task: {
  id: string;
  domain: string;
  prompt: string;
  verifier: string;
}) {
  const c = sb();
  if (!c) return local.addCommunityTask(task);

  const { error } = await c.from("community_tasks").insert({
    ...task,
    source: "community",
    approved: false,
    created_at: new Date().toISOString(),
  });
  if (error) {
    // fall back to sqlite, but surface failure if local also fails
    try {
      await local.addCommunityTask(task);
    } catch (localErr) {
      const detail = localErr instanceof Error ? localErr.message : String(localErr);
      throw new Error(`community task persist failed (supabase: ${error.message}; local: ${detail})`);
    }
  }
}
