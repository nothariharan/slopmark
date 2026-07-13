"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SessionCard = {
  slug: string;
  title: string;
  subtitle: string;
  completed_at: string;
  models: number;
  tasks: number;
  winner?: string;
  best_pass_rate: number;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-zinc-100">sessions</h1>
            <p className="mt-1 text-sm text-zinc-500">
              every playground run people threw at the models. good, bad, cursed.
            </p>
          </div>
          <Link
            href="/challenges/new"
            className="shrink-0 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            new run
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 animate-pulse">loading the wall…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            no sessions yet. spin one up in{" "}
            <Link href="/challenges/new" className="text-zinc-300 hover:text-zinc-100">
              build a run
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Link
                key={s.slug}
                href={`/sessions/${s.slug}`}
                className="block border border-zinc-900 bg-zinc-950/50 p-5 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium text-zinc-100">{s.title}</h2>
                    <p className="truncate text-sm text-zinc-500">{s.subtitle}</p>
                  </div>
                  {s.winner && (
                    <span className="shrink-0 whitespace-nowrap text-xs text-emerald-500/90">
                      {s.winner} · {Math.round(s.best_pass_rate * 100)}%
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-zinc-600">
                  {s.models} models · {s.tasks} tasks ·{" "}
                  {new Date(s.completed_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
