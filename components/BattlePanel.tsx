"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type BattlePanelProps = {
  label: string
  battleId: string
  slot: "a" | "b"
  onDone?: () => void
}

export function BattlePanel({ label, battleId, slot, onDone }: BattlePanelProps) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      setText("")

      try {
        const response = await fetch("/api/battle/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ battleId, slot }),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("no stream body")
        }

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (cancelled) break
          if (done) break
          setText((prev) => prev + decoder.decode(value, { stream: true }))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "stream failed")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          onDone?.()
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [battleId, slot, onDone])

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[220px] whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-4 text-sm leading-6">
          {loading && !text ? "streaming..." : text || " "}
          {error ? (
            <p className="mt-3 text-destructive">{error}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
