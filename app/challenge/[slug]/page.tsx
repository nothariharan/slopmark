"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChallengeInfographic } from "@/components/ChallengeInfographic";
import { SvgThumb, extractSvg } from "@/components/SvgOutput";
import type { ChallengeResults, ChallengeRunRow } from "@/lib/challenges/types";

export default function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<ChallengeResults | null>(null);
  const [err, setErr] = useState("");
  const [openModel, setOpenModel] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/challenges/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "load failed"));
  }, [slug]);

  if (err) return <p className="p-8 text-red-400">{err}</p>;
  if (!data) return <p className="p-8 text-zinc-500 animate-pulse">loading challenge…</p>;

  const modelRuns = (label: string) =>
    data.runs.filter((r) => r.model_label === label);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/challenges" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← all challenges
        </Link>

        <header className="mt-4 mb-10">
          <p className="text-xs uppercase tracking-widest text-emerald-500/80">benchmark challenge</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.manifest.title}</h1>
          <p className="mt-2 text-zinc-400">{data.manifest.subtitle}</p>
          <p className="mt-4 max-w-2xl text-sm text-zinc-500">{data.manifest.description}</p>
          <p className="mt-3 text-xs text-zinc-600">
            harness: {data.manifest.harness_mode} · completed{" "}
            {new Date(data.completed_at).toLocaleString()}
          </p>
        </header>

        <ChallengeInfographic data={data} />

        <DrawingGallery data={data} />

        <section className="mt-16">
          <h2 className="mb-6 text-xl font-medium">per-model breakdown</h2>
          <div className="space-y-3">
            {data.summaries
              .sort((a, b) => b.pass_rate - a.pass_rate)
              .map((s) => (
                <div key={s.model_slug} className="border border-zinc-800 bg-zinc-950">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-900"
                    onClick={() =>
                      setOpenModel(openModel === s.model_label ? null : s.model_label)
                    }
                  >
                    <span className="font-medium">{s.model_label}</span>
                    <span className="text-sm text-zinc-400">
                      {s.passed}/{s.runs} passed · {Math.round(s.pass_rate * 100)}%
                    </span>
                  </button>
                  {openModel === s.model_label && (
                    <div className="border-t border-zinc-800 px-4 py-3 space-y-4">
                      {modelRuns(s.model_label).map((r) => (
                        <RunCard key={r.id} run={r} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}

/** when the runs are drawings, show them — a grid of model art per task */
function DrawingGallery({ data }: { data: ChallengeResults }) {
  const drawn = data.runs.filter((r) => !r.error && extractSvg(r.output));
  if (!drawn.length) return null;

  const tasks = data.manifest.tasks.filter((t) => drawn.some((r) => r.task_id === t.id));

  return (
    <section className="mt-16">
      <h2 className="text-xl font-medium">the gallery</h2>
      <p className="mt-1 text-sm text-zinc-500">
        every drawing, rendered exactly as the model coded it. judge them.
      </p>
      <div className="mt-8 space-y-10">
        {tasks.map((t) => (
          <div key={t.id}>
            <h3 className="mb-3 font-mono text-sm text-zinc-400">{t.label}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {data.manifest.models.map((m) => {
                const run = drawn.find((r) => r.task_id === t.id && r.model_label === m.label);
                return run ? (
                  <SvgThumb key={m.slug} output={run.output} label={m.label} passed={run.passed} />
                ) : (
                  <div
                    key={m.slug}
                    className="flex aspect-square items-center justify-center border border-dashed border-zinc-900 text-[11px] text-zinc-700"
                  >
                    {m.label}: no drawing
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RunCard({ run }: { run: ChallengeRunRow }) {
  return (
    <div className="rounded border border-zinc-800 bg-black p-3 text-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs ${run.passed ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/40 text-red-300"}`}
        >
          {run.passed ? "pass" : "fail"}
        </span>
        <span className="text-zinc-300">{run.task_label}</span>
        <span className="text-xs text-zinc-600">{run.task_category}</span>
        <span className="text-xs text-zinc-500">{run.score}%</span>
      </div>
      {run.error ? (
        <p className="text-red-400 text-xs">{run.error}</p>
      ) : (
        <pre className="max-h-32 overflow-auto whitespace-pre-wrap text-xs text-zinc-500">
          {run.output.slice(0, 800)}
          {run.output.length > 800 ? "…" : ""}
        </pre>
      )}
    </div>
  );
}
