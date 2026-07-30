import * as schema from "./schema";

/**
 * sqlite is for local/cli only. on vercel the filesystem is ephemeral and
 * better-sqlite3 native bindings are a footgun — routes that need persistence
 * must read committed JSON (challenges/sessions) or supabase instead.
 */
export const sqliteAvailable = !process.env.VERCEL;

type Db = import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema>;

function initDb(): Db {
  if (!sqliteAvailable) {
    return new Proxy({} as Db, {
      get(_target, prop) {
        // avoid looking like a thenable to async code
        if (prop === "then") return undefined;
        throw new Error("sqlite unavailable on vercel serverless");
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/better-sqlite3") as typeof import("drizzle-orm/better-sqlite3");

  const sqlite = new Database("data/local.db");

  // ensure all tables exist without requiring drizzle-kit push in dev
  sqlite.exec(`
  CREATE TABLE IF NOT EXISTS eval_runs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    model_slug TEXT NOT NULL,
    output TEXT NOT NULL,
    passed INTEGER NOT NULL,
    score INTEGER NOT NULL,
    details TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    harness_version TEXT NOT NULL DEFAULT 'v0',
    task_pool_version TEXT NOT NULL DEFAULT 'unknown',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS arena_votes (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    model_a TEXT NOT NULL,
    model_b TEXT NOT NULL,
    winner TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS review_queue (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    model_slug TEXT NOT NULL,
    prompt TEXT NOT NULL,
    output TEXT NOT NULL,
    auto_score INTEGER DEFAULT 0,
    vote_sum INTEGER DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS community_tasks (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    prompt TEXT NOT NULL,
    verifier TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'community',
    approved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS challenges (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    description TEXT NOT NULL,
    harness_mode TEXT NOT NULL DEFAULT 'zero_context',
    manifest_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'complete',
    completed_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS challenge_runs (
    id TEXT PRIMARY KEY,
    challenge_slug TEXT NOT NULL,
    task_id TEXT NOT NULL,
    task_label TEXT NOT NULL,
    task_category TEXT NOT NULL,
    task_prompt TEXT NOT NULL,
    model_slug TEXT NOT NULL,
    model_label TEXT NOT NULL,
    output TEXT NOT NULL,
    passed INTEGER NOT NULL,
    score INTEGER NOT NULL,
    details TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    error TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS challenge_runs_slug_idx ON challenge_runs (challenge_slug);
  CREATE INDEX IF NOT EXISTS challenge_runs_model_idx ON challenge_runs (challenge_slug, model_slug);
`);

  try {
    sqlite.exec(`ALTER TABLE eval_runs ADD COLUMN upvotes INTEGER NOT NULL DEFAULT 0;`);
  } catch {
    // column likely exists
  }

  // harness + pool versions used to get dropped on insert — keep them around
  // so local receipts match what supabase already stores
  for (const stmt of [
    `ALTER TABLE eval_runs ADD COLUMN harness_version TEXT NOT NULL DEFAULT 'v0';`,
    `ALTER TABLE eval_runs ADD COLUMN task_pool_version TEXT NOT NULL DEFAULT 'unknown';`,
  ]) {
    try {
      sqlite.exec(stmt);
    } catch {
      // column likely exists
    }
  }

  return drizzle(sqlite, { schema });
}

export const db = initDb();
