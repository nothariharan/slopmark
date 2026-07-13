import { NextResponse } from "next/server";
import { validateByokAgent } from "@/lib/byok";
import { runChallengeGrid, smokeChallengeModels, type ChallengeModelInput } from "@/lib/challenges/run";
import type { ChallengeManifest, ChallengeTaskRef } from "@/lib/challenges/types";
import { checkSuiteLimit, getIp } from "@/lib/rate-limit";
import { saveSession, sessionSlug } from "@/lib/challenges/sessions";
import type { HarnessMode } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const limit = checkSuiteLimit(ip);
    if (!limit.ok) {
      return NextResponse.json(
        { error: `rate limit — try again in ${limit.retryIn}s` },
        { status: 429 },
      );
    }

    const body = await req.json();
    const title = String(body.title ?? "custom challenge").trim();
    const subtitle = String(body.subtitle ?? "BYOK ad-hoc run").trim();
    const description = String(body.description ?? "").trim();
    const harness_mode = (body.harness_mode ?? "zero_context") as HarnessMode;
    const tasks = body.tasks as ChallengeTaskRef[] | undefined;
    const rawModels = body.models as unknown[] | undefined;

    if (!tasks?.length) {
      return NextResponse.json({ error: "tasks required" }, { status: 400 });
    }
    if (!rawModels?.length) {
      return NextResponse.json({ error: "models required" }, { status: 400 });
    }
    if (tasks.length > 15) {
      return NextResponse.json({ error: "max 15 tasks per ad-hoc run" }, { status: 400 });
    }
    if (rawModels.length > 6) {
      return NextResponse.json({ error: "max 6 models per ad-hoc run" }, { status: 400 });
    }

    const models: ChallengeModelInput[] = rawModels.map((m, i) => {
      const o = m as Record<string, unknown>;
      if (o.provider) {
        const agent = validateByokAgent(o.provider, `models[${i}]`);
        return { kind: "byok" as const, agent, label: String(o.label ?? agent.name) };
      }
      if (o.slug) {
        return { kind: "slug" as const, slug: String(o.slug), label: String(o.label ?? o.slug) };
      }
      throw new Error(`models[${i}] needs slug or provider`);
    });

    // always a fresh unique slug so each run becomes its own entry on the wall
    const slug = sessionSlug(body.slug ? String(body.slug) : title);

    const manifest: ChallengeManifest = {
      slug,
      title,
      subtitle,
      description: description || `${tasks.length} tasks · ${models.length} models · ad-hoc`,
      harness_mode,
      tasks,
      models: models.map((m) => ({
        slug: m.kind === "byok" ? `byok/${m.label}` : m.slug,
        label: m.label,
      })),
      created_at: new Date().toISOString(),
    };

    await smokeChallengeModels(models);
    const results = await runChallengeGrid(manifest, models);

    // persist so it shows up on the sessions wall (best-effort — read-only fs just no-ops)
    try {
      await saveSession(results);
    } catch (e) {
      console.error("failed to persist session", e);
    }

    return NextResponse.json(results);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "challenge run failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
