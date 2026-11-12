/** Tiny trend line (ink). Values are 0..1 rates; a fixed domain keeps sparklines comparable. */
export function Sparkline({
  values,
  width = 72,
  height = 20,
  domain = [0, 1],
  dot = true,
  label,
}: {
  values: number[];
  width?: number;
  height?: number;
  domain?: [number, number];
  dot?: boolean;
  label?: string;
}) {
  if (values.length < 2) return null;
  const [d0, d1] = domain;
  const x = (i: number) => 1 + (i * (width - 4)) / (values.length - 1);
  const y = (v: number) => height - 2 - ((v - d0) / (d1 - d0 || 1)) * (height - 4);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const last = values[values.length - 1]!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label ?? `Trend from ${Math.round(values[0]! * 100)}% to ${Math.round(last * 100)}%`}>
      <path d={d} fill="none" stroke="var(--color-ink)" strokeWidth={1.25} strokeLinejoin="round" strokeLinecap="round" />
      {dot && <circle cx={x(values.length - 1)} cy={y(last)} r={2} fill="var(--color-ink)" />}
    </svg>
  );
}
