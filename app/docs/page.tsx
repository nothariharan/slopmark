import Link from "next/link";
import { docPages } from "@/lib/docs";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="mb-2 text-2xl font-semibold">docs</h1>
        <p className="mb-8 text-sm text-zinc-400">
          how slopmark benches models — scoring, domains, harness, challenges, api
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {docPages.map((d) => (
            <Link
              key={d.slug}
              href={`/docs/${d.slug}`}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-600"
            >
              <h2 className="font-medium">{d.title}</h2>
              <p className="mt-1 text-sm text-zinc-400">{d.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
