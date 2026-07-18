"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ByokAgentForm, EMPTY_BYOK } from "@/components/ByokAgentForm";
import type { ByokAgent } from "@/lib/byok";
import { aimlTestModels, defaultBenchSlug, openRouterFreeModels } from "@/lib/models";
import type { Domain, EvalRun, HarnessMode, RuleResult, TaskPublic } from "@/lib/types";

type EvalRes = {
  passed: boolean;
  score: number;
  details: string;
  output: string;
  rules?: RuleResult[];
  meta: { latency_ms: number; cost_usd: number };
};

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
  { label: "drawing", value: "drawing" },
];

const DIFFICULTIES = ["", "easy", "medium", "hard"] as const;
type DifficultyFilter = (typeof DIFFICULTIES)[number];

const STORAGE_BYOK = "bench-byok-agent";

function loadByok(): ByokAgent {
  if (typeof window === "undefined") return { ...EMPTY_BYOK };
  try {
    const raw = sessionStorage.getItem(STORAGE_BYOK);
    if (raw) return JSON.parse(raw) as ByokAgent;
  } catch {
    /* ignore */
  }
  return { ...EMPTY_BYOK };
}

export default function BenchPage() {
  const [domain, setDomain] = useState<Domain>("instruction");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("");
  const [tasks, setTasks] = useState<TaskPublic[]>([]);
  const [taskId, setTaskId] = useState("");
  const [model, setModel] = useState<string>(defaultBenchSlug);
  const [paste, setPaste] = useState("");
  const [res, setRes] = useState<EvalRes | null>(null);
  const [turn1Output, setTurn1Output] = useState<string | null>(null);
  const [suite, setSuite] = useState<string | null>(null);
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [useByok, setUseByok] = useState(false);
  const [byok, setByok] = useState<ByokAgent>(EMPTY_BYOK);
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const harnessMode: HarnessMode = domain === "zero_ctx" ? "zero_context" : "standard";

  useEffect(() => {
    setByok(loadByok());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_BYOK, JSON.stringify(byok));
    }
  }, [byok]);

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

  async function testByok() {
    setTesting(true);
    setTestOk(null);
    try {
      const r = await fetch("/api/realshot/duel", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(byok),
      });
      const d = await r.json();
      setTestOk(!!d.ok);
    } catch {
      setTestOk(false);
    } finally {
      setTesting(false);
    }
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
          modelSlug: withPaste || useByok ? undefined : model,
          provider: !withPaste && useByok ? byok : undefined,
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
        body: JSON.stringify({
          modelSlug: useByok ? undefined : model,
          provider: useByok ? byok : undefined,
          domain,
          harnessMode,
        }),
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
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight text-zinc-100">bench</h1>
          <p className="mt-1 text-sm text-zinc-500">
            pick a domain, pick a model, run — every run goes through the same fixed harness
            {domain === "zero_ctx" && (
              <span className="ml-2 text-amber-400">· zero context (no system prompt)</span>
            )}
          </p>
        </div>

        {/* domain chips — wrap instead of overflowing off screen */}
        <div className="flex flex-wrap gap-1.5">
          {DOMAINS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDomain(d.value)}
              className={`border px-3 py-1 text-xs transition-colors ${
                domain === d.value
                  ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                  : "border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* difficulty filter */}
        <div className="mt-3 flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 text-xs transition-colors ${
                difficulty === d
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-300"
              }`}
            >
              {d === "" ? "all" : d}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* left — configure + run */}
          <div className="space-y-4">
            <section className="border border-zinc-900 bg-zinc-950/50 p-5 space-y-3">
              <label className="block text-xs uppercase tracking-widest text-zinc-600">task</label>
              <select
                className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
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
                <p className="border border-zinc-900 bg-black p-3 text-sm leading-relaxed text-zinc-300">{prompt}</p>
              )}

              <label className="flex items-center gap-2 pt-1 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={useByok}
                  onChange={(e) => setUseByok(e.target.checked)}
                />
                use my own API key (BYOK)
              </label>

              {useByok ? (
                <ByokAgentForm
                  agent={byok}
                  onChange={setByok}
                  onTest={testByok}
                  testing={testing}
                  testOk={testOk}
                />
              ) : (
                <>
                  <label className="block text-xs uppercase tracking-widest text-zinc-600">model</label>
                  <select
                    className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <optgroup label="openrouter free — host default (1 req/min)">
                      {openRouterFreeModels.map((m) => (
                        <option key={m.slug} value={m.slug}>
                          {m.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="aiml — needs AIMLAPI_KEY or BYOK">
                      {aimlTestModels.map((m) => (
                        <option key={m.slug} value={m.slug}>
                          {m.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </>
              )}

              {!useByok && (
                <p className="text-xs text-zinc-600">
                  free host tier: 1 request per minute per tester. enable BYOK to go faster.
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button disabled={busy || !taskId || (useByok && !byok.apiKey)} onClick={() => runOne(false)}>
                  {busy ? "running…" : "run task"}
                </Button>
                <Button variant="outline" disabled={busy || !tasks.length || !useByok || !byok.apiKey} onClick={runAll} title={!useByok ? "full suite needs BYOK — free host tier is 1 req/min" : undefined}>
                  run full suite
                </Button>
              </div>
            </section>

            <details className="border border-zinc-900 bg-zinc-950/50">
              <summary className="cursor-pointer px-5 py-3 text-sm text-zinc-500 hover:text-zinc-300">
                paste output instead (score without an api key)
              </summary>
              <div className="space-y-3 px-5 pb-5">
                <textarea
                  className="min-h-24 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  placeholder="paste model output to score against the selected task"
                />
                <Button variant="outline" disabled={busy || !paste || !taskId} onClick={() => runOne(true)}>
                  score pasted output
                </Button>
              </div>
            </details>
          </div>

          {/* right — live result */}
          <div className="space-y-4">
            {err && <p className="border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-400">{err}</p>}
            {suite && (
              <p className="border border-emerald-900/50 bg-emerald-950/20 p-3 text-sm text-emerald-300">
                suite: {suite}
              </p>
            )}

            {res ? (
              <section className="border border-zinc-900 bg-zinc-950/50 p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge ok={res.passed}>{res.passed ? "pass" : "fail"}</Badge>
                  <span className="text-sm text-zinc-100">score {res.score}</span>
                  <span className="ml-auto font-mono text-xs text-zinc-500">
                    {res.meta.latency_ms}ms · ${res.meta.cost_usd}
                  </span>
                </div>
                {domain === "sycophancy" && turn1Output && (
                  <>
                    <p className="text-xs text-zinc-500">turn 1 — initial answer</p>
                    <pre className="whitespace-pre-wrap border border-zinc-900 bg-black p-3 text-xs text-zinc-300">
                      {turn1Output}
                    </pre>
                    <p className="text-xs text-zinc-500">turn 2 — after challenge</p>
                    <pre className="whitespace-pre-wrap border border-zinc-900 bg-black p-3 text-xs text-zinc-300">
                      {res.output}
                    </pre>
                  </>
                )}
                <p className="text-xs uppercase tracking-widest text-zinc-600">verifier breakdown</p>
                <pre className="whitespace-pre-wrap border border-zinc-900 bg-black p-3 text-xs text-zinc-300">
                  {domain === "sycophancy"
                    ? res.details.replace(/^\[turn1\][\s\S]*?\[\/turn1\]\n/, "")
                    : res.details}
                </pre>
                {domain !== "sycophancy" && (
                  <details open>
                    <summary className="cursor-pointer text-xs uppercase tracking-widest text-zinc-600">model output</summary>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap border border-zinc-900 bg-black p-3 text-xs text-zinc-300">
                      {res.output}
                    </pre>
                  </details>
                )}
              </section>
            ) : (
              <div className="flex min-h-40 items-center justify-center border border-dashed border-zinc-900 p-5">
                <p className="text-sm text-zinc-700">run a task — pass/fail, score, latency and the verifier breakdown land here</p>
              </div>
            )}
          </div>
        </div>

        {/* recent runs — full metric row, not just a score */}
        <section className="mt-8 border border-zinc-900">
          <h2 className="border-b border-zinc-900 bg-zinc-950/50 px-4 py-3 text-xs uppercase tracking-widest text-zinc-600">
            recent runs
          </h2>
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-zinc-900">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-zinc-400">{r.task_id}</td>
                  <td className="px-4 py-2.5 font-mono text-zinc-300">{r.model_slug}</td>
                  <td className="px-4 py-2.5 text-zinc-600">{r.domain}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-500">{r.latency_ms}ms</td>
                  <td className={`px-4 py-2.5 text-right ${r.passed ? "text-emerald-400" : "text-red-400"}`}>
                    {r.passed ? "pass" : "fail"} · {r.score}
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-600">no runs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}


// code can be made clean for now not worrying on it like the reduduncy on regex etc and all -- subject to change later on --- 