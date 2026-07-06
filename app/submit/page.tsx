"use client";

import { useState } from "react";
import type { Domain } from "@/lib/types";

const DOMAINS: Domain[] = ["instruction", "json", "math", "sycophancy", "agentic", "safety", "coding", "writing", "swe"];
const RULE_TYPES = [
  { value: "word_count", label: "word limit (max)", placeholder: "e.g. 50" },
  { value: "forbidden_substring", label: "forbidden word", placeholder: "e.g. the" },
  { value: "required_phrase", label: "required phrase", placeholder: "e.g. in conclusion" },
];

export default function SubmitPage() {
  const [domain, setDomain] = useState<Domain>("instruction");
  const [prompt, setPrompt] = useState("");
  const [ruleType, setRuleType] = useState(RULE_TYPES[0].value);
  const [ruleVal, setRuleVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, prompt, ruleType, ruleVal }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "submission failed");
      
      setMsg("Task submitted successfully! It is now pending admin approval.");
      setPrompt("");
      setRuleVal("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-medium tracking-tight mb-1 text-zinc-100">submit a task</h1>
          <p className="text-sm text-zinc-500">contribute to the slopmark benchmark dataset</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-sm text-zinc-500">domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as Domain)}
              className="w-full rounded-none border-b border-zinc-800 bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d} className="bg-zinc-950">{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-500">prompt</label>
            <textarea
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Write the instruction or question for the AI..."
              className="min-h-32 w-full rounded-none border border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-4 border border-zinc-900 p-4">
            <label className="block text-sm text-zinc-500">evaluation rule (verifier)</label>
            <p className="text-xs text-zinc-600 mb-4">How should we automatically score the model's response?</p>
            
            <div className="flex gap-4 flex-col sm:flex-row">
              <select
                value={ruleType}
                onChange={(e) => { setRuleType(e.target.value); setRuleVal(""); }}
                className="rounded-none border-b border-zinc-800 bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 w-full sm:w-1/2"
              >
                {RULE_TYPES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-zinc-950">{r.label}</option>
                ))}
              </select>

              <input
                required
                type="text"
                value={ruleVal}
                onChange={(e) => setRuleVal(e.target.value)}
                placeholder={RULE_TYPES.find(r => r.value === ruleType)?.placeholder}
                className="w-full sm:w-1/2 rounded-none border-b border-zinc-800 bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 placeholder:text-zinc-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || !prompt.trim() || !ruleVal.trim()}
            className="w-full bg-zinc-100 text-black py-3 text-sm font-medium hover:bg-zinc-300 transition-colors disabled:opacity-50"
          >
            {busy ? "submitting..." : "submit task"}
          </button>
        </form>

        {msg && <p className="mt-6 p-4 border border-zinc-800 text-zinc-400 text-center rounded-none text-sm">{msg}</p>}
        {err && <p className="mt-6 p-4 border border-red-900/50 text-red-400 text-center rounded-none text-sm">{err}</p>}
      </main>
    </div>
  );
}
