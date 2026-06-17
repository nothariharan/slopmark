import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline";
};

export function Button({ className, variant = "default", ...props }: Props) {
  const v =
    variant === "ghost"
      ? "bg-transparent hover:bg-zinc-800"
      : variant === "outline"
        ? "border border-zinc-700 hover:bg-zinc-900"
        : "bg-zinc-100 text-zinc-900 hover:bg-white";

  return (
    <button
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50",
        v,
        className,
      )}
      {...props}
    />
  );
}
