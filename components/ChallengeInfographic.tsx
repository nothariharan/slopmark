"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChallengeResults } from "@/lib/challenges/types";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"];

export function ChallengeInfographic({ data }: { data: ChallengeResults }) {
  const barData = [...data.summaries]
    .sort((a, b) => b.pass_rate - a.pass_rate)
    .map((s, i) => ({
      name: s.model_label,
      passRate: Math.round(s.pass_rate * 100),
      avgScore: s.avg_score,
      passed: s.passed,
      total: s.runs,
      fill: COLORS[i % COLORS.length],
    }));

  const categories = [...new Set(data.manifest.tasks.map((t) => t.category))];
  const heatData = data.manifest.models.map((m) => {
    const row: Record<string, string | number> = { model: m.label };
    for (const cat of categories) {
      const catRuns = data.runs.filter(
        (r) => r.model_slug === m.slug && r.task_category === cat,
      );
      const rate = catRuns.length
        ? Math.round((catRuns.filter((r) => r.passed).length / catRuns.length) * 100)
        : 0;
      row[cat] = rate;
    }
    return row;
  });

  return (
    <div className="space-y-10" id="challenge-infographic">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="models" value={String(data.manifest.models.length)} />
        <StatCard label="tasks" value={String(data.manifest.tasks.length)} />
        <StatCard
          label="total runs"
          value={String(data.runs.length)}
        />
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="mb-2 text-lg font-medium text-zinc-100">pass rate by model</h2>
        <p className="mb-6 text-sm text-zinc-500">
          {data.manifest.title} · zero context · {new Date(data.completed_at).toLocaleDateString()}
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#71717a" fontSize={11} unit="%" />
              <YAxis type="category" dataKey="name" width={120} stroke="#71717a" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 0 }}
                formatter={(v, _n, p) => [
                  `${v}% (${(p?.payload as { passed: number; total: number })?.passed}/${(p?.payload as { passed: number; total: number })?.total})`,
                  "pass rate",
                ]}
              />
              <Bar dataKey="passRate" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="mb-6 text-lg font-medium text-zinc-100">pass rate by category</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="pb-3 pr-4 font-normal">model</th>
                {categories.map((c) => (
                  <th key={c} className="pb-3 pr-4 font-normal capitalize">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatData.map((row) => (
                <tr key={String(row.model)} className="border-t border-zinc-900">
                  <td className="py-3 pr-4 text-zinc-200">{row.model}</td>
                  {categories.map((c) => {
                    const v = row[c] as number;
                    return (
                      <td key={c} className="py-3 pr-4">
                        <span
                          className="inline-block min-w-[3rem] rounded px-2 py-0.5 text-center text-xs font-medium"
                          style={{
                            background: `rgba(34, 197, 94, ${v / 100})`,
                            color: v > 50 ? "#fff" : "#a1a1aa",
                          }}
                        >
                          {v}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {barData.map((s) => (
          <div
            key={s.name}
            className="border border-zinc-800 bg-zinc-950 p-4"
            style={{ borderTopColor: s.fill, borderTopWidth: 3 }}
          >
            <p className="font-medium text-zinc-100">{s.name}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-50">{s.passRate}%</p>
            <p className="text-xs text-zinc-500">
              {s.passed}/{s.total} tasks · avg score {s.avgScore}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-800 bg-zinc-950 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
