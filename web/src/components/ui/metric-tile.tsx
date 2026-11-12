import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Headline number. The skeleton keeps the exact box sizes so nothing shifts when data lands. */
export function MetricTile({
  label,
  value,
  delta,
  footnote,
  loading = false,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  footnote?: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[124px] flex-col gap-3 rounded-md border border-line bg-surface p-4", className)} aria-busy={loading || undefined}>
      <div className="text-micro font-medium uppercase text-ink-3">{label}</div>
      {loading ? (
        <>
          <div className="h-8 w-28 animate-shimmer rounded-sm bg-[linear-gradient(90deg,var(--color-fill)_0%,var(--color-line)_50%,var(--color-fill)_100%)] bg-[length:200%_100%]" />
          <div className="h-4 w-40 rounded-sm bg-fill" />
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-3">
            <div className="min-w-0">{value}</div>
            {delta}
          </div>
          {footnote && <div className="text-small text-ink-3">{footnote}</div>}
        </>
      )}
    </div>
  );
}
