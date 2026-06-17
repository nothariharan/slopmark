import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Markdown } from "@/components/Markdown";
import { docPages, readDoc } from "@/lib/docs";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return docPages.map((d) => ({ slug: d.slug }));
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const doc = await readDoc(slug);
  if (!doc) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Nav />
      <main className="mx-auto flex max-w-5xl gap-8 p-4">
        <aside className="hidden w-44 shrink-0 md:block">
          <p className="mb-3 text-xs uppercase tracking-wide text-zinc-500">docs</p>
          <nav className="space-y-2 text-sm">
            {docPages.map((d) => (
              <Link
                key={d.slug}
                href={`/docs/${d.slug}`}
                className={`block hover:text-zinc-100 ${d.slug === slug ? "text-zinc-100" : "text-zinc-500"}`}
              >
                {d.title}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 flex-1 pb-12">
          <Markdown content={doc.body} />
        </article>
      </main>
    </div>
  );
}
