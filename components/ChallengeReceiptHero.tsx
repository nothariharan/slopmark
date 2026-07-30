"use client";

import { useState } from "react";
import {
  buildChallengeReceipt,
  taskAnchorId,
  type ChallengeReceipt,
} from "@/lib/challenges/receipt";
import type { ChallengeResults } from "@/lib/challenges/types";

function cleanModelLabel(label: string) {
  return label.replace(/\s*\(via .*\)\s*$/i, "");
}

export function ChallengeReceiptHero({
  data,
  slug,
}: {
  data: ChallengeResults;
  slug: string;
}) {
  const receipt = buildChallengeReceipt(data);
  const winnerPct = receipt.winner
    ? Math.round(receipt.winner.pass_rate * 100)
    : null;
  const winnerLine =
    receipt.tiedWinners.length > 1
      ? receipt.tiedWinners.map((w) => cleanModelLabel(w.model_label)).join(" / ")
      : receipt.winner
        ? cleanModelLabel(receipt.winner.model_label)
        : null;
  const specimenTaskId = receipt.specimen?.task.id;

  return (
    <section
      id="receipt"
      className="mb-12 border border-zinc-800 bg-zinc-950"
      aria-label="challenge receipt"
    >
      <div className="border-b border-zinc-900 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-500/80">
              challenge receipt
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              {receipt.punchline}
            </p>
          </div>
          <SharePack receipt={receipt} slug={slug} />
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-[1.1fr_1fr]">
        <div className="border-b border-zinc-900 px-5 py-6 sm:border-b-0 sm:border-r sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            top of the board
          </p>
          {winnerLine && winnerPct != null ? (
            <>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                {winnerPct}%
              </p>
              <p className="mt-1 text-base text-zinc-200">{winnerLine}</p>
              {receipt.tiedWinners.length > 1 && (
                <p className="mt-1 font-mono text-[11px] text-zinc-600">tied</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">no runs yet</p>
          )}
          <p className="mt-4 font-mono text-[11px] text-zinc-600">
            {receipt.modelCount} models · {receipt.taskCount} traps · rule
            verifier · 0 LLM judges
          </p>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <FieldChips
            title="universal wipeouts"
            tone="fail"
            items={receipt.wipeouts.map((w) => ({
              id: w.task.id,
              label: w.task.label,
              meta: `0/${w.total}`,
              href:
                w.task.id === specimenTaskId
                  ? `#${taskAnchorId(w.task.id)}`
                  : `#task-${w.task.id}`,
            }))}
            empty="no total wipeouts — soft field"
          />
          <div className="mt-5">
            <FieldChips
              title="universal clears"
              tone="pass"
              items={receipt.clears.map((c) => ({
                id: c.task.id,
                label: c.task.label,
                meta: `${c.total}/${c.total}`,
                href: `#task-${c.task.id}`,
              }))}
              empty="nothing cleared by everyone"
            />
          </div>
        </div>
      </div>

      {receipt.specimen && <SpecimenCard receipt={receipt} />}
    </section>
  );
}

function FieldChips({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: "fail" | "pass";
  items: { id: string; label: string; meta: string; href: string }[];
  empty: string;
}) {
  const chip =
    tone === "fail"
      ? "border-red-950/80 bg-red-950/25 text-red-200/90"
      : "border-emerald-950/80 bg-emerald-950/20 text-emerald-200/90";

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-600">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className={`inline-flex max-w-full items-baseline gap-2 border px-2.5 py-1 text-left text-xs transition-colors hover:border-zinc-600 ${chip}`}
              >
                <span className="truncate">{item.label}</span>
                <span className="shrink-0 font-mono text-[10px] opacity-70">
                  {item.meta}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SpecimenCard({ receipt }: { receipt: ChallengeReceipt }) {
  const { specimen } = receipt;
  if (!specimen) return null;
  const { run, task, failLine, outputPreview } = specimen;
  const [openPrompt, setOpenPrompt] = useState(false);

  return (
    <div
      id={taskAnchorId(task.id)}
      className="scroll-mt-24 border-t border-zinc-900 px-5 py-6 sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          specimen fail
        </p>
        <span className="border border-red-950/70 bg-red-950/30 px-2 py-0.5 font-mono text-[10px] text-red-300">
          fail
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          {task.category}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-medium text-zinc-100">{task.label}</h3>
      {task.blurb && (
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-500">
          {task.blurb}
        </p>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        model:{" "}
        <span className="text-zinc-300">{cleanModelLabel(run.model_label)}</span>
      </p>

      {failLine && (
        <pre className="mt-4 overflow-x-auto border border-red-950/50 bg-red-950/15 px-3 py-2 font-mono text-[11px] leading-relaxed text-red-300/85 whitespace-pre-wrap">
          {failLine}
        </pre>
      )}

      <pre className="mt-3 max-h-40 overflow-auto border border-zinc-900 bg-black px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-500 whitespace-pre-wrap">
        {outputPreview}
      </pre>

      <button
        type="button"
        onClick={() => setOpenPrompt((v) => !v)}
        className="mt-3 text-[11px] text-zinc-600 underline-offset-2 hover:text-zinc-300 hover:underline"
      >
        {openPrompt ? "hide prompt" : "show prompt"}
      </button>
      {openPrompt && (
        <pre className="mt-2 max-h-48 overflow-auto border border-zinc-900 bg-zinc-950 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 whitespace-pre-wrap">
          {run.task_prompt}
        </pre>
      )}
    </div>
  );
}

function SharePack({
  receipt,
  slug,
}: {
  receipt: ChallengeReceipt;
  slug: string;
}) {
  const [copied, setCopied] = useState<"link" | "card" | null>(null);

  async function copy(kind: "link" | "card") {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/challenge/${slug}#receipt`
        : `/challenge/${slug}#receipt`;
    const text =
      kind === "link"
        ? url
        : `${receipt.shareText}\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard may be blocked */
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => copy("link")}
        className="border border-zinc-800 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
      >
        {copied === "link" ? "copied link" : "copy link"}
      </button>
      <button
        type="button"
        onClick={() => copy("card")}
        className="border border-zinc-800 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
      >
        {copied === "card" ? "copied card" : "copy share card"}
      </button>
    </div>
  );
}
