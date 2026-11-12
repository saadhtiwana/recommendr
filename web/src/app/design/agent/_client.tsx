"use client";

import { ArrowUp, ChevronRight, CornerUpLeft, ShieldAlert, Sparkles, Square, SquarePen, Wrench } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppShell, NavItem } from "@/components/app/app-shell";
import { AnswerCard } from "@/components/ui/answer-card";
import { ApprovalCard } from "@/components/ui/approval-card";
import { Delta } from "@/components/ui/delta";
import { EngineLabel } from "@/components/ui/engine-label";
import { IntervalValue } from "@/components/ui/interval-value";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { answers, competitors, engineStats, wilson } from "@/lib/mock";
import { BG_CLASS, ENGINES } from "@/lib/palette";

const byId = (id: string) => answers.find((a) => a.id === id)!;
const cgpt = engineStats.chatgpt;
const cgptNow = wilson(cgpt.x, cgpt.n);
const cgptPrev = wilson(cgpt.xPrev, cgpt.nPrev);
const late = wilson(6, 36);
const latePrev = wilson(9, 36);

const CHIP =
  "mx-0.5 inline-flex h-6 items-center gap-1.5 rounded-full bg-fill px-2 align-[1px] font-mono text-micro tracking-normal tabular text-ink-2 transition-colors duration-[var(--duration-fast)] hover:bg-line hover:text-ink focus-visible:focus-ring";

