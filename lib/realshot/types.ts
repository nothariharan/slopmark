import type { HarnessMode, RuleResult, VerifierResult } from "../types";

export type RealshotCategory =
  | "random"
  | "constraint"
  | "procedural"
  | "json"
  | "html"
  | "extract"
  | "regex";

export type RealshotAgent = {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
};

export type RealshotSide = {
  name: string;
  output: string;
  passed: boolean;
  score: number;
  details: string;
  rules?: RuleResult[];
  meta: { latency_ms: number; input_tokens: number; output_tokens: number };
  error?: string;
};

export type RealshotDuelResult = {
  duelId: string;
  category: RealshotCategory;
  harnessMode: HarnessMode;
  seed: number;
  task: {
    id: string;
    label: string;
    prompt: string;
  };
  agentA: RealshotSide;
  agentB: RealshotSide;
  winner: "a" | "b" | "tie";
};
