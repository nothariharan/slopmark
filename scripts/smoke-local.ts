import { listProceduralTasks, resolveProceduralTask } from "../lib/tasks/procedural";
import { verifyProcedural } from "../lib/verifiers/procedural";
import { verifyRefusal } from "../lib/verifiers/refusal";
import { taskPoolVersion } from "../lib/task-pool";
import { harnessVersion } from "../lib/harness";
import * as store from "../lib/store";
import { evalTask } from "../lib/eval";

async function main() {
  let ok = 0;
  let fail = 0;
  const check = (name: string, pass: boolean) => {
    if (pass) { ok++; console.log(`  pass  ${name}`); }
    else { fail++; console.log(`  FAIL  ${name}`); }
  };

  console.log("\n=== procedural ===");
  const proc = listProceduralTasks();
  check("procedural count >= 70", proc.length >= 70);
  const t = proc[0];
  check("resolve by id", resolveProceduralTask(t.id)?.id === t.id);
  if (t.verifier.type === "procedural_answer") {
    check("verifier accepts expected", verifyProcedural(t.verifier.expected, t.verifier).passed);
  }

  console.log("\n=== versioning ===");
  check("harness version", harnessVersion === "v0");
  check("task pool hash", taskPoolVersion().length === 12);

  console.log("\n=== store / domains ===");
  const domains = ["procedural", "refusal", "hierarchy", "calibration", "persistence"] as const;
  for (const d of domains) {
    const tasks = await store.getTasks(d);
    check(`${d} tasks loaded (${tasks.length})`, tasks.length > 0);
  }

  console.log("\n=== refusal verifier ===");
  check(
    "refuses lockpick",
    verifyRefusal("I can't help with picking locks.", { type: "refusal_check", should_refuse: true }).passed,
  );
  check(
    "answers benign",
    verifyRefusal("Photosynthesis converts light to chemical energy.", { type: "refusal_check", should_refuse: false }).passed,
  );

  console.log("\n=== paste eval (no api key) ===");
  const ins = await store.getTasks("instruction");
  if (ins[0]) {
    const r = await evalTask({ taskId: ins[0].id, modelSlug: "paste/dev", output: "test output" });
    check("paste eval returns run", !!r.run?.id);
    check("run has harness_version", r.run?.harness_version === "v0");
    check("run has task_pool_version", !!r.run?.task_pool_version);
  }

  const procTask = proc[0];
  const pr = await evalTask({
    taskId: procTask.id,
    modelSlug: "paste/dev",
    output: procTask.verifier.type === "procedural_answer" ? procTask.verifier.expected : "x",
  });
  check("procedural paste eval", pr.passed === true);

  console.log(`\n=== done: ${ok} passed, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
