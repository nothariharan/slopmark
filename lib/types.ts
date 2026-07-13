export type Domain =
  | "instruction"
  | "json"
  | "math"
  | "coding"
  | "writing"
  | "swe"
  | "sycophancy"
  | "agentic"
  | "safety"
  | "calibration"
  | "persistence"
  | "procedural"
  | "refusal"
  | "hierarchy"
  | "zero_ctx"
  | "drawing";

export const MIN_RUNS = 3;

export type HarnessMode = "standard" | "zero_context";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type InstructionRule =
  | { type: "word_count"; exact?: number; min?: number; max?: number }
  | { type: "paragraph_count"; exact?: number; min?: number; max?: number }
  | { type: "forbidden_substring"; values: string[]; case_insensitive?: boolean }
  | { type: "required_phrase"; values: string[]; case_insensitive?: boolean }
  | { type: "starts_with"; value: string }
  | { type: "ends_with"; value: string }
  | { type: "max_chars"; value: number }
  | { type: "line_count"; exact?: number; min?: number; max?: number };

export type SycophancyPush = { challenge: string };

export type VerifierConfig =
  | { type: "instruction_rules"; rules: InstructionRule[] }
  | { type: "json_schema"; schema: object }
  | { type: "exact_number"; expected: string }
  | { type: "code_exec"; tests: unknown[] }
  | { type: "human_vote"; min_words?: number; max_words?: number }
  | { type: "sycophancy_check"; challenge: string; correct_token: string; incorrect_token: string }
  | { type: "sycophancy_resistance"; correct_token: string; pushes: SycophancyPush[] }
  | { type: "calibration_check"; answer_token: string }
  | { type: "persistence_check"; rule: InstructionRule; follow_up_prompts: string[] }
  | { type: "gaslight_check"; original_fact: string }
  | { type: "tool_labyrinth"; broken_tools: string[]; fallback_tool: string }
  | { type: "distraction_trap"; bait: string }
  | { type: "malicious_env"; payload: string }
  | { type: "infinite_loop"; max_steps: number }
  | { type: "prompt_injection"; trigger_phrase: string }
  | { type: "rag_obedience"; page_title: string; fake_fact: string; question: string; expected_answer: string }
  | { type: "procedural_answer"; expected: string; mode: "contains" | "exact_number" | "time" | "yes_no" }
  | { type: "refusal_check"; should_refuse: boolean; forbidden_tokens?: string[] }
  | { type: "hierarchy_check"; rules: InstructionRule[]; system_override?: string }
  | { type: "html_contract"; rules: HtmlRule[] }
  | { type: "regex_craft"; tests: { text: string; should_match: boolean }[] };

export type HtmlRule =
  | { type: "contains_tag"; tag: string; min_count?: number }
  | { type: "attribute_exists"; tag: string; attr: string }
  | { type: "required_substring"; value: string; case_insensitive?: boolean }
  | { type: "forbidden_pattern"; pattern: string };

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
  difficulty?: "easy" | "medium" | "hard";
  template_id?: string;
  paraphrases?: string[];
  counterfactual?: { prompt: string; verifier: VerifierConfig };
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
  harness_version: string;
  task_pool_version: string;
  harness_mode?: HarnessMode;
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
  avg_output_tokens: number;
};

export type TaskPublic = {
  id: string;
  domain: Domain;
  prompt: string;
  source: string;
  difficulty?: string;
};

export type RunMeta = {
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};
