#!/usr/bin/env npx tsx
/**
 * append new fireworks models onto an existing trap-season receipt
 *
 * we already burned 50 runs on the classic 5-model panel — this just
 * smokes + grids the extras and merges them into results.json so the
 * receipt grows without redoing kimi/gpt-oss/etc
 */
import fs from "fs";
import path from "path";
import { runChallengeGrid } from "../lib/challenges/run";
import { smokeTestProvider } from "../lib/openrouter";
import {
  exportChallengeJson,
  loadChallengeResults,
  loadManifest,
  saveChallengeToSqlite,
  summarizeRuns,
} from "../lib/challenges/store";
import { fireworksCursePanelExtras } from "../lib/fireworks-models";

const SLUG = "trap-season-v2";

function loadEnvLocal() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env.local */
  }
}

async function main() {
  loadEnvLocal();
  if (!process.env.FIREWORKS_API_KEY) {
    throw new Error("FIREWORKS_API_KEY required — extras are fireworks-only (no openrouter twins yet)");
  }

  const manifest = await loadManifest(SLUG);
  const existing = await loadChallengeResults(SLUG);
  if (!manifest || !existing) throw new Error(`missing ${SLUG} manifest/results`);

  // only run models that arent already on the receipt
  const have = new Set(existing.runs.map((r) => r.model_slug));
  const extras = fireworksCursePanelExtras.filter((m) => !have.has(m.slug));
  if (!extras.length) {
    console.log("nothing to add — extras already on the receipt");
    return;
  }

  console.log(`\nappending ${extras.length} fireworks models onto ${SLUG}\n`);
  const models = extras.map((m) => {
    const hit = manifest.models.find((x) => x.slug === m.slug);
    return {
      kind: "slug" as const,
      slug: m.slug,
      label: hit?.label ?? m.name,
    };
  });

  for (const m of models) {
    process.stdout.write(`smoke ${m.label}… `);
    const pong = await smokeTestProvider(m.slug);
    if (!pong.ok) {
      console.log(`FAIL — ${pong.error}`);
      throw new Error(`model ${m.slug} failed smoke: ${pong.error}`);
    }
    console.log("ok");
  }

  const partial = await runChallengeGrid(manifest, models);
  const runs = [...existing.runs, ...partial.runs];
  const results = {
    manifest,
    runs,
    summaries: summarizeRuns(runs, manifest),
    completed_at: new Date().toISOString(),
  };

  for (const r of partial.runs) {
    const mark = r.passed
      ? `PASS ${r.score}%`
      : r.error
        ? `ERROR — ${r.error}`
        : `fail ${r.score}%`;
    console.log(`  ${r.model_label} · ${r.task_label} → ${mark}`);
  }

  await saveChallengeToSqlite(results);
  await exportChallengeJson(results);

  console.log("\n=== summaries (full panel) ===");
  for (const s of results.summaries.sort((a, b) => b.pass_rate - a.pass_rate)) {
    console.log(
      `  ${s.model_label.padEnd(28)} ${s.passed}/${s.runs} (${Math.round(s.pass_rate * 100)}%) avg ${s.avg_score}`,
    );
  }
  console.log(`\nsaved: data/challenges/${SLUG}/results.json\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
