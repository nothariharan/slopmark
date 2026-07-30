import { ImageResponse } from "next/og";
import { buildChallengeReceipt } from "@/lib/challenges/receipt";
import { loadChallengeResults } from "@/lib/challenges/store-json";

export const runtime = "nodejs";
export const alt = "slopmark challenge receipt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

function cleanModelLabel(label: string) {
  return label.replace(/\s*\(via .*\)\s*$/i, "");
}

function short(s: string, max: number) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const data = await loadChallengeResults(slug);
  const receipt = data ? buildChallengeReceipt(data) : null;

  const title = data?.manifest.title ?? slug;
  const winnerPct = receipt?.winner
    ? Math.round(receipt.winner.pass_rate * 100)
    : null;
  const winnerNames =
    receipt && receipt.tiedWinners.length > 1
      ? receipt.tiedWinners.map((w) => cleanModelLabel(w.model_label)).join(" / ")
      : receipt?.winner
        ? cleanModelLabel(receipt.winner.model_label)
        : "no runs";

  const wipe = receipt?.wipeouts[0]?.task.label;
  const clear = receipt?.clears[0]?.task.label;
  const specimen = receipt?.specimen;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          color: "#fafafa",
          padding: "48px 56px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 780 }}>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#f59e0b",
              }}
            >
              slopmark · receipt
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 54,
                fontWeight: 650,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              {short(title, 42)}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: 24,
                color: "#a1a1aa",
                lineHeight: 1.35,
                maxWidth: 720,
              }}
            >
              {short(
                receipt?.punchline ??
                  "Rule-verified traps. Same harness. Zero LLM judges.",
                110,
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: "#ffffff",
              }}
            >
              {winnerPct != null ? `${winnerPct}%` : "—"}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 4,
                fontSize: 22,
                color: "#d4d4d8",
                maxWidth: 280,
                textAlign: "right",
                justifyContent: "flex-end",
              }}
            >
              {short(winnerNames, 36)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 36,
          }}
        >
          <Badge
            label="wipeout"
            value={wipe ? short(wipe, 34) : "none"}
            tone="fail"
          />
          <Badge
            label="clear"
            value={clear ? short(clear, 34) : "none"}
            tone="pass"
          />
        </div>

        {specimen && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "auto",
              border: "1px solid #27272a",
              backgroundColor: "#09090b",
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 14,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#71717a",
              }}
            >
              specimen fail · {short(cleanModelLabel(specimen.run.model_label), 28)}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 22,
                color: "#f4f4f5",
              }}
            >
              {short(specimen.task.label, 58)}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 18,
                color: "#fca5a5",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {short(specimen.failLine || specimen.outputPreview, 90)}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            marginTop: specimen ? 18 : "auto",
            fontSize: 16,
            color: "#52525b",
            letterSpacing: "0.04em",
          }}
        >
          rule verifier · zero LLM judges · /challenge/{slug}
        </div>
      </div>
    ),
    { ...size },
  );
}

function Badge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "fail" | "pass";
}) {
  const border = tone === "fail" ? "#450a0a" : "#052e16";
  const bg = tone === "fail" ? "#1c0a0a" : "#052e16";
  const fg = tone === "fail" ? "#fecaca" : "#bbf7d0";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${border}`,
        backgroundColor: bg,
        padding: "12px 16px",
        minWidth: 280,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 12,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#71717a",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 6,
          fontSize: 18,
          color: fg,
        }}
      >
        {value}
      </div>
    </div>
  );
}
