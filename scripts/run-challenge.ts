#!/usr/bin/env npx tsx
/**
 * Run a persisted benchmark challenge across AIML models.
 * usage: npx tsx scripts/run-challenge.ts [slug]
 */
import fs from "fs";
import path from "path";
import { runChallengeGrid } from "../lib/challenges/run";
import { smokeTestProvider } from "../lib/openrouter";
import {
  exportChallengeJson,
  loadManifest,
  saveChallengeToSqlite,
} from "../lib/challenges/store";

function loadEnvLocal() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env.local */
  }
}

async function main() {
  loadEnvLocal();
  const slug = process.argv[2] ?? "niche-sprint-v1";
  const manifest = await loadManifest(slug);
  if (!manifest) throw new Error(`challenge manifest not found: ${slug}`);
  if (!process.env.AIMLAPI_KEY) throw new Error("AIMLAPI_KEY not set in .env.local");

  console.log(`\n=== challenge: ${manifest.title} ===`);
  console.log(`${manifest.tasks.length} tasks × ${manifest.models.length} models\n`);

  const models = manifest.models.map((m) => ({
    kind: "slug" as const,
    slug: m.slug,
    label: m.label,
  }));

  for (const m of models) {
    process.stdout.write(`smoke ${m.label}… `);
    if (m.kind === "slug") {
      const pong = await smokeTestProvider(m.slug);
      if (!pong.ok) {
        console.log(`FAIL — ${pong.error}`);
        throw new Error(`model ${m.slug} failed smoke test`);
      }
    }
    console.log("ok");
  }

  const results = await runChallengeGrid(manifest, models);

  for (const r of results.runs) {
    const mark = r.passed ? `PASS ${r.score}%` : r.error ? `ERROR — ${r.error}` : `fail ${r.score}%`;
    console.log(`  ${r.model_label} · ${r.task_label} → ${mark}`);
  }

  await saveChallengeToSqlite(results);
  await exportChallengeJson(results);

  console.log("\n=== summaries ===");
  for (const s of results.summaries.sort((a, b) => b.pass_rate - a.pass_rate)) {
    console.log(
      `  ${s.model_label.padEnd(18)} ${s.passed}/${s.runs} (${Math.round(s.pass_rate * 100)}%) avg ${s.avg_score}`,
    );
  }
  console.log(`\nsaved: data/challenges/${slug}/results.json`);
  console.log(`view:  http://localhost:3000/challenge/${slug}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
