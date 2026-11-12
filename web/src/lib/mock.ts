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
  name: "Dera Biryani House",
  org: "Dera Hospitality",
  brand: {
    id: "b_dera",
    name: "Dera Biryani House",
    aliases: ["Dera Biryani", "Dera House"],
    website: "derabiryani.pk",
    category: "Biryani restaurant",
    city: "Islamabad",
  } satisfies Brand,
  locale: "en-PK",
  engines: ["chatgpt", "gemini", "perplexity", "claude"] as EngineId[],
  cadence: "Weekly",
  nextRefreshIso: "2026-11-16T03:00:00+05:00",
  lastRunIso: "2026-11-09T03:00:00+05:00",
};

export const competitors: Competitor[] = [
  { id: "c_shahi", name: "Shahi Handi", aliases: ["Shahi Handi F-7"], website: "shahihandi.pk", category: "Biryani restaurant", city: "Islamabad", color: "teal" },
  { id: "c_degh", name: "Lahori Degh", aliases: ["Lahori Degh Blue Area"], website: "lahoridegh.com", category: "Biryani restaurant", city: "Islamabad", color: "sky" },
  { id: "c_karachi", name: "Karachi Biryani Centre", aliases: ["KBC"], website: "kbc-isb.pk", category: "Biryani restaurant", city: "Islamabad", color: "amber" },
  { id: "c_tandoor", name: "Tandoor & Co.", aliases: ["Tandoor and Co"], website: "tandoorco.pk", category: "Pakistani restaurant", city: "Islamabad", color: "rose" },
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
  { id: "q01", text: "best biryani in Islamabad", intent: "Discovery", x: 12, n: 40, xPrev: 7, nPrev: 40, rank: 2.4, topCompetitor: "Shahi Handi", trend: trend(1, 0.25), significant: false },
  { id: "q02", text: "where to get authentic Sindhi biryani in Islamabad", intent: "Specific need", x: 27, n: 40, xPrev: 14, nPrev: 39, rank: 1.6, topCompetitor: "Karachi Biryani Centre", trend: trend(2, 0.5), significant: true },
  { id: "q03", text: "biryani delivery F-7 Islamabad late night", intent: "Local", x: 6, n: 36, xPrev: 9, nPrev: 36, rank: 3.1, topCompetitor: "Lahori Degh", trend: trend(3, 0.2), significant: false },
  { id: "q04", text: "Shahi Handi vs Dera Biryani House", intent: "Comparison", x: 34, n: 36, xPrev: 33, nPrev: 36, rank: 1.2, topCompetitor: "Shahi Handi", trend: trend(4, 0.9), significant: false },
  { id: "q05", text: "family restaurant with biryani and private rooms Islamabad", intent: "Specific need", x: 3, n: 40, xPrev: 2, nPrev: 40, rank: 4.0, topCompetitor: "Tandoor & Co.", trend: trend(5, 0.06), significant: false },
  { id: "q06", text: "cheap biryani near Blue Area under Rs 800", intent: "Price", x: 0, n: 24, xPrev: 1, nPrev: 24, rank: null, topCompetitor: "Lahori Degh", trend: trend(6, 0.02), significant: false },
  { id: "q07", text: "catering biryani for 100 people Islamabad", intent: "Specific need", x: 18, n: 40, xPrev: 22, nPrev: 40, rank: 2.0, topCompetitor: "Shahi Handi", trend: trend(7, 0.5), significant: false },
  { id: "q08", text: "is Dera Biryani House halal certified", intent: "Specific need", x: 33, n: 36, xPrev: 31, nPrev: 36, rank: 1.0, topCompetitor: "—", trend: trend(8, 0.9), significant: false },
  { id: "q09", text: "most famous biryani places in Pakistan", intent: "Discovery", x: 4, n: 40, xPrev: 1, nPrev: 40, rank: 6.5, topCompetitor: "Karachi Biryani Centre", trend: trend(9, 0.05), significant: false },
  { id: "q10", text: "biryani restaurant open on Eid Islamabad", intent: "Local", x: 9, n: 32, xPrev: 0, nPrev: 32, rank: 2.2, topCompetitor: "Shahi Handi", trend: trend(10, 0.15), significant: true },
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
    sampledAtIso: "2026-11-09T03:14:22+05:00",
    sampleIndex: 2,
    brandRank: 2,
    sentiment: "positive",
    segments: [
      { kind: "text", text: "For biryani in Islamabad, locals most often point to " },
      { kind: "competitor", text: "Shahi Handi", competitorId: "c_shahi" },
      { kind: "text", text: " in F-7 for its slow-cooked handi biryani" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ". " },
      { kind: "brand", text: "Dera Biryani House" },
      { kind: "text", text: " is a strong choice if you want Sindhi-style biryani with plenty of aloo and a sharper spice level" },
      { kind: "cite", n: 2 },
      { kind: "text", text: ". For delivery late at night, " },
      { kind: "competitor", text: "Lahori Degh", competitorId: "c_degh" },
      { kind: "text", text: " in Blue Area is open until 2 am" },
      { kind: "cite", n: 3 },
      { kind: "text", text: "." },
    ],
    sources: [
      { n: 1, title: "The 12 best biryani spots in Islamabad, ranked", domain: "foodiespk.com", url: "https://foodiespk.com/islamabad/best-biryani" },
      { n: 2, title: "Dera Biryani House: menu and reviews", domain: "derabiryani.pk", url: "https://derabiryani.pk/menu" },
      { n: 3, title: "Late-night food delivery in Islamabad", domain: "dawn.com", url: "https://www.dawn.com/news/late-night-islamabad" },
    ],
    fanouts: ["best biryani Islamabad 2026", "Sindhi biryani Islamabad", "biryani open late Islamabad"],
  },
  {
    id: "ans_91c2",
    questionId: "q01",
    engine: "perplexity",
    model: "sonar-pro",
    sampledAtIso: "2026-11-09T03:16:05+05:00",
    sampleIndex: 0,
    brandRank: null,
    sentiment: null,
    segments: [
      { kind: "text", text: "Top-rated biryani in Islamabad includes " },
      { kind: "competitor", text: "Shahi Handi", competitorId: "c_shahi" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ", " },
      { kind: "competitor", text: "Karachi Biryani Centre", competitorId: "c_karachi" },
      { kind: "cite", n: 2 },
      { kind: "text", text: " and " },
      { kind: "competitor", text: "Lahori Degh", competitorId: "c_degh" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ". Reviewers single out Karachi Biryani Centre's mutton biryani and its consistent portions across branches." },
    ],
    sources: [
      { n: 1, title: "The 12 best biryani spots in Islamabad, ranked", domain: "foodiespk.com", url: "https://foodiespk.com/islamabad/best-biryani" },
      { n: 2, title: "Karachi Biryani Centre opens second Islamabad branch", domain: "propakistani.pk", url: "https://propakistani.pk/kbc-islamabad" },
    ],
    fanouts: ["top rated biryani Islamabad", "biryani Islamabad reviews"],
  },
  {
    id: "ans_44be",
    questionId: "q02",
    engine: "gemini",
    model: "gemini-3-pro",
    sampledAtIso: "2026-11-09T03:21:47+05:00",
    sampleIndex: 1,
    brandRank: 1,
    sentiment: "positive",
    segments: [
      { kind: "text", text: "If you're after authentic Sindhi biryani, " },
      { kind: "brand", text: "Dera Biryani House" },
      { kind: "text", text: " in G-9 Markaz is the name that comes up most. It uses Sindhi-style aloo, dried plums and green chillies" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ". " },
      { kind: "competitor", text: "Karachi Biryani Centre", competitorId: "c_karachi" },
      { kind: "text", text: " is a close second, with a milder version" },
      { kind: "cite", n: 2 },
      { kind: "text", text: ". Dera is open daily from 12 pm to 11 pm" },
      { kind: "cite", n: 3 },
      { kind: "text", text: "." },
    ],
    sources: [
      { n: 1, title: "Sindhi biryani in the capital: where to go", domain: "tribune.com.pk", url: "https://tribune.com.pk/story/sindhi-biryani-islamabad" },
      { n: 2, title: "Karachi Biryani Centre — Google reviews", domain: "maps.google.com", url: "https://maps.google.com/?cid=1" },
      { n: 3, title: "Dera Biryani House on Foodpanda", domain: "foodpanda.pk", url: "https://www.foodpanda.pk/restaurant/dera" },
    ],
    fanouts: ["Sindhi biryani Islamabad", "Dera Biryani House G-9 timings"],
  },
  {
    id: "ans_c07d",
    questionId: "q05",
    engine: "claude",
    model: "claude-sonnet-5",
    sampledAtIso: "2026-11-09T03:29:10+05:00",
    sampleIndex: 3,
    brandRank: 3,
    sentiment: "neutral",
    segments: [
      { kind: "text", text: "For a family meal with private rooms, " },
      { kind: "competitor", text: "Tandoor & Co.", competitorId: "c_tandoor" },
      { kind: "text", text: " in F-6 has two bookable family halls" },
      { kind: "cite", n: 1 },
      { kind: "text", text: ". " },
      { kind: "competitor", text: "Shahi Handi", competitorId: "c_shahi" },
      { kind: "text", text: " takes group reservations. " },
      { kind: "brand", text: "Dera Biryani House" },
      { kind: "text", text: " is popular for takeaway but, as far as I can tell, does not offer private dining" },
      { kind: "cite", n: 2 },
      { kind: "text", text: "." },
    ],
    sources: [
      { n: 1, title: "Tandoor & Co. — family dining", domain: "tandoorco.pk", url: "https://tandoorco.pk/family" },
      { n: 2, title: "Islamabad restaurant guide 2024", domain: "islamabadscene.com", url: "https://islamabadscene.com/guide-2024" },
    ],
    fanouts: ["restaurants with private family rooms Islamabad"],
  },
];

