import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const evalRuns = sqliteTable("eval_runs", {
  id: text("id").primaryKey(),
  task_id: text("task_id").notNull(),
  domain: text("domain").notNull(),
  model_slug: text("model_slug").notNull(),
  output: text("output").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  score: integer("score").notNull(),
  details: text("details").notNull(),
  latency_ms: integer("latency_ms").notNull(),
  input_tokens: integer("input_tokens").notNull(),
  output_tokens: integer("output_tokens").notNull(),
  cost_usd: real("cost_usd").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  created_at: text("created_at").notNull(),
});

export const arenaVotes = sqliteTable("arena_votes", {
  id: text("id").primaryKey(),
  task_id: text("task_id").notNull(),
  model_a: text("model_a").notNull(),
  model_b: text("model_b").notNull(),
  winner: text("winner").notNull(),
  created_at: text("created_at").notNull(),
});

export const reviewQueue = sqliteTable("review_queue", {
  id: text("id").primaryKey(),
  run_id: text("run_id").notNull(),
  task_id: text("task_id").notNull(),
  domain: text("domain").notNull(),
  model_slug: text("model_slug").notNull(),
  prompt: text("prompt").notNull(),
  output: text("output").notNull(),
  auto_score: integer("auto_score").default(0),
  vote_sum: integer("vote_sum").default(0),
  vote_count: integer("vote_count").default(0),
  status: text("status").default("pending"),
  created_at: text("created_at").notNull(),
});

export const communityTasks = sqliteTable("community_tasks", {
  id: text("id").primaryKey(),
  domain: text("domain").notNull(),
  prompt: text("prompt").notNull(),
  verifier: text("verifier").notNull(), // json string
  source: text("source").notNull().default("community"),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  created_at: text("created_at").notNull(),
});

export const challenges = sqliteTable("challenges", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  harness_mode: text("harness_mode").notNull().default("zero_context"),
  manifest_json: text("manifest_json").notNull(),
  status: text("status").notNull().default("complete"),
  completed_at: text("completed_at"),
  created_at: text("created_at").notNull(),
});

export const challengeRuns = sqliteTable("challenge_runs", {
  id: text("id").primaryKey(),
  challenge_slug: text("challenge_slug").notNull(),
  task_id: text("task_id").notNull(),
  task_label: text("task_label").notNull(),
  task_category: text("task_category").notNull(),
  task_prompt: text("task_prompt").notNull(),
  model_slug: text("model_slug").notNull(),
  model_label: text("model_label").notNull(),
  output: text("output").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  score: integer("score").notNull(),
  details: text("details").notNull(),
  latency_ms: integer("latency_ms").notNull(),
  input_tokens: integer("input_tokens").notNull(),
  output_tokens: integer("output_tokens").notNull(),
  error: text("error"),
  created_at: text("created_at").notNull(),
});
