"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { EngineLogo } from "@/components/brand/engine-logo";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScoreRing } from "@/components/ui/score-ring";
import { answers, questions, wilson, type Answer } from "@/lib/mock";
import { ENGINE_ORDER, ENGINES, type EngineId } from "@/lib/palette";

const q = questions[0]!; // "best pizza in Brooklyn": 12 mentions in 40 answers
const rate = wilson(q.x, q.n);
const prev = Math.round((q.xPrev / q.nPrev) * 100);

/** Mentions per engine this week, 10 answers each; sums to q.x. */
const MENTIONED: Record<EngineId, number> = { chatgpt: 5, gemini: 3, perplexity: 3, claude: 1 };
const PER_ENGINE = 10;

/** Competitors named in the same 40 answers. */
const INSTEAD = [
  { name: "Fulton Ave Pizza", count: 31 },
  { name: "Prospect Pie Co.", count: 19 },
  { name: "Bleecker Street Slice", count: 16 },
];

const examples = answers.filter((a) => a.questionId === q.id).slice(0, 3);

function Example({ a }: { a: Answer }) {
  return (
    <article className="rounded-lg bg-surface p-5">
      <p className="mb-3 flex items-center gap-2 text-small font-medium text-ink">
        <EngineLogo engine={a.engine} size={16} />
        {ENGINES[a.engine].label}
        <span className="ml-auto font-normal text-ink-3">{a.brandRank ? `You're #${a.brandRank}` : "You're not named"}</span>
      </p>
      <p className="text-body leading-relaxed text-ink-2">
        {a.segments.map((s, i) =>
          s.kind === "brand" ? (
            <mark key={i} className="rounded-xs bg-lime px-0.5 font-medium text-lime-ink">
              {s.text}
            </mark>
          ) : s.kind === "cite" ? null : (
            <span key={i} className={s.kind === "competitor" ? "text-ink" : undefined}>
              {s.text}
            </span>
          ),
        )}
      </p>
    </article>
  );
}

export function PromptPreview() {
  return (
    <AppShell
      active="prompts"
      title={q.text}
      subtitle={
        <Link href="/design/dashboard" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} aria-hidden /> Prompts
        </Link>
      }
      actions={
        <Button variant="accent" asChild>
          <Link href="/design/agent">Ask the agent about this</Link>
        </Button>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[2fr_3fr]">
        <div className="grid gap-3">
          <Panel title="Mention rate">
            <div className="flex items-center gap-5">
              <ScoreRing value={rate.p} margin={rate.half} size={132} />
              <div>
                <p className="text-body font-semibold text-ink">of answers mention you</p>
                <p className="mt-1 text-small text-ink-3">Up from {prev}% last week</p>
              </div>
            </div>
          </Panel>
          <Panel title="Who AI names instead">
            <ul className="space-y-3">
              {INSTEAD.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-4 text-body">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={c.name} size={34} />
                    <span className="truncate font-semibold text-ink">{c.name}</span>
                  </span>
                  <span className="shrink-0 text-small tabular text-ink-3">
                    {c.count} of {q.n}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="By engine">
          <ul className="space-y-5">
            {ENGINE_ORDER.map((e) => (
              <li key={e} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-4 sm:grid-cols-[9rem_1fr_auto]">
                <span className="flex items-center gap-2.5 text-body font-semibold text-ink">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill">
                    <EngineLogo engine={e} size={18} />
                  </span>
                  {ENGINES[e].label}
                </span>
                <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-fill">
                  <span className="block h-full rounded-full bg-ink" style={{ width: `${(MENTIONED[e] / PER_ENGINE) * 100}%` }} />
                </span>
                <span className="text-small tabular text-ink-3">
                  {MENTIONED[e]} of {PER_ENGINE}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <section aria-labelledby="answers-h" className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="answers-h" className="text-h4 font-medium text-ink">
            Answers
          </h2>
          <Button variant="secondary" size="sm">
            Show all {q.n}
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {examples.map((a) => (
            <Example key={a.id} a={a} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

// Self-check: per-engine mentions must add up to the headline count.
if (process.env.NODE_ENV !== "production") {
  const total = ENGINE_ORDER.reduce((s, e) => s + MENTIONED[e], 0);
  console.assert(total === q.x, `prompt preview: engines sum to ${total}, expected ${q.x}`);
}
