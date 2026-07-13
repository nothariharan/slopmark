"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  slug: string;
  title: string;
  subtitle: string;
  completed_at: string;
  models: number;
  tasks: number;
  top_model?: string;
};

export default function ChallengesPage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((d) => setItems(d.challenges ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold">challenges</h1>
        <p className="mt-2 text-sm text-zinc-500">
          persisted benchmark sessions — revisit every model run
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 2).map((c) => (
            <Link
              key={c.slug}
              href={`/challenge/${c.slug}`}
              className="block border border-emerald-900/50 bg-emerald-950/20 p-5 transition hover:border-emerald-700"
            >
              <p className="text-xs uppercase tracking-widest text-emerald-500/80">featured</p>
              <h2 className="mt-1 font-medium">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{c.subtitle}</p>
            </Link>
          ))}
          <Link
            href="/challenges/new"
            className="block border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600"
          >
            <p className="text-xs uppercase tracking-widest text-zinc-500">build</p>
            <h2 className="mt-1 font-medium">create your own sprint</h2>
            <p className="mt-1 text-sm text-zinc-500">pick tasks · BYOK models · ad-hoc infographic</p>
          </Link>
          <Link
            href="/realshot"
            className="block border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600"
          >
            <p className="text-xs uppercase tracking-widest text-zinc-500">BYOK</p>
            <h2 className="mt-1 font-medium">realshot duels</h2>
            <p className="mt-1 text-sm text-zinc-500">test your own API key on one-shot tasks</p>
          </Link>
        </div>

        <p className="mt-6 text-sm text-zinc-600">
          how challenges work →{" "}
          <Link href="/docs/challenges" className="text-zinc-400 hover:text-zinc-200">
            docs
          </Link>
        </p>

        <div className="mt-10 space-y-4">
          {items.length === 0 && (
            <p className="text-zinc-600 text-sm">no challenges yet. run scripts/run-challenge.ts</p>
          )}
          {items.map((c) => (
            <Link
              key={c.slug}
              href={`/challenge/${c.slug}`}
              className="block border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600"
            >
              <h2 className="font-medium text-zinc-100">{c.title}</h2>
              <p className="text-sm text-zinc-500">{c.subtitle}</p>
              <p className="mt-3 text-xs text-zinc-600">
                {c.models} models · {c.tasks} tasks
                {c.top_model && ` · leader: ${c.top_model}`}
                {" · "}
                {new Date(c.completed_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
