"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChallengeInfographic } from "@/components/ChallengeInfographic";
import { ChallengeReceiptHero } from "@/components/ChallengeReceiptHero";
import { SvgThumb, extractSvg } from "@/components/SvgOutput";
import { modelAnchorId } from "@/lib/challenges/receipt";
import type {
  ChallengeResults,
  ChallengeRunRow,
  ChallengeTaskRef,
} from "@/lib/challenges/types";

const CATEGORY_HELP: Record<string, string> = {
  cursed: "stacked silly constraints at once — count + banned words + fixed start/end",
  lipogram: "writing without a banned letter (here: no e). models leak the letter constantly",
  format: "shape obedience — questions only, fixed prefixes, exact paragraph layout",
  caps: "case lock — ALL CAPS, no lowercase anywhere",
  count: "counting / exact token output (classic F-count trap)",
  meme: "obey a joke instruction instead of being factually correct",
  taboo: "describe something without using the obvious words for it",
  json: "strict schema JSON — no markdown, no extra keys",
  lipogram_alt: "letter bans",
  roleplay: "stay in character while hitting hard rules",
};

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

        <header className="mt-4 mb-8">
          <p className="text-xs uppercase tracking-widest text-emerald-500/80">benchmark challenge</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.manifest.title}</h1>
          <p className="mt-2 text-zinc-400">{data.manifest.subtitle}</p>
          <p className="mt-3 text-xs text-zinc-600">
            harness: {data.manifest.harness_mode} · completed{" "}
            {new Date(data.completed_at).toLocaleString()}
          </p>
        </header>

        <ChallengeReceiptHero data={data} slug={slug} />

        <ChallengeInfographic data={data} />

        <TaskBriefing data={data} />

        <DrawingGallery data={data} />

        <section className="mt-16" id="models">
          <h2 className="mb-2 text-xl font-medium">per-model breakdown</h2>
          <p className="mb-6 text-sm text-zinc-500">
            expand a model to see the exact prompt, what the rule checker said, and the raw output
          </p>
          <div className="space-y-3">
            {data.summaries
              .sort((a, b) => b.pass_rate - a.pass_rate)
              .map((s) => (
                <div
                  key={s.model_slug}
                  id={modelAnchorId(s.model_slug)}
                  className="scroll-mt-24 border border-zinc-800 bg-zinc-950"
                >
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
                        <RunCard
                          key={r.id}
                          run={r}
                          blurb={data.manifest.tasks.find((t) => t.id === r.task_id)?.blurb}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-zinc-900 pt-6 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-700">
            export
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <a
              href={`/api/export?kind=challenge&slug=${encodeURIComponent(slug)}&format=json`}
              className="text-zinc-600 underline-offset-2 hover:text-zinc-400 hover:underline"
            >
              json
            </a>
            <a
              href={`/api/export?kind=challenge&slug=${encodeURIComponent(slug)}&format=csv`}
              className="text-zinc-600 underline-offset-2 hover:text-zinc-400 hover:underline"
            >
              csv
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

/** plain-english map of every trap so the short labels make sense */
function TaskBriefing({ data }: { data: ChallengeResults }) {
  const cats = [...new Set(data.manifest.tasks.map((t) => t.category))];
  const byId = new Map(data.runs.map((r) => [r.task_id, r.task_prompt]));

  return (
    <section className="mt-16 scroll-mt-24" id="briefing">
      <h2 className="text-xl font-medium">what these tasks actually are</h2>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        the short titles above are nicknames. each trap is a hard rule contract scored by a
        parser — not vibes, not another model. here is the human-readable brief.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {cats.map((c) => (
          <span
            key={c}
            className="border border-zinc-800 bg-zinc-950 px-2.5 py-1 font-mono text-[11px] text-zinc-400"
            title={CATEGORY_HELP[c] ?? c}
          >
            <span className="text-zinc-200">{c}</span>
            <span className="text-zinc-600"> — {CATEGORY_HELP[c] ?? "constraint trap"}</span>
          </span>
        ))}
      </div>

      <ol className="mt-8 space-y-4">
        {data.manifest.tasks.map((t, i) => (
          <TaskBriefRow
            key={t.id}
            index={i + 1}
            task={t}
            prompt={byId.get(t.id) ?? ""}
            passRate={taskPassRate(data, t.id)}
          />
        ))}
      </ol>
    </section>
  );
}

function taskPassRate(data: ChallengeResults, taskId: string) {
  const rows = data.runs.filter((r) => r.task_id === taskId);
  if (!rows.length) return null;
  const passed = rows.filter((r) => r.passed).length;
  return { passed, total: rows.length, pct: Math.round((passed / rows.length) * 100) };
}

function TaskBriefRow({
  index,
  task,
  prompt,
  passRate,
}: {
  index: number;
  task: ChallengeTaskRef;
  prompt: string;
  passRate: { passed: number; total: number; pct: number } | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li id={`task-${task.id}`} className="scroll-mt-24 border border-zinc-900 bg-zinc-950/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-900/50"
      >
        <span className="font-mono text-xs text-zinc-600 pt-0.5">{String(index).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-zinc-100">{task.label}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
              {task.category}
            </span>
            {passRate && (
              <span className="font-mono text-[10px] text-zinc-500">
                field: {passRate.passed}/{passRate.total} models ({passRate.pct}%)
              </span>
            )}
          </div>
          {task.blurb && (
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{task.blurb}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-zinc-600">{open ? "hide prompt" : "show prompt"}</span>
      </button>
      {open && prompt && (
        <pre className="border-t border-zinc-900 bg-black px-4 py-3 text-xs leading-relaxed text-zinc-500 whitespace-pre-wrap">
          {prompt}
        </pre>
      )}
    </li>
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
            {t.blurb && <p className="mb-3 text-xs text-zinc-600">{t.blurb}</p>}
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

function RunCard({ run, blurb }: { run: ChallengeRunRow; blurb?: string }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const failLines = (run.details || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("fail:"));
  const passLines = (run.details || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("pass:"));

  return (
    <div className="rounded border border-zinc-800 bg-black p-3 text-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs ${run.passed ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/40 text-red-300"}`}
        >
          {run.passed ? "pass" : "fail"}
        </span>
        {!run.passed && failLines.slice(0, 2).map((line) => (
          <span
            key={line}
            className="max-w-[14rem] truncate border border-red-950/60 bg-red-950/20 px-1.5 py-0.5 font-mono text-[10px] text-red-300/80"
            title={line}
          >
            {line.replace(/^fail:\s*/, "")}
          </span>
        ))}
        {run.passed && passLines.slice(0, 1).map((line) => (
          <span
            key={line}
            className="max-w-[14rem] truncate border border-emerald-950/60 bg-emerald-950/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300/80"
            title={line}
          >
            {line.replace(/^pass:\s*/, "")}
          </span>
        ))}
        <span className="text-zinc-300">{run.task_label}</span>
        <span className="text-xs text-zinc-600">{run.task_category}</span>
        <span className="text-xs text-zinc-500">{run.score}%</span>
      </div>

      {blurb && <p className="mb-2 text-xs leading-relaxed text-zinc-500">{blurb}</p>}

      <div className="mb-2 flex flex-wrap gap-3 text-[11px]">
        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
        >
          {showPrompt ? "hide prompt" : "show prompt"}
        </button>
      </div>

      {showPrompt && (
        <pre className="mb-2 max-h-40 overflow-auto whitespace-pre-wrap border border-zinc-900 bg-zinc-950 p-2 text-xs text-zinc-500">
          {run.task_prompt}
        </pre>
      )}

      {!run.passed && run.details && (
        <pre className="mb-2 max-h-28 overflow-auto whitespace-pre-wrap border border-red-950/60 bg-red-950/20 p-2 text-[11px] text-red-300/80">
          {run.details}
        </pre>
      )}

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
