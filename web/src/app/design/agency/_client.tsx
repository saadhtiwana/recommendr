"use client";

import { Download } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { LineCI } from "@/components/charts/line-ci";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import { IntervalValue } from "@/components/ui/interval-value";
import { MetricTile } from "@/components/ui/metric-tile";
import { Sparkline } from "@/components/ui/sparkline";
import { DataTable, type Column } from "@/components/ui/table";
import { actions, agencyClients, brandSeries, engineSeries, modelChanges, seeded, wilson } from "@/lib/mock";
import { ENGINES } from "@/lib/palette";

type Client = (typeof agencyClients)[number];
const pts = (c: Client) => {
  const now = wilson(c.x, c.n);
  const prev = wilson(c.xPrev, c.nPrev);
  return { now, delta: Math.round((now.p - prev.p) * 1000) / 10 };
};
// deterministic 8-week history ending at this week's rate
const history = (c: Client, i: number) => {
  const r = seeded(200 + i);
  const end = c.x / c.n;
  const start = c.xPrev / c.nPrev;
  return Array.from({ length: 8 }, (_, k) => Math.max(0, start + ((end - start) * k) / 7 + (r() - 0.5) * 0.03));
};

const columns: Column<Client>[] = [
  {
    key: "client",
    header: "Client",
    sortValue: (c) => c.name,
    cell: (c) => (
      <span className="flex flex-col">
        <span className="font-medium">{c.name}</span>
        <span className="text-micro text-ink-3">{c.city}</span>
      </span>
    ),
  },
  {
    key: "vis",
    header: "Visibility",
    align: "right",
    sortValue: (c) => c.x / c.n,
    cell: (c) => {
      const { now } = pts(c);
      return <IntervalValue p={now.p} lo={now.lo} hi={now.hi} n={c.n} size="sm" />;
    },
  },
  { key: "delta", header: "vs last week", align: "right", sortValue: (c) => pts(c).delta, cell: (c) => <Delta value={pts(c).delta} significant={c.significant} size="sm" /> },
  {
    key: "trend",
    header: "8 weeks",
    cell: (c) => <Sparkline values={history(c, agencyClients.indexOf(c))} domain={[0, 0.6]} dot label={`${c.name} visibility, 8 weeks`} />,
  },
  { key: "facts", header: "False facts", align: "right", sortValue: (c) => c.falseFacts, cell: (c) => <span className={c.falseFacts ? "text-down" : "text-ink-3"}>{c.falseFacts}</span> },
  { key: "actions", header: "Open actions", align: "right", sortValue: (c) => c.openActions, cell: (c) => c.openActions },
  { key: "spend", header: "Spend (Nov)", align: "right", sortValue: (c) => c.spendUsd, cell: (c) => `$${c.spendUsd.toFixed(2)}` },
];

const dera = agencyClients[0]!;
const deraNow = wilson(dera.x, dera.n);
const cgpt = wilson(71, 150);
const cgptPrev = wilson(48, 147);

