"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/card";
import type { LeaderboardRow } from "@/lib/types";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard?domain=instruction")
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Nav />
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="mb-2 text-2xl font-semibold">leaderboard</h1>
        <p className="mb-4 text-sm text-zinc-400">slopmark · instruction domain · pass rate and avg score</p>

        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2">model</th>
                <th className="pb-2">pass rate</th>
                <th className="pb-2">avg score</th>
                <th className="pb-2">latency</th>
                <th className="pb-2">cost</th>
                <th className="pb-2">runs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.model_slug} className="border-t border-zinc-900">
                  <td className="py-2">{r.model_slug}</td>
                  <td className="py-2">{Math.round(r.pass_rate * 100)}%</td>
                  <td className="py-2">{Math.round(r.avg_score)}</td>
                  <td className="py-2">{Math.round(r.avg_latency_ms)}ms</td>
                  <td className="py-2">${r.avg_cost_usd.toFixed(4)}</td>
                  <td className="py-2">{r.runs}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-zinc-500">
                    no benchmark runs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}
