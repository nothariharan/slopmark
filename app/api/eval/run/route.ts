import { NextResponse } from "next/server";
import { evalTask } from "@/lib/eval";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const taskId = body.taskId as string;
    const modelSlug = body.modelSlug as string | undefined;
    const output = body.output as string | undefined;

    if (!taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    if (!output && !modelSlug) {
      return NextResponse.json({ error: "modelSlug or output required" }, { status: 400 });
    }

    const res = await evalTask({
      taskId,
      modelSlug: modelSlug ?? "paste/dev",
      output,
    });

    return NextResponse.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "eval failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
