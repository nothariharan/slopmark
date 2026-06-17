import { cn } from "@/lib/cn";

type Props = { ok?: boolean; children: React.ReactNode; className?: string };

export function Badge({ ok, children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        ok ? "bg-emerald-900 text-emerald-200" : "bg-red-900 text-red-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
