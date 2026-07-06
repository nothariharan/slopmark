"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { models } from "@/lib/models";
import type { Domain, EvalRun, HarnessMode, RuleResult, TaskPublic } from "@/lib/types";

type EvalRes = {
  passed: boolean;
  score: number;
  details: string;
  output: string;
  rules?: RuleResult[];
  meta: { latency_ms: number; cost_usd: number };
};

// more domains later on
const DOMAINS: { label: string; value: Domain }[] = [
  { label: "instruction", value: "instruction" },
  { label: "json", value: "json" },
  { label: "math", value: "math" },
  { label: "sycophancy", value: "sycophancy" },
  { label: "zero ctx", value: "zero_ctx" },
  { label: "procedural", value: "procedural" },
  { label: "refusal", value: "refusal" },
  { label: "hierarchy", value: "hierarchy" },
  { label: "calibration", value: "calibration" },
  { label: "persistence", value: "persistence" },
  { label: "agentic", value: "agentic" },
  { label: "safety", value: "safety" },
  { label: "coding", value: "coding" },
  { label: "writing", value: "writing" },
  { label: "swe", value: "swe" },
];

const DIFFICULTIES = ["", "easy", "medium", "hard"] as const;
type DifficultyFilter = (typeof DIFFICULTIES)[number];

