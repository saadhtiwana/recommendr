"use client";

import { ChevronRight, CornerDownLeft, ShieldAlert, Wrench, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { AnswerCard } from "@/components/ui/answer-card";
import { ApprovalCard } from "@/components/ui/approval-card";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { IntervalValue } from "@/components/ui/interval-value";
import { Delta } from "@/components/ui/delta";
import { EngineLabel } from "@/components/ui/engine-label";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { answers, competitors, engineStats, wilson } from "@/lib/mock";

const byId = (id: string) => answers.find((a) => a.id === id)!;
const cgpt = engineStats.chatgpt;
const cgptNow = wilson(cgpt.x, cgpt.n);
const cgptPrev = wilson(cgpt.xPrev, cgpt.nPrev);
const sindhi = wilson(27, 40);
const sindhiPrev = wilson(14, 39);

/** Inline reference to an answer: opens the answer card in a sheet. */
function AnswerRef({ id }: { id: string }) {
  const a = byId(id);
  return (
    <Sheet>
      <SheetTrigger className="mx-0.5 inline-flex h-5 items-center gap-1 rounded-sm border border-line-strong bg-surface px-1.5 align-baseline font-mono text-micro tabular text-ink-2 hover:border-ink hover:text-ink focus-visible:focus-ring">
        {id}
      </SheetTrigger>
      <SheetContent title={`Answer ${id}`} description="The exact answer the agent cited.">
        <div className="p-5">
          <AnswerCard answer={a} competitors={competitors} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Inline reference to a metric: opens the metric with its interval and n. */
function MetricRef({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger className="mx-0.5 inline-flex h-5 items-center gap-1 rounded-sm border border-line-strong bg-fill px-1.5 align-baseline font-mono text-micro tabular text-ink-2 hover:border-ink hover:text-ink focus-visible:focus-ring">
        {id}
      </SheetTrigger>
      <SheetContent title={`Metric ${id}`} description="Computed from sampled answers; Wilson 95% interval.">
        <div className="space-y-4 p-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

type Step = { kind: "model" | "tool"; name: string; input?: string; output: string; tokens: string; cost: string };
const STEPS: Step[] = [
  { kind: "model", name: "plan", output: "Check ChatGPT mention rate trend, then the answers and sources behind the change.", tokens: "1,204 in · 88 out", cost: "$0.004" },
  { kind: "tool", name: "get_visibility", input: `{ "project": "prj_01", "engine": "chatgpt", "question": "q02", "periods": ["2026-W45", "2026-W44"] }`, output: "q02 on ChatGPT: 27/40 → 68% (95% CI 52–80) vs 14/39 → 36%; two-proportion test p = 0.004, significant after BH (q = 0.10).", tokens: "—", cost: "$0.000" },
  { kind: "tool", name: "list_answers", input: `{ "question": "q02", "engine": "chatgpt", "limit": 6, "since": "2026-11-02" }`, output: "6 answers; brand mentioned in 5; rank 1 in 4 of them. Returned ids incl. ans_44be, ans_7f3a.", tokens: "—", cost: "$0.000" },
  { kind: "tool", name: "list_sources", input: `{ "question": "q02", "since": "2026-11-02", "compare_to": "2026-10-26" }`, output: "New citation: tribune.com.pk 'Sindhi biryani in the capital' (first seen 2026-11-03, cited in 19 answers, mentions Dera in paragraph 2). Untrusted web content read.", tokens: "—", cost: "$0.000" },
  { kind: "model", name: "answer", output: "Grounded answer with 4 citations; validator: 4/4 numeric claims cited.", tokens: "3,912 in · 402 out", cost: "$0.026" },
];

function StepTrace() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-left text-small hover:bg-fill focus-visible:focus-ring"
      >
        <ChevronRight size={14} className={cn("transition-transform duration-[var(--duration-fast)]", open && "rotate-90")} aria-hidden />
        <span className="font-medium">Trace</span>
        <span className="font-mono tabular text-ink-3">5 of 12 steps</span>
        <span className="font-mono tabular text-ink-3">$0.03 of $0.25 cap</span>
        <span className="font-mono tabular text-ink-3">5,606 tokens</span>
        <span className="ml-auto text-ink-3">Replayable · run ar_3c91</span>
      </button>
      {open ? (
        <ol className="divide-y divide-line border-t border-line">
          {STEPS.map((s, i) => (
            <li key={i} className="grid gap-2 px-3 py-3 sm:grid-cols-[2rem_1fr]">
              <span className="font-mono text-small tabular text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-small">
                  {s.kind === "tool" ? <Wrench size={14} strokeWidth={1.75} aria-hidden /> : <Sparkles size={14} strokeWidth={1.75} aria-hidden />}
                  <span className="font-mono">{s.kind === "tool" ? s.name : `model · ${s.name}`}</span>
                  <span className="ml-auto font-mono tabular text-ink-3">{s.tokens} · {s.cost}</span>
                </div>
                {s.input ? <pre className="overflow-x-auto rounded-sm bg-fill px-2 py-1.5 font-mono text-micro text-ink-2">{s.input}</pre> : null}
                <p className="text-small text-ink-2">{s.output}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "agent"; children: ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[46rem] rounded-lg text-body",
          role === "user" ? "bg-fill px-4 py-3 text-ink" : "w-full space-y-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "Which sources cite Shahi Handi but not us?",
  "What does Claude get wrong about us?",
  "Draft the fix for the private dining false fact",
];

export function AgentPreview() {
  const [approval, setApproval] = useState<"pending" | "approved" | "denied">("pending");
  const [draft, setDraft] = useState("");

  return (
    <AppShell active="agent" title="Agent" subtitle="Answers cite your data. Spending and publishing always wait for your approval.">
      <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
        <section aria-label="Conversation" className="min-w-0 space-y-6">
          <Bubble role="user">Why did ChatGPT start mentioning us more for Sindhi biryani?</Bubble>

          <Bubble role="agent">
            <StepTrace />
            <div className="space-y-3 leading-relaxed text-ink">
              <p>
                It&apos;s a real change, not sampling noise. For <q>where to get authentic Sindhi biryani in Islamabad</q>, ChatGPT
                mentioned you in 27 of 40 answers this week, up from 14 of 39
                <MetricRef id="m:q02.chatgpt.rate">
                  <EngineLabel engine="chatgpt" model={cgpt.model} />
                  <div className="flex items-end gap-6">
                    <div>
                      <p className="text-micro uppercase text-ink-3">This week</p>
                      <IntervalValue p={sindhi.p} lo={sindhi.lo} hi={sindhi.hi} n={40} size="lg" bar />
                    </div>
                    <div>
                      <p className="text-micro uppercase text-ink-3">Last week</p>
                      <IntervalValue p={sindhiPrev.p} lo={sindhiPrev.lo} hi={sindhiPrev.hi} n={39} size="lg" bar />
                    </div>
                  </div>
                  <Delta value={Math.round((sindhi.p - sindhiPrev.p) * 1000) / 10} significant />
                  <p className="text-small text-ink-3">Two-proportion test p = 0.004; significant after Benjamini-Hochberg at q = 0.10.</p>
                </MetricRef>
                . Across all your questions, ChatGPT&apos;s overall rate moved from {Math.round(cgptPrev.p * 100)}% to{" "}
                {Math.round(cgptNow.p * 100)}% ±{Math.round(cgptNow.half * 100)}
                <MetricRef id="m:chatgpt.rate">
                  <EngineLabel engine="chatgpt" model={cgpt.model} />
                  <IntervalValue p={cgptNow.p} lo={cgptNow.lo} hi={cgptNow.hi} n={cgpt.n} size="xl" bar />
                  <Delta value={Math.round((cgptNow.p - cgptPrev.p) * 1000) / 10} significant={cgpt.significant} />
                  <p className="text-small text-ink-3">n = {cgpt.n} answers this week, {cgpt.nPrev} last week.</p>
                </MetricRef>
                .
              </p>
              <p>
                The most likely cause is a new source. Since 3 November, ChatGPT cites a Tribune piece, <q>Sindhi biryani in the
                capital</q>, which names you in its second paragraph. It appears in 19 of the answers that mention you, for example
                <AnswerRef id="ans_44be" /> and <AnswerRef id="ans_7f3a" />.
              </p>
              <p className="text-ink-2">
                A caveat: ChatGPT also switched from gpt-5-search to gpt-5.1-search the same week, so part of the change may come from
                the model. I can&apos;t separate the two from this data alone.
              </p>
            </div>
            <p className="flex items-start gap-2 rounded-md border border-line bg-fill px-3 py-2 text-small text-ink-2">
              <ShieldAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
              This run read web content. Spend and publish actions need your approval, and nothing in that content can trigger them.
            </p>
          </Bubble>

          <Bubble role="user">Can we confirm it&apos;s the source and not the model?</Bubble>

          <Bubble role="agent">
            <p className="leading-relaxed">
              One way: re-sample q02 on ChatGPT now, pinned to gpt-5.1-search, and compare answers that cite the Tribune article with
              those that don&apos;t. That needs a fresh check on your OpenAI key.
            </p>
            <ApprovalCard
              action="spend"
              title="Run a check: 1 prompt × ChatGPT × 20 samples"
              description="start_check will sample q02 on ChatGPT (gpt-5.1-search) with web search, using your OpenAI key ••••Q8xD."
              estimate={{ costUsd: 0.24, calls: 20 }}
              details={
                <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-small">
                  <dt className="text-ink-3">Prompt</dt>
                  <dd>where to get authentic Sindhi biryani in Islamabad</dd>
                  <dt className="text-ink-3">Key budget</dt>
                  <dd className="font-mono tabular">$41.27 of $60.00 used this month</dd>
                  <dt className="text-ink-3">Requested by</dt>
                  <dd>You, in this conversation</dd>
                </dl>
              }
              state={approval}
              onApprove={() => setApproval("approved")}
              onDeny={() => setApproval("denied")}
            />
          </Bubble>

          <form
            className="sticky bottom-0 rounded-lg border border-line-strong bg-surface p-3 focus-within:border-ink"
            onSubmit={(e) => {
              e.preventDefault();
              setDraft("");
            }}
          >
            <label htmlFor="agent-input" className="sr-only">
              Ask about your data
            </label>
            <Textarea
              id="agent-input"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about your visibility, competitors, sources or fixes…"
              className="resize-none border-0 p-0 shadow-none focus-visible:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3 text-micro text-ink-3">
              <span className="inline-flex items-center gap-1">
                <Kbd>
                  <CornerDownLeft size={10} aria-hidden />
                </Kbd>
                send
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>⇧</Kbd>
                <Kbd>
                  <CornerDownLeft size={10} aria-hidden />
                </Kbd>
                new line
              </span>
              <span className="font-mono tabular">Cap $0.25 per run</span>
              <Button type="submit" variant="primary" size="sm" className="ml-auto">
                Send
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <Panel title="Try asking">
            <ul className="space-y-1">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setDraft(s)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-small text-ink-2 hover:bg-fill hover:text-ink focus-visible:focus-ring"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="This conversation">
            <dl className="grid grid-cols-2 gap-y-2 text-small">
              <dt className="text-ink-3">Runs</dt>
              <dd className="text-right font-mono tabular">2</dd>
              <dt className="text-ink-3">Cost</dt>
              <dd className="text-right font-mono tabular">$0.05</dd>
              <dt className="text-ink-3">Charged to</dt>
              <dd className="text-right">OpenAI ••••Q8xD</dd>
              <dt className="text-ink-3">Uncited claims</dt>
              <dd className="text-right font-mono tabular">0 rejected</dd>
            </dl>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
