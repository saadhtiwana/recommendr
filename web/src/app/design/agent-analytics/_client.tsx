"use client";

import { FileUp, CheckCircle2, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { CrawlerHeatmap } from "@/components/charts/crawler-heatmap";
import { LineCI, type LineSeries } from "@/components/charts/line-ci";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { DataTable, type Column } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { crawlerHeatmap, WEEKS, wilson, type SeriesPoint } from "@/lib/mock";

type RobotsRow = { bot: string; owner: string; purpose: string; allowed: boolean; rule: string; impact: string };
const ROBOTS: RobotsRow[] = [
  { bot: "GPTBot", owner: "OpenAI", purpose: "Model training", allowed: true, rule: "User-agent: * · Allow: /", impact: "Your pages can be used to train future models." },
  { bot: "OAI-SearchBot", owner: "OpenAI", purpose: "ChatGPT search results", allowed: false, rule: "User-agent: OAI-SearchBot · Disallow: /", impact: "ChatGPT can't cite derabiryani.pk in search answers; it cites listings about you instead." },
  { bot: "ChatGPT-User", owner: "OpenAI", purpose: "Fetches a page when a user asks", allowed: true, rule: "User-agent: * · Allow: /", impact: "Users can ask ChatGPT to read your menu page." },
  { bot: "PerplexityBot", owner: "Perplexity", purpose: "Perplexity search index", allowed: false, rule: "User-agent: PerplexityBot · Disallow: /", impact: "Perplexity never cites your site (0 of 150 answers this week)." },
  { bot: "ClaudeBot", owner: "Anthropic", purpose: "Model training and retrieval", allowed: true, rule: "User-agent: * · Allow: /", impact: "Your pages are crawlable by Anthropic." },
  { bot: "Google-Extended", owner: "Google", purpose: "Gemini training and grounding", allowed: true, rule: "User-agent: * · Allow: /", impact: "Gemini grounding can use your pages." },
];

const ROBOTS_FIX = `# derabiryani.pk/robots.txt — suggested by Recommendr
# Allow AI search crawlers so ChatGPT and Perplexity can cite your own pages.
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# Unchanged: keep private areas private for every crawler.
User-agent: *
Disallow: /admin/
Disallow: /checkout/
Allow: /

Sitemap: https://derabiryani.pk/sitemap.xml`;

const robotsColumns: Column<RobotsRow>[] = [
  { key: "bot", header: "Crawler", cell: (r) => <span className="font-mono">{r.bot}</span>, sortValue: (r) => r.bot, width: "10rem" },
  { key: "owner", header: "Owner", cell: (r) => r.owner, sortValue: (r) => r.owner },
  { key: "purpose", header: "Purpose", cell: (r) => <span className="text-ink-2">{r.purpose}</span> },
  {
    key: "status",
    header: "Status",
    sortValue: (r) => (r.allowed ? 1 : 0),
    cell: (r) =>
      r.allowed ? (
        <span className="inline-flex items-center gap-1.5 text-up">
          <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden /> Allowed
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-down">
          <XCircle size={14} strokeWidth={1.75} aria-hidden /> Blocked
        </span>
      ),
  },
  { key: "rule", header: "Matching rule", cell: (r) => <code className="whitespace-nowrap font-mono text-micro text-ink-2">{r.rule}</code> },
  { key: "impact", header: "What it means", cell: (r) => <span className="text-ink-2">{r.impact}</span>, width: "22rem" },
];

type PageRow = { path: string; bot: string; hits: number; last: string };
const PAGES: PageRow[] = [
  { path: "/menu", bot: "GPTBot", hits: 412, last: "12 Nov, 02:41" },
  { path: "/", bot: "Google-Extended", hits: 288, last: "12 Nov, 05:10" },
  { path: "/catering", bot: "ClaudeBot", hits: 131, last: "11 Nov, 22:03" },
  { path: "/locations/g-9-markaz", bot: "GPTBot", hits: 96, last: "11 Nov, 18:27" },
  { path: "/menu/sindhi-biryani", bot: "ChatGPT-User", hits: 57, last: "12 Nov, 09:55" },
  { path: "/catering/menu.pdf", bot: "ClaudeBot", hits: 22, last: "08 Nov, 13:40" },
];
const pageColumns: Column<PageRow>[] = [
  { key: "path", header: "Page", cell: (r) => <span className="font-mono text-small">{r.path}</span>, sortValue: (r) => r.path },
  { key: "bot", header: "Top crawler", cell: (r) => <span className="font-mono">{r.bot}</span>, sortValue: (r) => r.bot },
  { key: "hits", header: "Hits (14 d)", align: "right", cell: (r) => r.hits.toLocaleString("en-US"), sortValue: (r) => r.hits },
  { key: "last", header: "Last crawled", align: "right", cell: (r) => r.last },
];

// AI referral sessions over 8 weeks. Shown as share of all site sessions with a Wilson interval,
// so small weeks don't look more precise than they are.
const TOTAL_SESSIONS = [3100, 2980, 3240, 3305, 3190, 3420, 3510, 3660];
const REFERRALS: { id: string; label: string; color: LineSeries["color"]; sessions: number[] }[] = [
  { id: "chatgpt.com", label: "chatgpt.com", color: "teal", sessions: [41, 38, 52, 49, 57, 63, 88, 104] },
  { id: "gemini.google.com", label: "gemini.google.com", color: "sky", sessions: [12, 15, 11, 14, 18, 16, 19, 21] },
  { id: "perplexity.ai", label: "perplexity.ai", color: "amber", sessions: [9, 7, 10, 8, 11, 9, 10, 12] },
  { id: "claude.ai", label: "claude.ai", color: "rose", sessions: [3, 4, 2, 5, 4, 6, 5, 7] },
];
const weeks8 = WEEKS.slice(-8);
const toPoints = (s: number[]): SeriesPoint[] =>
  s.map((x, i) => {
    const n = TOTAL_SESSIONS[i]!;
    const w = wilson(x, n);
    return { date: weeks8[i]!, p: w.p, lo: w.lo, hi: w.hi, n };
  });
const allAi = toPoints(TOTAL_SESSIONS.map((_, i) => REFERRALS.reduce((sum, r) => sum + r.sessions[i]!, 0)));

type LandingRow = { page: string; source: string; sessions: number; orders: number };
const LANDING: LandingRow[] = [
  { page: "/menu/sindhi-biryani", source: "chatgpt.com", sessions: 61, orders: 14 },
  { page: "/", source: "chatgpt.com", sessions: 28, orders: 3 },
  { page: "/catering", source: "gemini.google.com", sessions: 11, orders: 2 },
  { page: "/locations/g-9-markaz", source: "perplexity.ai", sessions: 9, orders: 1 },
  { page: "/menu", source: "claude.ai", sessions: 6, orders: 0 },
];
const landingColumns: Column<LandingRow>[] = [
  { key: "page", header: "Landing page", cell: (r) => <span className="font-mono text-small">{r.page}</span> },
  { key: "source", header: "From", cell: (r) => r.source, sortValue: (r) => r.source },
  { key: "sessions", header: "Sessions (last wk)", align: "right", cell: (r) => r.sessions, sortValue: (r) => r.sessions },
  { key: "orders", header: "Online orders", align: "right", cell: (r) => r.orders, sortValue: (r) => r.orders },
];

function LogUpload() {
  const [state, setState] = useState<"empty" | "processed">("processed");
  const input = useRef<HTMLInputElement>(null);
  if (state === "processed") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-fill px-3 py-2.5 text-small">
        <FileUp size={16} strokeWidth={1.75} aria-hidden />
        <span className="font-mono">access.log</span>
        <span className="font-mono tabular text-ink-3">14 days · 1.2M lines · 3,412 AI crawler hits</span>
        <Badge tone="up">Processed</Badge>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setState("empty")}>
          Replace
        </Button>
      </div>
    );
  }
  return (
    <label
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") input.current?.click();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setState("processed");
      }}
      className="flex cursor-pointer flex-col items-start gap-1 rounded-md border border-dashed border-line-strong bg-surface px-4 py-6 hover:border-ink-3 focus-visible:focus-ring"
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <FileUp size={16} strokeWidth={1.75} aria-hidden /> Drop a server log, or choose a file
      </span>
      <span className="text-small text-ink-3">
        Nginx, Apache or Cloudflare logs, up to 500 MB. We keep only AI crawler lines; IP addresses are dropped on upload.
      </span>
      <input ref={input} type="file" className="sr-only" accept=".log,.gz,.txt" onChange={() => setState("processed")} />
    </label>
  );
}

