import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          slopmark
        </Link>
        <nav className="flex gap-4 text-sm text-zinc-400">
          <Link href="/bench" className="hover:text-zinc-100">
            bench
          </Link>
          <Link href="/leaderboard" className="hover:text-zinc-100">
            leaderboard
          </Link>
          <Link href="/docs" className="hover:text-zinc-100">
            docs
          </Link>
        </nav>
      </div>
    </header>
  );
}
