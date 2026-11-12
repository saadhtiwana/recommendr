import { scaleLinear } from "@visx/scale";
import { cn } from "@/lib/cn";

export type HeatmapRow = { bot: string; days: { day: number; visits: number }[] };

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * AI crawler visits by bot and day, from uploaded server logs. Intensity is ink opacity (one hue,
 * so it reads in greyscale); bots blocked by robots.txt are hatched and labelled, not shown as 0.
 */
export function CrawlerHeatmap({ rows, startIso, blocked = [], className }: { rows: HeatmapRow[]; startIso: string; blocked?: string[]; className?: string }) {
  const max = Math.max(1, ...rows.flatMap((r) => r.days.map((d) => d.visits)));
  const alpha = scaleLinear({ domain: [0, max], range: [0.06, 1] });
  const start = new Date(`${startIso}T00:00:00Z`);
  const dayLabel = (i: number) => fmt.format(new Date(start.getTime() + i * 86_400_000));
  const n = rows[0]?.days.length ?? 0;
  return (
    <div className={cn("relative overflow-x-auto", className)}>
      <table className="w-full border-separate border-spacing-[3px] text-small">
        <caption className="sr-only">AI crawler visits per day</caption>
        <thead>
          <tr>
            <th scope="col" className="w-36 text-left text-micro font-medium uppercase text-ink-3">Bot</th>
            {Array.from({ length: n }, (_, i) => (
              <th key={i} scope="col" className="font-mono text-[10px] font-normal text-ink-3 tabular">
                {i % 2 === 0 ? dayLabel(i) : <span className="sr-only">{dayLabel(i)}</span>}
              </th>
            ))}
            <th scope="col" className="pl-2 text-right text-micro font-medium uppercase text-ink-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isBlocked = blocked.includes(r.bot);
            const total = r.days.reduce((s, d) => s + d.visits, 0);
            return (
              <tr key={r.bot}>
                <th scope="row" className="whitespace-nowrap pr-2 text-left font-mono text-data font-normal text-ink">
                  {r.bot}
                  {isBlocked && <span className="ml-2 font-sans text-micro tracking-normal text-down">blocked</span>}
                </th>
                {r.days.map((d) =>
                  isBlocked ? (
                    <td key={d.day} className="h-6 min-w-5 rounded-xs bg-[repeating-linear-gradient(135deg,var(--color-fill)_0_3px,var(--color-line)_3px_5px)]">
                      <span className="sr-only">blocked</span>
                    </td>
                  ) : (
                    <td key={d.day} className="h-6 min-w-5 rounded-xs" style={{ backgroundColor: `rgb(17 19 17 / ${alpha(d.visits).toFixed(2)})` }} title={`${r.bot}, ${dayLabel(d.day)}: ${d.visits} visits`}>
                      <span className="sr-only">{d.visits}</span>
                    </td>
                  ),
                )}
                <td className="pl-2 text-right font-mono text-data text-ink-2 tabular">{isBlocked ? "0" : total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-2 text-micro tracking-normal text-ink-3" aria-hidden>
        fewer
        {[0.1, 0.3, 0.55, 0.8, 1].map((a) => (
          <span key={a} className="size-3 rounded-xs" style={{ backgroundColor: `rgb(17 19 17 / ${a})` }} />
        ))}
        more visits
      </div>
    </div>
  );
}
