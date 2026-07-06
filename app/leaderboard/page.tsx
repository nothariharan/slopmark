"use client";

import { useEffect, useState } from "react";
import type { LeaderboardRow, Domain } from "@/lib/types";
import { MIN_RUNS } from "@/lib/types";
import { LeaderboardCharts, AggregateCapabilityChart } from "@/components/LeaderboardCharts";

const DOMAINS: Domain[] = ["instruction", "json", "math", "sycophancy", "agentic", "safety", "coding", "writing", "swe"];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [aggregateRows, setAggregateRows] = useState<LeaderboardRow[]>([]);
  const [domain, setDomain] = useState<Domain>("instruction");
  const [view, setView] = useState<"domain" | "aggregate">("domain");

  // dependancy set as domain to make sure it runs only when domain changes c
  useEffect(() => {
    fetch(`/api/leaderboard?domain=${domain}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []));
  }, [domain]);

  useEffect(() => {
    fetch("/api/leaderboard?aggregate=true")
      .then((r) => r.json())
      .then((d) => setAggregateRows(d.rows ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-medium tracking-tight mb-1 text-zinc-100">leaderboard</h1>
            <p className="text-sm text-zinc-500">
              global model metrics · min {MIN_RUNS} runs to appear
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex border border-zinc-800 rounded overflow-hidden text-sm">
              <button
                onClick={() => setView("domain")}
                className={`px-4 py-1.5 transition-colors ${view === "domain" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                by domain
              </button>
              <button
                onClick={() => setView("aggregate")}
                className={`px-4 py-1.5 transition-colors ${view === "aggregate" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                aggregate
              </button>
            </div>
            {view === "domain" && (
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as Domain)}
                className="rounded-none border-b border-zinc-800 bg-transparent px-2 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-500 cursor-pointer"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d} className="bg-zinc-950">{d}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {view === "aggregate" ? (
          <>
            <AggregateCapabilityChart rows={aggregateRows} />
            {aggregateRows.length > 0 && (
              <div className="overflow-x-auto mt-12 border border-zinc-900">
                <table className="w-full text-left text-sm">
                  <thead className="text-zinc-500 bg-zinc-950/50">
                    <tr>
                      <th className="px-4 py-3 font-normal">model</th>
                      <th className="px-4 py-3 font-normal text-right">pass rate</th>
                      <th className="px-4 py-3 font-normal text-right">avg score</th>
                      <th className="px-4 py-3 font-normal text-right">latency</th>
                      <th className="px-4 py-3 font-normal text-right">cost</th>
                      <th className="px-4 py-3 font-normal text-right">total runs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {aggregateRows.map((r, i) => (
                      <tr key={r.model_slug} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-zinc-300">
                          <span className="text-zinc-700 mr-3">{i + 1}</span>
                          {r.model_slug}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-100">{Math.round(r.pass_rate * 100)}%</td>
                        <td className="px-4 py-3 text-right text-zinc-400">{Math.round(r.avg_score)}</td>
                        <td className="px-4 py-3 text-right text-zinc-500">{Math.round(r.avg_latency_ms)}ms</td>
                        <td className="px-4 py-3 text-right text-zinc-500">${r.avg_cost_usd.toFixed(4)}</td>
                        <td className="px-4 py-3 text-right text-zinc-500">{r.runs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {aggregateRows.length === 0 && (
              <div className="border border-zinc-900 py-16 text-center">
                <p className="text-zinc-600">no data yet · models need at least {MIN_RUNS} total runs to appear</p>
              </div>
            )}
          </>
        ) : (
          <>
            <LeaderboardCharts rows={rows} />
            <div className="overflow-x-auto mt-12 border border-zinc-900">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-500 bg-zinc-950/50">
                  <tr>
                    <th className="px-4 py-3 font-normal">model</th>
                    <th className="px-4 py-3 font-normal text-right">pass rate</th>
                    <th className="px-4 py-3 font-normal text-right">avg score</th>
                    <th className="px-4 py-3 font-normal text-right">latency</th>
                    <th className="px-4 py-3 font-normal text-right">cost</th>
                    <th className="px-4 py-3 font-normal text-right">runs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {rows.map((r, i) => (
                    <tr key={r.model_slug} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-zinc-300">
                        <span className="text-zinc-700 mr-3">{i + 1}</span>
                        {r.model_slug}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-100">{Math.round(r.pass_rate * 100)}%</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{Math.round(r.avg_score)}</td>
                      <td className="px-4 py-3 text-right text-zinc-500">{Math.round(r.avg_latency_ms)}ms</td>
                      <td className="px-4 py-3 text-right text-zinc-500">${r.avg_cost_usd.toFixed(4)}</td>
                      <td className="px-4 py-3 text-right text-zinc-500">{r.runs}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-600">
                        no data yet · models need at least {MIN_RUNS} runs in this domain
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
