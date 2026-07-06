import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('data/local.db');

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
`);

try {
  sqlite.exec(`ALTER TABLE eval_runs ADD COLUMN upvotes INTEGER NOT NULL DEFAULT 0;`);
} catch {
  // column likely exists
}

export const db = drizzle(sqlite, { schema });
