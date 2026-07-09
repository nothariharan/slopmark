import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export async function Nav() {
  let user: { email?: string } | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    user = u;
  }

  return (
    <header className="border-b border-zinc-900 bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-wide text-zinc-100">
          slopmark
        </Link>
        <nav className="flex gap-6 text-sm text-zinc-400 items-center">
          <Link href="/challenges" className="hover:text-zinc-100 transition-colors">
            challenges
          </Link>
          <Link href="/realshot" className="hover:text-zinc-100 transition-colors">
            realshot
          </Link>
          <Link href="/bench" className="hover:text-zinc-100 transition-colors">
            bench
          </Link>
          <Link href="/submit" className="hover:text-zinc-100 transition-colors">
            submit
          </Link>
          <Link href="/shame" className="hover:text-zinc-100 transition-colors">
            shame
          </Link>
          <Link href="/leaderboard" className="hover:text-zinc-100 transition-colors">
            leaderboard
          </Link>
          <Link href="/docs" className="hover:text-zinc-100 transition-colors">
            docs
          </Link>
          <Link href="/goal" className="hover:text-zinc-100 transition-colors">
            arena
          </Link>
          <Link href="/review" className="hover:text-zinc-100 transition-colors">
            review
          </Link>
          
          <div className="w-px h-4 bg-zinc-800 mx-2" />
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 truncate max-w-[120px]">{user.email}</span>
              <form action={signOut}>
                <button className="hover:text-zinc-100 transition-colors text-xs uppercase tracking-wider">Sign Out</button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="text-xs uppercase tracking-wider hover:text-zinc-100 transition-colors">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
