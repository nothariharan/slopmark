"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ByokAgent } from "@/lib/byok";

export const EMPTY_BYOK: ByokAgent = {
  name: "my model",
  baseURL: "https://api.aimlapi.com/v1",
  apiKey: "",
  model: "openai/gpt-4o-mini",
};

export function ByokAgentForm({
  agent,
  onChange,
  onTest,
  testing,
  testOk,
}: {
  agent: ByokAgent;
  onChange: (a: ByokAgent) => void;
  onTest: () => void;
  testing: boolean;
  testOk: boolean | null;
}) {
  return (
    <Card className="space-y-3 border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm font-semibold text-zinc-300">bring your own key</p>
      <p className="text-xs text-zinc-500">keys stay in your browser — sent per request only, never stored server-side</p>
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
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        placeholder="api key"
        type="password"
        value={agent.apiKey}
        onChange={(e) => onChange({ ...agent, apiKey: e.target.value })}
      />
      <input
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        placeholder="model id (e.g. openai/gpt-4o-mini)"
        value={agent.model}
        onChange={(e) => onChange({ ...agent, model: e.target.value })}
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={testing || !agent.apiKey} onClick={onTest}>
          {testing ? "testing…" : "test connection"}
        </Button>
        {testOk === true && <span className="text-xs text-emerald-400">pong ok</span>}
        {testOk === false && <span className="text-xs text-red-400">connection failed</span>}
      </div>
    </Card>
  );
}
