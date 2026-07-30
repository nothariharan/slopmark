import Link from "next/link";

/** serious eval + receipts — the product spine */
const BENCH = [
  { href: "/bench", label: "bench" },
  { href: "/challenges", label: "challenges" },
  { href: "/sessions", label: "sessions" },
  { href: "/leaderboard", label: "leaderboard" },
  { href: "/shame", label: "shame" },
  { href: "/docs", label: "docs" },
];

/** games and freeform — doors into the traps, not the main scoreboard */
const PLAY = [
  { href: "/playground", label: "playground" },
  { href: "/realshot", label: "realshot" },
  { href: "/goal", label: "goal" },
  { href: "/canvas", label: "canvas" },
  { href: "/arena", label: "arena" },
  { href: "/thunderdome", label: "thunderdome" },
];

function Cluster({
  name,
  links,
}: {
  name: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
        {name}
      </span>
      <div className="flex items-center gap-3.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap text-zinc-400 transition-colors hover:text-zinc-100"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Nav() {
  return (
    <header className="border-b border-zinc-900 bg-black">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold tracking-wide text-zinc-100"
        >
          slopmark
        </Link>

        {/*
          two clusters so visitors stop treating playground as the bench.
          canvas + thunderdome live under play now instead of only existing
          as tiles inside /playground
        */}
        <nav
          className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto text-sm"
          aria-label="primary"
        >
          <Cluster name="bench" links={BENCH} />
          <span
            className="hidden h-3 w-px shrink-0 bg-zinc-800 sm:block"
            aria-hidden
          />
          <Cluster name="play" links={PLAY} />
        </nav>
      </div>
    </header>
  );
}
