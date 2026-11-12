/**
 * Realistic mock data for the /design preview pages (phase 1b). Businesses are FICTIONAL on
 * purpose: previews show false facts and competitor gaps, which must never be attributed to real
 * companies. Numbers are internally consistent (mentions/n match the rates, intervals are Wilson
 * 95% intervals computed by `wilson()` below), so the previews also demo honest uncertainty.
 */
import type { DataColor, EngineId } from "./palette";

// ---------------------------------------------------------------- statistics helpers

/** Wilson score interval (95%). Same formula the backend will use (system-design §8a). */
export function wilson(x: number, n: number, z = 1.96): { p: number; lo: number; hi: number; half: number } {
  if (n === 0) return { p: 0, lo: 0, hi: 1, half: 0.5 };
  const p = x / n;
  const z2 = z * z;
  const center = (p + z2 / (2 * n)) / (1 + z2 / n);
  const half = (z / (1 + z2 / n)) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return { p, lo: Math.max(0, center - half), hi: Math.min(1, center + half), half };
}

/** Deterministic PRNG so server and client render identical mock data (no hydration mismatch). */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- entities

export interface Brand {
  id: string;
  name: string;
  aliases: string[];
  website: string;
  category: string;
  city: string;
}

export interface Competitor extends Brand {
  color: DataColor;
}

export const project = {
  id: "prj_01",
  name: "Corner Slice Pizza",
  org: "Corner Slice Pizza",
  brand: {
    id: "b_corner",
    name: "Corner Slice Pizza",
    aliases: ["Corner Slice", "Corner Slice Brooklyn"],
    website: "cornerslice.nyc",
    category: "Pizzeria",
    city: "Brooklyn, NY",
  } satisfies Brand,
  locale: "en-US",
  engines: ["chatgpt", "gemini", "perplexity", "claude"] as EngineId[],
  cadence: "Weekly",
  nextRefreshIso: "2026-11-16T03:00:00-05:00",
  lastRunIso: "2026-11-09T03:00:00-05:00",
};

export const competitors: Competitor[] = [
  // ids are kept stable across the app; names are fictional Brooklyn pizzerias
  { id: "c_shahi", name: "Fulton Ave Pizza", aliases: ["Fulton Ave"], website: "fultonavepizza.com", category: "Pizzeria", city: "Brooklyn, NY", color: "teal" },
  { id: "c_degh", name: "Prospect Pie Co.", aliases: ["Prospect Pie"], website: "prospectpie.com", category: "Pizzeria", city: "Brooklyn, NY", color: "sky" },
  { id: "c_karachi", name: "Bleecker Street Slice", aliases: ["Bleecker Slice"], website: "bleeckerslice.com", category: "Pizzeria", city: "Brooklyn, NY", color: "amber" },
  { id: "c_tandoor", name: "Grand Army Pizzeria", aliases: ["Grand Army"], website: "grandarmypizza.com", category: "Pizzeria", city: "Brooklyn, NY", color: "rose" },
];

// ---------------------------------------------------------------- headline metrics

export const overview = {
  // 4 engines × 30 questions × ~5 samples = 594 answers this week
  visibility: { x: 196, n: 594 }, // 33.0% [29.3, 36.9]
  visibilityPrev: { x: 152, n: 588 }, // 25.9%
  significant: true,
  averageRank: { value: 2.8, prev: 3.4 },
  shareOfVoice: { value: 0.21, prev: 0.17 },
  sentiment: { positive: 0.64, neutral: 0.31, negative: 0.05 },
  falseFacts: 3,
  partialEngines: [] as EngineId[],
};

/** Per-engine mention counts this week and last week. */
export const engineStats: Record<EngineId, { x: number; n: number; xPrev: number; nPrev: number; model: string; significant: boolean }> = {
  chatgpt: { x: 71, n: 150, xPrev: 48, nPrev: 147, model: "gpt-5.1-search", significant: true },
  gemini: { x: 44, n: 148, xPrev: 41, nPrev: 146, model: "gemini-3-pro", significant: false },
  perplexity: { x: 58, n: 150, xPrev: 44, nPrev: 149, model: "sonar-pro", significant: false },
  claude: { x: 23, n: 146, xPrev: 19, nPrev: 146, model: "claude-sonnet-5", significant: false },
};

