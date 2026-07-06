import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { evalRuns, reviewQueue, communityTasks } from "../db/schema";
import type { BenchTask, Domain, EvalRun, LeaderboardRow, TaskPublic } from "../types";
import { MIN_RUNS } from "../types";
import * as json from "./json-store";

export type ReviewItem = {
  id: string;
  run_id: string;
  task_id: string;
  domain: string;
  model_slug: string;
  prompt: string;
  output: string;
  auto_score: number;
  vote_sum: number;
  vote_count: number;
  status: string;
  created_at: string;
};

export async function getTasks(domain: Domain, difficulty?: string): Promise<BenchTask[]> {
  return json.getTasks(domain, difficulty);
}

export async function getTask(id: string): Promise<BenchTask | null> {
  return json.getTask(id);
}

export function toPublic(t: BenchTask): TaskPublic {
  return json.toPublic(t);
}

export async function addRun(run: EvalRun) {
  try {
    await db.insert(evalRuns).values({
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
  } catch (e) {
    console.error("failed to save run to sqlite", e);
  }
}

export async function updateRun(id: string, score: number, passed: boolean) {
  try {
    await db.update(evalRuns).set({ score, passed }).where(eq(evalRuns.id, id));
  } catch (e) {
    console.error("failed to update run", e);
  }
}

export async function listRuns(limit = 10): Promise<EvalRun[]> {
  try {
    const res = await db.select().from(evalRuns).orderBy(desc(evalRuns.created_at)).limit(limit);
    return res as EvalRun[];
  } catch {
    return [];
  }
}

export async function getLeaderboard(domain: Domain): Promise<LeaderboardRow[]> {
  try {
    const res = await db
      .select({
        model_slug: evalRuns.model_slug,
        runs: sql<number>`count(*)`.as("runs"),
        pass_rate: sql<number>`avg(case when passed = 1 then 1.0 else 0.0 end)`.as("pass_rate"),
        avg_score: sql<number>`avg(score)`.as("avg_score"),
        avg_latency_ms: sql<number>`avg(latency_ms)`.as("avg_latency_ms"),
        avg_cost_usd: sql<number>`avg(cost_usd)`.as("avg_cost_usd"),
        avg_output_tokens: sql<number>`avg(output_tokens)`.as("avg_output_tokens"),
      })
      .from(evalRuns)
      .where(eq(evalRuns.domain, domain))
      .groupBy(evalRuns.model_slug)
      .having(sql`count(*) >= ${MIN_RUNS}`)
      .orderBy(sql`pass_rate desc`, sql`avg_score desc`);

    return res.map((r) => ({
      model_slug: r.model_slug,
      domain,
      runs: Number(r.runs),
      pass_rate: Number(r.pass_rate),
      avg_score: Number(r.avg_score),
      avg_latency_ms: Number(r.avg_latency_ms),
      avg_cost_usd: Number(r.avg_cost_usd),
      avg_output_tokens: Number(r.avg_output_tokens),
    }));
  } catch {
    return [];
  }
}

export async function getLeaderboardAggregate(): Promise<LeaderboardRow[]> {
  try {
    const res = await db
      .select({
        model_slug: evalRuns.model_slug,
        runs: sql<number>`count(*)`.as("runs"),
        pass_rate: sql<number>`avg(case when passed = 1 then 1.0 else 0.0 end)`.as("pass_rate"),
        avg_score: sql<number>`avg(score)`.as("avg_score"),
        avg_latency_ms: sql<number>`avg(latency_ms)`.as("avg_latency_ms"),
        avg_cost_usd: sql<number>`avg(cost_usd)`.as("avg_cost_usd"),
        avg_output_tokens: sql<number>`avg(output_tokens)`.as("avg_output_tokens"),
      })
      .from(evalRuns)
      .groupBy(evalRuns.model_slug)
      .having(sql`count(*) >= ${MIN_RUNS}`)
      .orderBy(sql`pass_rate desc`);

    return res.map((r) => ({
      model_slug: r.model_slug,
      domain: "instruction" as Domain,
      runs: Number(r.runs),
      pass_rate: Number(r.pass_rate),
      avg_score: Number(r.avg_score),
      avg_latency_ms: Number(r.avg_latency_ms),
      avg_cost_usd: Number(r.avg_cost_usd),
      avg_output_tokens: Number(r.avg_output_tokens),
    }));
  } catch {
    return [];
  }
}

export async function addReviewItem(item: ReviewItem) {
  try {
    await db.insert(reviewQueue).values(item);
  } catch (e) {
    console.error("failed to add review item", e);
  }
}

export async function getReviewItems(limit = 20): Promise<ReviewItem[]> {
  try {
    const res = await db
      .select()
      .from(reviewQueue)
      .where(eq(reviewQueue.status, "pending"))
      .orderBy(desc(reviewQueue.created_at))
      .limit(limit);
    return res as ReviewItem[];
  } catch {
    return [];
  }
}

export async function voteReview(id: string, score: number, runId: string) {
  try {
    const [item] = await db.select().from(reviewQueue).where(eq(reviewQueue.id, id));
    if (!item) return;

    const newVoteSum = (item.vote_sum ?? 0) + score;
    const newVoteCount = (item.vote_count ?? 0) + 1;
    const FINALIZE_AT = 3;

    if (newVoteCount >= FINALIZE_AT) {
      const finalScore = Math.round((newVoteSum / newVoteCount / 5) * 100);
      const passed = finalScore >= 60;
      await db
        .update(reviewQueue)
        .set({ vote_sum: newVoteSum, vote_count: newVoteCount, status: "reviewed" })
        .where(eq(reviewQueue.id, id));
      await updateRun(runId, finalScore, passed);
    } else {
      await db
        .update(reviewQueue)
        .set({ vote_sum: newVoteSum, vote_count: newVoteCount })
        .where(eq(reviewQueue.id, id));
    }
  } catch (e) {
    console.error("failed to vote on review", e);
  }
}

export async function addCommunityTask(task: {
  id: string;
  domain: string;
  prompt: string;
  verifier: string;
}) {
  try {
    await db.insert(communityTasks).values({
      ...task,
      source: "community",
      approved: false,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("failed to add community task", e);
  }
}

export async function getCommunityTasks(approved = false) {
  try {
    return await db.select().from(communityTasks).where(eq(communityTasks.approved, approved));
  } catch {
    return [];
  }
}

export async function getShameRuns(limit = 20) {
  try {
    return await db.select()
      .from(evalRuns)
      .where(eq(evalRuns.passed, false))
      .orderBy(desc(evalRuns.upvotes), desc(evalRuns.created_at))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function upvoteRun(id: string) {
  try {
    const [run] = await db.select().from(evalRuns).where(eq(evalRuns.id, id));
    if (run) {
      await db.update(evalRuns).set({ upvotes: run.upvotes + 1 }).where(eq(evalRuns.id, id));
    }
  } catch (e) {
    console.error("failed to upvote run", e);
  }
}
