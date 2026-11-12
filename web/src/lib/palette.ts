/**
 * Consistent colour assignment for data series. The user's brand is ALWAYS ink (#111311, thick
 * line, lime confidence band); engines and competitors use the data colours in a fixed order so
 * the same entity has the same colour on every screen.
 */

export type EngineId = "chatgpt" | "gemini" | "perplexity" | "claude";
export type DataColor = "teal" | "sky" | "amber" | "rose" | "stone";

export const ENGINES: Record<EngineId, { label: string; color: DataColor }> = {
  chatgpt: { label: "ChatGPT", color: "teal" },
  gemini: { label: "Gemini", color: "sky" },
  perplexity: { label: "Perplexity", color: "amber" },
  claude: { label: "Claude", color: "rose" },
};

export const ENGINE_ORDER: EngineId[] = ["chatgpt", "gemini", "perplexity", "claude"];

/** Competitors take data colours in rank order; "others" is always stone. */
export const COMPETITOR_COLORS: DataColor[] = ["teal", "sky", "amber", "rose"];
export const OTHERS_COLOR: DataColor = "stone";

/** Raw hex values for SVG (visx) where CSS classes can't be used. Mirror of globals.css. */
export const HEX = {
  bg: "#F5F5F6",
  surface: "#FFFFFF",
  fill: "#F0F0F2",
  line: "#E8E8EB",
  lineStrong: "#D6D7DB",
  ink: "#111311",
  ink2: "#45484D",
  ink3: "#5F636A",
  lime: "#D6F69A",
  limeDeep: "#C4EC74",
  limeSoft: "#F0FBD9",
  limeInk: "#1B4249",
  teal: "#1F8A8A",
  sky: "#4C9BE8",
  amber: "#E8A33D",
  rose: "#E06C75",
  stone: "#9CA3AF",
  up: "#15803D",
  down: "#B91C1C",
} as const;

/** Distinct dash patterns so series stay distinguishable without colour (sky/amber/stone < 3:1). */
export const DASH: Record<DataColor, string | undefined> = {
  teal: undefined,
  sky: "6 3",
  amber: "2 3",
  rose: "8 3 2 3",
  stone: "1 3",
};

/** Tailwind class lookups (literal strings so Tailwind's scanner sees them). */
export const BG_CLASS: Record<DataColor, string> = {
  teal: "bg-teal",
  sky: "bg-sky",
  amber: "bg-amber",
  rose: "bg-rose",
  stone: "bg-stone",
};
export const DECORATION_CLASS: Record<DataColor, string> = {
  teal: "decoration-teal",
  sky: "decoration-sky",
  amber: "decoration-amber",
  rose: "decoration-rose",
  stone: "decoration-stone",
};
