"use client";

import { ArrowRight, CircleAlert, Download, Play } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { ChartLegend } from "@/components/charts/chart-legend";
import { EngineComparison } from "@/components/charts/engine-comparison";
import { LineCI } from "@/components/charts/line-ci";
import { RankTable } from "@/components/charts/rank-table";
import { SourceBars } from "@/components/charts/source-bars";
import { SovBars } from "@/components/charts/sov-bars";
import { AnswerCard } from "@/components/ui/answer-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import { EngineLabel } from "@/components/ui/engine-label";
import { IntervalValue } from "@/components/ui/interval-value";
import { MetricTile } from "@/components/ui/metric-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  actions,
  answers,
  brandSeries,
  competitors,
  engineSeries,
  engineStats,
  falseFacts,
  modelChanges,
  overview,
  project,
  questions,
  shareOfVoice,
  topSources,
  wilson,
} from "@/lib/mock";
import { ENGINE_ORDER, ENGINES } from "@/lib/palette";

const vis = wilson(overview.visibility.x, overview.visibility.n);
const visPrev = wilson(overview.visibilityPrev.x, overview.visibilityPrev.n);

/** Renders `children` or a skeleton of the same fixed height, so toggling never shifts layout. */
function Loadable({ loading, height, children }: { loading: boolean; height: number; children: ReactNode }) {
  return (
    <div style={{ minHeight: height }} className="flex flex-col">
      {loading ? <Skeleton className="w-full flex-1" /> : children}
    </div>
  );
}

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" }).format(new Date(iso));

const subscribeClock = (onTick: () => void) => {
  const t = setInterval(onTick, 1000);
  return () => clearInterval(t);
};
// Whole seconds, so repeated snapshot reads within one second return the same value.
const clockSnapshot = () => Math.floor(Date.now() / 1000) * 1000;

/** Live countdown. Server render (null snapshot) shows a stable placeholder, so hydration matches. */
function Countdown({ targetIso }: { targetIso: string }) {
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, () => null);
  if (now === null) return <span className="font-mono tabular">--d --h --m</span>;
  const ms = Math.max(0, new Date(targetIso).getTime() - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return (
    <span className="font-mono tabular" aria-live="off">
      {ms === 0 ? "running now" : `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`}
    </span>
  );
}

const IMPACT_TONE = { High: "lime", Medium: "neutral", Low: "muted" } as const;

