import { cn } from "@/lib/cn";
import { DASH, HEX, type DataColor } from "@/lib/palette";

export type LegendItem = { label: string; color: DataColor | "brand"; muted?: boolean };

/** Legend swatches repeat each series' stroke and dash, so the legend works without colour too. */
export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-small text-ink-2", className)}>
      {items.map((it) => (
        <li key={it.label} className={cn("inline-flex items-center gap-1.5", it.muted && "text-ink-3")}>
          <svg width="22" height="10" aria-hidden>
            {it.color === "brand" ? (
              <>
                <rect x="0" y="1" width="22" height="8" fill={HEX.limeSoft} />
                <line x1="0" x2="22" y1="5" y2="5" stroke={HEX.ink} strokeWidth="2.5" />
              </>
            ) : (
              <line x1="0" x2="22" y1="5" y2="5" stroke={HEX[it.color]} strokeWidth="2" strokeDasharray={DASH[it.color]} strokeOpacity={it.muted ? 0.5 : 1} />
            )}
          </svg>
          {it.label}
        </li>
      ))}
    </ul>
  );
}
