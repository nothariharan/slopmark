import Link from "next/link"

const links = [
  { href: "/", label: "Home" },
  { href: "/battle", label: "Battle" },
  { href: "/leaderboard", label: "Leaderboard" },
]

export function Navbar() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          Arena
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
