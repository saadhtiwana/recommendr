import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONES = {
  neutral: "bg-fill text-ink-2",
  outline: "border border-line-strong text-ink-2",
  lime: "bg-lime-soft text-lime-ink", // key tags: lime only ever sits behind ink
  up: "bg-surface text-up border border-line",
  down: "bg-surface text-down border border-line",
  muted: "text-ink-3 border border-line",
} as const;

export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-sm px-1.5 text-micro font-medium tracking-normal whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}