// ---------------------------------------------------------------- time series (12 weeks)

export interface SeriesPoint {
  date: string; // ISO date (week start)
  p: number;
  lo: number;
  hi: number;
  n: number;
}

const weeks = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 7, 24 + i * 7)); // Aug 24 → Nov 9, 2026
  return d.toISOString().slice(0, 10);
});
export const WEEKS = weeks;

function makeSeries(seed: number, start: number, end: number, n: number, jump?: { at: number; by: number }): SeriesPoint[] {
  const rnd = seeded(seed);
  return weeks.map((date, i) => {
    let p = start + ((end - start) * i) / (weeks.length - 1) + (rnd() - 0.5) * 0.06;
    if (jump && i >= jump.at) p += jump.by;
    p = Math.min(0.95, Math.max(0.02, p));
    const x = Math.round(p * n);
    const w = wilson(x, n);
    return { date, p: w.p, lo: w.lo, hi: w.hi, n };
  });
}

/** The user's brand, aggregated over engines (n ≈ 590/week). */
export const brandSeries = makeSeries(11, 0.22, 0.31, 590, { at: 10, by: 0.04 });

/** Brand visibility per engine (n ≈ 148/week each). */
export const engineSeries: Record<EngineId, SeriesPoint[]> = {
  chatgpt: makeSeries(21, 0.3, 0.36, 148, { at: 10, by: 0.1 }),
  gemini: makeSeries(22, 0.27, 0.3, 148),
  perplexity: makeSeries(23, 0.28, 0.37, 148),
  claude: makeSeries(24, 0.12, 0.16, 146),
};

/** Competitor visibility, aggregated (for share-of-voice and comparison charts). */
export const competitorSeries: Record<string, SeriesPoint[]> = {
  c_shahi: makeSeries(31, 0.58, 0.55, 590),
  c_degh: makeSeries(32, 0.41, 0.46, 590),
  c_karachi: makeSeries(33, 0.36, 0.3, 590),
  c_tandoor: makeSeries(34, 0.19, 0.2, 590),
};

/** Provider model changes, annotated on time series. */
export const modelChanges = [
  { date: weeks[4]!, engine: "gemini" as EngineId, from: "gemini-2.5-pro", to: "gemini-3-pro" },
  { date: weeks[10]!, engine: "chatgpt" as EngineId, from: "gpt-5-search", to: "gpt-5.1-search" },
];

/** Weekly share of voice (mentions of each entity / all tracked mentions). */
export const shareOfVoice = weeks.slice(-6).map((date, i) => {
  const brand = 0.15 + i * 0.012;
  const shahi = 0.33 - i * 0.008;
  const degh = 0.22 + (i % 2) * 0.01;
  const karachi = 0.16 - i * 0.004;
  const tandoor = 0.08;
  return { date, brand, c_shahi: shahi, c_degh: degh, c_karachi: karachi, c_tandoor: tandoor, others: Math.max(0, 1 - brand - shahi - degh - karachi - tandoor) };
});

// ---------------------------------------------------------------- questions (prompts)

export interface Question {
  id: string;
  text: string;
  intent: "Discovery" | "Comparison" | "Specific need" | "Local" | "Price";
  x: number;
  n: number;
  xPrev: number;
  nPrev: number;
  rank: number | null; // average position when mentioned
  topCompetitor: string;
  trend: number[]; // weekly mention rate, 8 weeks
  significant: boolean;
}

function trend(seed: number, base: number): number[] {
  const r = seeded(seed);
  return Array.from({ length: 8 }, (_, i) => Math.max(0, Math.min(1, base + (r() - 0.5) * 0.25 + i * 0.01)));
}