export function AgentAnalyticsPreview() {
  const blocked = ROBOTS.filter((r) => !r.allowed).length;
  return (
    <AppShell
      active="agent-analytics"
      title="Agent analytics"
      subtitle="How AI crawlers and assistants reach derabiryani.pk. Robots audit run 12 Nov, 03:02."
      actions={<Button variant="primary">Re-run audit</Button>}
    >
      <div className="space-y-6">
        <Panel
          title="robots.txt for AI crawlers"
          description={`${blocked} of ${ROBOTS.length} AI crawlers are blocked. Two of them power AI search answers.`}
          padded={false}
        >
          <div className="overflow-x-auto">
            <DataTable columns={robotsColumns} rows={ROBOTS} getRowId={(r) => r.bot} initialSort={{ key: "status", dir: "asc" }} />
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Suggested fix" description="Allows the two blocked search crawlers; keeps your private paths blocked.">
            <CodeBlock code={ROBOTS_FIX} language="txt" filename="robots.txt" />
          </Panel>
          <Panel title="Server logs" description="Upload logs to see which AI crawlers actually visit, and what they read.">
            <div className="space-y-4">
              <LogUpload />
              <p className="text-small text-ink-2">
                OAI-SearchBot and PerplexityBot made no requests in 14 days, consistent with the robots.txt block. GPTBot crawls
                your menu daily; nothing crawled <span className="font-mono">/private-dining</span> because the page doesn&apos;t
                exist yet.
              </p>
            </div>
          </Panel>
        </div>

        <Panel title="Crawler activity" description="Requests per bot per day, 30 Oct – 12 Nov. Hatched rows are blocked by robots.txt.">
          <div className="overflow-x-auto">
            <CrawlerHeatmap rows={crawlerHeatmap} startIso="2026-10-30" blocked={["OAI-SearchBot", "PerplexityBot"]} />
          </div>
        </Panel>

        <Panel title="Top pages crawled" padded={false}>
          <div className="overflow-x-auto">
            <DataTable columns={pageColumns} rows={PAGES} getRowId={(r) => r.path} initialSort={{ key: "hits", dir: "desc" }} />
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Panel
            title="AI referral traffic"
            description="Share of all site sessions arriving from AI assistants, 8 weeks, with 95% intervals."
          >
            <LineCI
              brand={allAi}
              brandLabel="All AI"
              series={REFERRALS.map((r) => ({ id: r.id, label: r.label, color: r.color, points: toPoints(r.sessions), significant: r.id === "chatgpt.com" }))}
              height={260}
              title="AI referral sessions as share of all sessions"
            />
            <p className={cn("mt-3 text-small text-ink-3")}>
              chatgpt.com referrals rose from 1.3% to 2.8% of sessions (significant). The other assistants are flat within their
              intervals. Referrer data misses app traffic, so treat these as a floor.
            </p>
          </Panel>
          <Panel title="Where AI visitors land" padded={false}>
            <div className="overflow-x-auto">
              <DataTable columns={landingColumns} rows={LANDING} getRowId={(r) => r.page + r.source} initialSort={{ key: "sessions", dir: "desc" }} />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
