"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LeaderboardRow, Domain } from "@/lib/types";
import { MIN_RUNS } from "@/lib/types";
import type { SessionLeaderboardRow } from "@/lib/leaderboard";
import { LeaderboardCharts, AggregateCapabilityChart } from "@/components/LeaderboardCharts";

const DOMAINS: Domain[] = [
  "instruction", "json", "math", "procedural", "zero_ctx", "refusal", "hierarchy",
  "calibration", "persistence", "sycophancy", "agentic", "safety", "coding", "writing", "swe",
];

type View = "sessions" | "domain" | "aggregate";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [aggregateRows, setAggregateRows] = useState<LeaderboardRow[]>([]);
  const [sessionRows, setSessionRows] = useState<SessionLeaderboardRow[]>([]);
  const [domain, setDomain] = useState<Domain>("instruction");
  const [view, setView] = useState<View>("sessions");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leaderboard?domain=${domain}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []));
  }, [domain]);

  useEffect(() => {
    fetch("/api/leaderboard?aggregate=true")
      .then((r) => r.json())
      .then((d) => setAggregateRows(d.rows ?? []));
    fetch("/api/leaderboard?source=sessions")
      .then((r) => r.json())
      .then((d) => setSessionRows(d.rows ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-medium tracking-tight mb-1 text-zinc-100">leaderboard</h1>
            <p className="text-sm text-zinc-500">
              {view === "sessions"
                ? "every persisted challenge + playground session, folded into one table"
                : `live harness runs · min ${MIN_RUNS} runs to appear`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex border border-zinc-800 rounded overflow-hidden text-sm">
              {(["sessions", "domain", "aggregate"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 transition-colors ${view === v ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {v}
                </button>
              ))}
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

        {view === "sessions" && (
          <>
            <div className="overflow-x-auto border border-zinc-900">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-500 bg-zinc-950/50">
                  <tr>
                    <th className="px-4 py-3 font-normal">model</th>
                    <th className="px-4 py-3 font-normal text-right">sessions</th>
                    <th className="px-4 py-3 font-normal text-right">wins</th>
                    <th className="px-4 py-3 font-normal text-right">pass rate</th>
                    <th className="px-4 py-3 font-normal text-right">avg score</th>
                    <th className="px-4 py-3 font-normal text-right">latency</th>
                    <th className="px-4 py-3 font-normal text-right">runs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {sessionRows.map((r, i) => (
                    <tr key={r.model_label} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="px-4 py-3 text-zinc-300">
                        <span className="text-zinc-700 mr-3 font-mono">{i + 1}</span>
                        {r.model_label}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500">{r.sessions}</td>
                      <td className="px-4 py-3 text-right text-amber-400/90">{r.wins}</td>
                      <td className="px-4 py-3 text-right text-zinc-100">{Math.round(r.pass_rate * 100)}%</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{r.avg_score}</td>
                      <td className="px-4 py-3 text-right text-zinc-500">{r.avg_latency_ms}ms</td>
                      <td className="px-4 py-3 text-right text-zinc-500">{r.runs}</td>
                    </tr>
                  ))}
                  {!loading && !sessionRows.length && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-600">
                        no sessions yet — run one from{" "}
                        <Link href="/challenges/new" className="text-zinc-400 hover:text-zinc-200">the builder</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              wins = sessions where the model had the top pass rate (ties share). full breakdowns live on{" "}
              <Link href="/sessions" className="text-zinc-400 hover:text-zinc-200">the sessions wall</Link>.
            </p>
          </>
        )}

        {view === "aggregate" && (
          <>
            <AggregateCapabilityChart rows={aggregateRows} />
            {aggregateRows.length > 0 ? (
              <div className="overflow-x-auto mt-12 border border-zinc-900">
                <StatsTable rows={aggregateRows} />
              </div>
            ) : (
              <div className="border border-zinc-900 py-16 text-center">
                <p className="text-zinc-600">no data yet · models need at least {MIN_RUNS} total runs to appear</p>
              </div>
            )}
          </>
        )}

        {view === "domain" && (
          <>
            <LeaderboardCharts rows={rows} />
            <div className="overflow-x-auto mt-12 border border-zinc-900">
              <StatsTable rows={rows} emptyText={`no data yet · models need at least ${MIN_RUNS} runs in this domain`} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatsTable({ rows, emptyText }: { rows: LeaderboardRow[]; emptyText?: string }) {
  return (
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
            <td colSpan={6} className="py-12 text-center text-zinc-600">{emptyText ?? "no data yet"}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