export const questions: Question[] = [
  { id: "q01", text: "best pizza in Brooklyn", intent: "Discovery", x: 12, n: 40, xPrev: 7, nPrev: 40, rank: 2.4, topCompetitor: "Fulton Ave Pizza", trend: trend(1, 0.25), significant: false },
  { id: "q02", text: "classic New York slice near Park Slope", intent: "Specific need", x: 27, n: 40, xPrev: 14, nPrev: 39, rank: 1.6, topCompetitor: "Bleecker Street Slice", trend: trend(2, 0.5), significant: true },
  { id: "q03", text: "late night pizza delivery Brooklyn", intent: "Local", x: 6, n: 36, xPrev: 9, nPrev: 36, rank: 3.1, topCompetitor: "Prospect Pie Co.", trend: trend(3, 0.2), significant: false },
  { id: "q04", text: "Fulton Ave Pizza vs Corner Slice Pizza", intent: "Comparison", x: 34, n: 36, xPrev: 33, nPrev: 36, rank: 1.2, topCompetitor: "Fulton Ave Pizza", trend: trend(4, 0.9), significant: false },
  { id: "q05", text: "pizza place for a group of 20 in Brooklyn", intent: "Specific need", x: 3, n: 40, xPrev: 2, nPrev: 40, rank: 4.0, topCompetitor: "Grand Army Pizzeria", trend: trend(5, 0.06), significant: false },
  { id: "q06", text: "cheap pizza near Barclays Center", intent: "Price", x: 0, n: 24, xPrev: 1, nPrev: 24, rank: null, topCompetitor: "Prospect Pie Co.", trend: trend(6, 0.02), significant: false },
  { id: "q07", text: "pizza catering for an office party Brooklyn", intent: "Specific need", x: 18, n: 40, xPrev: 22, nPrev: 40, rank: 2.0, topCompetitor: "Fulton Ave Pizza", trend: trend(7, 0.5), significant: false },
  { id: "q08", text: "does Corner Slice Pizza deliver", intent: "Specific need", x: 33, n: 36, xPrev: 31, nPrev: 36, rank: 1.0, topCompetitor: "—", trend: trend(8, 0.9), significant: false },
  { id: "q09", text: "most famous pizza in New York", intent: "Discovery", x: 4, n: 40, xPrev: 1, nPrev: 40, rank: 6.5, topCompetitor: "Bleecker Street Slice", trend: trend(9, 0.05), significant: false },
  { id: "q10", text: "gluten-free pizza near me Brooklyn", intent: "Local", x: 9, n: 32, xPrev: 0, nPrev: 32, rank: 2.2, topCompetitor: "Fulton Ave Pizza", trend: trend(10, 0.15), significant: true },
];

// ---------------------------------------------------------------- answers (answer cards)

/** Text is split into segments so mentions/citations render without parsing at runtime. */
export type AnswerSegment =
  | { kind: "text"; text: string }
  | { kind: "brand"; text: string }
  | { kind: "competitor"; text: string; competitorId: string }
  | { kind: "cite"; n: number };

export interface Source {
  n: number;
  title: string;
  domain: string;
  url: string;
}

export interface Answer {
  id: string;
  questionId: string;
  engine: EngineId;
  model: string;
  sampledAtIso: string;
  sampleIndex: number;
  brandRank: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  segments: AnswerSegment[];
  sources: Source[];
  fanouts: string[];
}

