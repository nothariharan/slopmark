"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RealshotCategory, RealshotDuelResult } from "@/lib/realshot/types";

type AgentForm = {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
};

const EMPTY_AGENT: AgentForm = {
  name: "",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "",
  model: "",
};

const CATEGORIES: { value: RealshotCategory; label: string; hint: string }[] = [
  { value: "random", label: "random", hint: "pick any category" },
  { value: "constraint", label: "constraint", hint: "multi-rule instruction burst" },
  { value: "procedural", label: "procedural", hint: "novel instance each seed" },
  { value: "json", label: "json", hint: "schema output under pressure" },
  { value: "html", label: "html", hint: "one-shot website / markup" },
  { value: "extract", label: "extract", hint: "scrape-like — facts from provided text" },
  { value: "regex", label: "regex", hint: "write a pattern that passes hidden tests" },
];

const STORAGE_A = "realshot-agent-a";
const STORAGE_B = "realshot-agent-b";

function loadAgent(key: string): AgentForm {
  if (typeof window === "undefined") return { ...EMPTY_AGENT, name: key === STORAGE_A ? "Agent A" : "Agent B" };
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw) as AgentForm;
  } catch {
    /* ignore */
  }
  return { ...EMPTY_AGENT, name: key === STORAGE_A ? "Agent A" : "Agent B" };
}

function saveAgent(key: string, agent: AgentForm) {
  sessionStorage.setItem(key, JSON.stringify(agent));
}

function AgentCard({
  label,
  agent,
  onChange,
  onTest,
  testing,
  testOk,
}: {
  label: string;
  agent: AgentForm;
  onChange: (a: AgentForm) => void;
  onTest: () => void;
  testing: boolean;
  testOk: boolean | null;
}) {
  return (
    <Card className="space-y-3 border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm font-semibold text-zinc-300">{label}</p>
      <input
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        placeholder="display name"
        value={agent.name}
        onChange={(e) => onChange({ ...agent, name: e.target.value })}
      />
      <input
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        placeholder="base URL (OpenAI-compatible)"
        value={agent.baseURL}
        onChange={(e) => onChange({ ...agent, baseURL: e.target.value })}
      />
      <input
        type="password"
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        placeholder="API key (session only — never stored server-side)"
        value={agent.apiKey}
        onChange={(e) => onChange({ ...agent, apiKey: e.target.value })}
      />
      <input
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        placeholder="model id"
        value={agent.model}
        onChange={(e) => onChange({ ...agent, model: e.target.value })}
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onTest} disabled={testing}>
          {testing ? "testing…" : "test connection"}
        </Button>
        {testOk === true && <span className="text-xs text-emerald-400">pong ok</span>}
        {testOk === false && <span className="text-xs text-red-400">failed</span>}
      </div>
    </Card>
  );
}

