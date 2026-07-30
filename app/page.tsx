import Link from "next/link";
import fs from "fs/promises";
import path from "path";
import { listChallengeSlugs, loadChallengeResults } from "@/lib/challenges/store-json";
import { buildChallengeReceipt } from "@/lib/challenges/receipt";
import { listSessions } from "@/lib/challenges/sessions";
import type { ChallengeResults } from "@/lib/challenges/types";
import { SlopDoodle } from "@/components/SlopDoodle";

export const dynamic = "force-dynamic";

async function countTasks(): Promise<{ tasks: number; domains: number }> {
  try {
    const root = path.join(process.cwd(), "data", "tasks");
    const files = (await fs.readdir(root)).filter((f) => f.endsWith(".json"));
    let tasks = 0;
    for (const f of files) {
      try {
        const raw = JSON.parse(await fs.readFile(path.join(root, f), "utf8"));
        if (Array.isArray(raw)) tasks += raw.length;
      } catch {
        /* skip malformed */
      }
    }
    return { tasks, domains: files.length };
  } catch {
    return { tasks: 0, domains: 0 };
  }
}

async function featuredChallenges(): Promise<ChallengeResults[]> {
  const slugs = await listChallengeSlugs();
  const out: ChallengeResults[] = [];
  for (const slug of slugs) {
    const r = await loadChallengeResults(slug);
    if (r) out.push(r);
  }
  // newest first
  return out.sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}