export const answers: Answer[] = [
  {
    id: "ans_7f3a",
    questionId: "q01",
    engine: "chatgpt",
    model: "gpt-5.1-search",
    sampledAtIso: "2026-11-09T03:14:22-05:00",
    sampleIndex: 2,
    brandRank: 2,
    sentiment: "positive",
    segments: [
      { kind: "text", text: "For pizza in Brooklyn, locals most often point to " },
      { kind: "competitor", text: "Fulton Ave Pizza", competitorId: "c_shahi" },
      { kind: "text", text: " for its coal-oven pies" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ". " },
      { kind: "brand", text: "Corner Slice Pizza" },
      { kind: "text", text: " on 7th Ave is the pick for a classic New York slice" },
      { kind: "cite", n: 2 },
      { kind: "text", text: ". For late-night delivery, " },
      { kind: "competitor", text: "Prospect Pie Co.", competitorId: "c_degh" },
      { kind: "text", text: " is open until 3 am" },
      { kind: "cite", n: 3 },
      { kind: "text", text: "." },
    ],
    sources: [
      { n: 1, title: "The best pizza in Brooklyn, ranked", domain: "brooklynbites.com", url: "https://brooklynbites.com/best-pizza" },
      { n: 2, title: "Corner Slice Pizza: menu", domain: "cornerslice.nyc", url: "https://cornerslice.nyc/menu" },
      { n: 3, title: "Where to eat late in Brooklyn", domain: "parkslopeeats.com", url: "https://parkslopeeats.com/late-night" },
    ],
    fanouts: ["best pizza Brooklyn 2026", "classic NY slice Brooklyn", "pizza open late Brooklyn"],
  },
  {
    id: "ans_91c2",
    questionId: "q01",
    engine: "perplexity",
    model: "sonar-pro",
    sampledAtIso: "2026-11-09T03:16:05-05:00",
    sampleIndex: 0,
    brandRank: null,
    sentiment: null,
    segments: [
      { kind: "text", text: "Top-rated pizza in Brooklyn includes " },
      { kind: "competitor", text: "Fulton Ave Pizza", competitorId: "c_shahi" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ", " },
      { kind: "competitor", text: "Bleecker Street Slice", competitorId: "c_karachi" },
      { kind: "cite", n: 2 },
      { kind: "text", text: " and " },
      { kind: "competitor", text: "Prospect Pie Co.", competitorId: "c_degh" },
      { kind: "cite", n: 1 },
      { kind: "text", text: "." },
    ],
    sources: [
      { n: 1, title: "The best pizza in Brooklyn, ranked", domain: "brooklynbites.com", url: "https://brooklynbites.com/best-pizza" },
      { n: 2, title: "Bleecker Street Slice opens in Brooklyn", domain: "slicereport.com", url: "https://slicereport.com/bleecker-brooklyn" },
    ],
    fanouts: ["top rated pizza Brooklyn", "pizza Brooklyn reviews"],
  },
  {
    id: "ans_44be",
    questionId: "q02",
    engine: "gemini",
    model: "gemini-3-pro",
    sampledAtIso: "2026-11-09T03:21:47-05:00",
    sampleIndex: 1,
    brandRank: 1,
    sentiment: "positive",
    segments: [
      { kind: "text", text: "For a classic New York slice near Park Slope, " },
      { kind: "brand", text: "Corner Slice Pizza" },
      { kind: "text", text: " on 7th Ave comes up most" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ". " },
      { kind: "competitor", text: "Bleecker Street Slice", competitorId: "c_karachi" },
      { kind: "text", text: " is a close second" },
      { kind: "cite", n: 2 },
      { kind: "text", text: ". Corner Slice is open 11 am to 11 pm" },
      { kind: "cite", n: 3 },
      { kind: "text", text: "." },
    ],
    sources: [
      { n: 1, title: "Park Slope's best slices", domain: "parkslopeeats.com", url: "https://parkslopeeats.com/slices" },
      { n: 2, title: "Bleecker Street Slice reviews", domain: "yelp.com", url: "https://www.yelp.com/biz/bleecker-street-slice" },
      { n: 3, title: "Corner Slice Pizza on DoorDash", domain: "doordash.com", url: "https://www.doordash.com/store/corner-slice" },
    ],
    fanouts: ["NY slice Park Slope", "Corner Slice Pizza hours"],
  },
  {
    id: "ans_c07d",
    questionId: "q05",
    engine: "claude",
    model: "claude-sonnet-5",
    sampledAtIso: "2026-11-09T03:29:10-05:00",
    sampleIndex: 3,
    brandRank: 3,
    sentiment: "neutral",
    segments: [
      { kind: "text", text: "For a group of 20, " },
      { kind: "competitor", text: "Grand Army Pizzeria", competitorId: "c_tandoor" },
      { kind: "text", text: " has a private back room" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ". " },
      { kind: "competitor", text: "Fulton Ave Pizza", competitorId: "c_shahi" },
      { kind: "text", text: " takes group bookings. " },
      { kind: "brand", text: "Corner Slice Pizza" },
      { kind: "text", text: " is mostly takeout and, as far as I can tell, doesn't deliver" },
      { kind: "cite", n: 2 },
      { kind: "text", text: "." },
    ],
    sources: [
      { n: 1, title: "Grand Army Pizzeria: private events", domain: "grandarmypizza.com", url: "https://grandarmypizza.com/events" },
      { n: 2, title: "Brooklyn pizza guide 2024", domain: "brooklynbites.com", url: "https://brooklynbites.com/guide-2024" },
    ],
    fanouts: ["pizza restaurant large groups Brooklyn"],
  },
];

