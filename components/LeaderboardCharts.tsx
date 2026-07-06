"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  ZAxis,
  LabelList,
  ReferenceLine,
} from "recharts";
import type { LeaderboardRow } from "@/lib/types";

type ScatterPoint = {
  name: string;
  cost: number;
  passRate: number;
  latency: number;
};

function CustomDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: ScatterPoint }) {
  if (cx == null || cy == null || !payload) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#a1a1aa" />
      <text
        x={cx + 7}
        y={cy + 4}
        fill="#71717a"
        fontSize={10}
        fontFamily="monospace"
      >
        {payload.name.substring(0, 12)}
      </text>
    </g>
  );
}

export function LeaderboardCharts({ rows }: { rows: LeaderboardRow[] }) {
  if (!rows || rows.length === 0) return null;

  const barData = [...rows]
    .sort((a, b) => b.pass_rate - a.pass_rate)
    .slice(0, 10)
    .map((r) => ({
      name: r.model_slug.split("/").pop() || r.model_slug,
      passRate: Math.round(r.pass_rate * 100),
      score: Math.round(r.avg_score),
    }));

  const scatterData: ScatterPoint[] = rows.map((r) => ({
    name: r.model_slug.split("/").pop() || r.model_slug,
    cost: Number(r.avg_cost_usd.toFixed(5)),
    passRate: Math.round(r.pass_rate * 100),
    latency: Math.round(r.avg_latency_ms),
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="border border-zinc-900 bg-zinc-950/50 p-6">
        <h3 className="mb-6 text-sm font-normal text-zinc-500">top 10 pass rate</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(0, 8) + "…"} />
              <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a", borderRadius: "0px", color: "#fff" }}
                itemStyle={{ color: "#fafafa" }}
                cursor={{ fill: "#18181b" }}
              />
              <Bar dataKey="passRate" fill="#fafafa" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-zinc-900 bg-zinc-950/50 p-6">
        <h3 className="mb-1 text-sm font-normal text-zinc-500">cost vs capability</h3>
        <p className="mb-5 text-xs text-zinc-700">up-right = better value. avg cost per task vs pass rate.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 0, right: 40, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
              <XAxis
                type="number"
                dataKey="cost"
                name="avg cost per task (usd)"
                stroke="#52525b"
                fontSize={11}
                tickFormatter={(val) => `$${val}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="passRate"
                name="pass rate (%)"
                stroke="#52525b"
                fontSize={11}
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
              />
              <ZAxis type="category" dataKey="name" name="model" />
              <Tooltip
                cursor={{ strokeDasharray: "2 2", stroke: "#3f3f46" }}
                contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a", borderRadius: "0px", color: "#fff" }}
                formatter={(val, name) => {
                  if (name === "avg cost per task (usd)") return [`$${val}`, name];
                  if (name === "pass rate (%)") return [`${val}%`, name];
                  return [val, name];
                }}
              />
              <Scatter
                name="models"
                data={scatterData}
                shape={(props: unknown) => <CustomDot {...(props as { cx?: number; cy?: number; payload?: ScatterPoint })} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function AggregateCapabilityChart({ rows }: { rows: LeaderboardRow[] }) {
  if (!rows || rows.length === 0) return null;

  const data = [...rows]
    .sort((a, b) => b.pass_rate - a.pass_rate)
    .map((r) => ({
      name: r.model_slug.split("/").pop() || r.model_slug,
      fullName: r.model_slug,
      passRate: Math.round(r.pass_rate * 100),
      cost: Number(r.avg_cost_usd.toFixed(5)),
      latency: Math.round(r.avg_latency_ms),
      runs: r.runs,
    }));

  const avgPassRate = data.length > 0
    ? Math.round(data.reduce((s, r) => s + r.passRate, 0) / data.length)
    : 50;

  const scatterData = data.map((r) => ({ ...r, costPerPoint: r.cost / Math.max(r.passRate, 1) * 100 }));

  return (
    <div className="space-y-6">
      <div className="border border-zinc-900 bg-zinc-950/50 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-sm font-normal text-zinc-300">aggregate capability</h3>
            <p className="text-xs text-zinc-600 mt-1">pass rate across all domains combined · min 3 runs to appear</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(0, 10)} />
              <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a", borderRadius: "0px", color: "#fff" }}
                itemStyle={{ color: "#fafafa" }}
                cursor={{ fill: "#18181b" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as typeof data[number];
                  return (
                    <div className="border border-zinc-800 bg-black px-3 py-2 text-xs space-y-1">
                      <p className="font-mono text-zinc-300">{d.fullName}</p>
                      <p className="text-zinc-400">pass rate: <span className="text-zinc-100">{d.passRate}%</span></p>
                      <p className="text-zinc-400">avg cost: <span className="text-zinc-100">${d.cost}</span></p>
                      <p className="text-zinc-400">latency: <span className="text-zinc-100">{d.latency}ms</span></p>
                      <p className="text-zinc-400">total runs: <span className="text-zinc-100">{d.runs}</span></p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={avgPassRate} stroke="#3f3f46" strokeDasharray="3 3" label={{ value: "avg", fill: "#52525b", fontSize: 10 }} />
              <Bar dataKey="passRate" fill="#52525b" radius={[2, 2, 0, 0]}>
                <LabelList dataKey="passRate" position="top" formatter={(v: unknown) => v != null ? `${v}%` : ""} style={{ fill: "#71717a", fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-zinc-900 bg-zinc-950/50 p-6">
        <h3 className="mb-1 text-sm font-normal text-zinc-300">cost-capability frontier</h3>
        <p className="mb-5 text-xs text-zinc-600">
          each dot = one model across all domains. top-left = cheap and capable (ideal).
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 0, right: 40, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
              <XAxis
                type="number"
                dataKey="cost"
                name="avg cost (usd)"
                stroke="#52525b"
                fontSize={11}
                tickFormatter={(v) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="passRate"
                name="pass rate (%)"
                stroke="#52525b"
                fontSize={11}
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
              />
              <ZAxis type="category" dataKey="name" name="model" />
              <Tooltip
                cursor={{ strokeDasharray: "2 2", stroke: "#3f3f46" }}
                contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a", borderRadius: "0px", color: "#fff" }}
                formatter={(val, name) => {
                  if (name === "avg cost (usd)") return [`$${val}`, name];
                  if (name === "pass rate (%)") return [`${val}%`, name];
                  return [val, name];
                }}
              />
              <Scatter
                name="models"
                data={scatterData}
                shape={(props: unknown) => <CustomDot {...(props as { cx?: number; cy?: number; payload?: ScatterPoint })} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
