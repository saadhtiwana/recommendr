"use client";

import { ArrowDown, ArrowRight, ArrowUp, Play } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { AnswerCard } from "@/components/ui/answer-card";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { IntervalValue } from "@/components/ui/interval-value";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import {
  actions,
  answers,
  brandSeries,
  competitorSeries,
  competitors,
  engineSeries,
  engineStats,
  falseFacts,
  overview,
  project,
  questions,
  shareOfVoice,
  topSources,
  wilson,
} from "@/lib/mock";
import { BG_CLASS, ENGINE_ORDER, ENGINES } from "@/lib/palette";
import { AreaTrend, EngineBars, Gauge, SegmentBar } from "./_charts";

const vis = wilson(overview.visibility.x, overview.visibility.n);
const visPrev = wilson(overview.visibilityPrev.x, overview.visibilityPrev.n);
const visDelta = (vis.p - visPrev.p) * 100;
const topCompetitor = competitors
  .map((c) => ({ c, p: competitorSeries[c.id]!.at(-1)!.p }))
  .sort((a, b) => b.p - a.p)[0]!;
// Mock series ends on its own sample; pin the last week to the headline numbers so chart and KPI agree.
const brandTrend = [...brandSeries.slice(0, -1), { ...brandSeries.at(-1)!, p: vis.p, lo: vis.lo, hi: vis.hi, n: overview.visibility.n }];
const ffSeen = falseFacts.reduce((s, f) => s + f.seen, 0);
const ffOf = falseFacts.reduce((s, f) => s + f.of, 0);

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
  if (now === null) return <>--d --h --m</>;
  const ms = Math.max(0, new Date(targetIso).getTime() - now);
  if (ms === 0) return <>running</>;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return (
    <>
      {d}d {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m
    </>
  );
}

type Tone = "up" | "down" | "flat";
const CHIP: Record<Tone, string> = { up: "bg-up-soft text-up", down: "bg-down-soft text-down", flat: "bg-fill text-ink-3" };

/** Soft change chip ("+7.1 pts"). Non-significant changes are always grey, whatever their sign. */
function Chip({ tone, children, label }: { tone: Tone; children: ReactNode; label?: string }) {
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center rounded-sm px-1.5 text-micro font-medium tracking-normal whitespace-nowrap tabular", CHIP[tone])} title={label}>
      {children}
      {label ? <span className="sr-only">, {label}</span> : null}
    </span>
  );
}

function TinyArrow({ tone, dir }: { tone: Tone; dir: "up" | "down" }) {
  const Icon = dir === "up" ? ArrowUp : ArrowDown;
  return (
    <span aria-hidden className={cn("inline-flex size-4 items-center justify-center rounded-full", CHIP[tone])}>
      <Icon size={10} strokeWidth={2.5} />
    </span>
  );
}

function Kpi({ label, chip, value, arrow, foot, wide }: { label: string; chip?: ReactNode; value: ReactNode; arrow?: ReactNode; foot: ReactNode; wide?: boolean }) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-lg bg-surface p-5 xl:col-span-1", wide ? "md:col-span-3" : "md:col-span-2")} aria-label={label}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="truncate text-body text-ink-3">{label}</h2>
        {chip}
      </div>
      <div className="mt-5 flex items-center gap-2">
        <p className="font-mono text-[1.75rem] leading-none tracking-[-0.03em] text-ink tabular">{value}</p>
        {arrow}
      </div>
      <p className="mt-3 text-small text-ink-2">{foot}</p>
    </section>
  );
}

