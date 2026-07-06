#!/usr/bin/env npx tsx
/**
 * run model suites and write data/baselines/latest.json
 * usage: npx tsx scripts/baseline.ts [--domain instruction] [--model slug]
 * needs OPENROUTER_API_KEY in env (or .env.local loaded by your shell)
 */
import fs from "fs/promises";
import path from "path";

import { evalSuite } from "../lib/eval";
import type { Domain } from "../lib/types";
import { models } from "../lib/models";
import { harnessVersion } from "../lib/harness";
import { taskPoolVersion } from "../lib/task-pool";

const DOMAINS: Domain[] = [
  "instruction",
  "json",
  "math",
  "sycophancy",
  "procedural",
  "refusal",
  "hierarchy",
  "calibration",
  "persistence",
];

async function main() {
  const args = process.argv.slice(2);
  const domainArg = args.includes("--domain") ? args[args.indexOf("--domain") + 1] as Domain : null;
  const modelArg = args.includes("--model") ? args[args.indexOf("--model") + 1] : null;

  const domains = domainArg ? [domainArg] : DOMAINS;
  const slugs = modelArg ? [modelArg] : models.map((m) => m.slug);

  const results: Record<string, Record<string, { passRate: number; avgScore: number; total: number; passed: number }>> = {};

  for (const slug of slugs) {
    results[slug] = {};
    for (const domain of domains) {
      console.log(`running ${slug} on ${domain}…`);
      try {
        const r = await evalSuite(slug, domain);
        if (r.total === 0) {
          console.log(`  skip — no tasks`);
          continue;
        }
        results[slug][domain] = {
          passRate: r.passRate,
          avgScore: r.avgScore,
          total: r.total,
          passed: r.passed,
        };
        console.log(`  ${r.passed}/${r.total} (${Math.round(r.passRate * 100)}%) avg ${r.avgScore}`);
      } catch (e) {
        console.error(`  failed:`, e instanceof Error ? e.message : e);
      }
    }
  }

  const outDir = path.join(process.cwd(), "data", "baselines");
  await fs.mkdir(outDir, { recursive: true });
  const payload = {
    generated_at: new Date().toISOString(),
    harness_version: harnessVersion,
    task_pool_version: taskPoolVersion(),
    results,
  };
  await fs.writeFile(path.join(outDir, "latest.json"), JSON.stringify(payload, null, 2));
  console.log(`\nwrote data/baselines/latest.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
