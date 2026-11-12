"use client";

import { ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { ChartLegend } from "@/components/charts/chart-legend";
import { FanoutList } from "@/components/charts/fanout-list";
import { LineCI } from "@/components/charts/line-ci";
import { SourceBars } from "@/components/charts/source-bars";
import { AnswerCard } from "@/components/ui/answer-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import { EngineLabel } from "@/components/ui/engine-label";
import { IntervalValue } from "@/components/ui/interval-value";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  answers,
  competitors,
  engineStats,
  fanoutTopics,
  modelChanges,
  questions,
  seeded,
  topSources,
  WEEKS,
  wilson,
  type Answer,
  type AnswerSegment,
  type Source,
} from "@/lib/mock";
import { ENGINE_ORDER, ENGINES, type EngineId } from "@/lib/palette";
import { cn } from "@/lib/cn";

const q = questions[0]!; // "best biryani in Islamabad": 12 mentions in 40 samples
const rate = wilson(q.x, q.n);
const ratePrev = wilson(q.xPrev, q.nPrev);

/** Mentions per engine this week; sums to q.x (12 of 40). */
const MENTIONED: Record<EngineId, number> = { chatgpt: 5, gemini: 3, perplexity: 3, claude: 1 };
const SAMPLES_PER_ENGINE = 10;

const SOURCES: Source[] = [
  { n: 1, title: "The 12 best biryani spots in Islamabad, ranked", domain: "foodiespk.com", url: "https://foodiespk.com/islamabad/best-biryani" },
  { n: 2, title: "Dera Biryani House: menu and reviews", domain: "derabiryani.pk", url: "https://derabiryani.pk/menu" },
  { n: 3, title: "Where Islamabad eats: biryani edition", domain: "tribune.com.pk", url: "https://tribune.com.pk/story/islamabad-biryani" },
];

const COMP = Object.fromEntries(competitors.map((c) => [c.id, c])) as Record<string, (typeof competitors)[number]>;
const comp = (id: string): AnswerSegment => ({ kind: "competitor", text: COMP[id]!.name, competitorId: id });

/** Deterministic synthetic samples in the same segment format as real answers (fictional businesses). */
function synthesize(engine: EngineId, index: number, mentioned: boolean): Answer {
  const r = seeded(engine.length * 97 + index * 13);
  const order = ["c_shahi", "c_degh", "c_karachi", "c_tandoor"].sort(() => r() - 0.5);
  const [a, b, c] = order as [string, string, string];
  const segments: AnswerSegment[] = mentioned
    ? [
        { kind: "text", text: "Islamabad's most recommended biryani spots are " },
        comp(a),
        { kind: "cite", n: 1 },
        { kind: "text", text: " and " },
        { kind: "brand", text: "Dera Biryani House" },
        { kind: "text", text: ", which is known for Sindhi-style biryani with aloo and dried plums" },
        { kind: "cite", n: 2 },
        { kind: "text", text: ". If you prefer a milder Lahori style, try " },
        comp(b),
        { kind: "cite", n: 3 },
        { kind: "text", text: "." },
      ]
    : [
        { kind: "text", text: "Popular choices for biryani in Islamabad include " },
        comp(a),
        { kind: "cite", n: 1 },
        { kind: "text", text: ", " },
        comp(b),
        { kind: "text", text: " and " },
        comp(c),
        { kind: "cite", n: 3 },
        { kind: "text", text: ". Most are in F-7 and Blue Area and offer delivery." },
      ];
  const minute = 10 + index * 2 + ENGINE_ORDER.indexOf(engine);
  return {
    id: `syn_${engine}_${index}`,
    questionId: q.id,
    engine,
    model: engineStats[engine].model,
    sampledAtIso: `2026-11-09T03:${String(minute).padStart(2, "0")}:${String(Math.floor(r() * 60)).padStart(2, "0")}+05:00`,
    sampleIndex: index,
    brandRank: mentioned ? 2 : null,
    sentiment: mentioned ? "positive" : null,
    segments,
    sources: mentioned ? SOURCES : [SOURCES[0]!, SOURCES[2]!],
    fanouts: ["best biryani Islamabad 2026", "biryani F-7 Islamabad"],
  };
}