export default function BenchPage() {
  const [domain, setDomain] = useState<Domain>("instruction");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("");
  const [tasks, setTasks] = useState<TaskPublic[]>([]);
  const [taskId, setTaskId] = useState("");
  const [model, setModel] = useState<string>(models[0].slug);
  const [paste, setPaste] = useState("");
  const [res, setRes] = useState<EvalRes | null>(null);
  const [turn1Output, setTurn1Output] = useState<string | null>(null);
  const [suite, setSuite] = useState<string | null>(null);
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const harnessMode: HarnessMode = domain === "zero_ctx" ? "zero_context" : "standard";

  const prompt = tasks.find((t) => t.id === taskId)?.prompt ?? "";

  useEffect(() => {
    setTasks([]);
    setTaskId("");
    setRes(null);
    setTurn1Output(null);
    setSuite(null);
    const params = new URLSearchParams({ domain });
    if (difficulty) params.set("difficulty", difficulty);
    fetch(`/api/tasks?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setTasks(d.tasks ?? []);
        if (d.tasks?.[0]) setTaskId(d.tasks[0].id);
      });
  }, [domain, difficulty]);

  useEffect(() => {
    loadRuns();
  }, []);

  async function loadRuns() {
    const r = await fetch("/api/runs");
    const d = await r.json();
    setRuns(d.runs ?? []);
  }

  async function runOne(withPaste = false) {
    setBusy(true);
    setErr("");
    setSuite(null);
    try {
      const isStream = !withPaste;
      const r = await fetch("/api/eval/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskId,
          modelSlug: withPaste ? undefined : model,
          output: withPaste ? paste : undefined,
          stream: isStream,
          harnessMode,
        }),
      });

      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error ?? "run failed");
      }

      if (!isStream) {
        const d = await r.json();
        setRes(d);
        const t1Match = (d.details as string | undefined)?.match(/^\[turn1\]\n([\s\S]*?)\n\[\/turn1\]/);
        setTurn1Output(t1Match ? t1Match[1] : null);
        await loadRuns();
      } else {
        const reader = r.body?.getReader();
        if (!reader) throw new Error("no reader");
        const decoder = new TextDecoder();
        let buffer = "";
        let streamedOutput = "";

        setRes({ passed: false, score: 0, details: "generating...", output: "", meta: { latency_ms: 0, cost_usd: 0 } });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            const lines = chunk.split("\n");
            const eventLine = lines.find(l => l.startsWith("event: "));
            const dataLine = lines.find(l => l.startsWith("data: "));
            
            if (eventLine && dataLine) {
              const event = eventLine.substring(7);
              const data = dataLine.substring(6);
              
              if (event === "token") {
                streamedOutput += JSON.parse(data);
                setRes(prev => prev ? { ...prev, output: streamedOutput } : null);
              } else if (event === "result") {
                const finalRes = JSON.parse(data);
                setRes(finalRes);
                const t1Match = (finalRes.details as string | undefined)?.match(/^\[turn1\]\n([\s\S]*?)\n\[\/turn1\]/); //regex comes in clutch
                setTurn1Output(t1Match ? t1Match[1] : null);
                await loadRuns();
              }
            }
          }
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "run failed");
    } finally {
      setBusy(false);
    }
  }

  async function runAll() {
    setBusy(true);
    setErr("");
    setRes(null);
    try {
      const r = await fetch("/api/eval/suite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ modelSlug: model, domain, harnessMode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "suite failed");
      setSuite(
        `${d.passed}/${d.total} passed · ${Math.round(d.passRate * 100)}% · avg ${d.avgScore}`,
      );
      await loadRuns();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "suite failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold">bench</h1>
          <p className="text-sm text-zinc-400">
            pick a domain, pick a model, run
            {domain === "zero_ctx" && (
              <span className="ml-2 text-amber-400">· zero context (no system prompt)</span>
            )}
          </p>
        </div>

        {/* domain tabs */}
        <div className="flex gap-1 border-b border-zinc-800 pb-0">
          {DOMAINS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDomain(d.value)}
              className={`px-4 py-2 text-sm transition-colors ${
                domain === d.value
                  ? "border-b-2 border-zinc-100 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* difficulty filter */}
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded px-3 py-1 text-xs transition-colors ${
                difficulty === d
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {d === "" ? "all" : d}
            </button>
          ))}
        </div>

        <Card className="space-y-3">
          <label className="block text-sm text-zinc-400">task</label>
          <select
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} [{t.difficulty ?? "?"}] ({t.source})
              </option>
            ))}
            {!tasks.length && <option disabled>no tasks for this domain</option>}
          </select>
          {prompt && (
            <p className="rounded bg-zinc-900 p-3 text-sm text-zinc-300">{prompt}</p>
          )}

          <label className="block text-sm text-zinc-400">model</label>
          <select
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !taskId} onClick={() => runOne(false)}>
              run task
            </Button>
            <Button variant="outline" disabled={busy || !tasks.length} onClick={runAll}>
              run full suite
            </Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <label className="block text-sm text-zinc-400">paste output (dev mode)</label>
          <textarea
            className="min-h-24 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="paste model output to score without an api key"
          />
          <Button variant="outline" disabled={busy || !paste || !taskId} onClick={() => runOne(true)}>
            score pasted output
          </Button>
        </Card>

        {err && <p className="text-sm text-red-400">{err}</p>}
        {suite && <Card className="text-sm text-emerald-300">suite: {suite}</Card>}

        {res && (
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge ok={res.passed}>{res.passed ? "pass" : "fail"}</Badge>
              <span className="text-sm">score {res.score}</span>
              <span className="text-xs text-zinc-500">
                {res.meta.latency_ms}ms · ${res.meta.cost_usd}
              </span>
            </div>
            {domain === "sycophancy" && turn1Output && (
              <>
                <p className="text-xs text-zinc-500">turn 1 — initial answer</p>
                <pre className="whitespace-pre-wrap rounded bg-zinc-900 p-3 text-xs text-zinc-300">
                  {turn1Output}
                </pre>
                <p className="text-xs text-zinc-500">turn 2 — after challenge</p>
                <pre className="whitespace-pre-wrap rounded bg-zinc-900 p-3 text-xs text-zinc-300">
                  {res.output}
                </pre>
              </>
            )}
            <pre className="whitespace-pre-wrap rounded bg-zinc-900 p-3 text-xs text-zinc-300">
              {domain === "sycophancy"
                ? res.details.replace(/^\[turn1\][\s\S]*?\[\/turn1\]\n/, "")
                : res.details}
            </pre>
            {domain !== "sycophancy" && (
              <details>
                <summary className="cursor-pointer text-sm text-zinc-400">model output</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded bg-zinc-900 p-3 text-xs">
                  {res.output}
                </pre>
              </details>
            )}
          </Card>
        )}

        <Card>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">recent runs</h2>
          <div className="space-y-2 text-xs">
            {runs.map((r) => (
              <div key={r.id} className="flex justify-between gap-2 border-b border-zinc-900 pb-2">
                <span>
                  {r.task_id} · {r.model_slug}
                </span>
                <span className={r.passed ? "text-emerald-400" : "text-red-400"}>
                  {r.score}
                </span>
              </div>
            ))}
            {!runs.length && <p className="text-zinc-500">no runs yet</p>}
          </div>
        </Card>
      </main>
    </div>
  );
}


// code can be made clean for now not worrying on it like the reduduncy on regex etc and all -- subject to change later on --- 