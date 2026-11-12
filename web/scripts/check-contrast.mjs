// Prints the WCAG contrast table for docs/design/design-system.md and checks colour-vision-deficiency
// separation of the chart series. Run: node scripts/check-contrast.mjs  (exit 1 if a text pair fails AA)
import { t, textPairs, markPairs, dataSeries } from "./tokens.mjs";

const hex = (h) => h.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Machado et al. (2009) full-severity simulation matrices, applied in linear RGB; ΔE76 in CIELAB.
const M = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const lab = ([r, g, b]) => {
  const f = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const X = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), Y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), Z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
};
const sim = (h, m) => { const c = hex(h).map(lin); return m ? m.map((r) => Math.min(1, Math.max(0, r[0] * c[0] + r[1] * c[1] + r[2] * c[2]))) : c; };
const dE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

let textFailures = 0;
const out = ["### Text on background (WCAG 2.x AA: 4.5:1 normal text)", "", "| Text | Background | Ratio | Result | Used for |", "|---|---|---|---|---|"];
for (const [fg, bg, min, use] of textPairs) {
  const r = ratio(t[fg], t[bg]); const ok = r >= min; if (!ok) textFailures++;
  out.push(`| \`${fg}\` ${t[fg]} | \`${bg}\` ${t[bg]} | ${r.toFixed(2)}:1 | ${ok ? "AA pass" : "**FAIL**"}${r >= 7 ? " (AAA)" : ""} | ${use} |`);
}
out.push("", "### Graphics on cards (WCAG 1.4.11 non-text contrast: 3:1)", "", "| Mark | On | Ratio | Result | Used for |", "|---|---|---|---|---|");
for (const [fg, bg, use] of markPairs) {
  const r = ratio(t[fg], t[bg]);
  out.push(`| \`${fg}\` ${t[fg]} | \`${bg}\` | ${r.toFixed(2)}:1 | ${r >= 3 ? "pass" : "below 3:1, see mitigation"} | ${use} |`);
}
out.push("", "### Chart series separation under colour-vision deficiency (min pairwise ΔE76)", "", "| Vision | Closest pair | ΔE |", "|---|---|---|");
for (const [kind, m] of Object.entries({ normal: null, ...M })) {
  let min = Infinity, pair = "";
  for (let i = 0; i < dataSeries.length; i++) for (let j = i + 1; j < dataSeries.length; j++) {
    const d = dE(sim(t[dataSeries[i]], m), sim(t[dataSeries[j]], m));
    if (d < min) { min = d; pair = `${dataSeries[i]} / ${dataSeries[j]}`; }
  }
  out.push(`| ${kind} | ${pair} | ${min.toFixed(1)} |`);
}
console.log(out.join("\n"));
console.error(textFailures ? `${textFailures} text pairs FAIL AA` : "All text pairs pass AA.");
process.exit(textFailures ? 1 : 0);
