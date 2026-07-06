"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/Markdown";

type Challenge = {
  challengeId: string;
  task: { id: string; prompt: string };
  outputA: string;
  outputB: string;
  _hidden: { modelA: string; modelB: string };
};

export default function ArenaPage() {
  const [chal, setChal] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [err, setErr] = useState("");

  async function loadChallenge() {
    setLoading(true);
    setRevealed(false);
    setErr("");
    try {
      const r = await fetch("/api/arena/challenge");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "failed to load");
      setChal(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallenge();
  }, []);

  async function vote(winner: "a" | "b" | "tie") {
    if (!chal) return;
    
    // optimistic reveal
    setRevealed(true);

    try {
      await fetch("/api/arena/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskId: chal.task.id,
          modelA: chal._hidden.modelA,
          modelB: chal._hidden.modelB,
          winner
        })
      });
      // auto load next after a delay
      setTimeout(() => loadChallenge(), 2000);
    } catch (e) {
      console.error(e);
    }
  }
  // the ui as always subject to change later on
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-6xl p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">human arena</h1>
          <p className="text-sm text-zinc-400">blind a vs b testing vote on the best response</p>
        </div>

        {err && <p className="text-red-400 mb-4">{err}</p>}

        {!chal && loading && <p className="text-zinc-500 animate-pulse">generating anonymous models...</p>}

        {chal && (
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <p className="text-sm text-zinc-400 mb-2">prompt ({chal.task.id})</p>
              <div className="text-zinc-200"><Markdown content={chal.task.prompt} /></div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-400 mb-4">model a</p>
                  <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                    <Markdown content={chal.outputA} />
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                  {revealed ? (
                    <span className="text-emerald-400 font-medium">{chal._hidden.modelA}</span>
                  ) : (
                    <Button className="w-full" onClick={() => vote("a")} disabled={loading}>👈 model a is better</Button>
                  )}
                </div>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-400 mb-4">model b</p>
                  <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                    <Markdown content={chal.outputB} />
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                  {revealed ? (
                    <span className="text-emerald-400 font-medium">{chal._hidden.modelB}</span>
                  ) : (
                    <Button className="w-full" onClick={() => vote("b")} disabled={loading}>model b is better 👉</Button>
                  )}
                </div>
              </Card>
            </div>

            {!revealed && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={() => vote("tie")} disabled={loading}>its a tie 🤝</Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