function SidePanel({
  side,
  data,
  isWinner,
}: {
  side: "A" | "B";
  data: RealshotDuelResult["agentA"];
  isWinner: boolean;
}) {
  return (
    <Card
      className={`flex flex-col border-zinc-800 bg-zinc-900 p-4 ${
        isWinner ? "ring-1 ring-emerald-500/60" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-semibold text-zinc-200">{data.name || `Agent ${side}`}</p>
        <div className="flex items-center gap-2">
          <Badge ok={data.passed}>{data.score}%</Badge>
          {isWinner && <span className="text-xs text-emerald-400">winner</span>}
        </div>
      </div>

      {data.error ? (
        <p className="text-sm text-red-400">{data.error}</p>
      ) : (
        <pre className="mb-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-zinc-950 p-3 text-xs text-zinc-300">
          {data.output || "(empty)"}
        </pre>
      )}

      <p className="mb-2 text-xs text-zinc-500">
        {data.meta.latency_ms}ms · {data.meta.output_tokens} out tokens
      </p>

      <details className="text-xs text-zinc-400">
        <summary className="cursor-pointer text-zinc-500">verifier breakdown</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded bg-zinc-950 p-2">{data.details}</pre>
      </details>
    </Card>
  );
}

export default function RealshotPage() {
  const [agentA, setAgentA] = useState<AgentForm>(EMPTY_AGENT);
  const [agentB, setAgentB] = useState<AgentForm>(EMPTY_AGENT);
  const [category, setCategory] = useState<RealshotCategory>("random");
  const [zeroContext, setZeroContext] = useState(true);
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<RealshotDuelResult | null>(null);
  const [testA, setTestA] = useState<boolean | null>(null);
  const [testB, setTestB] = useState<boolean | null>(null);
  const [testingA, setTestingA] = useState(false);
  const [testingB, setTestingB] = useState(false);

  useEffect(() => {
    setAgentA(loadAgent(STORAGE_A));
    setAgentB(loadAgent(STORAGE_B));
  }, []);

  useEffect(() => {
    if (agentA.name) saveAgent(STORAGE_A, agentA);
  }, [agentA]);

  useEffect(() => {
    if (agentB.name) saveAgent(STORAGE_B, agentB);
  }, [agentB]);

  async function testAgent(agent: AgentForm, setTesting: (v: boolean) => void, setOk: (v: boolean | null) => void) {
    setTesting(true);
    setOk(null);
    try {
      const r = await fetch("/api/realshot/duel", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(agent),
      });
      const d = await r.json();
      setOk(!!d.ok);
    } catch {
      setOk(false);
    } finally {
      setTesting(false);
    }
  }

  async function runDuel(opts?: { taskId?: string; newSeed?: boolean }) {
    setBusy(true);
    setErr("");
    try {
      const body: Record<string, unknown> = {
        agentA,
        agentB,
        category,
        harnessMode: zeroContext ? "zero_context" : "standard",
      };
      if (opts?.taskId) {
        body.taskId = opts.taskId;
      } else if (seed && !opts?.newSeed) {
        body.seed = parseInt(seed, 10);
      } else if (opts?.newSeed) {
        body.seed = Math.floor(Math.random() * 1_000_000);
      }
      const r = await fetch("/api/realshot/duel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "duel failed");
      setResult(d);
      setSeed(String(d.seed ?? ""));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "duel failed");
    } finally {
      setBusy(false);
    }
  }

  const catHint = CATEGORIES.find((c) => c.value === category)?.hint ?? "";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-6xl space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-semibold">realshot</h1>
          <p className="text-sm text-zinc-400">
            BYOK agent duel — one prompt, one response each, verifier picks the winner
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AgentCard
            label="Agent A"
            agent={agentA}
            onChange={setAgentA}
            onTest={() => testAgent(agentA, setTestingA, setTestA)}
            testing={testingA}
            testOk={testA}
          />
          <AgentCard
            label="Agent B"
            agent={agentB}
            onChange={setAgentB}
            onTest={() => testAgent(agentB, setTestingB, setTestB)}
            testing={testingB}
            testOk={testB}
          />
        </div>

        <Card className="space-y-4 border-zinc-800 bg-zinc-900 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="space-y-1 text-sm">
              <span className="text-zinc-400">task</span>
              <select
                className="block rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value as RealshotCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={zeroContext}
                onChange={(e) => setZeroContext(e.target.checked)}
              />
              zero context (no system prompt)
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-zinc-400">seed (optional)</span>
              <input
                className="block w-32 rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
                placeholder="random"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            </label>

            <Button onClick={() => runDuel()} disabled={busy}>
              {busy ? "running duel…" : "run duel"}
            </Button>
          </div>

          {catHint && <p className="text-xs text-zinc-500">{catHint}</p>}
        </Card>

        {err && <p className="text-sm text-red-400">{err}</p>}

        {result && (
          <div className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge ok={result.winner !== "tie"}>{result.category}</Badge>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{result.task.label}</span>
                <span className="text-xs text-zinc-500">{result.task.id}</span>
                {result.winner === "tie" ? (
                  <span className="text-sm text-zinc-400">tie</span>
                ) : (
                  <span className="text-sm text-emerald-400">
                    winner: {result.winner === "a" ? result.agentA.name : result.agentB.name}
                  </span>
                )}
              </div>
              <p className="mb-1 text-xs text-zinc-500">shared prompt</p>
              <pre className="whitespace-pre-wrap rounded bg-zinc-950 p-3 text-sm text-zinc-300">
                {result.task.prompt}
              </pre>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <SidePanel side="A" data={result.agentA} isWinner={result.winner === "a"} />
              <SidePanel side="B" data={result.agentB} isWinner={result.winner === "b"} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => runDuel({ taskId: result.task.id })} disabled={busy}>
                rematch same task
              </Button>
              <Button variant="outline" onClick={() => runDuel({ newSeed: true })} disabled={busy}>
                new random task
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