function Report() {
  return (
    <article
      id="report"
      aria-label="White-label weekly report preview"
      className="mx-auto max-w-3xl rounded-lg border border-line bg-surface px-6 py-8 sm:px-12 sm:py-12"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        {/* white-label: the agency's name replaces ours */}
        <p className="font-serif text-h3 tracking-tight">Northstar Digital</p>
        <p className="text-right text-small text-ink-3">
          Weekly AI visibility report
          <br />
          <span className="font-mono tabular">Week 45 · 3–9 Nov 2026</span>
        </p>
      </header>

      <h2 className="mt-8 font-serif text-h1">Dera Biryani House</h2>
      <p className="mt-2 text-ink-2">
        Across ChatGPT, Gemini, Perplexity and Claude, Dera appeared in 196 of 594 answers this week, up from 152 of 588.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 border-y border-line py-6 sm:grid-cols-3">
        <div>
          <p className="text-micro uppercase text-ink-3">Mentioned in</p>
          <IntervalValue p={deraNow.p} lo={deraNow.lo} hi={deraNow.hi} n={dera.n} size="xl" />
          <Delta value={pts(dera).delta} significant className="mt-2" />
        </div>
        <div>
          <p className="text-micro uppercase text-ink-3">Share of voice</p>
          <p className="font-mono text-h1 tabular">21%</p>
          <p className="mt-2 text-small text-ink-3">vs 17% last week · not tested</p>
        </div>
        <div>
          <p className="text-micro uppercase text-ink-3">Average rank when mentioned</p>
          <p className="font-mono text-h1 tabular">2.8</p>
          <p className="mt-2 text-small text-ink-3">was 3.4</p>
        </div>
      </div>

      <section className="mt-8">
        <h3 className="text-h4 font-semibold">What changed</h3>
        <p className="mt-1 text-small text-ink-3">Only changes that are statistically significant (Benjamini-Hochberg, q = 0.10, at least 10 points).</p>
        <ul className="mt-3 space-y-3">
          <li className="flex flex-wrap items-baseline gap-x-3">
            <Delta value={Math.round((cgpt.p - cgptPrev.p) * 1000) / 10} significant />
            <span>
              ChatGPT now mentions Dera in {Math.round(cgpt.p * 100)}% of answers, up from {Math.round(cgptPrev.p * 100)}%. A new Tribune
              article on Sindhi biryani is cited in most of them. ChatGPT also changed model this week (gpt-5.1-search).
            </span>
          </li>
          <li className="flex flex-wrap items-baseline gap-x-3">
            <Delta value={34.8} significant />
            <span>&ldquo;Sindhi biryani in Islamabad&rdquo;: mentioned in 27 of 40 answers, up from 14 of 39.</span>
          </li>
        </ul>
        <p className="mt-3 text-small text-ink-3">Gemini, Perplexity and Claude moved within their margins of error.</p>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-h4 font-semibold">12-week trend</h3>
        <LineCI
          brand={brandSeries}
          brandLabel="Dera"
          series={(["chatgpt", "perplexity"] as const).map((e) => ({ id: e, label: ENGINES[e].label, color: ENGINES[e].color, points: engineSeries[e], significant: e === "chatgpt" }))}
          annotations={modelChanges.map((m) => ({ date: m.date, label: `${ENGINES[m.engine].label} → ${m.to}` }))}
          height={220}
          title="Dera Biryani House visibility, 12 weeks"
        />
      </section>

      <section className="mt-8">
        <h3 className="text-h4 font-semibold">Recommended next</h3>
        <ol className="mt-3 space-y-3">
          {actions.slice(0, 3).map((a, i) => (
            <li key={a.id} className="grid grid-cols-[1.5rem_1fr] gap-x-2">
              <span className="font-mono tabular text-ink-3">{i + 1}.</span>
              <span>
                <span className="font-medium">{a.title}</span>
                <span className="block text-small text-ink-3">
                  Impact {a.impact.toLowerCase()} · effort {a.effort.toLowerCase()} · expected {a.expectedLift}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-micro text-ink-3">
        <span>Prepared by Northstar Digital</span>
        <span className="font-mono tabular">594 answers sampled · 95% intervals</span>
      </footer>
    </article>
  );
}

export function AgencyPreview() {
  const totalSpend = agencyClients.reduce((s, c) => s + c.spendUsd, 0);
  const sig = agencyClients.filter((c) => c.significant);
  const facts = agencyClients.reduce((s, c) => s + c.falseFacts, 0);
  return (
    <AppShell
      active="reports"
      title="All clients"
      subtitle="Northstar Digital · 6 clients · week 45"
      actions={
        <Button variant="secondary">
          <Download size={14} strokeWidth={1.75} aria-hidden /> Download PDF
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricTile label="Clients" value={<span className="font-mono tabular">{agencyClients.length}</span>} />
          <MetricTile
            label="Significant changes"
            value={<span className="font-mono tabular">{sig.length}</span>}
            footnote={`${sig.filter((c) => c.x / c.n > c.xPrev / c.nPrev).length} up, ${sig.filter((c) => c.x / c.n < c.xPrev / c.nPrev).length} down`}
          />
          <MetricTile label="Open false facts" value={<span className="font-mono tabular">{facts}</span>} footnote="across 4 clients" />
          <MetricTile label="Spend this month" value={<span className="font-mono tabular">${totalSpend.toFixed(2)}</span>} footnote="on clients' own keys" />
        </div>

        <Panel title="Client overview" description="Sorted by change. Muted deltas are within the margin of error." padded={false}>
          <div className="overflow-x-auto">
            <DataTable columns={columns} rows={agencyClients} getRowId={(c) => c.name} initialSort={{ key: "delta", dir: "desc" }} />
          </div>
        </Panel>

        <section aria-labelledby="report-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="report-heading" className="font-serif text-h2">
                Report preview
              </h2>
              <p className="text-small text-ink-3">White-label: your agency&apos;s name, no Recommendr branding. Sent Mondays at 09:00.</p>
            </div>
            <Button variant="secondary">
              <Download size={14} strokeWidth={1.75} aria-hidden /> Download PDF
            </Button>
          </div>
          <Report />
        </section>
      </div>
    </AppShell>
  );
}