/** Inline citation to an answer: opens the exact answer the agent used. */
function AnswerRef({ id }: { id: string }) {
  const a = byId(id);
  return (
    <Sheet>
      <SheetTrigger className={CHIP}>
        <span aria-hidden className={cn("size-1.5 rounded-full", BG_CLASS[ENGINES[a.engine].color])} />
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

/** Inline citation to a metric: the value with its interval and n. */
function MetricRef({ label, title, children }: { label: ReactNode; title: string; children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger className={CHIP}>{label}</SheetTrigger>
      <SheetContent title={title} description="Computed from sampled answers; Wilson 95% interval.">
        <div className="space-y-4 p-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

type Step = { kind: "model" | "tool"; name: string; input?: string; output: string; cost: string };
const STEPS: Step[] = [
  { kind: "model", name: "plan", output: "Check ChatGPT's overall mention rate, then the prompts and answers behind any drop.", cost: "$0.004" },
  { kind: "tool", name: "get_visibility", input: `{ "engine": "chatgpt", "periods": ["2026-W45", "2026-W44"] }`, output: "71/150 → 47% (95% CI 39–55) vs 48/147 → 33%; p = 0.01, significant after BH (q = 0.10).", cost: "$0.000" },
  { kind: "tool", name: "get_visibility", input: `{ "engine": "chatgpt", "by": "question", "periods": ["2026-W45", "2026-W44"] }`, output: "1 of 10 prompts went down: q03 6/36 vs 9/36, p = 0.38, not significant.", cost: "$0.000" },
  { kind: "tool", name: "list_answers", input: `{ "question": "q03", "engine": "chatgpt", "limit": 6 }`, output: "6 answers; brand mentioned in 1. Returned ids incl. ans_7f3a, ans_44be.", cost: "$0.000" },
  { kind: "model", name: "answer", output: "Grounded answer with 4 citations; validator: 4/4 numeric claims cited.", cost: "$0.026" },
];

function StepTrace() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-4 py-3 text-left text-small hover:bg-fill/60 focus-visible:focus-ring"
      >
        <ChevronRight size={14} className={cn("text-ink-3 transition-transform duration-[var(--duration-fast)]", open && "rotate-90")} aria-hidden />
        <span className="font-medium text-ink">Ran {STEPS.length} steps</span>
        <span className="text-ink-3">get_visibility, list_answers</span>
        <span className="ml-auto font-mono tabular text-ink-3">$0.03 of $0.25 cap</span>
      </button>
      {open ? (
        <ol className="border-t border-line px-4 py-2">
          {STEPS.map((s, i) => (
            <li key={i} className="relative flex gap-3 py-2.5">
              <span aria-hidden className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2">
                {s.kind === "tool" ? <Wrench size={11} strokeWidth={1.75} /> : <Sparkles size={11} strokeWidth={1.75} />}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-small">
                  <span className="font-mono text-ink">{s.kind === "tool" ? s.name : `model · ${s.name}`}</span>
                  <span className="ml-auto font-mono text-micro tracking-normal tabular text-ink-3">{s.cost}</span>
                </div>
                {s.input ? <pre className="overflow-x-auto rounded-md bg-fill px-2.5 py-1.5 font-mono text-micro tracking-normal text-ink-2">{s.input}</pre> : null}
                <p className="text-small text-ink-2">{s.output}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function AgentAvatar() {
  return (
    <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-surface text-ink ring-1 ring-line-strong">
      <Sparkles size={14} strokeWidth={1.75} />
    </span>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-2.5" role="status">
      <AgentAvatar />
      <span className="text-small text-ink-2">Thinking</span>
      <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-ink-3" />
    </div>
  );
}

function AgentAnswer({ approval, setApproval }: { approval: "pending" | "approved" | "denied"; setApproval: (s: "approved" | "denied") => void }) {
  return (
    <div className="flex animate-fade-in gap-3">
      <span className="hidden sm:block">
        <AgentAvatar />
      </span>
      <div className="min-w-0 flex-1 space-y-4">
        <StepTrace />
        <div className="space-y-3 text-body leading-[1.7] text-ink">
          <p>
            It didn&apos;t. ChatGPT mentions you more often this week, not less: in 71 of 150 answers, up from 48 of 147
            <MetricRef
              title="ChatGPT mention rate"
              label={
                <>
                  <span aria-hidden className="size-1.5 rounded-full bg-teal" />
                  ChatGPT {Math.round(cgptNow.p * 100)}% ±{Math.round(cgptNow.half * 100)}, n={cgpt.n}
                </>
              }
            >
              <EngineLabel engine="chatgpt" model={cgpt.model} />
              <IntervalValue p={cgptNow.p} lo={cgptNow.lo} hi={cgptNow.hi} n={cgpt.n} size="xl" bar />
              <Delta value={Math.round((cgptNow.p - cgptPrev.p) * 1000) / 10} significant={cgpt.significant} />
              <p className="text-small text-ink-3">
                n = {cgpt.n} answers this week, {cgpt.nPrev} last week.
              </p>
            </MetricRef>
            . That rise is significant.
          </p>
          <p>
            One prompt did drop: <q>biryani delivery F-7 Islamabad late night</q> went from 9 to 6 of 36 answers
            <MetricRef title="q03 on ChatGPT" label={<>q03 {Math.round(late.p * 100)}% ±{Math.round(late.half * 100)}, n=36</>}>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-small text-ink-3">This week</p>
                  <IntervalValue p={late.p} lo={late.lo} hi={late.hi} n={36} size="lg" bar />
                </div>
                <div>
                  <p className="text-small text-ink-3">Last week</p>
                  <IntervalValue p={latePrev.p} lo={latePrev.lo} hi={latePrev.hi} n={36} size="lg" bar />
                </div>
              </div>
              <Delta value={Math.round((late.p - latePrev.p) * 1000) / 10} significant={false} />
              <p className="text-small text-ink-3">Two-proportion test p = 0.38: within sampling noise.</p>
            </MetricRef>
            . With samples this small that is within noise. In the answers that leave you out, ChatGPT recommends Lahori Degh for being open until 2 am, for
            example <AnswerRef id="ans_7f3a" />. Where you are named, it is for Sindhi-style biryani, as in <AnswerRef id="ans_44be" />.
          </p>
          <p className="text-ink-2">
            To tell whether the late-night drop is real, I can re-sample that prompt 20 more times. That uses your OpenAI key.
          </p>
        </div>
        <ApprovalCard
          action="spend"
          title="start_check: 1 prompt × ChatGPT × 20 samples"
          description="Samples q03 on ChatGPT (gpt-5.1-search) with web search, using your OpenAI key ••••Q8xD."
          estimate={{ costUsd: 0.24, calls: 20 }}
          details={
            <dl className="grid grid-cols-[7rem_1fr] gap-y-1 text-small">
              <dt className="text-ink-3">Prompt</dt>
              <dd>biryani delivery F-7 Islamabad late night</dd>
              <dt className="text-ink-3">Key budget</dt>
              <dd className="font-mono tabular">$41.27 of $60.00 used</dd>
            </dl>
          }
          state={approval}
          onApprove={() => setApproval("approved")}
          onDeny={() => setApproval("denied")}
        />
        <p className="flex items-start gap-2 text-small text-ink-3">
          <ShieldAlert size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
          This run read AI answers and web pages. Nothing in that content can trigger spending or publishing.
        </p>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  { title: "Why did ChatGPT stop mentioning us?", body: "Compare this week with last, per prompt" },
  { title: "Which sources cite competitors but not us?", body: "Domains AI engines trust that never name you" },
  { title: "What false facts are AI stating?", body: "Claims that contradict your verified facts" },
];

const HISTORY = [
  { group: "Today", items: ["Sources citing Shahi Handi", "Catering prompt drop on Gemini"] },
  { group: "Yesterday", items: ["Private dining false fact fix", "Gemini opening hours error"] },
  { group: "Last 7 days", items: ["Catering prompts on Perplexity", "Weekly report for Dera Hospitality", "robots.txt and OAI-SearchBot"] },
];

type Phase = "empty" | "thinking" | "answered" | "stopped";

export function AgentPreview() {
  const [phase, setPhase] = useState<Phase>("empty");
  const [question, setQuestion] = useState("");
  const [draft, setDraft] = useState("");
  const [approval, setApproval] = useState<"pending" | "approved" | "denied">("pending");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    if (phase !== "empty") endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [phase]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setQuestion(text.trim());
    setDraft("");
    setApproval("pending");
    setPhase("thinking");
    // shortcut: scripted reply for the design preview; the real agent streams from the API.
    timer.current = setTimeout(() => setPhase("answered"), 1600);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("stopped");
  };
  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("empty");
    setDraft("");
  };

  const sidebar = (
    <div className="flex flex-col">
      <ul className="flex flex-col gap-0.5">
        <li>
          <NavItem href="/design/dashboard" icon={CornerUpLeft} label="Back" />
        </li>
        <li>
          <NavItem icon={SquarePen} label="New chat" onClick={reset} />
        </li>
      </ul>
      {HISTORY.map((g) => (
        <div key={g.group} className="mt-6">
          <p className="px-2.5 text-small text-ink-3">{g.group}</p>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {(g.group === "Today" && phase !== "empty" ? [question, ...g.items] : g.items).map((t, i) => (
              <li key={t}>
                <button
                  type="button"
                  className={cn(
                    "block h-9 w-full truncate rounded-md px-2.5 text-left text-small text-ink-2 hover:bg-fill hover:text-ink focus-visible:focus-ring",
                    g.group === "Today" && i === 0 && phase !== "empty" && "bg-fill text-ink",
                  )}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  const busy = phase === "thinking";

  return (
    <AppShell active="agent" title="Agent" sidebar={sidebar} dateRange={false} footer={false}>
      <div className="mx-auto flex w-full max-w-[52rem] flex-1 flex-col">
        {phase === "empty" ? (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <p className="text-h3 font-medium text-ink">Ask about your AI visibility</p>
            <p className="mt-1.5 max-w-md text-small text-ink-3">
              Every number links to the answers behind it. Anything that spends from your keys waits for your approval.
            </p>
          </div>
        ) : (
          <section aria-label="Conversation" aria-live="polite" className="flex flex-1 flex-col gap-6 pt-2 pb-8">
            <div className="flex justify-end">
              <p className="max-w-[30rem] rounded-lg bg-surface px-4 py-3 text-body text-ink">{question}</p>
            </div>
            {phase === "thinking" ? <Thinking /> : null}
            {phase === "stopped" ? (
              <div className="flex items-center gap-2.5">
                <AgentAvatar />
                <span className="text-small text-ink-3">Stopped. No tools were run and nothing was charged.</span>
              </div>
            ) : null}
            {phase === "answered" ? <AgentAnswer approval={approval} setApproval={setApproval} /> : null}
            <div ref={endRef} />
          </section>
        )}

        <div className="sticky bottom-0 bg-bg pt-2 pb-3">
          {phase === "empty" ? (
            <ul className="mb-2.5 grid gap-2.5 sm:grid-cols-3">
              {SUGGESTIONS.map((s) => (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => send(s.title)}
                    className="h-full w-full rounded-lg bg-surface px-4 py-3.5 text-left transition-colors duration-[var(--duration-fast)] hover:bg-white/60 focus-visible:focus-ring"
                  >
                    <span className="block text-small font-medium text-ink">{s.title}</span>
                    <span className="mt-1 block text-small text-ink-3">{s.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <form
            className="rounded-lg bg-surface p-3.5 ring-1 ring-line transition-shadow duration-[var(--duration-fast)] focus-within:ring-ink"
            onSubmit={(e) => {
              e.preventDefault();
              if (busy) stop();
              else send(draft);
            }}
          >
            <label htmlFor="agent-input" className="sr-only">
              Ask about your data
            </label>
            <textarea
              id="agent-input"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!busy) send(draft);
                }
              }}
              placeholder="How can I help?"
              className="block w-full resize-none bg-transparent px-1 text-body text-ink placeholder:text-ink-3 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-1 text-small text-ink">
                <Sparkles size={15} strokeWidth={1.6} aria-hidden /> Recommendr agent
              </span>
              <span className="ml-auto hidden font-mono text-micro tracking-normal tabular text-ink-3 sm:inline">Cap $0.25 per run</span>
              <button
                type="submit"
                aria-label={busy ? "Stop" : "Send"}
                disabled={!busy && !draft.trim()}
                className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-white transition-colors duration-[var(--duration-fast)] hover:bg-ink-2 focus-visible:focus-ring disabled:bg-line-strong"
              >
                {busy ? <Square size={12} fill="currentColor" aria-hidden /> : <ArrowUp size={17} strokeWidth={2} aria-hidden />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
