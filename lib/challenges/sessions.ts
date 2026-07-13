import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { ChallengeResults } from "./types";

// ad-hoc playground runs land here as their own wall, kept apart from the
// curated challenges in data/challenges so nobody's junk run pollutes those
const root = path.join(process.cwd(), "data", "sessions");

export type SessionCard = {
  slug: string;
  title: string;
  subtitle: string;
  completed_at: string;
  models: number;
  tasks: number;
  winner?: string;
  best_pass_rate: number;
};

function sessionDir(slug: string) {
  return path.join(root, slug);
}

/** make a slug that wont clash with an earlier run of the same title */
export function sessionSlug(base: string): string {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${clean || "session"}-${randomUUID().slice(0, 6)}`;
}

export async function saveSession(results: ChallengeResults): Promise<void> {
  const dir = sessionDir(results.manifest.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "results.json"), JSON.stringify(results, null, 2), "utf8");
}

export async function loadSession(slug: string): Promise<ChallengeResults | null> {
  try {
    const raw = await fs.readFile(path.join(sessionDir(slug), "results.json"), "utf8");
    return JSON.parse(raw) as ChallengeResults;
  } catch {
    return null;
  }
}

export async function listSessions(): Promise<SessionCard[]> {
  let slugs: string[] = [];
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }

  const cards: SessionCard[] = [];
  for (const slug of slugs) {
    const data = await loadSession(slug);
    if (!data) continue;
    const top = [...data.summaries].sort((a, b) => b.pass_rate - a.pass_rate)[0];
    cards.push({
      slug,
      title: data.manifest.title,
      subtitle: data.manifest.subtitle,
      completed_at: data.completed_at,
      models: data.manifest.models.length,
      tasks: data.manifest.tasks.length,
      winner: top?.model_label,
      best_pass_rate: top?.pass_rate ?? 0,
    });
  }

  // newest first so the wall reads top-down
  return cards.sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}
