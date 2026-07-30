import type {
  ChallengeResults,
  ChallengeRunRow,
  ChallengeSummary,
  ChallengeTaskRef,
} from "./types";

export type TaskFieldScore = {
  task: ChallengeTaskRef;
  passed: number;
  total: number;
  pct: number;
};

export type SpecimenFail = {
  run: ChallengeRunRow;
  task: ChallengeTaskRef;
  /** first verifier fail line, for the “receipt photo” */
  failLine: string;
  /** truncated model output for display */
  outputPreview: string;
};

export type ChallengeReceipt = {
  winner: ChallengeSummary | null;
  tiedWinners: ChallengeSummary[];
  wipeouts: TaskFieldScore[];
  clears: TaskFieldScore[];
  specimen: SpecimenFail | null;
  modelCount: number;
  taskCount: number;
  /** short share one-liner (~140 chars) from description */
  punchline: string;
  /** copy-paste share text for Discord / X */
  shareText: string;
};

function shortLabel(label: string, max = 42): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

function firstFailLine(details: string): string {
  const line =
    details
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("fail:")) ?? details.split("\n")[0]?.trim() ?? "";
  return line.length > 120 ? `${line.slice(0, 119)}…` : line;
}

function outputPreview(run: ChallengeRunRow, max = 220): string {
  if (run.error) return `error: ${run.error}`;
  const raw = (run.output || "").trim();
  if (!raw) return "(empty output)";
  return raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
}

export function taskFieldScores(data: ChallengeResults): TaskFieldScore[] {
  return data.manifest.tasks.map((task) => {
    const rows = data.runs.filter((r) => r.task_id === task.id);
    const passed = rows.filter((r) => r.passed).length;
    const total = rows.length;
    return {
      task,
      passed,
      total,
      pct: total ? Math.round((passed / total) * 100) : 0,
    };
  });
}

/** pick the most shareable fail: wipeout task preferred, then non-empty output, then winner model */
export function pickSpecimenFail(data: ChallengeResults): SpecimenFail | null {
  const fields = taskFieldScores(data);
  const wipeoutIds = new Set(
    fields.filter((f) => f.total > 0 && f.passed === 0).map((f) => f.task.id),
  );
  const winners = [...data.summaries].sort((a, b) => b.pass_rate - a.pass_rate);
  const topRate = winners[0]?.pass_rate ?? -1;
  const winnerSlugs = new Set(
    winners.filter((w) => w.pass_rate === topRate).map((w) => w.model_slug),
  );

  const fails = data.runs.filter((r) => !r.passed);
  if (!fails.length) return null;

  const scored = fails.map((run) => {
    const task =
      data.manifest.tasks.find((t) => t.id === run.task_id) ??
      ({
        id: run.task_id,
        label: run.task_label,
        category: run.task_category,
      } satisfies ChallengeTaskRef);
    let score = 0;
    if (wipeoutIds.has(run.task_id)) score += 100;
    if ((run.output || "").trim().length > 0) score += 40;
    if (!run.error) score += 20;
    if (winnerSlugs.has(run.model_slug)) score += 15;
    // prefer longer verifier detail (more “receipt”)
    score += Math.min(10, (run.details || "").split("\n").filter((l) => l.startsWith("fail:")).length);
    return { run, task, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) return null;

  return {
    run: best.run,
    task: best.task,
    failLine: firstFailLine(best.run.details || ""),
    outputPreview: outputPreview(best.run),
  };
}

export function buildChallengeReceipt(data: ChallengeResults): ChallengeReceipt {
  const ranked = [...data.summaries].sort((a, b) => b.pass_rate - a.pass_rate);
  const winner = ranked[0] ?? null;
  const tiedWinners =
    winner != null
      ? ranked.filter((s) => s.pass_rate === winner.pass_rate)
      : [];

  const fields = taskFieldScores(data);
  const wipeouts = fields.filter((f) => f.total > 0 && f.passed === 0);
  const clears = fields.filter((f) => f.total > 0 && f.passed === f.total);
  const specimen = pickSpecimenFail(data);

  const desc = data.manifest.description.trim();
  const punchline =
    desc.length <= 140 ? desc : `${desc.slice(0, 137).trimEnd()}…`;

  const topPct = winner ? Math.round(winner.pass_rate * 100) : null;
  const winnerNames =
    tiedWinners.length > 1
      ? tiedWinners.map((w) => w.model_label.replace(/\s*\(via .*\)\s*$/i, "")).join(" / ")
      : winner
        ? winner.model_label.replace(/\s*\(via .*\)\s*$/i, "")
        : "—";

  const wipeNick = wipeouts[0] ? shortLabel(wipeouts[0].task.label, 36) : null;
  const shareBits = [
    `${data.manifest.title}: ${winnerNames}${topPct != null ? ` · ${topPct}%` : ""}`,
    wipeNick ? `universal wipeout: ${wipeNick}` : null,
    "rule verifier · 0 LLM judges · slopmark",
  ].filter(Boolean);

  return {
    winner,
    tiedWinners,
    wipeouts,
    clears,
    specimen,
    modelCount: data.manifest.models.length,
    taskCount: data.manifest.tasks.length,
    punchline,
    shareText: shareBits.join("\n"),
  };
}

export function taskAnchorId(taskId: string): string {
  return `fail-${taskId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function modelAnchorId(modelSlug: string): string {
  return `model-${modelSlug.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
