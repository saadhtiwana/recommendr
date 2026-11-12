"use client";

import { useParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { DASH, HEX, type DataColor } from "@/lib/palette";
import { ChartLegend } from "./chart-legend";

export type SovEntity = { key: string; label: string; color: DataColor | "brand" };
export type SovRow = { date: string } & Record<string, number | string>;

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const ROW = 26;
const LABEL_W = 56;

/**
 * Share of voice as 100% stacked bars, one per week. The brand segment comes first and is ink
 * (with a white figure) so it reads as "you" against the coloured competitors; others are stone.
 */
export function SovBars({ rows, entities }: { rows: SovRow[]; entities: SovEntity[] }) {
  const { parentRef, width } = useParentSize({ debounceTime: 40 });
  const w = Math.max(0, width - LABEL_W);
  const x = scaleLinear({ domain: [0, 1], range: [0, w] });
  const height = rows.length * (ROW + 8);
  const brand = entities.find((e) => e.color === "brand");
  const summary = `Share of voice by week. ${rows
    .slice(-1)
    .map((r) => entities.map((e) => `${e.label} ${Math.round(Number(r[e.key]) * 100)}%`).join(", "))
    .join("")} in the latest week.`;
  return (
    <div className="flex flex-col gap-3">
      <div ref={parentRef} className="w-full" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={summary}>
            <desc>{summary}</desc>
            {rows.map((r, ri) => {
              let acc = 0;
              const yy = ri * (ROW + 8);
              return (
                <g key={r.date} transform={`translate(0 ${yy})`}>
                  <text x={0} y={ROW / 2} dy="0.32em" fontSize={11} className="font-mono tabular" fill={HEX.ink3}>
                    {fmt.format(new Date(`${r.date}T00:00:00Z`))}
                  </text>
                  {entities.map((e) => {
                    const v = Number(r[e.key]) || 0;
                    const x0 = LABEL_W + x(acc);
                    acc += v;
                    const segW = Math.max(0, x(v) - 1); // 1px paper gap separates segments
                    const isBrand = e.color === "brand";
                    return (
                      <g key={e.key}>
                        <rect x={x0} y={0} width={segW} height={ROW} fill={isBrand ? HEX.ink : HEX[e.color as DataColor]}>
                          <title>{`${e.label}: ${Math.round(v * 100)}%`}</title>
                        </rect>
                        {/* hatching keeps low-contrast segments (sky, amber, stone) distinguishable */}
                        {!isBrand && DASH[e.color as DataColor] && segW > 6 && (
                          <rect x={x0} y={0} width={segW} height={ROW} fill="url(#sov-hatch)" />
                        )}
                        {segW > 34 && (
                          <text x={x0 + 6} y={ROW / 2} dy="0.32em" fontSize={11} className="font-mono tabular" fill={isBrand ? HEX.surface : HEX.ink} fontWeight={isBrand ? 600 : 400}>
                            {Math.round(v * 100)}%
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            <defs>
              <pattern id="sov-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke={HEX.surface} strokeOpacity={0.35} strokeWidth={2} />
              </pattern>
            </defs>
          </svg>
        )}
      </div>
      <ChartLegend items={entities.map((e) => ({ label: e.label, color: e.color }))} />
      {brand && <p className="sr-only">Your brand is shown first in each bar.</p>}
    </div>
  );
}
