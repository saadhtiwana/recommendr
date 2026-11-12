"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { useParentSize } from "@visx/responsive";
import { scaleLinear, scaleUtc } from "@visx/scale";
import { Area, LinePath } from "@visx/shape";
import type { SeriesPoint } from "@/lib/mock";
import { DASH, HEX, type DataColor } from "@/lib/palette";

export type LineSeries = { id: string; label: string; color: DataColor; points: SeriesPoint[]; significant?: boolean };

const M = { top: 22, right: 112, bottom: 26, left: 40 };
const fmtDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const d = (p: SeriesPoint) => new Date(`${p.date}T00:00:00Z`);
const tick = { className: "font-mono tabular", fill: HEX.ink3, fontSize: 11 } as const;

/**
 * Visibility over time with uncertainty. The user's brand is a thick ink line inside a soft lime
 * confidence band; other series are thinner, dashed and labelled at their end so they never rely
 * on colour alone. Series whose change is not significant are drawn at half strength.
 */
export function LineCI({
  brand,
  brandLabel = "You",
  series = [],
  annotations = [],
  height = 280,
  title = "Mention rate over time",
}: {
  brand: SeriesPoint[];
  brandLabel?: string;
  series?: LineSeries[];
  annotations?: { date: string; label: string }[];
  height?: number;
  title?: string;
}) {
  const { parentRef, width } = useParentSize({ debounceTime: 40 });
  const w = Math.max(0, width - M.left - M.right);
  const h = height - M.top - M.bottom;
  const all = [brand, ...series.map((s) => s.points)].flat();
  const x = scaleUtc({ domain: [d(brand[0]!), d(brand[brand.length - 1]!)], range: [0, w] });
  const yMax = Math.min(1, Math.ceil((Math.max(...all.map((p) => p.hi)) + 0.02) * 10) / 10);
  const y = scaleLinear({ domain: [0, yMax], range: [h, 0], nice: true });

  // end-of-line labels, nudged apart so they never overlap (min 13px)
  const ends = [
    { key: "brand", label: brandLabel, v: brand[brand.length - 1]!.p, color: HEX.ink, strong: true },
    ...series.map((s) => ({ key: s.id, label: s.label, v: s.points[s.points.length - 1]!.p, color: HEX.ink2, strong: false })),
  ]
    .map((e) => ({ ...e, y: y(e.v) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i]!.y = Math.max(ends[i]!.y, ends[i - 1]!.y + 13);

  const last = brand[brand.length - 1]!;
  const summary = `${title}. ${brandLabel}: ${Math.round(brand[0]!.p * 100)}% on ${fmtDate.format(d(brand[0]!))} to ${Math.round(last.p * 100)}% (95% interval ${Math.round(last.lo * 100)}–${Math.round(last.hi * 100)}%) on ${fmtDate.format(d(last))}.${series.map((s) => ` ${s.label}: ${Math.round(s.points[s.points.length - 1]!.p * 100)}%.`).join("")}`;

  return (
    <div ref={parentRef} style={{ height }} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={summary}>
          <desc>{summary}</desc>
          <Group left={M.left} top={M.top}>
            <GridRows scale={y} width={w} numTicks={4} stroke={HEX.line} strokeWidth={1} />
            {annotations.map((a) => {
              const ax = x(new Date(`${a.date}T00:00:00Z`));
              return (
                <g key={a.date + a.label}>
                  <line x1={ax} x2={ax} y1={-8} y2={h} stroke={HEX.ink3} strokeDasharray="3 3" strokeWidth={1} />
                  <text x={ax + 4} y={-10} className="font-mono" fontSize={10} fill={HEX.ink3}>
                    {a.label}
                  </text>
                </g>
              );
            })}
            <Area data={brand} x={(p) => x(d(p))} y0={(p) => y(p.lo)} y1={(p) => y(p.hi)} curve={curveMonotoneX} fill={HEX.limeSoft} />
            {series.map((s) => (
              <LinePath
                key={s.id}
                data={s.points}
                x={(p) => x(d(p))}
                y={(p) => y(p.p)}
                curve={curveMonotoneX}
                stroke={HEX[s.color]}
                strokeWidth={s.significant === false ? 1.25 : 1.5}
                strokeOpacity={s.significant === false ? 0.5 : 1}
                strokeDasharray={DASH[s.color]}
              />
            ))}
            <LinePath data={brand} x={(p) => x(d(p))} y={(p) => y(p.p)} curve={curveMonotoneX} stroke={HEX.ink} strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={x(d(last))} cy={y(last.p)} r={3.5} fill={HEX.ink} />
            {ends.map((e) => (
              <text key={e.key} x={w + 8} y={e.y} dy="0.32em" fontSize={11} fill={e.color} fontWeight={e.strong ? 600 : 400}>
                {e.label} <tspan className="font-mono" fill={HEX.ink3}>{Math.round(e.v * 100)}%</tspan>
              </text>
            ))}
            <AxisLeft scale={y} numTicks={4} tickFormat={(v) => `${Math.round(Number(v) * 100)}%`} hideAxisLine hideTicks tickLabelProps={{ ...tick, textAnchor: "end", dx: -4, dy: "0.32em" }} />
            <AxisBottom
              top={h}
              scale={x}
              numTicks={Math.max(2, Math.floor(w / 90))}
              tickFormat={(v) => fmtDate.format(v as Date)}
              stroke={HEX.lineStrong}
              tickStroke={HEX.lineStrong}
              tickLength={4}
              tickLabelProps={{ ...tick, textAnchor: "middle" }}
            />
          </Group>
        </svg>
      )}
    </div>
  );
}
