"use client"

import { useCallback, useState } from "react"
import { BattlePanel } from "@/components/BattlePanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type VoteResult = {
  modelA: { name: string; elo: number; eloDelta: number }
  modelB: { name: string; elo: number; eloDelta: number }
}

export function BattleArena() {
  const [prompt, setPrompt] = useState("")
  const [activePrompt, setActivePrompt] = useState<string | null>(null)
  const [battleId, setBattleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [doneCount, setDoneCount] = useState(0)
  const [voted, setVoted] = useState(false)
  const [result, setResult] = useState<VoteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startBattle = async (customPrompt?: string) => {
    setLoading(true)
    setError(null)
    setVoted(false)
    setResult(null)
    setDoneCount(0)

    try {
      const response = await fetch("/api/battle/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          customPrompt?.trim() ? { prompt: customPrompt.trim() } : {}
        ),
      })

      if (!response.ok) {
        throw new Error("could not start battle")
      }

      const data = await response.json()
      setBattleId(data.battleId)
      setActivePrompt(data.prompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "start failed")
    } finally {
      setLoading(false)
    }
  }

  const onPanelDone = useCallback(() => {
    setDoneCount((count) => count + 1)
  }, [])

  const vote = async (choice: "a" | "b" | "tie") => {
    if (!battleId || voted) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/battle/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId, vote: choice }),
      })

      if (!response.ok) {
        throw new Error("vote failed")
      }

      const data = await response.json()
      setResult(data)
      setVoted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "vote failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Battle arena</h1>
        <p className="text-sm text-muted-foreground">
          Two models answer the same prompt. Vote blind. Names show up after.
        </p>
      </div>

      {!battleId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pick a prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Leave empty for a random seed prompt"
              rows={4}
            />
            <div className="flex flex-wrap gap-3">
              <Button disabled={loading} onClick={() => startBattle(prompt)}>
                Start battle
              </Button>
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => startBattle()}
              >
                Random prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activePrompt ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6">{activePrompt}</p>
          </CardContent>
        </Card>
      ) : null}

      {battleId ? (
        <div className="grid gap-4 md:grid-cols-2">
          <BattlePanel
            key={`${battleId}-a`}
            label="Model A"
            battleId={battleId}
            slot="a"
            onDone={onPanelDone}
          />
          <BattlePanel
            key={`${battleId}-b`}
            label="Model B"
            battleId={battleId}
            slot="b"
            onDone={onPanelDone}
          />
        </div>
      ) : null}

      {battleId && doneCount >= 2 && !voted ? (
        <div className="flex flex-wrap gap-3">
          <Button disabled={loading} onClick={() => vote("a")}>
            A wins
          </Button>
          <Button disabled={loading} variant="secondary" onClick={() => vote("tie")}>
            Tie
          </Button>
          <Button disabled={loading} onClick={() => vote("b")}>
            B wins
          </Button>
        </div>
      ) : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reveal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Model A: {result.modelA.name} ({result.modelA.elo}{" "}
              {result.modelA.eloDelta >= 0 ? "+" : ""}
              {result.modelA.eloDelta})
            </p>
            <p>
              Model B: {result.modelB.name} ({result.modelB.elo}{" "}
              {result.modelB.eloDelta >= 0 ? "+" : ""}
              {result.modelB.eloDelta})
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setBattleId(null)
                setActivePrompt(null)
                setPrompt("")
                setVoted(false)
                setResult(null)
                setDoneCount(0)
              }}
            >
              Run another battle
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
