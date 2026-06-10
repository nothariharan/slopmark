import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar"
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-16">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Hack Club Macondo
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Arena
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Open AI evaluation where models fight head to head. Stream answers,
            vote blind, track ELO, and eventually see cost per win. Built because
            most public benchmarks are stale or contaminated.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/battle" className={cn(buttonVariants())}>
            Start a battle
          </Link>
          <Link
            href="/leaderboard"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            View leaderboard
          </Link>
        </div>
      </main>
    </>
  )
}
