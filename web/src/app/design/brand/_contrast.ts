// WCAG contrast for the brand sheet. Values mirror scripts/tokens.mjs (the checked source of truth);
// the page recomputes ratios so the table can't drift from the hex values shown next to it.
export const T = {
  bg: "#FAFAF8", surface: "#FFFFFF", fill: "#F2F2EE", line: "#E5E5E0", "line-strong": "#D4D4CE",
  ink: "#111311", "ink-2": "#4B4F4B", "ink-3": "#6B706B", white: "#FFFFFF",
  lime: "#D6F69A", "lime-deep": "#C4EC74", "lime-soft": "#F0FBD9", "lime-ink": "#1B4249",
  "on-dark": "#FFFFFF", "on-dark-2": "#DBDDDE", overlay: "#0B0D0B",
  teal: "#1F8A8A", sky: "#4C9BE8", amber: "#E8A33D", rose: "#E06C75", stone: "#9CA3AF",
  up: "#15803D", down: "#B91C1C",
} as const;
export type TokenName = keyof typeof T;

export const TEXT_PAIRS: [TokenName, TokenName, string][] = [
  ["ink", "bg", "body text on page"], ["ink", "surface", "body text on cards"], ["ink", "fill", "text in fills, table header"],
  ["ink-2", "bg", "secondary text on page"], ["ink-2", "surface", "secondary text on cards"], ["ink-2", "fill", "secondary text in fills"],
  ["ink-3", "bg", "muted text, labels, non-significant deltas"], ["ink-3", "surface", "muted text on cards"], ["ink-3", "fill", "muted text in fills"],
  ["lime-ink", "lime", "primary pills, brand mention, selected nav, chips"], ["lime-ink", "lime-deep", "pill hover/pressed"], ["lime-ink", "lime-soft", "soft tags, tinted cells, added diff lines"],
  ["white", "ink", "ink button text"], ["on-dark", "overlay", "headline over darkened imagery"], ["on-dark-2", "overlay", "body over darkened imagery"],
  ["up", "bg", "positive delta"], ["up", "surface", "positive delta on cards"], ["down", "bg", "negative delta"], ["down", "surface", "negative delta on cards"],
];
export const MARK_PAIRS: [TokenName, string][] = [
  ["ink", "brand line, focus ring"], ["teal", "data series"], ["sky", "data series"], ["amber", "data series"],
  ["rose", "data series"], ["stone", "'other' series"], ["line-strong", "input borders"],
];

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lum(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
// Self-check against the known extremes so a broken formula fails loudly in dev.
if (Math.abs(ratio("#000000", "#FFFFFF") - 21) > 0.01) throw new Error("contrast formula broken");
