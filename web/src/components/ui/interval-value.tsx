import { cn } from "@/lib/cn";

/** 0.623 → "62%". Rates are shown as whole percentages: the interval makes decimals meaningless. */
export function formatPct(p: number): string {
  return `${Math.round(p * 100)}%`;
}

const SIZE = { sm: "text-data", md: "text-body", lg: "text-h3", xl: "text-h1" } as const;

/**
 * A rate with its uncertainty: "62% ±9". The ± is the half-width of the 95% interval, rounded
 * to whole points; screen readers and the title tooltip get the exact interval and sample size.
 * Asymmetric Wilson intervals are summarised by their larger half so we never understate doubt.
 */
export function IntervalValue({
  p,
  lo,
  hi,
  n,
  size = "md",
  bar = false,
  className,
}: {
  p: number;
  lo: number;
  hi: number;
  n?: number;
  size?: keyof typeof SIZE;
  bar?: boolean;
  className?: string;
}) {
  const half = Math.max(p - lo, hi - p);
  const exact = `${formatPct(p)}, 95% interval ${formatPct(lo)} to ${formatPct(hi)}${n ? `, ${n} answers` : ""}`;
  return (
    <span className={cn("inline-flex flex-col gap-1", className)} title={exact}>
      <span className={cn("font-mono tabular leading-none text-ink", SIZE[size])} aria-hidden>
        {formatPct(p)}
        <span className="ml-1 text-[0.72em] text-ink-3">±{Math.round(half * 100)}</span>
      </span>
      <span className="sr-only">{exact}</span>
      {bar && (
        <span aria-hidden className="relative block h-1 w-full min-w-16 rounded-xs bg-fill">
          {/* interval as a soft lime band, point estimate as an ink tick */}
          <span className="absolute inset-y-0 bg-lime-soft" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
          <span className="absolute inset-y-[-2px] w-0.5 bg-ink" style={{ left: `calc(${p * 100}% - 1px)` }} />
        </span>
      )}
    </span>
  );
}
