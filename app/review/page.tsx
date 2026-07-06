"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ReviewItem = {
  id: string;
  run_id: string;
  task_id: string;
  domain: string;
  model_slug: string;
  prompt: string;
  output: string;
  auto_score: number;
  vote_count: number;
  status: string;
  created_at: string;
};

const LABELS = ["", "very poor", "poor", "ok", "good", "excellent"];
const COLORS = [
  "",
  "bg-red-900/60 border-red-700 text-red-300",
  "bg-orange-900/60 border-orange-700 text-orange-300",
  "bg-yellow-900/60 border-yellow-700 text-yellow-300",
  "bg-emerald-900/60 border-emerald-700 text-emerald-300",
  "bg-blue-900/60 border-blue-700 text-blue-300",
];

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/review");
      const d = await r.json();
      setItems(d.items ?? []);
      setIdx(0);
      setVoted(false);
    } catch {
      setErr("failed to load review queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function vote(score: number) {
    const item = items[idx];
    if (!item || voting) return;
    setVoting(true);
    setErr("");
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, score, runId: item.run_id }),
      });
      setVoted(true);
    } catch {
      setErr("vote failed");
    } finally {
      setVoting(false);
    }
  }

  function next() {
    if (idx + 1 < items.length) {
      setIdx((i) => i + 1);
      setVoted(false);
    } else {
      load();
    }
  }

  const item = items[idx];
  const remaining = items.length - idx;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-medium tracking-tight mb-1">human review queue</h1>
          <p className="text-sm text-zinc-500">
            score writing outputs on quality. scores finalize after 3 votes. no model identity shown.
          </p>
        </div>

        {loading && <p className="text-zinc-500 animate-pulse">loading queue…</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}

        {!loading && !item && (
          <div className="border border-zinc-900 p-12 text-center">
            <p className="text-zinc-400 text-lg mb-2">queue is empty</p>
            <p className="text-zinc-600 text-sm mb-6">run writing tasks to generate items for review</p>
            <Button variant="outline" onClick={load}>refresh</Button>
          </div>
        )}

        {item && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>
                item {idx + 1} of {items.length}
                <span className="ml-3 text-zinc-700">·</span>
                <span className="ml-3">{remaining} remaining</span>
              </span>
              <span className="font-mono text-xs text-zinc-600">
                {item.domain} · {item.task_id}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-zinc-950 border-zinc-900">
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">prompt</p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.prompt}</p>
              </Card>

              <Card className="bg-zinc-950 border-zinc-900">
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">model output</p>
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{item.output}</p>
              </Card>
            </div>

            <div className="border border-zinc-900 p-4 bg-zinc-950/50">
              <p className="text-xs text-zinc-500 mb-1">deterministic pre-score</p>
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-400 rounded-full"
                    style={{ width: `${item.auto_score}%` }}
                  />
                </div>
                <span className="text-sm text-zinc-400 w-10 text-right">{item.auto_score}%</span>
              </div>
              <p className="text-xs text-zinc-700 mt-1">
                {item.vote_count} vote{item.vote_count !== 1 ? "s" : ""} so far · finalizes at 3
              </p>
            </div>

            {!voted ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">how good is this response?</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => vote(s)}
                      disabled={voting}
                      className={`border rounded px-3 py-3 text-center transition-all disabled:opacity-50 hover:opacity-90 ${COLORS[s]}`}
                    >
                      <div className="text-2xl font-bold">{s}</div>
                      <div className="text-xs mt-1 opacity-80">{LABELS[s]}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-emerald-900 bg-emerald-950/30 p-4 rounded flex items-center justify-between">
                <p className="text-emerald-300 text-sm">vote recorded</p>
                <Button onClick={next} className="shrink-0">
                  {idx + 1 < items.length ? "next →" : "reload queue →"}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
