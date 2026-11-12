import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Change indicator. Colour is never the only cue: an arrow and an accessible label always go
 * with it, and a non-significant change is muted (ink-3) whatever its sign, so readers learn to
 * ignore noise.
 */
export function Delta({
  value,
  significant,
  unit = "pts",
  size = "sm",
  className,
}: {
  value: number;
  significant: boolean;
  unit?: "pts" | "%";
  size?: "sm" | "md";
  className?: string;
}) {
  const dir = value > 0.05 ? "up" : value < -0.05 ? "down" : "flat";
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : ArrowRight;
  const tone = !significant || dir === "flat" ? "text-ink-3" : dir === "up" ? "text-up" : "text-down";
  const shown = `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(1)}${unit === "%" ? "%" : ""}`;
  const label = `${dir === "flat" ? "no change" : dir} ${Math.abs(value).toFixed(1)} ${unit === "%" ? "percent" : "points"}, ${significant ? "significant" : "not significant"}`;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono tabular", size === "md" ? "text-body" : "text-data", tone, !significant && "font-normal", significant && "font-medium", className)}>
      <Icon aria-hidden className={size === "md" ? "size-4" : "size-3.5"} strokeWidth={2} />
      <span aria-hidden>{shown}</span>
      {unit === "pts" && <span aria-hidden className="text-micro tracking-normal">pts</span>}
      <span className="sr-only">{label}</span>
    </span>
  );
}
