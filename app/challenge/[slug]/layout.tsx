import type { Metadata } from "next";
import { loadChallengeResults } from "@/lib/challenges/store-json";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadChallengeResults(slug);
  const title = data?.manifest.title ?? slug;
  const description =
    data?.manifest.subtitle ??
    data?.manifest.description ??
    "slopmark challenge receipt — rule-verified, no LLM judges";
  const top = data
    ? [...data.summaries].sort((a, b) => b.pass_rate - a.pass_rate)[0]
    : null;
  const winnerLine = top
    ? `Top: ${top.model_label} · ${Math.round(top.pass_rate * 100)}% pass`
    : "Fixed harness · behavioral verifiers";

  return {
    title: `${title} · slopmark`,
    description: `${description} — ${winnerLine}`,
    openGraph: {
      title: `${title} · slopmark`,
      description: `${description} — ${winnerLine}`,
      type: "website",
      siteName: "slopmark",
    },
    twitter: {
      card: "summary",
      title: `${title} · slopmark`,
      description: winnerLine,
    },
  };
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
