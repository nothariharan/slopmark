"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type LeaderboardRow = {
  id: string
  name: string
  slug: string
  provider: string
  elo: number
  costInput: number
  costOutput: number
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/leaderboard")
      const data = await response.json()
      setRows(data.models ?? [])
      setLoading(false)
    }

    load()
  }, [])

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            ELO from blind battles. Cost columns are per 1M tokens (USD).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Models</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Model</th>
                  <th className="py-2 pr-4 font-medium">Provider</th>
                  <th className="py-2 pr-4 font-medium">ELO</th>
                  <th className="py-2 pr-4 font-medium">Input $/1M</th>
                  <th className="py-2 font-medium">Output $/1M</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-4 text-muted-foreground" colSpan={5}>
                      loading...
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">{row.name}</td>
                      <td className="py-3 pr-4">{row.provider}</td>
                      <td className="py-3 pr-4">{row.elo}</td>
                      <td className="py-3 pr-4">{row.costInput}</td>
                      <td className="py-3">{row.costOutput}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
