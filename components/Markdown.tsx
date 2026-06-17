import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const parts: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-8 text-2xl font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => <h2 className="mb-3 mt-8 text-xl font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-medium">{children}</h3>,
  p: ({ children }) => <p className="mb-4 leading-7 text-zinc-300">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-5 text-zinc-300">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-5 text-zinc-300">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  a: ({ href, children }) => (
    <Link href={href ?? "#"} className="text-zinc-100 underline underline-offset-2 hover:text-white">
      {children}
    </Link>
  ),
  code: ({ className, children }) => {
    const block = className?.includes("language-");
    if (block) {
      return (
        <code className="block overflow-x-auto rounded bg-zinc-900 p-3 text-xs text-zinc-200">
          {children}
        </code>
      );
    }
    return <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs text-zinc-200">{children}</code>;
  },
  pre: ({ children }) => <pre className="mb-4 overflow-x-auto rounded bg-zinc-900 p-3 text-xs">{children}</pre>,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{children}</td>
  ),
  hr: () => <hr className="my-8 border-zinc-800" />,
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-2 border-zinc-700 pl-4 text-zinc-400">{children}</blockquote>
  ),
};

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={parts}>
      {content}
    </ReactMarkdown>
  );
}
