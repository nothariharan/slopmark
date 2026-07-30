import type { Metadata } from "next";
import { buildChallengeReceipt } from "@/lib/challenges/receipt";
import { loadChallengeResults } from "@/lib/challenges/store-json";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadChallengeResults(slug);
  const receipt = data ? buildChallengeReceipt(data) : null;
  const title = data?.manifest.title ?? slug;
  const description =
    receipt?.punchline ??
    data?.manifest.subtitle ??
    data?.manifest.description ??
    "slopmark challenge receipt — rule-verified, no LLM judges";

  const winner = receipt?.winner;
  const winnerPct = winner ? Math.round(winner.pass_rate * 100) : null;
  const winnerNames =
    receipt && receipt.tiedWinners.length > 1
      ? receipt.tiedWinners
          .map((w) => w.model_label.replace(/\s*\(via .*\)\s*$/i, ""))
          .join(" / ")
      : winner
        ? winner.model_label.replace(/\s*\(via .*\)\s*$/i, "")
        : null;

  const wipeCount = receipt?.wipeouts.length ?? 0;
  const winnerLine =
    winnerNames && winnerPct != null
      ? `Top: ${winnerNames} · ${winnerPct}%${wipeCount ? ` · ${wipeCount} universal wipeout${wipeCount === 1 ? "" : "s"}` : ""}`
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
      card: "summary_large_image",
      title: `${title} · slopmark`,
      description: winnerLine,
    },
  };
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
