"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * A circular gauge for a rate (0..1): the ring fills to the value, the number sits in the middle
 * and the margin of error sits under it. The ring draws in once when it mounts.
 */
export function ScoreRing({
  value,
  margin,
  size = 120,
  stroke,
  tone = "ink",
  label,
  center,
  className,
}: {
  value: number;
  /** half-width of the interval, 0..1, shown as "±4" */
  margin?: number;
  size?: number;
  stroke?: number;
  tone?: "ink" | "lime";
  label?: string;
  /** replaces the percentage in the middle (e.g. "3d" for a countdown) */
  center?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const w = stroke ?? Math.max(4, Math.round(size / 11));
  const r = (size - w) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.round(value * 100);
  const big = size >= 80;
  // small rings are pure graphics: the number belongs next to them, never squeezed inside
  const showText = size >= 48;
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }} role="img" aria-label={label ?? `${pct}%${margin !== undefined ? `, plus or minus ${Math.round(margin * 100)}` : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-fill)" strokeWidth={w} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === "lime" ? "var(--color-lime-deep)" : "var(--color-ink)"}
          strokeWidth={w}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      {showText ? (
      <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className={"font-bold leading-none tracking-[-0.03em] text-ink tabular"} style={{ fontSize: big ? size * 0.25 : size * 0.26 }}>
          {center ?? `${pct}%`}
        </span>
        {margin !== undefined && big ? <span className="mt-1 text-small font-medium text-ink-3 tabular">±{Math.round(margin * 100)}</span> : null}
      </span>
      ) : null}
    </div>
  );
}
