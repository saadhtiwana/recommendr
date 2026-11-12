import { scaleLinear } from "@visx/scale";
import { Delta } from "@/components/ui/delta";
import { EngineLabel } from "@/components/ui/engine-label";
import { formatPct } from "@/components/ui/interval-value";
import { wilson } from "@/lib/mock";
import { BG_CLASS, ENGINES, type EngineId } from "@/lib/palette";
import { cn } from "@/lib/cn";

export type EngineRow = {
  engine: EngineId;
  model: string;
  x: number;
  n: number;
  xPrev: number;
  nPrev: number;
  significant: boolean;
  /** Provider failed or engine blocked: shown as incomplete, never as zero (ADR-0020). */
  incomplete?: "partial" | "blocked";
};

/**
 * Your mention rate per engine: this week as a filled dot with its 95% whisker, last week as a
 * hollow ring. Overlapping whiskers are the visual cue that a difference may just be noise.
 */
export function EngineComparison({ rows, className }: { rows: EngineRow[]; className?: string }) {
  const max = Math.min(1, Math.ceil(Math.max(...rows.map((r) => wilson(r.x, r.n).hi)) * 10 + 1) / 10);
  const pos = scaleLinear({ domain: [0, max], range: [0, 100] }); // percent of the track width
  const ticks = pos.ticks(4);
  return (
    <div className={cn("@container flex flex-col", className)} role="table" aria-label="Your mention rate by engine, this week vs last week">
      <div role="row" className="grid grid-cols-[1fr_5.5rem] @md:grid-cols-[minmax(8rem,12rem)_1fr_5.5rem] items-end gap-x-4 gap-y-1 pb-1 text-micro uppercase text-ink-3">
        <span role="columnheader">Engine</span>
        <span role="columnheader" className="relative order-last col-span-2 h-4 @md:order-none @md:col-span-1">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 font-mono normal-case tabular" style={{ left: `${pos(t)}%` }}>
              {Math.round(t * 100)}%
            </span>
          ))}
        </span>
        <span role="columnheader" className="text-right">Change</span>
      </div>
      {rows.map((r) => {
        const cur = wilson(r.x, r.n);
        const prev = wilson(r.xPrev, r.nPrev);
        const color = BG_CLASS[ENGINES[r.engine].color];
        return (
          <div role="row" key={r.engine} className="grid grid-cols-[1fr_5.5rem] @md:grid-cols-[minmax(8rem,12rem)_1fr_5.5rem] items-center gap-x-4 gap-y-2 border-t border-line py-3">
            <span role="cell" className="flex flex-col">
              <EngineLabel engine={r.engine} />
              <span className="pl-3.5 font-mono text-micro tracking-normal text-ink-3">{r.model}</span>
            </span>
            <span role="cell" className="relative order-last col-span-2 h-6 @md:order-none @md:col-span-1">
              {ticks.map((t) => (
                <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-line" style={{ left: `${pos(t)}%` }} />
              ))}
              {r.incomplete ? (
                <span className="absolute inset-y-1 left-0 right-0 flex items-center rounded-xs border border-dashed border-line-strong bg-[repeating-linear-gradient(135deg,transparent_0_5px,var(--color-fill)_5px_10px)] px-2 text-small text-ink-3">
                  {r.incomplete === "blocked" ? "Blocked: no key or quota" : "Incomplete: provider errors"}, not counted as zero
                </span>
              ) : (
                <>
                  <span aria-hidden className="absolute top-1/2 h-px -translate-y-1/2 bg-ink-3" style={{ left: `${pos(prev.lo)}%`, width: `${pos(prev.hi) - pos(prev.lo)}%`, marginTop: 6 }} />
                  <span aria-hidden className="absolute top-1/2 size-2 -translate-x-1/2 rounded-full border border-ink-3 bg-surface" style={{ left: `${pos(prev.p)}%`, marginTop: 2 }} />
                  <span aria-hidden className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink" style={{ left: `${pos(cur.lo)}%`, width: `${pos(cur.hi) - pos(cur.lo)}%`, marginTop: -3 }} />
                  <span aria-hidden className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface", color)} style={{ left: `${pos(cur.p)}%`, marginTop: -3 }} />
                  <span aria-hidden className="absolute top-1/2 -translate-y-1/2 font-mono text-micro tracking-normal text-ink tabular" style={{ left: `calc(${pos(cur.hi)}% + 6px)`, marginTop: -3 }}>
                    {formatPct(cur.p)}
                  </span>
                  <span className="sr-only">
                    This week {formatPct(cur.p)} (95% interval {formatPct(cur.lo)} to {formatPct(cur.hi)}, {r.n} answers); last week {formatPct(prev.p)}.
                  </span>
                </>
              )}
            </span>
            <span role="cell" className="text-right">
              {r.incomplete ? <span className="text-small text-ink-3">n/a</span> : <Delta value={(cur.p - prev.p) * 100} significant={r.significant} />}
            </span>
          </div>
        );
      })}
      <p className="mt-2 flex flex-wrap gap-4 text-micro tracking-normal text-ink-3">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-full bg-ink" /> this week, line = 95% interval</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full border border-ink-3" /> last week</span>
      </p>
    </div>
  );
}
