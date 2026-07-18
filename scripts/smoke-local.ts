import fs from "fs";
import path from "path";
import { listProceduralTasks, resolveProceduralTask } from "../lib/tasks/procedural";
import { verifyProcedural } from "../lib/verifiers/procedural";
import { verifyRefusal } from "../lib/verifiers/refusal";
import { taskPoolVersion } from "../lib/task-pool";
import { harnessVersion } from "../lib/harness";
import * as store from "../lib/store";
import { evalTask } from "../lib/eval";

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

loadEnvLocal();

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

  console.log("\n=== realshot ===");
  const { pickRealshotTask, resolveRealshotTask } = await import("../lib/realshot/tasks");
  const { verifyHtml } = await import("../lib/verifiers/html");
  const { verifyRegexCraft } = await import("../lib/verifiers/regex");

  for (const cat of ["html", "extract", "regex", "constraint", "procedural", "json"] as const) {
    const picked = await pickRealshotTask(cat, 12345);
    check(`pick ${cat} task`, !!picked.task.prompt && !!picked.task.verifier);
  }

  const rematch = await resolveRealshotTask("rs-extract-01");
  check("resolve rs-extract-01", rematch?.task.id === "rs-extract-01");

  const landing = await resolveRealshotTask("rs-html-01");
  if (landing?.task.verifier.type === "html_contract") {
    const sample = `<!DOCTYPE html><html><head><title>Slopmark</title></head><body><header>Slopmark</header><nav><a>1</a><a>2</a><a>3</a></nav><main><h1>hi</h1></main><footer>2026</footer></body></html>`;
    check("html verifier on landing sample", verifyHtml(sample, landing.task.verifier.rules).passed);
  }

  check(
    "regex verifier sample",
    verifyRegexCraft("#[0-9A-Fa-f]{6}", [{ text: "#FF00AA", should_match: true }]).passed,
  );

  {
    const { smokeTestProvider } = await import("../lib/openrouter");
    const pong = await smokeTestProvider("openrouter/free");
    check("openrouter free pong smoke", pong.ok);
  }

  if (process.env.AIMLAPI_KEY) {
    const { smokeTestProvider } = await import("../lib/openrouter");
    const pong = await smokeTestProvider("aiml/openai/gpt-4o-mini");
    check("aiml pong smoke", pong.ok);
  }

  console.log(`\n=== done: ${ok} passed, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