/** All samples for one engine, real mock answers placed at their sample index. */
function samplesFor(engine: EngineId): Answer[] {
  const real = answers.filter((a) => a.engine === engine && a.questionId === q.id);
  // Spread the remaining mentions over free slots deterministically, so the per-engine total
  // equals MENTIONED[engine] whatever the real answers say.
  const need = MENTIONED[engine] - real.filter((a) => a.brandRank !== null).length;
  const free = Array.from({ length: SAMPLES_PER_ENGINE }, (_, i) => i)
    .filter((i) => !real.some((a) => a.sampleIndex === i))
    .sort((x, y) => ((x * 7) % SAMPLES_PER_ENGINE) - ((y * 7) % SAMPLES_PER_ENGINE));
  const mentionIdx = new Set(free.slice(0, need));
  return Array.from({ length: SAMPLES_PER_ENGINE }, (_, i) => {
    const r = real.find((a) => a.sampleIndex === i);
    return r ?? synthesize(engine, i, mentionIdx.has(i));
  });
}

const SAMPLES = Object.fromEntries(ENGINE_ORDER.map((e) => [e, samplesFor(e)])) as Record<EngineId, Answer[]>;

/** 12-week history for this prompt (n = 40 per week). */
const history = (() => {
  const r = seeded(7);
  return WEEKS.map((date, i) => {
    const p = Math.min(0.9, Math.max(0.05, 0.17 + i * 0.008 + (r() - 0.5) * 0.08 + (i >= 10 ? 0.05 : 0)));
    const x = Math.round(p * 40);
    const w = wilson(x, 40);
    return { date, p: w.p, lo: w.lo, hi: w.hi, n: 40 };
  });
})();

function SampleDots({ samples }: { samples: Answer[] }) {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {samples.map((s) => (
        <span
          key={s.id}
          className={cn("size-2.5 rounded-full border border-ink", s.brandRank !== null ? "bg-ink" : "bg-surface")}
        />
      ))}
    </span>
  );
}