// ---------------------------------------------------------------- sources & fanouts

export const topSources = [
  { domain: "brooklynbites.com", citations: 142, brandShare: 0.18, engines: ["chatgpt", "perplexity"] as EngineId[], citesBrand: true },
  { domain: "parkslopeeats.com", citations: 96, brandShare: 0.41, engines: ["gemini", "chatgpt"] as EngineId[], citesBrand: true },
  { domain: "doordash.com", citations: 88, brandShare: 0.27, engines: ["gemini", "perplexity", "claude"] as EngineId[], citesBrand: true },
  { domain: "yelp.com", citations: 81, brandShare: 0.12, engines: ["gemini"] as EngineId[], citesBrand: true },
  { domain: "slicereport.com", citations: 54, brandShare: 0.0, engines: ["perplexity"] as EngineId[], citesBrand: false },
  { domain: "eater.com", citations: 47, brandShare: 0.06, engines: ["chatgpt", "claude"] as EngineId[], citesBrand: true },
  { domain: "timeout.com", citations: 33, brandShare: 0.09, engines: ["claude"] as EngineId[], citesBrand: true },
  { domain: "reddit.com/r/brooklyn", citations: 29, brandShare: 0.0, engines: ["perplexity", "chatgpt"] as EngineId[], citesBrand: false },
];

export const fanoutTopics = [
  { topic: "best pizza Brooklyn", count: 214, brandMentioned: 0.31 },
  { topic: "classic NY slice", count: 121, brandMentioned: 0.68 },
  { topic: "pizza delivery late night", count: 77, brandMentioned: 0.14 },
  { topic: "pizza catering Brooklyn", count: 64, brandMentioned: 0.42 },
  { topic: "pizza for large groups", count: 51, brandMentioned: 0.05 },
  { topic: "gluten-free pizza", count: 38, brandMentioned: 0.21 },
  { topic: "cheap pizza Barclays Center", count: 26, brandMentioned: 0.0 },
];

// ---------------------------------------------------------------- facts & actions

export const falseFacts = [
  {
    id: "ff1",
    claim: "Corner Slice Pizza doesn't deliver.",
    truth: "Delivers in Brooklyn until 2 am.",
    engines: ["claude", "chatgpt"] as EngineId[],
    seen: 9,
    of: 76,
    source: "brooklynbites.com/guide-2024",
    severity: "high" as const,
  },
  {
    id: "ff2",
    claim: "Open 11 am – 11 pm.",
    truth: "Open 11 am – 2 am every day.",
    engines: ["gemini"] as EngineId[],
    seen: 14,
    of: 40,
    source: "doordash.com listing (old hours)",
    severity: "medium" as const,
  },
  {
    id: "ff3",
    claim: "Located on 5th Ave.",
    truth: "7th Ave since March 2025.",
    engines: ["perplexity"] as EngineId[],
    seen: 4,
    of: 38,
    source: "slicereport.com (2023 article)",
    severity: "medium" as const,
  },
];

export interface Action {
  id: string;
  title: string;
  kind: "owned" | "earned";
  impact: "High" | "Medium" | "Low";
  effort: "Low" | "Medium" | "High";
  expectedLift: string; // honest range, not a promise
  evidence: string;
  questions: number;
}

