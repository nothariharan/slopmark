"use client";

/**
 * renders model-drawn SVGs from run outputs. outputs are untrusted text, so
 * the markup is sanitized hard before it touches the DOM: no scripts, no
 * event handlers, no external fetches, no embedded html.
 */

export function extractSvg(output: string): string | null {
  const m = output.match(/<svg[\s\S]*?<\/svg>/i);
  return m ? m[0] : null;
}

export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(foreignObject|iframe|image|use|animate\w*)[\s\S]*?(\/>|<\/\1>)/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("[^"]*"|'[^']*')/gi, "");
}

export function SvgThumb({ output, label, passed }: { output: string; label?: string; passed?: boolean }) {
  const svg = extractSvg(output);
  if (!svg) return null;
  return (
    <figure className="border border-zinc-900 bg-zinc-950/50">
      <div
        className="flex aspect-square items-center justify-center overflow-hidden bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
        // sanitized above — model-drawn svg, rendered white like paper
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg) }}
      />
      {label && (
        <figcaption className="flex items-center justify-between px-2 py-1.5 text-[11px] text-zinc-500">
          <span className="truncate">{label}</span>
          {passed !== undefined && (
            <span className={passed ? "text-emerald-400" : "text-red-400"}>
              {passed ? "pass" : "fail"}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
