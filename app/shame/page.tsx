"use client";

import { useEffect, useState } from "react";
import type { EvalRun } from "@/lib/types";

// Extended EvalRun type that includes upvotes
type ShameRun = EvalRun & { upvotes: number };

export default function ShamePage() {
  const [runs, setRuns] = useState<ShameRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState<Record<string, boolean>>({});

  async function loadRuns() {
    try {
      const res = await fetch("/api/shame");
      const data = await res.json();
      if (data.runs) setRuns(data.runs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRuns();
  }, []);

  async function handleUpvote(id: string) {
    if (upvoting[id]) return;
    setUpvoting(prev => ({ ...prev, [id]: true }));
    
    // optimistic update
    setRuns(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
    
    try {
      await fetch("/api/shame/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      // revert on failure
      setRuns(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes - 1 } : r));
    } finally {
      setUpvoting(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-medium tracking-tight mb-1 text-zinc-100">hall of shame</h1>
          <p className="text-sm text-zinc-500">epic failures, lazy answers, and confident hallucinations.</p>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 animate-pulse">loading failures...</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-zinc-500">no shameful runs found. the models are behaving.</p>
        ) : (
          <div className="space-y-8">
            {runs.map((r, i) => (
              <div key={r.id} className="border border-zinc-900 bg-zinc-950/50 p-6 flex gap-6 flex-col md:flex-row">
                <div className="flex flex-col items-center gap-2 md:w-16 shrink-0">
                  <button 
                    onClick={() => handleUpvote(r.id)}
                    disabled={upvoting[r.id]}
                    className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-zinc-900 hover:text-zinc-100 text-zinc-500 transition-colors disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <span className="text-sm font-medium text-zinc-400">{r.upvotes}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-mono text-zinc-300 bg-zinc-900 px-2 py-1">{r.model_slug}</span>
                    <span className="text-xs text-zinc-500">Domain: {r.domain}</span>
                    <span className="text-xs text-red-500 ml-auto">Score: {r.score}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Model Output:</p>
                      <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-black border border-zinc-900 p-4 rounded-none">
                        {r.output}
                      </pre>
                    </div>
                    
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Verifier Details:</p>
                      <pre className="whitespace-pre-wrap text-xs text-zinc-400 font-mono">
                        {r.details}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
