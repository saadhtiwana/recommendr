import { cn } from "@/lib/cn";
import { EngineLabel } from "@/components/ui/engine-label";
import type { EngineId } from "@/lib/palette";

export type SourceRow = { domain: string; citations: number; brandShare: number; citesBrand: boolean; engines: EngineId[] };

/**
 * Domains AI cites, by citation count. A domain that is cited a lot but never mentions you is the
 * best outreach opportunity, so it gets the soft-lime "doesn't cite you" tag.
 */
export function SourceBars({ rows, showEngines = false, className }: { rows: SourceRow[]; showEngines?: boolean; className?: string }) {
  const max = Math.max(...rows.map((r) => r.citations));
  return (
    <ol className={cn("flex flex-col", className)} aria-label="Most cited source domains">
      {rows.map((r) => (
        <li key={r.domain} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 border-b border-line py-2 last:border-0">
          <span className="truncate font-mono text-data text-ink" title={r.domain}>
            {r.domain}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 rounded-xs bg-ink" style={{ width: `${(r.citations / max) * 100}%` }} aria-hidden />
            {!r.citesBrand && (
              <span className="shrink-0 whitespace-nowrap rounded-xs bg-lime-soft px-1.5 py-0.5 text-micro font-medium tracking-normal text-lime-ink">doesn&apos;t cite you</span>
            )}
          </span>
          <span className="text-right font-mono text-data text-ink-2 tabular">
            {r.citations}
            <span className="sr-only"> citations{r.citesBrand ? `, mentions you in ${Math.round(r.brandShare * 100)}%` : ", never mentions you"}</span>
          </span>
          {showEngines && (
            <span className="col-span-3 -mt-1 flex flex-wrap gap-3">
              {r.engines.map((e) => (
                <EngineLabel key={e} engine={e} className="text-micro" />
              ))}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
