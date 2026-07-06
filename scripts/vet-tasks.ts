#!/usr/bin/env npx tsx
/**
 * flag tasks where sample models all pass or all fail
 * usage: npx tsx scripts/vet-tasks.ts --domain instruction
 */
import * as store from "../lib/store";
import { evalTask } from "../lib/eval";
import { models } from "../lib/models";
import type { Domain } from "../lib/types";

const SAMPLE = models.slice(0, 3).map((m) => m.slug);

async function main() {
  const args = process.argv.slice(2);
  const domain = (args.includes("--domain") ? args[args.indexOf("--domain") + 1] : "instruction") as Domain;
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
