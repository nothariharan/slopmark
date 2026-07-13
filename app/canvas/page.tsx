"use client";

import { useState } from "react";
import Link from "next/link";
import { models } from "@/lib/models";

// same seed pool the ascii duel uses — kept here so canvas stands on its own
const SUBJECTS = [
  "a cat sitting on a windowsill",
  "a rocket launching into space",
  "a house with a tree",
  "a fish in a fishbowl",
  "a robot waving hello",
  "a mountain with snow",
  "a skull",
  "a coffee cup",
  "a simple car",
  "a christmas tree",
  "a bicycle",
  "a dog",
];

type Side = {
  slug: string;
  name: string;
  art: string;
  latency: number;
  status: "idle" | "drawing" | "done" | "error";
  error?: string;
};

function subjectId(subject: string) {
  return `canvas:${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
}

export default function CanvasPage() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [slugA, setSlugA] = useState<string>(models[0].slug);
  const [slugB, setSlugB] = useState<string>(models[2].slug);
  const [sideA, setSideA] = useState<Side | null>(null);
  const [sideB, setSideB] = useState<Side | null>(null);
  const [busy, setBusy] = useState(false);
  const [voted, setVoted] = useState<"a" | "b" | "tie" | null>(null);
  const [tally, setTally] = useState({ a: 0, b: 0, tie: 0 });
  const [err, setErr] = useState("");

  function newSubject() {
    const i = (SUBJECTS.indexOf(subject) + 1) % SUBJECTS.length;
    setSubject(SUBJECTS[i]);
    reset();
  }

  function reset() {
    setSideA(null);
    setSideB(null);
    setVoted(null);
    setErr("");
  }

  async function draw(slug: string, name: string, set: (s: Side) => void) {
    set({ slug, name, art: "", latency: 0, status: "drawing" });
    try {
      const res = await fetch("/api/goal/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, modelSlug: slug }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      set({ slug, name, art: data.output, latency: data.meta.latency_ms, status: "done" });
    } catch (e) {
      set({ slug, name, art: "", latency: 0, status: "error", error: e instanceof Error ? e.message : "failed" });
    }
  }

  async function battle() {
    if (slugA === slugB) {
      setErr("pick two different models");
      return;
    }
    setBusy(true);
    setVoted(null);
    setErr("");
    const nameA = models.find((m) => m.slug === slugA)?.name ?? slugA;
    const nameB = models.find((m) => m.slug === slugB)?.name ?? slugB;
    await Promise.all([draw(slugA, nameA, setSideA), draw(slugB, nameB, setSideB)]);
    setBusy(false);
  }

  async function vote(winner: "a" | "b" | "tie") {
    if (voted) return;
    setVoted(winner);
    setTally((t) => ({ ...t, [winner]: t[winner] + 1 }));
    try {
      await fetch("/api/arena/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: subjectId(subject),
          modelA: slugA,
          modelB: slugB,
          winner,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  const ready = sideA?.status === "done" && sideB?.status === "done";

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-zinc-100">canvas battles</h1>
            <p className="mt-1 text-sm text-zinc-500">
              two models, one subject, only keyboard characters. you judge whose is less cursed.
            </p>
          </div>
          <Link
            href="/playground"
            className="shrink-0 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← playground
          </Link>
        </div>

        {/* setup */}
        <div className="border border-zinc-900 bg-zinc-950/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">subject</p>
            <button onClick={newSubject} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              shuffle →
            </button>
          </div>
          <input
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              reset();
            }}
            className="mt-2 w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500">canvas A</label>
              <select
                value={slugA}
                onChange={(e) => { setSlugA(e.target.value); reset(); }}
                className="mt-1 w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
              >
                {models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500">canvas B</label>
              <select
                value={slugB}
                onChange={(e) => { setSlugB(e.target.value); reset(); }}
                className="mt-1 w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
              >
                {models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={battle}
            disabled={busy}
            className="mt-5 border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "drawing…" : "battle →"}
          </button>

          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        </div>

        {/* the two canvases */}
        {(sideA || sideB) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <CanvasPane side={sideA} label="A" winner={voted === "a"} dim={voted === "b"} />
            <CanvasPane side={sideB} label="B" winner={voted === "b"} dim={voted === "a"} />
          </div>
        )}

        {/* the vote row */}
        {ready && (
          <div className="mt-5">
            {voted ? (
              <div className="flex items-center justify-between border border-zinc-900 bg-zinc-950/50 px-5 py-3 text-sm">
                <span className="text-zinc-300">
                  {voted === "tie" ? "called it a tie" : `${voted === "a" ? sideA?.name : sideB?.name} took it`}
                </span>
                <button onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-300">
                  rematch →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => vote("a")}
                  className="border border-zinc-800 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-800 hover:text-emerald-300"
                >
                  👈 A wins
                </button>
                <button
                  onClick={() => vote("tie")}
                  className="border border-zinc-800 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                >
                  both cursed 🤝
                </button>
                <button
                  onClick={() => vote("b")}
                  className="border border-zinc-800 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-800 hover:text-emerald-300"
                >
                  B wins 👉
                </button>
              </div>
            )}
          </div>
        )}

        {(tally.a > 0 || tally.b > 0 || tally.tie > 0) && (
          <p className="mt-6 text-xs text-zinc-600">
            session tally · A {tally.a} — B {tally.b} — ties {tally.tie}
          </p>
        )}
      </main>
    </div>
  );
}

function CanvasPane({
  side,
  label,
  winner,
  dim,
}: {
  side: Side | null;
  label: string;
  winner: boolean;
  dim: boolean;
}) {
  return (
    <div
      className={`border bg-zinc-950/50 p-4 transition-colors ${
        winner ? "border-emerald-700" : "border-zinc-900"
      } ${dim ? "opacity-40" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-500">
          canvas {label}
          {side?.status === "done" && <span className="ml-2 text-zinc-400">{side.name}</span>}
        </span>
        {side?.status === "done" && <span className="text-xs text-zinc-600">{side.latency}ms</span>}
      </div>
      {!side || side.status === "drawing" ? (
        <p className="py-8 text-center text-sm text-zinc-600 animate-pulse">drawing…</p>
      ) : side.status === "error" ? (
        <p className="text-xs text-red-400">{side.error}</p>
      ) : (
        <pre className="min-h-40 overflow-auto whitespace-pre font-mono text-xs leading-tight text-zinc-300">
          {side.art}
        </pre>
      )}
    </div>
  );
}
