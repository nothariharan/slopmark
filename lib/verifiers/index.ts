import type { VerifierConfig, VerifierResult } from "../types";
import { verifyInstruction } from "./instruction";
import { verifyJSON } from "./json";
import { verifyExactNumber } from "./math";
import { verifySycophancy } from "./sycophancy";
import { verifyGaslight, verifyToolLabyrinth, verifyInfiniteLoop, verifyRagObedience } from "./agentic";
import { verifyDistractionTrap, verifyMaliciousEnv, verifyPromptInjection } from "./safety";
import { verifyCodeExec } from "./sandbox";
import { verifyWriting } from "./writing";
import { verifyCalibration } from "./calibration";
import { verifyProcedural } from "./procedural";
import { verifyRefusal } from "./refusal";
import { verifyHierarchy } from "./hierarchy";
import { verifyHtml } from "./html";
import { verifyRegexCraft } from "./regex";

export function runVerifier(out: string, cfg: VerifierConfig): VerifierResult {
  switch (cfg.type) {
    case "instruction_rules":
      return verifyInstruction(out, cfg.rules);
    case "json_schema":
      return verifyJSON(out, cfg.schema);
    case "exact_number":
      return verifyExactNumber(out, cfg.expected);
    case "sycophancy_check":
      return verifySycophancy(out, cfg);
    case "sycophancy_resistance":
      // scored by eval.ts after all pushes; this path is a fallback
      return { passed: false, score: 0, details: "sycophancy_resistance must be run via evalTask" };
    case "calibration_check":
      return verifyCalibration(out, cfg.answer_token);
    case "persistence_check":
      // scored by eval.ts after all follow-up turns
      return { passed: false, score: 0, details: "persistence_check must be run via evalTask" };
    case "gaslight_check":
      return verifyGaslight(out, cfg.original_fact);
    case "tool_labyrinth":
      return verifyToolLabyrinth(out, cfg.fallback_tool);
    case "infinite_loop":
      return verifyInfiniteLoop(out);
    case "rag_obedience":
      return verifyRagObedience(out, cfg.expected_answer);
    case "distraction_trap":
      return verifyDistractionTrap(out, cfg.bait);
    case "malicious_env":
      return verifyMaliciousEnv(out, cfg.payload);
    case "prompt_injection":
      return verifyPromptInjection(out, cfg.trigger_phrase);
    case "code_exec":
      return verifyCodeExec(out, cfg.tests);
    case "human_vote":
      return verifyWriting(out, { min_words: cfg.min_words, max_words: cfg.max_words });
    case "procedural_answer":
      return verifyProcedural(out, cfg);
    case "refusal_check":
      return verifyRefusal(out, cfg);
    case "hierarchy_check":
      return verifyHierarchy(out, cfg);
    case "html_contract":
      return verifyHtml(out, cfg.rules);
    case "regex_craft":
      return verifyRegexCraft(out, cfg.tests);
    default:
      return { passed: false, score: 0, details: "unknown verifier type" };
  }
}
