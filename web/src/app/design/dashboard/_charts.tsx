"use client";

import { curveMonotoneX } from "@visx/curve";
import { useParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { Area, AreaClosed, LinePath } from "@visx/shape";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { SeriesPoint } from "@/lib/mock";
import { BG_CLASS, HEX, type DataColor } from "@/lib/palette";

const pct = (p: number) => `${Math.round(p * 100)}%`;
const half = (s: SeriesPoint) => Math.round(Math.max(s.p - s.lo, s.hi - s.p) * 100);
const fmtWeek = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const weekLabel = (iso: string) => fmtWeek.format(new Date(`${iso}T00:00:00Z`));

export type TrendLine = { id: string; label: string; color: DataColor; points: SeriesPoint[]; muted?: boolean };

const M = { top: 12, right: 8, bottom: 30, left: 36 };

/**
 * Smooth area chart for brand visibility. The brand is a thick ink line inside its lime-soft 95%
 * band, over a faint ink gradient; optional engine lines are thin (half strength when their change
 * is not significant). Hovering a week shows every value with its interval in a tooltip card.
 */
export function AreaTrend({ brand, lines = [], height = 260 }: { brand: SeriesPoint[]; lines?: TrendLine[]; height?: number }) {
  const { parentRef, width } = useParentSize({ debounceTime: 40 });
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const w = Math.max(0, width - M.left - M.right);
  const h = height - M.top - M.bottom;
  const n = brand.length;
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * w : 0);
  const top = Math.max(0.4, Math.ceil(Math.max(...[brand, ...lines.map((l) => l.points)].flat().map((p) => p.hi)) * 10) / 10);
  const y = scaleLinear({ domain: [0, top], range: [h, 0] });
  const ticks = Array.from({ length: Math.round(top * 10) + 1 }, (_, i) => i / 10);
  const every = w < 520 ? 3 : w < 760 ? 2 : 1;
  const last = brand[n - 1]!;
  const summary = `Brand visibility by week: ${pct(brand[0]!.p)} on ${weekLabel(brand[0]!.date)} to ${pct(last.p)} ±${half(last)} on ${weekLabel(last.date)}.`;
  const hp = hover === null ? null : brand[hover]!;

  return (
    <div ref={parentRef} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={summary}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left - M.left) / Math.max(1, w)) * (n - 1));
            setHover(Math.max(0, Math.min(n - 1, i)));
          }}
        >
          <defs>
            <linearGradient id={`fill-${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={HEX.ink} stopOpacity={0.07} />
              <stop offset="100%" stopColor={HEX.ink} stopOpacity={0} />
            </linearGradient>
          </defs>
          <g transform={`translate(${M.left},${M.top})`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={w} y1={y(t)} y2={y(t)} stroke={HEX.lineStrong} strokeDasharray="3 4" strokeWidth={1} />
                <text x={-10} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={HEX.ink3} className="font-mono tabular">
                  {pct(t)}
                </text>
              </g>
            ))}
            <AreaClosed data={brand} x={(_, i) => x(i)} y={(p) => y(p.p)} yScale={y} curve={curveMonotoneX} fill={`url(#fill-${gid})`} />
            <Area data={brand} x={(_, i) => x(i)} y0={(p) => y(p.lo)} y1={(p) => y(p.hi)} curve={curveMonotoneX} fill={HEX.limeSoft} />
            {lines.map((l) => (
              <LinePath
                key={l.id}
                data={l.points}
                x={(_, i) => x(i)}
                y={(p) => y(p.p)}
                curve={curveMonotoneX}
                stroke={HEX[l.color]}
                strokeWidth={1.5}
                strokeOpacity={l.muted ? 0.4 : 0.9}
              />
            ))}
            <LinePath data={brand} x={(_, i) => x(i)} y={(p) => y(p.p)} curve={curveMonotoneX} stroke={HEX.ink} strokeWidth={2.5} strokeLinecap="round" />
            {hover !== null && hp ? (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} stroke={HEX.ink3} strokeDasharray="2 3" />
                {lines.map((l) => (
                  <circle key={l.id} cx={x(hover)} cy={y(l.points[hover]!.p)} r={3} fill={HEX[l.color]} stroke={HEX.surface} strokeWidth={1.5} />
                ))}
                <circle cx={x(hover)} cy={y(hp.p)} r={8} fill={HEX.lime} fillOpacity={0.7} />
                <circle cx={x(hover)} cy={y(hp.p)} r={4} fill={HEX.ink} stroke={HEX.surface} strokeWidth={2} />
              </g>
            ) : null}
            {brand.map((p, i) =>
              i % every === (n - 1) % every ? (
                <g key={p.date} transform={`translate(${x(i)},${h + 20})`}>
                  {hover === i ? <rect x={-26} y={-11} width={52} height={20} rx={6} fill={HEX.fill} /> : null}
                  <text textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"} dy="0.32em" fontSize={11} fill={hover === i ? HEX.ink : HEX.ink3} fontWeight={hover === i ? 500 : 400}>
                    {weekLabel(p.date)}
                  </text>
                </g>
              ) : null,
            )}
          </g>
        </svg>
      )}
      {hover !== null && hp ? (
        <div
          className="pointer-events-none absolute z-tooltip w-44 rounded-md bg-surface px-3 py-2.5 shadow-overlay ring-1 ring-line"
          style={{
            top: M.top + Math.max(0, y(hp.hi) - 96),
            left: M.left + x(hover) + (x(hover) > w - 200 ? -188 : 14),
          }}
        >
          <p className="text-micro tracking-normal text-ink-3">Week of {weekLabel(hp.date)}</p>
          <p className="mt-1 flex items-baseline justify-between gap-2 text-small">
            <span className="text-ink-2">You</span>
            <span className="font-mono tabular text-ink">
              {pct(hp.p)} <span className="text-ink-3">±{half(hp)}</span>
            </span>
          </p>
          {lines.map((l) => {
            const v = l.points[hover]!;
            return (
              <p key={l.id} className="flex items-baseline justify-between gap-2 text-small">
                <span className="inline-flex items-center gap-1.5 text-ink-2">
                  <span aria-hidden className={cn("size-1.5 rounded-full", BG_CLASS[l.color])} />
                  {l.label}
                </span>
                <span className="font-mono tabular text-ink">
                  {pct(v.p)} <span className="text-ink-3">±{half(v)}</span>
                </span>
              </p>
            );
          })}
          <p className="mt-1 font-mono text-micro tracking-normal tabular text-ink-3">n = {hp.n} answers</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * "Funnel-like" engine bars: per engine, this week's mention rate as a coloured bar with its 95%
 * interval as a whisker, preceded by thin grey bars for the previous weeks. Engines whose change is
 * not significant are drawn at half strength.
 */
export function EngineBars({
  rows,
}: {
  rows: { id: string; label: string; color: DataColor; p: number; lo: number; hi: number; n: number; history: number[]; significant: boolean }[];
}) {
  const H = 168;
  // bars share one scale capped at 60% so differences are visible; the labels carry the values
  const MAX = Math.max(0.6, ...rows.map((r) => r.hi));
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {rows.map((r) => (
        <div key={r.id} className="flex min-w-0 flex-col">
          <p className={cn("font-mono text-body tabular", r.significant ? "text-ink" : "text-ink-3")}>
            {pct(r.p)} <span className="text-micro tracking-normal text-ink-3">±{Math.round(Math.max(r.p - r.lo, r.hi - r.p) * 100)}</span>
          </p>
          <div className="mt-2 flex items-end gap-[3px]" style={{ height: H }} aria-hidden>
            <div className="relative w-2.5 shrink-0 sm:w-3" style={{ height: `${(r.p / MAX) * 100}%` }}>
              <div className={cn("absolute inset-0 rounded-[3px]", BG_CLASS[r.color], !r.significant && "opacity-45")} />
              {/* 95% interval whisker */}
              <div
                className="absolute left-1/2 w-px -translate-x-1/2 bg-ink"
                style={{ bottom: `${(r.lo / r.p) * 100}%`, height: `${((r.hi - r.lo) / r.p) * 100}%` }}
              />
            </div>
            {r.history.map((v, i) => (
              <div key={i} className="hidden w-1.5 rounded-[3px] bg-line-strong/70 min-[400px]:block sm:w-2" style={{ height: `${(v / MAX) * 100}%`, opacity: 0.45 + (i / r.history.length) * 0.55 }} />
            ))}
          </div>
          <p className="mt-3 truncate text-small text-ink">{r.label}</p>
          <p className="font-mono text-micro tracking-normal tabular text-ink-3">n = {r.n}</p>
        </div>
      ))}
    </div>
  );
}

/** Semicircle gauge: value 0..1 as an ink arc on a light track. */
export function Gauge({ value, size = 200 }: { value: number; size?: number }) {
  const sw = 10;
  const r = size / 2 - sw;
  const cx = size / 2;
  const cy = size / 2;
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from);
    const a1 = Math.PI * (1 - to);
    const p = (a: number) => `${cx + r * Math.cos(a)} ${cy - r * Math.sin(a)}`;
    return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
  };
  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size / 2 + sw}`} aria-hidden className="block">
      <path d={arc(0, 1)} stroke={HEX.fill} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <path d={arc(0, value)} stroke={HEX.ink} strokeWidth={sw} fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Horizontal segmented bar with 4px gaps (sources, share breakdowns). */
export function SegmentBar({ parts }: { parts: { key: string; value: number; className: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className="flex h-2 w-full gap-1" aria-hidden>
      {parts.map((p) => (
        <div key={p.key} className={cn("h-full min-w-1.5 rounded-full", p.className)} style={{ width: `${(p.value / total) * 100}%` }} />
      ))}
    </div>
  );
}
