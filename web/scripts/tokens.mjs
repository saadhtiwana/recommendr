// Highlighter palette: the single source of colour values checked by check-contrast.mjs.
// Must match the @theme block in src/app/globals.css.
export const t = {
  canvas: "#E7E8EA", bg: "#F5F5F6", surface: "#FFFFFF", fill: "#F0F0F2", line: "#E8E8EB", "line-strong": "#D6D7DB",
  ink: "#111311", "ink-2": "#45484D", "ink-3": "#5F636A", white: "#FFFFFF",
  lime: "#D6F69A", "lime-deep": "#C4EC74", "lime-soft": "#F0FBD9", "lime-ink": "#1B4249",
  "on-dark": "#FFFFFF", "on-dark-2": "#DBDDDE", "overlay": "#0B0D0B",
  teal: "#1F8A8A", sky: "#4C9BE8", amber: "#E8A33D", rose: "#E06C75", stone: "#9CA3AF",
  up: "#15803D", down: "#B91C1C", "up-soft": "#EAF7EE", "down-soft": "#FBE7E7",
};
// Every text/background pair the UI actually uses: [foreground, background, minimum, where].
export const textPairs = [
  ["ink", "bg", 4.5, "body text on page"], ["ink", "surface", 4.5, "body text on cards"], ["ink", "fill", 4.5, "text in subtle fills, table header"],
  ["ink-2", "bg", 4.5, "secondary text on page"], ["ink-2", "surface", 4.5, "secondary text on cards"], ["ink-2", "fill", 4.5, "secondary text in fills"],
  ["ink-3", "bg", 4.5, "muted text, labels, footnotes, non-significant deltas"], ["ink-3", "surface", 4.5, "muted text on cards"], ["ink-3", "fill", 4.5, "muted text in fills"],
  ["lime-ink", "lime", 4.5, "primary pill buttons, highlighted brand mention, selected nav, chips"],
  ["lime-ink", "lime-deep", 4.5, "primary pill hover/pressed"],
  ["lime-ink", "lime-soft", 4.5, "soft tags, tinted pricing column, added diff lines"],
  ["on-dark", "overlay", 4.5, "headline over darkened imagery (overlay floor; video frame check in phase 2 of the landing work)"],
  ["on-dark-2", "overlay", 4.5, "body text over darkened imagery"],
  ["white", "ink", 4.5, "primary button text"],
  ["up", "up-soft", 4.5, "positive change badge"], ["down", "down-soft", 4.5, "negative change badge"], ["ink-3", "canvas", 4.5, "muted text on the canvas"],
  ["up", "bg", 4.5, "positive delta text"], ["up", "surface", 4.5, "positive delta on cards"],
  ["down", "bg", 4.5, "negative delta text"], ["down", "surface", 4.5, "negative delta on cards"],
];
// Non-text marks (WCAG 1.4.11 asks 3:1 for graphics needed to understand content).
export const markPairs = [
  ["ink", "surface", "brand line in charts, focus ring"],
  ["teal", "surface", "data series"], ["sky", "surface", "data series"], ["amber", "surface", "data series"],
  ["rose", "surface", "data series"], ["stone", "surface", "'other' series"],
  ["line-strong", "surface", "input borders"],
];
export const dataSeries = ["ink", "teal", "sky", "amber", "rose", "stone"];
