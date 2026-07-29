#!/usr/bin/env npx tsx
/**
 * Run slop-chaos-v1 on Fireworks if FIREWORKS_API_KEY is set,
 * otherwise fall back to OpenRouter equivalents (needs OPENROUTER_API_KEY + allowlist).
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
import type { ChallengeManifest } from "../lib/challenges/types";

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

/** OpenRouter stand-ins when Fireworks key is absent */
const OR_FALLBACK: Record<string, { slug: string; label: string }> = {
  "fireworks/kimi-k3": { slug: "moonshotai/kimi-k3", label: "Kimi K3 (via OpenRouter)" },
  "fireworks/kimi-k2p6": { slug: "moonshotai/kimi-k2.6", label: "Kimi K2.6 (via OpenRouter)" },
  "fireworks/glm-5p2": { slug: "z-ai/glm-5.2", label: "GLM 5.2 (via OpenRouter)" },
  "fireworks/deepseek-v4-pro": { slug: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro (via OpenRouter)" },
  "fireworks/gpt-oss-120b": { slug: "openai/gpt-oss-120b", label: "GPT-OSS 120B (via OpenRouter)" },
};

async function main() {
  loadEnvLocal();
  const slug = "slop-chaos-v1";
  const base = await loadManifest(slug);
  if (!base) throw new Error(`manifest missing: ${slug}`);

  const useFw = Boolean(process.env.FIREWORKS_API_KEY);
  let manifest: ChallengeManifest = base;

  if (!useFw) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "Need FIREWORKS_API_KEY (preferred) or OPENROUTER_API_KEY in .env.local to run slop-chaos-v1",
      );
    }
    console.log("\n!! FIREWORKS_API_KEY missing — using OpenRouter equivalents for this run\n");
    const models = base.models.map((m) => {
      const fb = OR_FALLBACK[m.slug];
      if (!fb) throw new Error(`no OpenRouter fallback for ${m.slug}`);
      return { slug: fb.slug, label: fb.label };
    });
    process.env.OPENROUTER_ALLOWLIST = models.map((m) => m.slug).join(",");
    manifest = {
      ...base,
      subtitle: base.subtitle + " · OpenRouter fallback (no Fireworks key)",
      models,
    };
  } else {
    console.log("\nusing Fireworks serverless panel\n");
  }

  console.log(`=== challenge: ${manifest.title} ===`);
  console.log(`${manifest.tasks.length} tasks × ${manifest.models.length} models\n`);

  const models = manifest.models.map((m) => ({
    kind: "slug" as const,
    slug: m.slug,
    label: m.label,
  }));

  for (const m of models) {
    process.stdout.write(`smoke ${m.label}… `);
    const pong = await smokeTestProvider(m.slug);
    if (!pong.ok) {
      console.log(`FAIL — ${pong.error}`);
      throw new Error(`model ${m.slug} failed smoke: ${pong.error}`);
    }
    console.log("ok");
  }

  const results = await runChallengeGrid(manifest, models);
  // keep the challenge slug stable for the UI even if models were remapped
  results.manifest = { ...results.manifest, slug };

  for (const r of results.runs) {
    const mark = r.passed ? `PASS ${r.score}%` : r.error ? `ERROR — ${r.error}` : `fail ${r.score}%`;
    console.log(`  ${r.model_label} · ${r.task_label} → ${mark}`);
  }

  await saveChallengeToSqlite(results);
  await exportChallengeJson(results);

  console.log("\n=== summaries ===");
  for (const s of results.summaries.sort((a, b) => b.pass_rate - a.pass_rate)) {
    console.log(
      `  ${s.model_label.padEnd(28)} ${s.passed}/${s.runs} (${Math.round(s.pass_rate * 100)}%) avg ${s.avg_score}`,
    );
  }
  console.log(`\nsaved: data/challenges/${slug}/results.json`);
  console.log(`view:  http://localhost:3000/challenge/${slug}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