export function DashboardPreview() {
  const [loading, setLoading] = useState(false);
  const ff = falseFacts[0]!;

  return (
    <AppShell
      active="overview"
      title="Overview"
      subtitle={`Week of 9 Nov 2026 · ${project.brand.category}, ${project.brand.city} · ${questions.length * 3} prompts tracked`}
      actions={
        <>
          <Switch label="Show skeletons" checked={loading} onCheckedChange={setLoading} />
          <Button variant="secondary" size="md">
            <Download size={14} strokeWidth={1.75} aria-hidden /> Export
          </Button>
          <Button variant="primary" size="md" kbd="R">
            <Play size={14} strokeWidth={1.75} aria-hidden /> Run check
          </Button>
        </>
      }
    >
      {/* headline row */}
      <section aria-label="Headline metrics" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="rounded-lg border border-line bg-surface p-5 md:col-span-2 xl:col-span-1">
          <p className="text-micro uppercase text-ink-3">AI visibility · all engines</p>
          {loading ? (
            <div className="mt-2 space-y-2" style={{ minHeight: 96 }}>
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : (
            <div style={{ minHeight: 96 }}>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <IntervalValue p={vis.p} lo={vis.lo} hi={vis.hi} n={overview.visibility.n} size="xl" bar />
                <Delta value={(vis.p - visPrev.p) * 100} significant={overview.significant} />
              </div>
              <p className="mt-2 text-small text-ink-3">
                Mentioned in <span className="font-mono tabular text-ink">{overview.visibility.x}</span> of{" "}
                <span className="font-mono tabular text-ink">{overview.visibility.n}</span> answers. A significant rise from{" "}
                <span className="font-mono tabular">{Math.round(visPrev.p * 100)}%</span> last week.
              </p>
            </div>
          )}
        </div>
        <MetricTile
          loading={loading}
          label="Average rank"
          value={<span className="font-mono tabular">{overview.averageRank.value.toFixed(1)}</span>}
          delta={<Delta value={overview.averageRank.prev - overview.averageRank.value} significant={false} unit="pts" size="sm" />}
          footnote="When mentioned. Lower is better."
        />
        <MetricTile
          loading={loading}
          label="Share of voice"
          value={<span className="font-mono tabular">{Math.round(overview.shareOfVoice.value * 100)}%</span>}
          delta={<Delta value={(overview.shareOfVoice.value - overview.shareOfVoice.prev) * 100} significant={false} size="sm" />}
          footnote="vs 4 tracked competitors"
        />
        <MetricTile
          loading={loading}
          label="Sentiment when mentioned"
          value={
            <span className="font-mono tabular">
              {Math.round(overview.sentiment.positive * 100)}
              <span className="text-ink-3">/{Math.round(overview.sentiment.neutral * 100)}/{Math.round(overview.sentiment.negative * 100)}</span>
            </span>
          }
          footnote="% positive / neutral / negative"
        />
        <MetricTile
          loading={loading}
          label="Next refresh"
          value={<Countdown targetIso={project.nextRefreshIso} />}
          footnote={<>Last run {fmtTime(project.lastRunIso)}</>}
        />
      </section>

      {/* false-facts alert */}
      <section id="facts" aria-label="False facts" className="mt-3">
        <div className="flex flex-col gap-3 rounded-lg border border-line border-l-2 border-l-down bg-surface p-4 md:flex-row md:items-center">
          <CircleAlert size={18} strokeWidth={1.75} className="shrink-0 text-down" aria-hidden />
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium">
                  {overview.falseFacts} false facts found this week. Most frequent: <q className="font-normal">{ff.claim}</q>
                </p>
                <p className="mt-0.5 text-small text-ink-3">
                  Truth: {ff.truth} Seen in <span className="font-mono tabular">{ff.seen}</span> of{" "}
                  <span className="font-mono tabular">{ff.of}</span> answers ·{" "}
                  {ff.engines.map((e) => ENGINES[e].label).join(", ")} · source: {ff.source}
                </p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/design/actions">
                  Fix it <ArrowRight size={14} aria-hidden />
                </Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* trend + engines */}
      <div className="mt-3 grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Panel
          title="Visibility over 12 weeks"
          description="Brand: thick line with its 95% confidence band. Engines: thin lines; faded when the week-on-week change isn't significant."
        >
          <Loadable loading={loading} height={320}>
            <LineCI
              brand={brandSeries}
              brandLabel={project.brand.name}
              series={ENGINE_ORDER.map((e) => ({
                id: e,
                label: ENGINES[e].label,
                color: ENGINES[e].color,
                points: engineSeries[e],
                significant: engineStats[e].significant,
              }))}
              annotations={modelChanges.map((m) => ({ date: m.date, label: `${ENGINES[m.engine].label}: ${m.to}` }))}
              height={280}
              title="Brand visibility by week with 95% confidence band, per engine"
            />
            <ChartLegend
              className="mt-3"
              items={[
                { label: project.brand.name, color: "brand" },
                ...ENGINE_ORDER.map((e) => ({ label: ENGINES[e].label, color: ENGINES[e].color, muted: !engineStats[e].significant })),
              ]}
            />
          </Loadable>
        </Panel>
        <Panel title="By engine" description="This week vs last, 95% intervals. Model in use shown per engine.">
          <Loadable loading={loading} height={320}>
            <EngineComparison
              rows={ENGINE_ORDER.map((e) => ({ engine: e, ...engineStats[e] }))}
            />
          </Loadable>
        </Panel>
      </div>

      {/* share of voice + sources */}
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <section id="competitors">
          <Panel title="Share of voice vs competitors" description="Share of all tracked mentions, last 6 weeks.">
            <Loadable loading={loading} height={260}>
              <SovBars
                rows={shareOfVoice}
                entities={[
                  { key: "brand", label: project.brand.name, color: "brand" },
                  ...competitors.map((c) => ({ key: c.id, label: c.name, color: c.color })),
                  { key: "others", label: "Others", color: "stone" as const },
                ]}
              />
            </Loadable>
          </Panel>
        </section>
        <section id="sources">
          <Panel
            title="Top cited sources"
            description="Domains AI engines cite for these prompts. Tagged when they never mention you."
            actions={<Badge tone="outline">{topSources.length} domains</Badge>}
          >
            <Loadable loading={loading} height={260}>
              <SourceBars rows={topSources.slice(0, 6)} showEngines />
            </Loadable>
          </Panel>
        </section>
      </div>

      {/* prompts */}
      <div className="mt-3">
        <Panel
          title="Prompts"
          description="Mention rate with 95% interval, average rank when mentioned, 8-week trend."
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/design/prompt">
                All prompts <ArrowRight size={14} aria-hidden />
              </Link>
            </Button>
          }
          padded={false}
        >
          <Loadable loading={loading} height={360}>
            <RankTable rows={questions} maxHeight="360px" />
          </Loadable>
        </Panel>
      </div>

      {/* answers + actions */}
      <div className="mt-3 grid gap-3 xl:grid-cols-[3fr_2fr]">
        <section id="perception" aria-labelledby="recent-answers" className="min-w-0">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="recent-answers" className="text-h4">Recent answers</h2>
            <p className="text-small text-ink-3">Your brand is highlighted; competitors underlined.</p>
          </div>
          <div className="space-y-3">
            {loading
              ? [0, 1].map((i) => <Skeleton key={i} className="h-56 w-full" />)
              : answers.slice(0, 3).map((a) => (
                  <AnswerCard
                    key={a.id}
                    answer={a}
                    question={questions.find((q) => q.id === a.questionId)?.text}
                    competitors={competitors}
                    compact
                  />
                ))}
          </div>
        </section>
        <aside className="min-w-0">
          <Panel
            title="Top actions"
            description="Ranked by expected impact and effort."
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/design/actions">
                  All {actions.length} <ArrowRight size={14} aria-hidden />
                </Link>
              </Button>
            }
            padded={false}
          >
            <ol className="divide-y divide-line">
              {actions.slice(0, 3).map((a, i) => (
                <li key={a.id} className="flex gap-3 px-4 py-3">
                  <span className="w-5 shrink-0 font-mono text-small tabular text-ink-3">{i + 1}</span>
                  <div className="min-w-0">
                    {loading ? (
                      <Skeleton className="h-10 w-64" />
                    ) : (
                      <>
                        <p className="text-small font-medium">{a.title}</p>
                        <p className="mt-0.5 text-small text-ink-3">{a.expectedLift}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge tone={IMPACT_TONE[a.impact]}>{a.impact} impact</Badge>
                          <Badge tone="outline">{a.effort} effort</Badge>
                          <Badge tone="muted">{a.kind === "owned" ? "Your site" : "Other sites"}</Badge>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <p className="mt-3 text-small text-ink-3">
            Models this week:{" "}
            {ENGINE_ORDER.map((e, i) => (
              <span key={e}>
                {i > 0 ? ", " : ""}
                <EngineLabel engine={e} model={engineStats[e].model} />
              </span>
            ))}
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
