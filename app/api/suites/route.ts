import { NextResponse } from "next/server";
import { createSuite, getSuite, listSuites } from "@/lib/suites";
import { evalTask } from "@/lib/eval";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const suite = await getSuite(id);
    if (!suite) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ suite });
  }
  const publicOnly = searchParams.get("public") === "1";
  const suites = await listSuites(publicOnly);
  return NextResponse.json({ suites });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string | undefined;

    if (action === "run") {
      const { suiteId, modelSlug } = body;
      if (!suiteId || !modelSlug) {
        return NextResponse.json({ error: "suiteId and modelSlug required" }, { status: 400 });
      }
      const suite = await getSuite(suiteId);
      if (!suite) return NextResponse.json({ error: "suite not found" }, { status: 404 });

      let passed = 0;
      let scoreSum = 0;
      const runs = [];
      for (const taskId of suite.task_ids) {
        const r = await evalTask({ taskId, modelSlug });
        runs.push(r.run);
        if (r.passed) passed += 1;
        scoreSum += r.score;
      }
      const total = suite.task_ids.length;
      return NextResponse.json({
        suiteId,
        modelSlug,
        total,
        passed,
        passRate: total ? passed / total : 0,
        avgScore: total ? Math.round(scoreSum / total) : 0,
        runs,
      });
    }

    const { name, description, task_ids, is_public } = body;
    if (!name || !Array.isArray(task_ids) || !task_ids.length) {
      return NextResponse.json({ error: "name and task_ids required" }, { status: 400 });
    }
    const suite = await createSuite({ name, description, task_ids, is_public });
    return NextResponse.json({ suite });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