// ---------------------------------------------------------------- sources & fanouts

export const topSources = [
  { domain: "foodiespk.com", citations: 142, brandShare: 0.18, engines: ["chatgpt", "perplexity"] as EngineId[], citesBrand: true },
  { domain: "tribune.com.pk", citations: 96, brandShare: 0.41, engines: ["gemini", "chatgpt"] as EngineId[], citesBrand: true },
  { domain: "foodpanda.pk", citations: 88, brandShare: 0.27, engines: ["gemini", "perplexity", "claude"] as EngineId[], citesBrand: true },
  { domain: "maps.google.com", citations: 81, brandShare: 0.12, engines: ["gemini"] as EngineId[], citesBrand: true },
  { domain: "propakistani.pk", citations: 54, brandShare: 0.0, engines: ["perplexity"] as EngineId[], citesBrand: false },
  { domain: "dawn.com", citations: 47, brandShare: 0.06, engines: ["chatgpt", "claude"] as EngineId[], citesBrand: true },
  { domain: "islamabadscene.com", citations: 33, brandShare: 0.09, engines: ["claude"] as EngineId[], citesBrand: true },
  { domain: "reddit.com/r/islamabad", citations: 29, brandShare: 0.0, engines: ["perplexity", "chatgpt"] as EngineId[], citesBrand: false },
];