export default async function Home() {
  const [{ tasks, domains }, featured, sessions] = await Promise.all([
    countTasks(),
    featuredChallenges(),
    listSessions(),
  ]);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4">
        {/* hero */}
        <section className="grid items-center gap-8 py-16 md:grid-cols-[1.4fr_1fr] md:py-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-600">
              the honest slop detector
            </p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">slopmark</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-400">
              AI models are great at sounding smart and terrible at admitting when
              they&apos;re not. slopmark feeds them tasks with{" "}
              <span className="text-zinc-200">machine-checkable answers</span>, runs every
              model through the exact same harness, and lets a rule-based verifier — never
              another AI — decide who actually passed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/bench"
                className="border border-zinc-100 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white"
              >
                bench →
              </Link>
              <Link
                href="/playground"
                className="border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
              >
                play →
              </Link>
              <Link
                href="/challenges"
                className="border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
              >
                receipts
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-zinc-600">
              <span><span className="text-zinc-300">{tasks}</span> tasks in the pool</span>
              <span><span className="text-zinc-300">{domains}</span> domains</span>
              <span><span className="text-zinc-300">{featured.length + sessions.length}</span> completed sessions</span>
              <span><span className="text-zinc-300">0</span> LLM judges. ever.</span>
            </div>
          </div>
          <SlopDoodle className="mx-auto w-full max-w-xs md:max-w-sm" />
        </section>

        {/* featured challenges */}
        <section className="border-t border-zinc-900 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-medium tracking-tight">featured challenges</h2>
              <p className="mt-1 text-sm text-zinc-500">
                bench receipts — fixed traps, fixed harness, wipeouts included
              </p>
            </div>
            <Link href="/challenges" className="text-sm text-zinc-500 hover:text-zinc-200">
              all challenges →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((c) => {
              const top = [...c.summaries].sort((a, b) => b.pass_rate - a.pass_rate)[0];
              const receipt = buildChallengeReceipt(c);
              const wipe = receipt.wipeouts[0]?.task.label;
              const punch =
                wipe && top
                  ? `${top.model_label.replace(/\s*\(via .*\)\s*$/i, "")} ${Math.round(top.pass_rate * 100)}% · ${wipe} 0/${receipt.wipeouts[0].total}`
                  : null;
              return (
                <Link
                  key={c.manifest.slug}
                  href={`/challenge/${c.manifest.slug}#receipt`}
                  className="group block border border-zinc-900 bg-zinc-950/50 p-5 transition-colors hover:border-zinc-700"
                >
                  <p className="font-mono text-xs uppercase tracking-widest text-amber-500/80">featured</p>
                  <h3 className="mt-2 font-medium text-zinc-100 group-hover:text-white">{c.manifest.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{c.manifest.subtitle}</p>
                  {punch ? (
                    <p className="mt-4 font-mono text-xs leading-relaxed text-zinc-500">
                      <span className="text-emerald-400">{Math.round((top?.pass_rate ?? 0) * 100)}%</span>
                      {" · "}
                      <span className="text-zinc-300">
                        {top?.model_label.replace(/\s*\(via .*\)\s*$/i, "")}
                      </span>
                      {" · "}
                      <span className="text-red-300/80">
                        {wipe} 0/{receipt.wipeouts[0].total}
                      </span>
                    </p>
                  ) : top ? (
                    <p className="mt-4 font-mono text-xs text-zinc-600">
                      winner: <span className="text-emerald-400">{top.model_label}</span>{" "}
                      · {Math.round(top.pass_rate * 100)}% pass ·{" "}
                      {new Date(c.completed_at).toLocaleDateString()}
                    </p>
                  ) : null}
                </Link>
              );
            })}
            {featured.length === 0 && (
              <p className="text-sm text-zinc-600">no challenges persisted yet.</p>
            )}
            <Link
              href="/challenges/new"
              className="flex items-center justify-center border border-dashed border-zinc-900 p-5 text-sm text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              + build your own — pick tasks, bring your key, get an infographic
            </Link>
          </div>
        </section>

        {/* how it works */}
        <section className="border-t border-zinc-900 py-14">
          <h2 className="text-xl font-medium tracking-tight">how a score is made</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            most leaderboards ask a bigger model to grade the answers. that&apos;s a vibe
            check, not a benchmark. here every point is traceable:
          </p>
          <ol className="mt-8 grid gap-3 md:grid-cols-4">
            {[
              {
                n: "01",
                t: "task drops",
                d: "a task with a machine-checkable contract comes out of the seed pool — word limits, JSON schemas, exact numbers, SVG shapes.",
              },
              {
                n: "02",
                t: "same harness, always",
                d: "identical system prompt, temperature 0, capped tokens. no per-model babysitting, no secret scaffolding.",
              },
              {
                n: "03",
                t: "rules decide",
                d: "a deterministic verifier checks the output against the contract and prints the rule-by-rule breakdown. no LLM judges.",
              },
              {
                n: "04",
                t: "everything is kept",
                d: "runs roll up to the leaderboard, sessions land on the wall, and the worst outputs get framed in the hall of shame.",
              },
            ].map((s) => (
              <li key={s.n} className="border border-zinc-900 bg-zinc-950/50 p-5">
                <p className="font-mono text-xs text-zinc-700">{s.n}</p>
                <h3 className="mt-2 text-sm font-medium text-zinc-100">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* play cluster — games + freeform, not the scored spine */}
        <section className="border-t border-zinc-900 py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
                play
              </p>
              <h2 className="mt-1 text-xl font-medium tracking-tight">
                when you&apos;re bored of charts
              </h2>
              <p className="mt-1 max-w-xl text-sm text-zinc-500">
                still the same models — just doors into stupid traps instead of
                suite runners. canvas and thunderdome live here too.
              </p>
            </div>
            <Link
              href="/playground"
              className="shrink-0 text-sm text-zinc-500 hover:text-zinc-200"
            >
              playground hub →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: "/goal", tag: "game", title: "you vs the model", d: "draw, stump, roulette — try to beat it yourself" },
              { href: "/canvas", tag: "battle", title: "canvas battles", d: "two models draw the same thing, you pick the worse one" },
              { href: "/thunderdome", tag: "debate", title: "thunderdome", d: "two models argue. it gets petty." },
              { href: "/arena", tag: "blind vote", title: "arena", d: "a vs b with the names hidden" },
              { href: "/realshot", tag: "BYOK", title: "realshot", d: "one-shot duels with your own key" },
              { href: "/shame", tag: "wall", title: "hall of shame", d: "the most confident wrong answers, upvoted" },
            ].map((v) => (
              <Link
                key={v.href}
                href={v.href}
                className="block border border-zinc-900 bg-zinc-950/50 p-4 transition-colors hover:border-zinc-700"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-700">{v.tag}</p>
                <h3 className="mt-1 text-sm font-medium text-zinc-100">{v.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{v.d}</p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="border-t border-zinc-900 py-8">
          <p className="font-mono text-xs text-zinc-700">
            slopmark — scores you can audit. every pass/fail has a rule behind it.
          </p>
        </footer>
      </main>
    </div>
  );
}
