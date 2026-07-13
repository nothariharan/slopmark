import Link from "next/link";

const LINKS = [
  { href: "/bench", label: "bench" },
  { href: "/playground", label: "playground" },
  { href: "/challenges", label: "challenges" },
  { href: "/sessions", label: "sessions" },
  { href: "/leaderboard", label: "leaderboard" },
  { href: "/shame", label: "shame" },
  { href: "/docs", label: "docs" },
];

export function Nav() {
  return (
    <header className="border-b border-zinc-900 bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-wide text-zinc-100">
          slopmark
        </Link>
        <nav className="flex items-center gap-5 overflow-x-auto text-sm text-zinc-400">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap transition-colors hover:text-zinc-100">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
