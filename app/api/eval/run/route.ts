import { NextResponse } from "next/server";
import { validateByokAgent, byokSlug, providerConfig } from "@/lib/byok";
import { evalTask, preparePrompt } from "@/lib/eval";
import * as store from "@/lib/store";
import { runModelStream, runModelStreamDirect } from "@/lib/openrouter";
import { runVerifier } from "@/lib/verifiers";
import { applyHostLimitCookie, checkLlmLimit } from "@/lib/rate-limit";
import { harnessLabel } from "@/lib/harness";
import { taskPoolVersion } from "@/lib/task-pool";
import type { HarnessMode } from "@/lib/types";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const taskId = body.taskId as string;
    const modelSlug = body.modelSlug as string | undefined;
    const output = body.output as string | undefined;
    const stream = body.stream as boolean | undefined;
    const harnessMode = body.harnessMode as HarnessMode | undefined;
    const provider = body.provider ? validateByokAgent(body.provider) : undefined;

    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });
    if (!output && !modelSlug && !provider) {
      return NextResponse.json({ error: "modelSlug, provider, or output required" }, { status: 400 });
    }

    // paste scoring doesn't burn the host key
    const hostFunded = !provider && !output;
    const limit = checkLlmLimit(req, { hostFunded, kind: "run" });
    if (!limit.ok) {
      return NextResponse.json(
        {
          error: hostFunded
            ? `free host tier — 1 request/minute. try again in ${limit.retryIn}s (or enable BYOK)`
            : `rate limit — try again in ${limit.retryIn}s`,
        },
        { status: 429 },
      );
    }

    const slug = provider ? byokSlug(provider) : (modelSlug ?? "paste/dev");

    if (!stream || output) {
      const res = await evalTask({
        taskId,
        modelSlug: slug,
        output,
        harnessMode,
        provider,
      });
      const json = NextResponse.json(res);
      if (hostFunded) applyHostLimitCookie(json, limit);
      return json;
    }

    // streaming mode
    const task = await store.getTask(taskId);
    if (!task) return NextResponse.json({ error: `task not found: ${taskId}` }, { status: 404 });
    const mode: HarnessMode =
      harnessMode ?? (task.domain === "zero_ctx" ? "zero_context" : "standard");

    const prompt = await preparePrompt(task);
    const { stream: oaiStream, t0 } = provider
      ? await runModelStreamDirect(prompt, provider.model, providerConfig(provider), mode)
      : await runModelStream(prompt, slug, mode);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullOutput = "";
        let meta = { latency_ms: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0 };

        try {
          for await (const chunk of oaiStream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              fullOutput += text;
              // sse format
              controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify(text)}\n\n`));
            }
            if (chunk.usage) {
              meta.input_tokens = chunk.usage.prompt_tokens;
              meta.output_tokens = chunk.usage.completion_tokens;
            }
          }

          meta.latency_ms = Date.now() - t0;

          // verify
          const vr = runVerifier(fullOutput, task.verifier);
          const run = {
            id: randomUUID(),
            task_id: task.id,
            domain: task.domain,
            model_slug: slug,
            output: fullOutput,
            passed: vr.passed,
            score: vr.score,
            details: vr.details,
            ...meta,
            harness_version: harnessLabel(mode),
            harness_mode: mode,
            task_pool_version: taskPoolVersion(),
            created_at: new Date().toISOString(),
          };
          await store.addRun(run);

          const finalRes = { ...vr, output: fullOutput, meta, run };
          controller.enqueue(encoder.encode(`event: result\ndata: ${JSON.stringify(finalRes)}\n\n`));
        } catch (e) {
          console.error("stream err", e);
        } finally {
          controller.close();
        }
      }
    });

    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };
    if (hostFunded && limit.setCookie) headers["Set-Cookie"] = limit.setCookie;

    return new Response(readable, { headers });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "eval failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
