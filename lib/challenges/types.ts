import type { HarnessMode } from "../types";

export type ChallengeTaskRef = {
  id: string;
  label: string;
  category: string;
};

export type ChallengeModelRef = {
  slug: string;
  label: string;
};

export type ChallengeManifest = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  harness_mode: HarnessMode;
  tasks: ChallengeTaskRef[];
  models: ChallengeModelRef[];
  created_at: string;
};

export type ChallengeRunRow = {
  id: string;
  challenge_slug: string;
  task_id: string;
  task_label: string;
  task_category: string;
  task_prompt: string;
  model_slug: string;
  model_label: string;
  output: string;
  passed: boolean;
  score: number;
  details: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  error?: string;
  created_at: string;
};

export type ChallengeSummary = {
  model_slug: string;
  model_label: string;
  runs: number;
  passed: number;
  pass_rate: number;
  avg_score: number;
  avg_latency_ms: number;
};

export type ChallengeResults = {
  manifest: ChallengeManifest;
  runs: ChallengeRunRow[];
  summaries: ChallengeSummary[];
  completed_at: string;
};
