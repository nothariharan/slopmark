#!/usr/bin/env npx tsx
/**
 * flag tasks where sample models all pass or all fail
 * usage:
 *   npx tsx scripts/vet-tasks.ts --domain instruction
 *   npx tsx scripts/vet-tasks.ts --static   # ci-safe, no model calls
 */
import fs from "fs/promises";
import path from "path";
import * as store from "../lib/store";
import { evalTask } from "../lib/eval";
import { models } from "../lib/models";
import type { Domain } from "../lib/types";

const SAMPLE = models.slice(0, 3).map((m) => m.slug);

const REQUIRED = ["id", "domain", "prompt", "verifier"] as const;

async function vetStatic() {
  const root = path.join(process.cwd(), "data", "tasks");
  const files = (await fs.readdir(root)).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    console.error("no task files under data/tasks");
    process.exit(1);
  }

  let tasks = 0;
  const problems: string[] = [];

  for (const f of files) {
    const full = path.join(root, f);
    let raw: unknown;
    try {
      raw = JSON.parse(await fs.readFile(full, "utf8"));
    } catch (e) {
      problems.push(`${f}: invalid json (${e instanceof Error ? e.message : e})`);
      continue;
    }
    if (!Array.isArray(raw)) {
      problems.push(`${f}: expected array`);
      continue;
    }

    // thunderdome topics — side_a/side_b, not bench verifier contracts
    if (f === "debate.json") {
      for (let i = 0; i < raw.length; i++) {
        const t = raw[i] as Record<string, unknown>;
        tasks += 1;
        for (const key of ["id", "prompt", "side_a", "side_b"] as const) {
          if (t?.[key] == null || t[key] === "") {
            problems.push(`${f}[${i}]: missing ${key}`);
          }
        }
      }
      continue;
    }

    for (let i = 0; i < raw.length; i++) {
      const t = raw[i] as Record<string, unknown>;
      tasks += 1;
      for (const key of REQUIRED) {
        if (t?.[key] == null || t[key] === "") {
          problems.push(`${f}[${i}]: missing ${key}`);
        }
      }
      if (t?.id != null && typeof t.id !== "string") {
        problems.push(`${f}[${i}]: id must be string`);
      }
    }
  }

  console.log(`static vet: ${files.length} files · ${tasks} tasks`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    problems.slice(0, 40).forEach((p) => console.error(`  ${p}`));
    if (problems.length > 40) console.error(`  … +${problems.length - 40} more`);
    process.exit(1);
  }
  console.log("ok — every task file has the shape its route expects");
}

async function vetLive(domain: Domain) {
  const tasks = await store.getTasks(domain);

  console.log(`vetting ${tasks.length} tasks in ${domain} against ${SAMPLE.join(", ")}\n`);

  const noSignal: string[] = [];
  const allFail: string[] = [];

  for (const t of tasks) {
    let passed = 0;
    for (const slug of SAMPLE) {
      try {
        const r = await evalTask({ taskId: t.id, modelSlug: slug });
        if (r.passed) passed += 1;
      } catch {
        // skip model errors
      }
    }
    if (passed === SAMPLE.length) noSignal.push(t.id);
    if (passed === 0) allFail.push(t.id);
    process.stdout.write(`${t.id}: ${passed}/${SAMPLE.length}\n`);
  }

  console.log(`\nall pass (no discriminability): ${noSignal.length}`);
  noSignal.forEach((id) => console.log(`  ${id}`));
  console.log(`\nall fail: ${allFail.length}`);
  allFail.slice(0, 20).forEach((id) => console.log(`  ${id}`));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--static")) {
    await vetStatic();
    return;
  }
  const domain = (args.includes("--domain")
    ? args[args.indexOf("--domain") + 1]
    : "instruction") as Domain;
  await vetLive(domain);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