const signed = (v: number, digits = 1) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(digits)}`;

const SOURCE_COLORS = ["bg-teal", "bg-sky", "bg-amber", "bg-rose", "bg-stone"];

export function DashboardPreview() {
  const [showEngines, setShowEngines] = useState(false);
  const sov = overview.shareOfVoice;
  const sovPrev = shareOfVoice.at(-2)!;
  const shownSources = topSources.slice(0, 5);
  const otherCitations = topSources.slice(5).reduce((s, t) => s + t.citations, 0);
  const totalCitations = topSources.reduce((s, t) => s + t.citations, 0);
  const citesYou = topSources.filter((s) => s.citesBrand).length;

  return (
    <AppShell
      active="overview"
      title="Overview"
      subtitle={`Week of 9 Nov 2026 · ${project.brand.category}, ${project.brand.city}`}
      actions={
        <Button variant="primary" size="md" kbd="R">
          <Play size={14} strokeWidth={1.75} aria-hidden /> Run check
        </Button>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-6 xl:grid-cols-5">
        <Kpi
          label="AI visibility"
          chip={<Chip tone="up" label="significant change">{signed(visDelta)} pts</Chip>}
          value={
            <>
              {Math.round(vis.p * 100)}%<span className="ml-1.5 text-[0.6em] text-ink-3">±{Math.round(vis.half * 100)}</span>
              <span className="sr-only">, 95% interval {Math.round(vis.lo * 100)} to {Math.round(vis.hi * 100)}%</span>
            </>
          }
          arrow={<TinyArrow tone="up" dir="up" />}
          foot={
            <>
              Mentioned in <span className="font-mono tabular text-ink">{overview.visibility.x}</span> of{" "}
              <span className="font-mono tabular text-ink">{overview.visibility.n}</span> answers
            </>
          }
        />
        <Kpi
          label="Average rank"
          chip={<Chip tone="flat" label="not significant">{signed(overview.averageRank.value - overview.averageRank.prev)}</Chip>}
          value={overview.averageRank.value.toFixed(1)}
          arrow={<TinyArrow tone="flat" dir="up" />}
          foot={<>When mentioned. Was {overview.averageRank.prev.toFixed(1)}</>}
        />
        <Kpi
          label="Share of voice"
          chip={<Chip tone="flat" label="not significant">{signed((sov.value - sov.prev) * 100, 0)} pts</Chip>}
          value={`${Math.round(sov.value * 100)}%`}
          arrow={<TinyArrow tone="flat" dir="up" />}
          foot={<>Of mentions vs {competitors.length} competitors</>}
        />
        <Kpi
          label="False facts"
          wide
          chip={<Chip tone="down">{falseFacts.filter((f) => f.severity === "high").length} high</Chip>}
          value={overview.falseFacts}
          foot={
            <>
              Seen in <span className="font-mono tabular text-ink">{ffSeen}</span> of <span className="font-mono tabular text-ink">{ffOf}</span> answers
            </>
          }
        />
        <Kpi
          label="Next refresh"
          wide
          chip={<Chip tone="flat">{project.cadence}</Chip>}
          value={<Countdown targetIso={project.nextRefreshIso} />}
          foot={<>Last run {fmtTime(project.lastRunIso)}</>}
        />
      </div>

      {/* trend + engines */}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-lg bg-surface p-5" aria-labelledby="vis-title">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <h2 id="vis-title" className="text-body text-ink-3">
                Visibility over time
              </h2>
              <p className="mt-6 max-w-[22rem] text-small text-ink-2">
                Up {visDelta.toFixed(1)} pts in a week, a significant rise. Shaded band is the 95% interval.
              </p>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <p className="flex items-center gap-1.5 text-small text-ink-2">
                  <span aria-hidden className="size-1.5 rounded-full bg-ink" /> You
                </p>
                <p className="mt-1.5 flex items-center gap-2">
                  <IntervalValue p={vis.p} lo={vis.lo} hi={vis.hi} n={overview.visibility.n} size="xl" />
                  <Chip tone="up" label="significant change">{signed(visDelta)} pts</Chip>
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-small text-ink-2">
                  <span aria-hidden className={cn("size-1.5 rounded-full", BG_CLASS[topCompetitor.c.color])} /> {topCompetitor.c.name}
                </p>
                <p className="mt-1.5 font-mono text-h1 leading-none text-ink tabular">{Math.round(topCompetitor.p * 100)}%</p>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <AreaTrend
              brand={brandTrend}
              height={248}
              lines={
                showEngines
                  ? ENGINE_ORDER.map((e) => ({ id: e, label: ENGINES[e].label, color: ENGINES[e].color, points: engineSeries[e], muted: !engineStats[e].significant }))
                  : []
              }
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-0.5 w-4 rounded-full bg-ink" /> You
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-4 rounded-xs bg-lime-soft ring-1 ring-line" /> 95% interval
              </span>
              {showEngines
                ? ENGINE_ORDER.map((e) => (
                    <span key={e} className={cn("inline-flex items-center gap-1.5", !engineStats[e].significant && "opacity-60")}>
                      <span aria-hidden className={cn("h-0.5 w-4 rounded-full", BG_CLASS[ENGINES[e].color])} /> {ENGINES[e].label}
                    </span>
                  ))
                : null}
            </div>
            <Switch label="Engines" checked={showEngines} onCheckedChange={setShowEngines} />
          </div>
        </section>

        <section className="flex min-w-0 flex-col rounded-lg bg-surface p-5" aria-labelledby="eng-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="eng-title" className="text-body text-ink-3">
                By engine
              </h2>
              <p className="mt-6 text-small text-ink-2">This week, with the 6 weeks before in grey.</p>
            </div>
            <div className="text-right">
              <p className="text-small text-ink-2">Changed significantly</p>
              <p className="mt-1.5 font-mono text-[2rem] leading-none tracking-[-0.03em] text-ink tabular">
                {ENGINE_ORDER.filter((e) => engineStats[e].significant).length}
                <span className="text-ink-3">/{ENGINE_ORDER.length}</span>
              </p>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <EngineBars
              rows={ENGINE_ORDER.map((e) => {
                const s = engineStats[e];
                const w = wilson(s.x, s.n);
                return {
                  id: e,
                  label: ENGINES[e].label,
                  color: ENGINES[e].color,
                  p: w.p,
                  lo: w.lo,
                  hi: w.hi,
                  n: s.n,
                  history: engineSeries[e].slice(-7, -1).map((pt) => pt.p),
                  significant: s.significant,
                };
              })}
            />
            <p className="mt-4 text-small text-ink-3">Faded: change since last week is within noise.</p>
          </div>
        </section>
      </div>

      {/* gauge + sources + facts */}
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,1.3fr)]">
        <section id="competitors" className="flex min-w-0 flex-col rounded-lg bg-surface p-5" aria-labelledby="sov-title">
          <h2 id="sov-title" className="text-body text-ink-3">
            Share of voice
          </h2>
          <div className="relative mx-auto mt-5 w-full max-w-[220px]">
            <Gauge value={sov.value} />
            <div className="absolute inset-x-0 bottom-1 text-center">
              <p className="font-mono text-[1.75rem] leading-none tracking-[-0.03em] tabular">{Math.round(sov.value * 100)}%</p>
              <p className="mt-1 text-small text-ink-3">of tracked mentions</p>
            </div>
          </div>
          <dl className="mt-auto divide-y divide-line border-t border-line pt-1 text-small">
            <div className="flex justify-between py-2">
              <dt className="text-ink-3">Last week</dt>
              <dd className="font-mono tabular">{Math.round(sovPrev.brand * 100)}%</dd>
            </div>
            <div className="flex justify-between gap-2 py-2">
              <dt className="truncate text-ink-3">{competitors[0]!.name}</dt>
              <dd className="font-mono tabular">{Math.round(shareOfVoice.at(-1)!.c_shahi * 100)}%</dd>
            </div>
          </dl>
        </section>

        <section id="sources" className="min-w-0 rounded-lg bg-surface p-5" aria-labelledby="src-title">
          <h2 id="src-title" className="text-body text-ink-3">
            Top cited sources
          </h2>
          <dl className="mt-5 grid grid-cols-3 gap-4 text-small">
            <div>
              <dt className="text-ink-3">Citations</dt>
              <dd className="mt-0.5 font-mono tabular">{totalCitations}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Domains</dt>
              <dd className="mt-0.5 font-mono tabular">{topSources.length}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Mention you</dt>
              <dd className="mt-0.5 font-mono tabular">
                {citesYou} of {topSources.length}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <SegmentBar
              parts={[
                ...shownSources.map((s, i) => ({ key: s.domain, value: s.citations, className: SOURCE_COLORS[i]! })),
                { key: "others", value: otherCitations, className: "bg-line-strong" },
              ]}
            />
          </div>
          <ul className="mt-5 grid gap-x-6 gap-y-2.5 text-small sm:grid-cols-2">
            {[...shownSources.map((s, i) => ({ ...s, dot: SOURCE_COLORS[i]! })), { domain: `${topSources.length - 5} others`, citations: otherCitations, citesBrand: true, dot: "bg-line-strong" }].map((s) => (
              <li key={s.domain} className="flex items-center gap-2">
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
                <span className="min-w-0 flex-1 truncate text-ink-2">
                  {s.domain}
                </span>
                <span className="font-mono tabular text-ink">{s.citations}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-3 text-small text-ink-3">
            {topSources.filter((s) => !s.citesBrand).map((s) => s.domain).join(" and ")} cite competitors but never mention you.
          </p>
        </section>

        <section id="facts" className="min-w-0 rounded-lg bg-surface p-5 md:col-span-2 xl:col-span-1" aria-labelledby="ff-title">
          <div className="flex items-start justify-between gap-2">
            <h2 id="ff-title" className="text-body text-ink-3">
              False facts
            </h2>
            <Link href="/design/actions" className="inline-flex items-center gap-1 rounded-sm text-small text-ink-2 hover:text-ink focus-visible:focus-ring">
              Fix <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {falseFacts.map((f) => (
              <li key={f.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <p className="min-w-0 flex-1 text-small text-ink">{f.claim}</p>
                  <Chip tone={f.severity === "high" ? "down" : "flat"}>
                    {f.seen}/{f.of}
                  </Chip>
                </div>
                <p className="mt-1 text-small text-ink-3">
                  {f.engines.map((e) => ENGINES[e].label).join(", ")} · truth: {f.truth}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* prompts table */}
      <div className="mt-3">
        <Panel
          title="Prompts"
          padded={false}
          actions={
            <Link href="/design/prompt" className="inline-flex items-center gap-1 rounded-sm text-small text-ink-2 hover:text-ink focus-visible:focus-ring">
              All {questions.length} prompts <ArrowRight size={14} aria-hidden />
            </Link>
          }
        >
          <div className="px-5 pt-3 pb-2">
            <table className="w-full min-w-[640px] text-small">
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="py-2 pr-4 font-normal">Prompt</th>
                  <th className="py-2 pr-4 font-normal">Mentioned</th>
                  <th className="py-2 pr-4 font-normal">Change</th>
                  <th className="py-2 pr-4 text-right font-normal whitespace-nowrap">Avg rank</th>
                  <th className="py-2 text-right font-normal whitespace-nowrap">Top competitor</th>
                </tr>
              </thead>
              <tbody>
                {questions.slice(0, 6).map((q) => {
                  const w = wilson(q.x, q.n);
                  const d = (w.p - wilson(q.xPrev, q.nPrev).p) * 100;
                  const tone: Tone = !q.significant || Math.abs(d) < 0.05 ? "flat" : d > 0 ? "up" : "down";
                  return (
                    <tr key={q.id} className="border-t border-dashed border-line-strong">
                      <td className="max-w-[22rem] py-3 pr-4">
                        <Link href="/design/prompt" className="block truncate text-ink hover:underline focus-visible:focus-ring">
                          {q.text}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <IntervalValue p={w.p} lo={w.lo} hi={w.hi} n={q.n} size="sm" />
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn("font-mono tabular", tone === "flat" ? "text-ink-3" : "text-ink")}>{signed(d)}</span>
                          <TinyArrow tone={tone} dir={d >= 0 ? "up" : "down"} />
                          {tone === "flat" ? <span className="text-micro tracking-normal text-ink-3">noise</span> : null}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono whitespace-nowrap tabular">{q.rank === null ? <span className="text-ink-3">not ranked</span> : q.rank.toFixed(1)}</td>
                      <td className="py-3 text-right whitespace-nowrap text-ink-2">{q.topCompetitor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* answers + actions */}
      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section id="perception" aria-labelledby="recent-answers" className="min-w-0 rounded-lg bg-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="recent-answers" className="text-body text-ink-3">
              Recent answers
            </h2>
            <p className="text-small text-ink-3">You are highlighted; competitors underlined.</p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {answers.slice(0, 2).map((a) => (
              <AnswerCard key={a.id} answer={a} question={questions.find((q) => q.id === a.questionId)?.text} competitors={competitors} compact />
            ))}
          </div>
        </section>
        <section className="min-w-0 rounded-lg bg-surface p-5" aria-labelledby="actions-title">
          <div className="flex items-start justify-between gap-2">
            <h2 id="actions-title" className="text-body text-ink-3">
              Top actions
            </h2>
            <Link href="/design/actions" className="inline-flex items-center gap-1 rounded-sm text-small text-ink-2 hover:text-ink focus-visible:focus-ring">
              All {actions.length} <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          <ol className="mt-3 divide-y divide-line">
            {actions.slice(0, 3).map((a, i) => (
              <li key={a.id} className="flex gap-3 py-3 last:pb-0">
                <span className="w-4 shrink-0 font-mono text-small tabular text-ink-3">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-small font-medium text-ink">{a.title}</p>
                  <p className="mt-0.5 text-small text-ink-3">{a.expectedLift}</p>
                  <p className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={cn("inline-flex h-5 items-center rounded-sm px-1.5 text-micro font-medium tracking-normal", a.impact === "High" ? "bg-lime text-lime-ink" : "bg-fill text-ink-2")}>
                      {a.impact} impact
                    </span>
                    <span className="inline-flex h-5 items-center rounded-sm bg-fill px-1.5 text-micro tracking-normal text-ink-2">{a.effort} effort</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
