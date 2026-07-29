import { NextResponse } from "next/server";
import { loadChallengeResults, listChallengeSlugs } from "@/lib/challenges/store-json";
import { listSessions, loadSession } from "@/lib/challenges/sessions";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
}

/** GET /api/export?kind=challenge|session&slug=...&format=json|csv */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") ?? "challenge";
  const slug = searchParams.get("slug");
  const format = (searchParams.get("format") ?? "json").toLowerCase();

  if (kind === "challenges") {
    const slugs = await listChallengeSlugs();
    return NextResponse.json({ slugs });
  }

  if (kind === "sessions" && !slug) {
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  }

  if (!slug) {
    return NextResponse.json({ error: "slug required (or kind=challenges|sessions)" }, { status: 400 });
  }

  if (kind === "session") {
    const session = await loadSession(slug);
    if (!session) return NextResponse.json({ error: "session not found" }, { status: 404 });
    if (format === "csv") {
      const rows = session.runs.map((r) => ({
        id: r.id,
        model: r.model_label,
        model_slug: r.model_slug,
        task_id: r.task_id,
        passed: r.passed,
        score: r.score,
        latency_ms: r.latency_ms,
        details: r.details,
      }));
      return new NextResponse(toCsv(rows), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${slug}.csv"`,
        },
      });
    }

    return NextResponse.json(session);
  }

  const data = await loadChallengeResults(slug);
  if (!data) return NextResponse.json({ error: "challenge not found" }, { status: 404 });

  if (format === "csv") {
    const rows = data.runs.map((r) => ({
      id: r.id,
      model: r.model_label,
      model_slug: r.model_slug,
      task_id: r.task_id,
      passed: r.passed,
      score: r.score,
      latency_ms: r.latency_ms,
      details: r.details,
    }));
    return new NextResponse(toCsv(rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${slug}.csv"`,
      },
    });
  }

  return NextResponse.json(data);
}
