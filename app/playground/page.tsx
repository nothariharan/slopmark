"use client";

import { useState } from "react";
import Link from "next/link";
import { models } from "@/lib/models";

// play-cluster launcher — freeform + games. scored spine lives under nav "bench"
const VIBES = [
  { href: "/goal", tag: "you vs ai", title: "the games", blurb: "draw, stump, roulette, letter-count, direction — beat the model" },
  { href: "/canvas", tag: "battle", title: "canvas battles", blurb: "two models draw the same thing, you judge whose is worse" },
  { href: "/thunderdome", tag: "debate", title: "thunderdome", blurb: "two models argue, you watch it get petty" },
  { href: "/arena", tag: "blind vote", title: "human arena", blurb: "a vs b, models hidden — pick the better answer" },
  { href: "/realshot", tag: "BYOK", title: "realshot duels", blurb: "test your own api key on one-shot tasks" },
  { href: "/shame", tag: "wall", title: "hall of shame", blurb: "the epic failures, upvoted" },
  { href: "/challenges/new", tag: "bench", title: "author a sprint", blurb: "pick traps, bring your key, get a scored receipt" },
  { href: "/submit", tag: "contribute", title: "submit a task", blurb: "add your own stupid task to the pool" },
];

type Panel = {
  slug: string;
  name: string;
  output: string;
  latency: number;
  status: "idle" | "running" | "done" | "error";
  error?: string;
};

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set([models[0].slug, models[2].slug]),
  );
  const [panels, setPanels] = useState<Panel[]>([]);
  const [busy, setBusy] = useState(false);

  function toggle(slug: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function run() {
    const chosen = models.filter((m) => picked.has(m.slug));
    if (!prompt.trim() || chosen.length === 0) return;

    setBusy(true);
    // seed a panel per model so the grid appears instantly, then fill each in
    setPanels(
      chosen.map((m) => ({
        slug: m.slug,
        name: m.name,
        output: "",
        latency: 0,
        status: "running" as const,
      })),
    );

    // fire them all at once — each is its own metered request
    await Promise.all(
      chosen.map(async (m) => {
        try {
          const res = await fetch("/api/goal/challenge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, modelSlug: m.slug }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setPanels((prev) =>
            prev.map((p) =>
              p.slug === m.slug
                ? { ...p, output: data.output, latency: data.meta.latency_ms, status: "done" }
                : p,
            ),
          );
        } catch (e) {
          setPanels((prev) =>
            prev.map((p) =>
              p.slug === m.slug
                ? { ...p, status: "error", error: e instanceof Error ? e.message : "failed" }
                : p,
            ),
          );
        }
      }),
    );

    setBusy(false);
  }

  const gridCols =
    panels.length <= 1 ? "grid-cols-1" : panels.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            play
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-zinc-100">playground</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            freeform multi-model dump + the game doors. for scored suites and challenge
            receipts, jump to{" "}
            <Link href="/bench" className="text-zinc-300 underline-offset-2 hover:underline">
              bench
            </Link>{" "}
            or{" "}
            <Link href="/challenges" className="text-zinc-300 underline-offset-2 hover:underline">
              challenges
            </Link>
            .
          </p>
        </div>

        {/* the unifying runner — one prompt, many models, side by side */}
        <div className="border border-zinc-900 bg-zinc-950/50 p-5">
          <label className="text-sm text-zinc-400">the prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="make them do something stupid — 'explain quantum physics as a pirate in 20 words'"
            className="mt-2 min-h-24 w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
          />

          <p className="mt-4 text-sm text-zinc-400">models ({picked.size})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {models.map((m) => {
              const on = picked.has(m.slug);
              return (
                <button
                  key={m.slug}
                  type="button"
                  onClick={() => toggle(m.slug)}
                  className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                    on
                      ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={run}
            disabled={busy || !prompt.trim() || picked.size === 0}
            className="mt-5 border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "running…" : `run on ${picked.size} model${picked.size === 1 ? "" : "s"} →`}
          </button>
        </div>

        {panels.length > 0 && (
          <div className={`mt-6 grid gap-3 ${gridCols}`}>
            {panels.map((p) => (
              <div key={p.slug} className="border border-zinc-900 bg-zinc-950/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-300">{p.name}</span>
                  <span className="text-xs text-zinc-600">
                    {p.status === "running"
                      ? "…"
                      : p.status === "done"
                        ? `${p.latency}ms`
                        : p.status === "error"
                          ? "error"
                          : ""}
                  </span>
                </div>
                {p.status === "error" ? (
                  <p className="text-xs text-red-400">{p.error}</p>
                ) : p.status === "running" ? (
                  <p className="text-sm text-zinc-600 animate-pulse">thinking…</p>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-300">
                    {p.output}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* launcher into the deeper modes */}
        <h2 className="mt-14 mb-4 text-sm uppercase tracking-widest text-zinc-600">or pick a mode</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VIBES.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className="block border border-zinc-900 bg-zinc-950/50 p-5 transition-colors hover:border-zinc-700"
            >
              <p className="text-xs uppercase tracking-widest text-zinc-600">{v.tag}</p>
              <h3 className="mt-1 font-medium text-zinc-100">{v.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{v.blurb}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
