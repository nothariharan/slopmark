import { runModel } from "./openrouter";
import { runVerifier } from "./verifiers";
import type { BenchTask, HarnessMode, VerifierResult } from "./types";

export type RobustnessReport = {
  paraphrase_pass_rate: number;
  paraphrase_runs: number;
  counterfactual_passed: boolean | null;
  counterfactual_details: string | null;
};

export async function runRobustnessProbes(
  task: BenchTask,
  modelSlug: string,
  primaryPassed: boolean,
  harnessMode: HarnessMode = "standard",
): Promise<{ report: RobustnessReport; detailsAppend: string }> {
  const report: RobustnessReport = {
    paraphrase_pass_rate: primaryPassed ? 1 : 0,
    paraphrase_runs: 0,
    counterfactual_passed: null,
    counterfactual_details: null,
  };

  const lines: string[] = [];

  if (task.paraphrases?.length) {
    let passed = 0;
    for (const p of task.paraphrases) {
      const res = await runModel(p, modelSlug, harnessMode);
      const vr = runVerifier(res.output, task.verifier);
      if (vr.passed) passed += 1;
      report.paraphrase_runs += 1;
    }
    report.paraphrase_pass_rate = passed / task.paraphrases.length;
    lines.push(`paraphrase: ${passed}/${task.paraphrases.length} passed`);
  }

  if (task.counterfactual) {
    const res = await runModel(task.counterfactual.prompt, modelSlug, harnessMode);
    const vr = runVerifier(res.output, task.counterfactual.verifier);
    report.counterfactual_passed = vr.passed;
    report.counterfactual_details = vr.details;
    lines.push(`counterfactual: ${vr.passed ? "pass" : "fail"} — ${vr.details}`);
  }

  return { report, detailsAppend: lines.length ? lines.join("\n") : "" };
}

export function mergeVerifierResults(primary: VerifierResult, report: RobustnessReport): VerifierResult {
  if (report.paraphrase_runs === 0 && report.counterfactual_passed === null) {
    return primary;
  }

  let penalty = 0;
  if (report.paraphrase_runs > 0 && report.paraphrase_pass_rate < 1) {
    penalty += Math.round((1 - report.paraphrase_pass_rate) * 30);
  }
  if (report.counterfactual_passed === false) {
    penalty += 20;
  }

  const score = Math.max(0, primary.score - penalty);
  const passed = primary.passed && score >= 70 && report.counterfactual_passed !== false;

  return {
    ...primary,
    passed,
    score,
    details: primary.details,
  };
}


// something new i am trying right now to see if its good to do aocontaminationrun on the agents and see hiow they work 