export const actions: Action[] = [
  { id: "a1", kind: "owned", title: "Say on your site that you deliver", impact: "High", effort: "Low", expectedLift: "+4 to +11 pts on 3 delivery questions", evidence: "Claude and ChatGPT say you don't deliver.", questions: 3 },
  { id: "a2", kind: "owned", title: "Put your hours where AI looks", impact: "High", effort: "Low", expectedLift: "Fixes 2 false facts", evidence: "Gemini gives the wrong hours in 14 of 40 answers.", questions: 6 },
  { id: "a3", kind: "earned", title: "Get on brooklynbites.com's best pizza list", impact: "High", effort: "Medium", expectedLift: "+6 to +15 pts on 'best pizza' questions", evidence: "AI cites this list 142 times. It names Fulton Ave Pizza, not you.", questions: 4 },
  { id: "a4", kind: "owned", title: "Let AI crawlers read your site", impact: "Medium", effort: "Low", expectedLift: "Lets AI cite your own site", evidence: "Your site blocks ChatGPT search and Perplexity.", questions: 30 },
  { id: "a5", kind: "earned", title: "Update your hours on DoorDash", impact: "Medium", effort: "Low", expectedLift: "Fixes 1 false fact", evidence: "AI reads your old hours from DoorDash.", questions: 5 },
  { id: "a6", kind: "owned", title: "Add a short AI summary of your business", impact: "Low", effort: "Low", expectedLift: "Small", evidence: "Your catering details are only in a PDF.", questions: 2 },
  { id: "a7", kind: "earned", title: "Reply in the r/brooklyn pizza thread", impact: "Low", effort: "Low", expectedLift: "Uncertain", evidence: "Perplexity cites it, and you aren't in it.", questions: 1 },
];

// ---------------------------------------------------------------- settings & agency

export const apiKeys = [
  { id: "k1", provider: "OpenAI", last4: "Q8xD", label: "Production", createdIso: "2026-10-02", lastUsedIso: "2026-11-09T03:14:22-05:00", status: "active" as const, spendUsd: 41.27, capUsd: 60 },
  { id: "k2", provider: "Anthropic", last4: "m2Lk", label: "Main", createdIso: "2026-10-02", lastUsedIso: "2026-11-09T03:29:10-05:00", status: "active" as const, spendUsd: 18.4, capUsd: 40 },
  { id: "k3", provider: "Perplexity", last4: "7aQ1", label: "Main", createdIso: "2026-10-15", lastUsedIso: "2026-11-09T03:16:05-05:00", status: "active" as const, spendUsd: 22.95, capUsd: null },
  { id: "k4", provider: "Google Gemini", last4: "Zt0p", label: "Old key", createdIso: "2026-08-20", lastUsedIso: "2026-10-27T03:02:11-05:00", status: "invalid" as const, spendUsd: 0, capUsd: null },
];

export const agencyClients = [
  { name: "Corner Slice Pizza", city: "Brooklyn, NY", x: 196, n: 594, xPrev: 152, nPrev: 588, significant: true, falseFacts: 3, openActions: 7, spendUsd: 23.1 },
  { name: "Bright Smile Dental", city: "Austin, TX", x: 88, n: 480, xPrev: 91, nPrev: 480, significant: false, falseFacts: 0, openActions: 4, spendUsd: 18.75 },
  { name: "Lakeview Florist", city: "Chicago, IL", x: 41, n: 360, xPrev: 63, nPrev: 360, significant: true, falseFacts: 1, openActions: 9, spendUsd: 14.2 },
  { name: "Fade Room Barbers", city: "Atlanta, GA", x: 133, n: 420, xPrev: 120, nPrev: 418, significant: false, falseFacts: 2, openActions: 5, spendUsd: 16.6 },
  { name: "Mesa Verde Physical Therapy", city: "Phoenix, AZ", x: 302, n: 600, xPrev: 287, nPrev: 600, significant: false, falseFacts: 0, openActions: 3, spendUsd: 31.4 },
  { name: "Harbor Light Yoga", city: "Seattle, WA", x: 57, n: 300, xPrev: 34, nPrev: 300, significant: true, falseFacts: 1, openActions: 6, spendUsd: 11.9 },
];

/** AI crawler visits by bot and day (from uploaded server logs), 14 days. */
export const CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended"] as const;
export const crawlerHeatmap = CRAWLERS.map((bot, bi) => {
  const r = seeded(100 + bi);
  const base = [22, 0, 6, 0, 9, 14][bi]!; // OAI-SearchBot and PerplexityBot are blocked by robots.txt
  return { bot, days: Array.from({ length: 14 }, (_, d) => ({ day: d, visits: base === 0 ? 0 : Math.round(base * (0.4 + r() * 1.2) * (d % 7 === 5 ? 1.6 : 1)) })) };
});
