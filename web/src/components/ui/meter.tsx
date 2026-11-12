import { cn } from "@/lib/cn";

/** Usage against a quota. Near the limit the LABEL turns down-red; the bar stays ink (no lime). */
export function Meter({
  label,
  used,
  limit,
  unit,
  warnAt = 0.8,
  format = (v: number) => v.toLocaleString("en-US"),
  className,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
  warnAt?: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const warn = ratio >= warnAt;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-small">
        <span className="text-ink-2">{label}</span>
        <span className={cn("tabular", warn ? "text-down" : "text-ink-3")}>
          {format(used)} / {format(limit)} {unit}
          {warn && <span className="ml-1">({Math.round(ratio * 100)}%)</span>}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-valuetext={`${format(used)} of ${format(limit)} ${unit}`}
        className="h-1.5 w-full overflow-hidden rounded-xs bg-fill"
      >
        <div className={cn("h-full", warn ? "bg-down" : "bg-ink")} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