export function PromptPreview() {
  return (
    <AppShell
      active="prompts"
      title={<>“{q.text}”</>}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-2">
          <Link href="/design/dashboard" className="inline-flex items-center gap-1 hover:text-ink">
            <ArrowLeft size={12} aria-hidden /> Prompts
          </Link>
          <span aria-hidden>·</span>
          <Badge tone="lime">{q.intent}</Badge>
          <span>en-PK · Islamabad · sampled weekly, {q.n} answers this week</span>
        </span>
      }
      actions={
        <Button variant="primary" kbd="R">
          <Play size={14} strokeWidth={1.75} aria-hidden /> Re-sample now
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[1fr_2fr]">
        <Panel title="Mention rate" description="Share of sampled answers that mention Dera Biryani House.">
          <div className="flex flex-wrap items-baseline gap-3">
            <IntervalValue p={rate.p} lo={rate.lo} hi={rate.hi} n={q.n} size="xl" bar />
            <Delta value={(rate.p - ratePrev.p) * 100} significant={q.significant} />
          </div>
          <p className="mt-2 text-small text-ink-3">
            We asked {ENGINE_ORDER.length} engines this question {q.n} times. You appeared{" "}
            <span className="font-mono tabular text-ink">{q.x}</span> times; {q.topCompetitor} appeared{" "}
            <span className="font-mono tabular text-ink">31</span>. Up from {q.xPrev} last week, but within sampling noise.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
            <div>
              <dt className="text-micro uppercase text-ink-3">Avg. rank when mentioned</dt>
              <dd className="font-mono text-h3 tabular">{q.rank?.toFixed(1) ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-micro uppercase text-ink-3">Top competitor</dt>
              <dd className="text-small font-medium">{q.topCompetitor}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="By engine" description="Each dot is one sampled answer: filled = mentions you." padded={false}>
          <ul className="divide-y divide-line">
            {ENGINE_ORDER.map((e) => {
              const w = wilson(MENTIONED[e], SAMPLES_PER_ENGINE);
              return (
                <li key={e} className="grid grid-cols-1 items-center gap-2 px-4 py-3 sm:grid-cols-[180px_1fr_auto]">
                  <EngineLabel engine={e} model={engineStats[e].model} />
                  <span className="flex items-center gap-3">
                    <SampleDots samples={SAMPLES[e]} />
                    <span className="font-mono text-small tabular text-ink-3">
                      {MENTIONED[e]}/{SAMPLES_PER_ENGINE}
                    </span>
                  </span>
                  <IntervalValue p={w.p} lo={w.lo} hi={w.hi} n={SAMPLES_PER_ENGINE} size="sm" />
                </li>
              );
            })}
          </ul>
          <p className="border-t border-line px-4 py-2 text-small text-ink-3">
            10 samples per engine gives wide intervals (±25 to ±30 points) by design: trust the 12-week trend more than any single week.
          </p>
        </Panel>
      </div>

      <section aria-labelledby="samples-h" className="mt-6">
        <h2 id="samples-h" className="mb-2 text-h4">
          All samples
        </h2>
        <Tabs defaultValue="chatgpt">
          <TabsList aria-label="Engine">
            {ENGINE_ORDER.map((e) => (
              <TabsTrigger key={e} value={e}>
                {ENGINES[e].label}{" "}
                <span className="ml-1 font-mono text-micro tabular text-ink-3">
                  {MENTIONED[e]}/{SAMPLES_PER_ENGINE}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {ENGINE_ORDER.map((e) => (
            <TabsContent key={e} value={e} className="mt-3">
              <div className="grid gap-3 lg:grid-cols-2">
                {SAMPLES[e].map((a) => (
                  <AnswerCard key={a.id} answer={a} competitors={competitors} compact />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <div className="mt-6 grid gap-3 xl:grid-cols-2">
        <Panel title="Cited sources" description="Domains cited in answers to this prompt.">
          <SourceBars rows={topSources.slice(0, 6)} showEngines />
        </Panel>
        <section id="fanouts">
          <Panel title="Fanout queries" description="Searches the engines ran before answering, and how often you appeared in the results they used.">
            <FanoutList rows={fanoutTopics} />
          </Panel>
        </section>
      </div>

      <div className="mt-3">
        <Panel title="History" description="Mention rate for this prompt, 12 weeks, 95% band (n = 40 per week).">
          <LineCI
            brand={history}
            brandLabel="Dera Biryani House"
            annotations={modelChanges.map((m) => ({ date: m.date, label: `${ENGINES[m.engine].label}: ${m.to}` }))}
            height={240}
            title="Mention rate history for this prompt"
          />
          <ChartLegend className="mt-3" items={[{ label: "Dera Biryani House", color: "brand" }]} />
        </Panel>
      </div>
    </AppShell>
  );
}

// Self-check: displayed samples must add up to the prompt's headline numbers.
if (process.env.NODE_ENV !== "production") {
  const total = ENGINE_ORDER.reduce((s, e) => s + SAMPLES[e].filter((a) => a.brandRank !== null).length, 0);
  console.assert(total === q.x, `prompt preview: ${total} mentions shown, expected ${q.x}`);
  for (const e of ENGINE_ORDER) {
    const m = SAMPLES[e].filter((a) => a.brandRank !== null).length;
    console.assert(m === MENTIONED[e], `prompt preview: ${e} shows ${m}, expected ${MENTIONED[e]}`);
  }
}
