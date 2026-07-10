"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ByokAgentForm, EMPTY_BYOK } from "@/components/ByokAgentForm";
import { ChallengeInfographic } from "@/components/ChallengeInfographic";
import type { ByokAgent } from "@/lib/byok";
import type { ChallengeResults, ChallengeTaskRef } from "@/lib/challenges/types";

const PRESET_TASKS: ChallengeTaskRef[] = [
  { id: "proc-direction-easy-3", label: "compass 3 turns", category: "procedural" },
  { id: "proc-sequence-5", label: "number sequence", category: "procedural" },
  { id: "proc-calendar-medium-2", label: "calendar hop", category: "procedural" },
  { id: "proc-palindrome-1", label: "palindrome check", category: "procedural" },
  { id: "rs-extract-01", label: "scrape price", category: "extract" },
  { id: "rs-extract-03", label: "scrape email", category: "extract" },
  { id: "rs-html-02", label: "signup form html", category: "html" },
  { id: "rs-constraint-03", label: "ANSWER: 8 words", category: "constraint" },
  { id: "json-01", label: "name + age json", category: "json" },
  { id: "rs-regex-01", label: "hex color regex", category: "regex" },
];

type ModelSlot = { label: string; agent: ByokAgent };

const STORAGE_KEY = "challenge-builder-byok";

function loadSlots(): ModelSlot[] {
  if (typeof window === "undefined") {
    return [{ label: "model A", agent: { ...EMPTY_BYOK, name: "model A" } }];
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ModelSlot[];
  } catch {
    /* ignore */
  }
  return [{ label: "model A", agent: { ...EMPTY_BYOK, name: "model A" } }];
}

export default function NewChallengePage() {
  const [title, setTitle] = useState("my stupid sprint");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(["proc-sequence-5", "rs-extract-01", "json-01"]),
  );
  const [slots, setSlots] = useState<ModelSlot[]>([{ label: "model A", agent: EMPTY_BYOK }]);
  const [results, setResults] = useState<ChallengeResults | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [testing, setTesting] = useState<number | null>(null);
  const [testOk, setTestOk] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSlots(loadSlots());
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }, [slots]);

  function toggleTask(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function testSlot(i: number) {
    setTesting(i);
    setTestOk((p) => ({ ...p, [i]: false }));
    try {
      const r = await fetch("/api/realshot/duel", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(slots[i].agent),
      });
      const d = await r.json();
      setTestOk((p) => ({ ...p, [i]: !!d.ok }));
    } catch {
      setTestOk((p) => ({ ...p, [i]: false }));
    } finally {
      setTesting(null);
    }
  }

  async function runChallenge() {
    setBusy(true);
    setErr("");
    setResults(null);
    const tasks = PRESET_TASKS.filter((t) => selected.has(t.id));
    if (!tasks.length) {
      setErr("pick at least one task");
      setBusy(false);
      return;
    }
    try {
      const r = await fetch("/api/challenges/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          harness_mode: "zero_context",
          tasks,
          models: slots.map((s) => ({
            label: s.label,
            provider: s.agent,
          })),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "run failed");
      setResults(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "run failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadResults() {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${results.manifest.slug}-results.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/challenges" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← all challenges
        </Link>

        <h1 className="mt-4 text-2xl font-semibold">build a challenge</h1>
        <p className="mt-2 text-sm text-zinc-500">
          pick tasks, add BYOK models, run ad-hoc. results stay in your browser unless you download json.
        </p>

        <Card className="mt-8 space-y-3 border-zinc-800 bg-zinc-950 p-5">
          <label className="block text-sm text-zinc-400">challenge title</label>
          <input
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Card>

        <Card className="mt-4 space-y-3 border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm font-medium text-zinc-300">tasks ({selected.size} selected)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESET_TASKS.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleTask(t.id)}
                />
                <span>
                  {t.label}{" "}
                  <span className="text-zinc-600">({t.category})</span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <div className="mt-4 space-y-4">
          {slots.map((slot, i) => (
            <div key={i} className="relative">
              <input
                className="mb-2 w-full max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm"
                value={slot.label}
                onChange={(e) => {
                  const next = [...slots];
                  next[i] = { ...next[i], label: e.target.value };
                  setSlots(next);
                }}
                placeholder="model label"
              />
              <ByokAgentForm
                agent={slot.agent}
                onChange={(agent) => {
                  const next = [...slots];
                  next[i] = { ...next[i], agent };
                  setSlots(next);
                }}
                onTest={() => testSlot(i)}
                testing={testing === i}
                testOk={testOk[i] ?? null}
              />
              {slots.length > 1 && (
                <button
                  type="button"
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                  onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                >
                  remove model
                </button>
              )}
            </div>
          ))}
          {slots.length < 6 && (
            <Button
              variant="outline"
              onClick={() =>
                setSlots([
                  ...slots,
                  {
                    label: `model ${String.fromCharCode(65 + slots.length)}`,
                    agent: { ...EMPTY_BYOK, name: `model ${String.fromCharCode(65 + slots.length)}` },
                  },
                ])
              }
            >
              + add model
            </Button>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button disabled={busy || !slots.every((s) => s.agent.apiKey)} onClick={runChallenge}>
            {busy ? "running…" : "run challenge"}
          </Button>
          {results && (
            <Button variant="outline" onClick={downloadResults}>
              download results.json
            </Button>
          )}
        </div>

        {err && <p className="mt-4 text-sm text-red-400">{err}</p>}

        {results && (
          <div className="mt-12">
            <ChallengeInfographic data={results} />
          </div>
        )}
      </main>
    </div>
  );
}
