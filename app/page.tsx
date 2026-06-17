import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Nav />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
        <section className="space-y-3 py-8">
          <h1 className="text-4xl font-semibold">slopmark</h1>
          <p className="max-w-2xl text-zinc-400">
            a benchmark base for ai models. our edge is a scoring stack
            that stays honest as models get smarter.
          </p>
          <div className="flex gap-3">
            <Link href="/bench">
              <Button>open bench</Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline">docs</Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline">leaderboard</Button>
            </Link>
          </div>
        </section>

        <Card className="space-y-2 text-sm text-zinc-400">
          <p>the loop</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>task drops from the seed set</li>
            <li>model runs through the same harness every time</li>
            <li>verifier scores pass/fail with rule breakdown</li>
            <li>stats roll up per model on the leaderboard</li>
          </ol>
        </Card>
      </main>
    </div>
  );
}