export const fanoutTopics = [
  { topic: "best biryani Islamabad", count: 214, brandMentioned: 0.31 },
  { topic: "Sindhi biryani Islamabad", count: 121, brandMentioned: 0.68 },
  { topic: "biryani delivery late night", count: 77, brandMentioned: 0.14 },
  { topic: "biryani catering Islamabad", count: 64, brandMentioned: 0.42 },
  { topic: "family restaurants private rooms", count: 51, brandMentioned: 0.05 },
  { topic: "halal biryani certified", count: 38, brandMentioned: 0.84 },
  { topic: "biryani price Blue Area", count: 26, brandMentioned: 0.0 },
];

// ---------------------------------------------------------------- facts & actions

export const falseFacts = [
  {
    id: "ff1",
    claim: "Dera Biryani House does not offer private dining.",
    truth: "Two private family rooms (up to 14 guests), bookable by phone.",
    engines: ["claude", "chatgpt"] as EngineId[],
    seen: 9,
    of: 76,
    source: "islamabadscene.com/guide-2024",
    severity: "high" as const,
  },
  {
    id: "ff2",
    claim: "Open daily 12 pm – 11 pm.",
    truth: "Open 12 pm – 1 am, Friday to Sunday until 2 am.",
    engines: ["gemini"] as EngineId[],
    seen: 14,
    of: 40,
    source: "foodpanda.pk listing (outdated hours)",
    severity: "medium" as const,
  },
  {
    id: "ff3",
    claim: "Located in F-10 Markaz.",
    truth: "G-9 Markaz since March 2025 (moved from F-10).",
    engines: ["perplexity"] as EngineId[],
    seen: 4,
    of: 38,
    source: "propakistani.pk (2023 article)",
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
  { id: "a1", kind: "owned", title: "Add a 'Private dining' section and FAQ to your site", impact: "High", effort: "Low", expectedLift: "+4 to +11 pts on 3 family-dining questions", evidence: "Claude and ChatGPT say you have no private rooms (9 of 76 answers); they cite a 2024 guide.", questions: 3 },
  { id: "a2", kind: "owned", title: "Publish Restaurant JSON-LD with opening hours and address", impact: "High", effort: "Low", expectedLift: "Fixes 2 false facts", evidence: "Gemini states 12 pm – 11 pm in 14 of 40 answers; your site has no structured hours.", questions: 6 },
  { id: "a3", kind: "earned", title: "Get listed in foodiespk.com's 'best biryani in Islamabad'", impact: "High", effort: "Medium", expectedLift: "+6 to +15 pts on 'best biryani' questions", evidence: "Cited in 142 answers, mentions Shahi Handi and Lahori Degh but not you.", questions: 4 },
  { id: "a4", kind: "owned", title: "Allow OAI-SearchBot and PerplexityBot in robots.txt", impact: "Medium", effort: "Low", expectedLift: "Enables citations of your own site", evidence: "robots.txt disallows both; ChatGPT and Perplexity never cite derabiryani.pk.", questions: 30 },
  { id: "a5", kind: "earned", title: "Update hours and address on Foodpanda", impact: "Medium", effort: "Low", expectedLift: "Fixes 1 false fact", evidence: "foodpanda.pk is cited in 88 answers with your old F-10 address.", questions: 5 },
  { id: "a6", kind: "owned", title: "Publish llms.txt with menu, locations and catering details", impact: "Low", effort: "Low", expectedLift: "Small; improves crawler understanding", evidence: "No llms.txt; catering details live only in a PDF.", questions: 2 },
  { id: "a7", kind: "earned", title: "Answer the r/islamabad 'Sindhi biryani' thread with your details", impact: "Low", effort: "Low", expectedLift: "Uncertain", evidence: "Thread cited by Perplexity in 11 answers; no mention of you.", questions: 1 },
];

// ---------------------------------------------------------------- settings & agency

export const apiKeys = [
  { id: "k1", provider: "OpenAI", last4: "Q8xD", label: "Production", createdIso: "2026-10-02", lastUsedIso: "2026-11-09T03:14:22+05:00", status: "active" as const, spendUsd: 41.27, capUsd: 60 },
  { id: "k2", provider: "Anthropic", last4: "m2Lk", label: "Main", createdIso: "2026-10-02", lastUsedIso: "2026-11-09T03:29:10+05:00", status: "active" as const, spendUsd: 18.4, capUsd: 40 },
  { id: "k3", provider: "Perplexity", last4: "7aQ1", label: "Main", createdIso: "2026-10-15", lastUsedIso: "2026-11-09T03:16:05+05:00", status: "active" as const, spendUsd: 22.95, capUsd: null },
  { id: "k4", provider: "Google Gemini", last4: "Zt0p", label: "Old key", createdIso: "2026-08-20", lastUsedIso: "2026-10-27T03:02:11+05:00", status: "invalid" as const, spendUsd: 0, capUsd: null },
];

export const agencyClients = [
  { name: "Dera Biryani House", city: "Islamabad", x: 196, n: 594, xPrev: 152, nPrev: 588, significant: true, falseFacts: 3, openActions: 7, spendUsd: 23.1 },
  { name: "Northwind Dental", city: "Leeds, UK", x: 88, n: 480, xPrev: 91, nPrev: 480, significant: false, falseFacts: 0, openActions: 4, spendUsd: 18.75 },
  { name: "Cedar & Sage Café", city: "Austin, TX", x: 41, n: 360, xPrev: 63, nPrev: 360, significant: true, falseFacts: 1, openActions: 9, spendUsd: 14.2 },
  { name: "Margalla Physio Clinic", city: "Islamabad", x: 133, n: 420, xPrev: 120, nPrev: 418, significant: false, falseFacts: 2, openActions: 5, spendUsd: 16.6 },
  { name: "Brightline Ledger", city: "Remote (SaaS)", x: 302, n: 600, xPrev: 287, nPrev: 600, significant: false, falseFacts: 0, openActions: 3, spendUsd: 31.4 },
  { name: "Saffron Lane Weddings", city: "Lahore", x: 57, n: 300, xPrev: 34, nPrev: 300, significant: true, falseFacts: 1, openActions: 6, spendUsd: 11.9 },
];

/** AI crawler visits by bot and day (from uploaded server logs), 14 days. */
export const CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended"] as const;
export const crawlerHeatmap = CRAWLERS.map((bot, bi) => {
  const r = seeded(100 + bi);
  const base = [22, 0, 6, 0, 9, 14][bi]!; // OAI-SearchBot and PerplexityBot are blocked by robots.txt
  return { bot, days: Array.from({ length: 14 }, (_, d) => ({ day: d, visits: base === 0 ? 0 : Math.round(base * (0.4 + r() * 1.2) * (d % 7 === 5 ? 1.6 : 1)) })) };
});
