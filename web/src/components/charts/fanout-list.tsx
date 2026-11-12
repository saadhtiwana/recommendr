import { cn } from "@/lib/cn";
import { formatPct } from "@/components/ui/interval-value";

export type FanoutRow = { topic: string; count: number; brandMentioned: number };

/** Search sub-queries the engines ran, by frequency, with how often you appear in their results. */
export function FanoutList({ rows, className }: { rows: FanoutRow[]; className?: string }) {
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <table className={cn("w-full border-collapse text-small", className)}>
      <caption className="sr-only">Fan-out search queries by frequency and your mention rate</caption>
      <thead>
        <tr className="text-left text-micro uppercase text-ink-3">
          <th scope="col" className="pb-2 font-medium">Query the engine searched</th>
          <th scope="col" className="w-[30%] pb-2 font-medium">Frequency</th>
          <th scope="col" className="w-20 pb-2 text-right font-medium">You</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.topic} className="border-t border-line">
            <td className="py-2 pr-3 font-mono text-data text-ink">{r.topic}</td>
            <td className="py-2 pr-3">
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 rounded-xs bg-ink-2" style={{ width: `${(r.count / max) * 100}%` }} />
                <span className="font-mono text-data text-ink-3 tabular">{r.count}</span>
              </span>
            </td>
            <td className={cn("py-2 text-right font-mono text-data tabular", r.brandMentioned === 0 ? "text-down" : "text-ink")}>{formatPct(r.brandMentioned)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
