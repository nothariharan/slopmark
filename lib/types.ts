export type Domain =
  | "instruction"
  | "json"
  | "math"
  | "coding"
  | "writing"
  | "swe";

export type InstructionRule =
  | { type: "word_count"; exact?: number; min?: number; max?: number }
  | { type: "paragraph_count"; exact?: number; min?: number; max?: number }
  | { type: "forbidden_substring"; values: string[]; case_insensitive?: boolean }
  | { type: "required_phrase"; values: string[]; case_insensitive?: boolean }
  | { type: "starts_with"; value: string }
  | { type: "ends_with"; value: string }
  | { type: "max_chars"; value: number }
  | { type: "line_count"; exact?: number; min?: number; max?: number };

export type VerifierConfig =
  | { type: "instruction_rules"; rules: InstructionRule[] }
  | { type: "json_schema"; schema: object }
  | { type: "exact_number"; expected: string }
  | { type: "code_exec"; tests: unknown[] }
  | { type: "human_vote" };

export type RuleResult = { rule: string; ok: boolean; msg: string };

export type VerifierResult = {
  passed: boolean;
  score: number;
  details: string;
  rules?: RuleResult[];
};

export type BenchTask = {
  id: string;
  domain: Domain;
  prompt: string;
  verifier: VerifierConfig;
  source: "seed" | "community";
  approved: boolean;
};

export type EvalRun = {
  id: string;
  task_id: string;
  domain: Domain;
  model_slug: string;
  output: string;
  passed: boolean;
  score: number;
  details: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
};

export type LeaderboardRow = {
  model_slug: string;
  domain: Domain;
  runs: number;
  pass_rate: number;
  avg_score: number;
  avg_latency_ms: number;
  avg_cost_usd: number;
};

export type TaskPublic = {
  id: string;
  domain: Domain;
  prompt: string;
  source: string;
};

export type RunMeta = {
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};
