"use client";

import { ArrowUp, CircleAlert, Download, Globe, RefreshCw, Square, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EngineLogo } from "@/components/brand/engine-logo";
import { Logo, LogoLoader } from "@/components/brand/logo";
import { AnswerCard } from "@/components/ui/answer-card";
import { Delta } from "@/components/ui/delta";
import { IntervalValue } from "@/components/ui/interval-value";
import { cn } from "@/lib/cn";
import { answers, competitors, engineStats, topSources, wilson } from "@/lib/mock";
import { ENGINES, type EngineId } from "@/lib/palette";
import { ArtifactPanel, CopyAction, FIXES, FixArtifact, IconAction, useReveal, useSpring, type FixId } from "./_artifact";

/*
 * The scripted agent conversation, shared by /design/agent (full page) and the dashboard (inline).
 * shortcut: deterministic script keyed by regex, no network; the real agent streams from the API.
 * Names are fictional US examples kept local on purpose (mock.ts strings may change).
 */

export const BRAND_NAME = "Corner Slice Pizza";

export type Artifact = { kind: "sources" } | { kind: "fix"; id: FixId } | { kind: "answer"; id: string } | { kind: "metric"; id: "chatgpt" | "q03" };
type Seg = string | { b: string } | { brand: string } | { chip: string; open: Artifact };
type Topic = "visibility" | "sources" | "facts" | "fix" | "fallback";

const BRAND = { brand: BRAND_NAME };
const cg = engineStats.chatgpt;
const cgNow = wilson(cg.x, cg.n);
const cgPrev = wilson(cg.xPrev, cg.nPrev);
const late = wilson(6, 36);
const latePrev = wilson(9, 36);
const ans = (id: string): Seg => ({ chip: id, open: { kind: "answer", id } });

export const Q = {
  visibility: "Why is ChatGPT mentioning us more?",
  sources: "Show the sources that skip us",
  facts: "What false facts are AI stating?",
  fix: "Fix the delivery claim",
};

const SCRIPT: Record<Topic, { segs: Seg[]; follow: string[]; artifact?: Artifact }> = {
  visibility: {
    segs: [
      "ChatGPT named ", BRAND, " in ", { b: "71 of 150" }, " answers this week, up from 48 of 147 ",
      { chip: "chatgpt", open: { kind: "metric", id: "chatgpt" } },
      ". You rank second for “best pizza in Brooklyn” ", ans("ans_7f3a"),
      ". Late-night delivery is still weak", { chip: "q03", open: { kind: "metric", id: "q03" } }, ".",
    ],
    follow: [Q.sources, Q.fix],
  },
  sources: {
    segs: [{ b: "4 trusted sources" }, " barely mention ", BRAND, ". Two never do. Perplexity leans on them most ", ans("ans_91c2"), "."],
    follow: [Q.fix, Q.facts],
    artifact: { kind: "sources" },
  },
  facts: {
    segs: [
      { b: "3 false claims" }, " this week. The worst: ChatGPT and Claude say ", BRAND, " doesn’t deliver ", ans("ans_c07d"),
      ". You deliver until 2 am.",
    ],
    follow: [Q.fix, Q.sources],
  },
  fix: {
    segs: ["Done. Restaurant schema with ", { b: "delivery and hours" }, ". Check it, then add it to your site."],
    follow: [Q.sources, Q.visibility],
    artifact: { kind: "fix", id: "delivery" },
  },
  fallback: {
    segs: ["I answer from this week’s ", { b: "594 sampled answers" }, ". Ask about visibility, sources or false facts."],
    follow: [Q.visibility, Q.sources, Q.facts],
  },
};

function route(text: string): Topic {
  const t = text.toLowerCase();
  if (/\bfix|schema|json/.test(t)) return "fix";
  if (/source|cite|skip|domain/.test(t)) return "sources";
  if (/false|wrong|fact|claim/.test(t)) return "facts";
  if (/chatgpt|visib|mention|why|drop|rank|up\b/.test(t)) return "visibility";
  return "fallback";
}

// Local US sources; citation counts come from mock.ts so numbers stay consistent.
const DOMAINS = ["brooklynbites.com", "slicereport.com", "parkslopeeats.com", "reddit.com/r/brooklyn"];
const SKIPPING = topSources
  .filter((s) => s.brandShare < 0.1)
  .sort((a, b) => b.citations - a.citations)
  .map((s, i) => ({ domain: DOMAINS[i] ?? s.domain, citations: s.citations, engines: s.engines as EngineId[], brandShare: s.brandShare }));
const CSV = ["domain,citations,engines,brand_share", ...SKIPPING.map((s) => `${s.domain},${s.citations},${s.engines.join(" ")},${s.brandShare}`)].join("\n");

// ---------------------------------------------------------------- streamed answer

type Unit = { k: "w"; v: string } | { k: "b"; v: string } | { k: "brand"; v: string } | { k: "chip"; v: string; open: Artifact };
const toUnits = (segs: Seg[]): Unit[] =>
  segs.flatMap((s): Unit[] =>
    typeof s === "string"
      ? s.split(/(?<=\s)/).map((v) => ({ k: "w", v }))
      : "b" in s
        ? [{ k: "b", v: s.b }]
        : "brand" in s
          ? [{ k: "brand", v: s.brand }]
          : [{ k: "chip", v: s.chip, open: s.open }],
  );
const plain = (segs: Seg[]) => segs.map((s) => (typeof s === "string" ? s : "b" in s ? s.b : "brand" in s ? s.brand : `[${s.chip}]`)).join("");
const engineOf = (a: Artifact) => (a.kind === "answer" ? answers.find((x) => x.id === a.id)?.engine : undefined);

// Citations read like footnotes: a small number that opens the source. No internal ids on screen.
const CHIP =
  "ml-0.5 inline-flex size-[18px] -translate-y-[0.35em] items-center justify-center rounded-full bg-fill text-[11px] font-medium tabular text-ink-2 transition-colors duration-[var(--duration-fast)] hover:bg-ink hover:text-white focus-visible:focus-ring";

function Streamed({ segs, frozen, onDone, onOpen }: { segs: Seg[]; frozen: boolean; onDone: () => void; onOpen: (a: Artifact) => void }) {
  const [units] = useState(() => toUnits(segs));
  const n = useReveal(units.length, 38, frozen);
  useEffect(() => {
    if (n >= units.length) onDone();
  }, [n, units.length, onDone]);
  return (
    <p className="text-body leading-[1.7] text-ink">
      {units.slice(0, n).map((u, i) => {
        if (u.k === "w") return <span key={i}>{u.v}</span>;
        if (u.k === "b")
          return (
            <strong key={i} className="font-semibold">
              {u.v}
            </strong>
          );
        if (u.k === "brand")
          return (
            <mark key={i} className="rounded-xs bg-lime px-1 text-lime-ink">
              {u.v}
            </mark>
          );
        // footnote number = position among the citations so far
        const num = units.slice(0, i + 1).filter((x) => x.k === "chip").length;
        const engine = engineOf(u.open);
        const name = engine ? `${ENGINES[engine].label} answer` : "the numbers behind this";
        return (
          <button key={i} type="button" className={CHIP} onClick={() => onOpen(u.open)} aria-label={`Source ${num}: ${name}`} title={name}>
            {num}
          </button>
        );
      })}
    </p>
  );
}

function Thinking() {
  return (
    <div role="status" className="flex items-center gap-2.5 text-small">
      <span className="animate-shimmer bg-[linear-gradient(90deg,var(--color-ink-3)_20%,var(--color-ink)_50%,var(--color-ink-3)_80%)] bg-[length:200%_100%] bg-clip-text font-medium text-transparent">
        Searching your answers
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- artifacts

function SourcesArtifact() {
  const shown = useReveal(SKIPPING.length, 260);
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full text-small">
        <thead>
          <tr className="border-b border-line text-left text-ink-3">
            <th className="py-2.5 pr-3 pl-4 font-normal">Domain</th>
            <th className="px-3 py-2.5 text-right font-normal">Citations</th>
            <th className="px-3 py-2.5 font-normal">Engines</th>
            <th className="py-2.5 pr-4 pl-3 font-normal">
              <span className="sr-only">Mentions you</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {SKIPPING.map((s, i) => (
            <tr key={s.domain} className="h-12 border-b border-line">
              {i < shown ? (
                <>
                  <motion.td initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-0 truncate py-2 pr-3 pl-4 font-medium text-ink" title={s.domain}>
                    {s.domain}
                  </motion.td>
                  <motion.td initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-2 text-right text-ink tabular">
                    {s.citations}
                  </motion.td>
                  <motion.td initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-2">
                    <span className="flex gap-1.5 text-ink-2">
                      {s.engines.map((e) => (
                        <EngineLogo key={e} engine={e} size={14} />
                      ))}
                    </span>
                  </motion.td>
                  <motion.td initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2 pr-4 pl-3 text-right whitespace-nowrap">
                    {s.brandShare === 0 ? (
                      <span className="rounded-sm bg-lime-soft px-1.5 py-0.5 text-micro tracking-normal text-lime-ink">Doesn&apos;t cite you</span>
                    ) : (
                      <span className="text-small text-ink-3 tabular">{Math.round(s.brandShare * 100)}% you</span>
                    )}
                  </motion.td>
                </>
              ) : (
                <td colSpan={4} className="px-4">
                  <span aria-hidden className="block h-2.5 w-2/3 rounded-xs bg-fill" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricArtifact({ id }: { id: "chatgpt" | "q03" }) {
  const { now, prev, n, sig } = id === "chatgpt" ? { now: cgNow, prev: cgPrev, n: cg.n, sig: true } : { now: late, prev: latePrev, n: 36, sig: false };
  return (
    <div className="space-y-5 p-5">
      <IntervalValue p={now.p} lo={now.lo} hi={now.hi} n={n} size="xl" bar />
      <Delta value={Math.round((now.p - prev.p) * 1000) / 10} significant={sig} size="md" />
      <p className="text-small text-ink-3">n = {n} answers</p>
    </div>
  );
}

const keyOf = (a: Artifact) => `${a.kind}-${"id" in a ? a.id : ""}`;
const titleOf = (a: Artifact) =>
  a.kind === "sources" ? "Sources that skip you" : a.kind === "fix" ? FIXES[a.id].title : a.kind === "answer" ? `${ENGINES[engineOf(a) ?? "chatgpt"].label}\u2019s answer` : a.id === "chatgpt" ? "ChatGPT this week" : "Late-night delivery";

function exportCsv() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([CSV], { type: "text/csv" }));
  a.download = "sources-that-skip-you.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

/** The right-hand artifact panel. Render inside <AnimatePresence> so it can slide out. */
export function ArtifactView({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  return (
    <ArtifactPanel
      contentKey={keyOf(artifact)}
      title={titleOf(artifact)}
      onClose={onClose}
      actions={
        artifact.kind === "sources" ? (
          <>
            <CopyAction text={CSV} label="Copy as CSV" />
            <IconAction label="Export CSV" onClick={exportCsv}>
              <Download size={14} strokeWidth={1.6} aria-hidden />
            </IconAction>
          </>
        ) : null
      }
    >
      {artifact.kind === "sources" ? (
        <SourcesArtifact />
      ) : artifact.kind === "fix" ? (
        <FixArtifact key={artifact.id} id={artifact.id} onClose={onClose} />
      ) : artifact.kind === "answer" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <AnswerCard answer={answers.find((a) => a.id === artifact.id)!} competitors={competitors} />
        </div>
      ) : (
        <MetricArtifact id={artifact.id} />
      )}
    </ArtifactPanel>
  );
}

// ---------------------------------------------------------------- conversation

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "ai"; topic: Topic; status: "thinking" | "streaming" | "done" | "stopped"; gen: number; vote?: "up" | "down" };

const PAGE_SUGGESTIONS: { title: string; body: string; icon: "chatgpt" | "sources" | "facts" }[] = [
  { title: Q.visibility, body: "This week vs last", icon: "chatgpt" },
  { title: "Which sources skip us?", body: "Sites that never name you", icon: "sources" },
  { title: Q.facts, body: "Claims to correct", icon: "facts" },
];

function SuggestionIcon({ kind }: { kind: "chatgpt" | "sources" | "facts" }) {
  if (kind === "chatgpt")
    return (
      <span className="flex size-10 items-center justify-center rounded-full bg-fill text-ink">
        <EngineLogo engine="chatgpt" size={18} />
      </span>
    );
  if (kind === "sources")
    return (
      <span className="flex size-10 items-center justify-center rounded-full bg-lime text-lime-ink">
        <Globe size={18} strokeWidth={1.8} aria-hidden />
      </span>
    );
  return (
    <span className="flex size-10 items-center justify-center rounded-full bg-down-soft text-down">
      <CircleAlert size={18} strokeWidth={1.8} aria-hidden />
    </span>
  );
}
const CHIPS = [
  { label: "Why is ChatGPT up?", q: Q.visibility },
  { label: "Sources that skip us", q: Q.sources },
  { label: "False facts", q: Q.facts },
];

/**
 * Conversation + composer. `page`: fills the agent page, suggestion cards above the composer.
 * `inline`: the dashboard's prominent agent card, suggestion chips under the composer.
 */
export function Chat({
  variant,
  onArtifact,
  onStart,
  onSubmit,
}: {
  variant: "page" | "inline";
  onArtifact: (a: Artifact) => void;
  onStart?: (q: string) => void;
  /** When set, questions leave this box (the dashboard hands them to the agent page). */
  onSubmit?: (q: string) => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const t = useSpring();
  const page = variant === "page";

  const last = msgs.at(-1);
  const busy = last?.role === "ai" && (last.status === "thinking" || last.status === "streaming");
  const lastAi = msgs.findLast((m) => m.role === "ai");
  const patch = (id: number, p: Partial<Extract<Msg, { role: "ai" }>>) => setMsgs((m) => m.map((x) => (x.id === id && x.role === "ai" ? { ...x, ...p } : x)));

  const think = (id: number, topic: Topic) => {
    timer.current = setTimeout(() => {
      patch(id, { status: "streaming" });
      const a = SCRIPT[topic].artifact;
      if (a) onArtifact(a);
    }, 1100);
  };
  const send = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    if (onSubmit) return onSubmit(q);
    if (msgs.length === 0) onStart?.(q);
    const topic = route(q);
    const u = ++seq.current;
    const a = ++seq.current;
    setMsgs((m) => [...m, { id: u, role: "user", text: q }, { id: a, role: "ai", topic, status: "thinking", gen: 0 }]);
    setDraft("");
    think(a, topic);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    if (last?.role === "ai") patch(last.id, { status: "stopped" });
  };
  const regenerate = (m: Extract<Msg, { role: "ai" }>) => {
    if (busy) return;
    patch(m.id, { status: "thinking", gen: m.gen + 1, vote: undefined });
    think(m.id, m.topic);
  };
  // Returns the same array when nothing changes, so the streaming effect cannot loop.
  const done = useCallback(
    (id: number) =>
      setMsgs((m) =>
        m.some((x) => x.id === id && x.role === "ai" && x.status === "streaming")
          ? m.map((x) => (x.id === id && x.role === "ai" ? { ...x, status: "done" as const } : x))
          : m,
      ),
    [],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // The agent page picks up a question handed over from the dashboard (?q=...), once.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    if (!page) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    // clear the URL only when sending, so a remount (React strict mode) still finds the question
    const id = setTimeout(() => {
      window.history.replaceState(null, "", window.location.pathname);
      sendRef.current(q);
    }, 150);
    return () => clearTimeout(id);
  }, [page]);

  // Keep the newest text in view while it streams, unless the reader scrolled up.
  useEffect(() => {
    const el = scroller.current;
    const inner = list.current;
    if (!el || !inner) return;
    let pinned = true;
    const onScroll = () => {
      pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    const ro = new ResizeObserver(() => {
      if (pinned) el.scrollTo({ top: el.scrollHeight });
    });
    el.addEventListener("scroll", onScroll);
    ro.observe(inner);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // Auto-grow the composer up to ~8 lines.
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, [draft]);

  const empty = msgs.length === 0;
  const white = !page;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-lg transition-colors duration-[var(--duration-slow)]",
        page ? "h-[calc(100dvh-9.5rem)] min-h-[26rem] flex-1" : "rounded-xl",
        white ? "bg-surface" : "bg-transparent",
      )}
    >
      <div ref={scroller} className={cn("overflow-y-auto px-4", page ? "min-h-0 flex-1" : "max-h-[min(52vh,30rem)]")}>
        <div ref={list} className={cn("mx-auto flex w-full flex-col gap-6", page && "max-w-[44rem]", !empty && (page ? "py-4" : "pt-5 pb-2"))}>
          {msgs.map((m) =>
            m.role === "user" ? (
              <motion.div key={m.id} layout="position" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={t} className="flex justify-end">
                <p className={cn("max-w-[85%] rounded-lg rounded-br-sm px-4 py-2.5 text-body whitespace-pre-wrap text-ink", white ? "bg-fill" : "bg-surface")}>{m.text}</p>
              </motion.div>
            ) : (
              <motion.div key={m.id} layout="position" transition={t} className="flex gap-3" aria-live="polite">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-fill">
                  {m.status === "thinking" || m.status === "streaming" ? <LogoLoader size={18} /> : <Logo variant="mark" height={18} />}
                </span>
                <div className="flex min-h-7 min-w-0 flex-1 flex-col gap-3">
                {m.status === "thinking" ? (
                  <Thinking />
                ) : (
                  <Streamed key={m.gen} segs={SCRIPT[m.topic].segs} frozen={m.status === "stopped"} onDone={() => done(m.id)} onOpen={onArtifact} />
                )}
                {m.status === "stopped" ? <p className="text-small text-ink-3">Stopped.</p> : null}
                {m.status === "done" ? (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
                    <div className="flex gap-1.5">
                      <CopyAction text={plain(SCRIPT[m.topic].segs)} />
                      <IconAction label="Good answer" pressed={m.vote === "up"} onClick={() => patch(m.id, { vote: m.vote === "up" ? undefined : "up" })}>
                        <ThumbsUp size={14} strokeWidth={1.6} aria-hidden />
                      </IconAction>
                      <IconAction label="Bad answer" pressed={m.vote === "down"} onClick={() => patch(m.id, { vote: m.vote === "down" ? undefined : "down" })}>
                        <ThumbsDown size={14} strokeWidth={1.6} aria-hidden />
                      </IconAction>
                      <IconAction label="Regenerate" onClick={() => regenerate(m)}>
                        <RefreshCw size={14} strokeWidth={1.6} aria-hidden />
                      </IconAction>
                    </div>
                    {m === lastAi ? (
                      <ul className="flex flex-wrap gap-2" aria-label="Follow-up questions">
                        {SCRIPT[m.topic].follow.map((f) => (
                          <li key={f}>
                            <button
                              type="button"
                              onClick={() => send(f)}
                              className="h-8 rounded-full bg-surface px-3.5 text-small text-ink-2 ring-1 ring-line ring-inset transition-colors hover:bg-fill hover:text-ink focus-visible:focus-ring"
                            >
                              {f}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </motion.div>
                ) : null}
                </div>
              </motion.div>
            ),
          )}
        </div>
      </div>

      <div className={cn("mx-auto w-full", page ? "px-4 pb-4" : "p-3", page && "max-w-[46rem]")}>
        <AnimatePresence initial={false}>
          {page && empty ? (
            <motion.div key="empty" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={t} className="overflow-hidden">
              <div className="flex flex-col items-center pb-8 pt-2 text-center">
                <motion.span
                  className="flex size-20 items-center justify-center rounded-full bg-surface shadow-[0_18px_40px_-20px_rgb(17_19_17/0.35)]"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <Logo variant="mark" height={40} />
                </motion.span>
                <h2 className="mt-5 text-h2 font-bold text-ink">What do you want to know?</h2>
                <p className="mt-1.5 text-body text-ink-3">About Corner Slice Pizza on ChatGPT, Gemini, Perplexity and Claude</p>
              </div>
              <ul className="grid gap-3 pb-4 sm:grid-cols-3">
                {PAGE_SUGGESTIONS.map((s, i) => (
                  <motion.li key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.1 + i * 0.06 }}>
                    <button
                      type="button"
                      onClick={() => send(s.title)}
                      className="flex h-full w-full flex-col gap-4 rounded-[20px] bg-surface p-4 text-left shadow-card transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-18px_rgb(17_19_17/0.35)] focus-visible:focus-ring"
                    >
                      <SuggestionIcon kind={s.icon} />
                      <span>
                        <span className="block text-body font-semibold text-ink">{s.title}</span>
                        <span className="mt-1 block text-small text-ink-3">{s.body}</span>
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <form
          className={cn(
            "rounded-lg p-3 ring-1 transition-shadow duration-[var(--duration-fast)] focus-within:ring-ink",
            page ? "bg-surface ring-line" : "bg-bg ring-transparent",
          )}
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) stop();
            else send(draft);
          }}
        >
          <label htmlFor={`${variant}-agent-input`} className="sr-only">
            Ask Recommendr
          </label>
          <textarea
            ref={input}
            id={`${variant}-agent-input`}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder={page ? "How can I help?" : "Ask Recommendr anything"}
            className={cn("block w-full resize-none bg-transparent px-1 py-1 text-ink placeholder:text-ink-3 focus:outline-none", page ? "text-body" : "text-h4")}
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-1 text-small text-ink">
              <Logo variant="mark" height={16} /> Recommendr
            </span>
            <button
              type="submit"
              aria-label={busy ? "Stop" : "Send"}
              disabled={!busy && !draft.trim()}
              className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors duration-[var(--duration-fast)] hover:bg-ink-2 focus-visible:focus-ring disabled:bg-line-strong"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={busy ? "stop" : "send"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }}>
                  {busy ? <Square size={12} fill="currentColor" aria-hidden /> : <ArrowUp size={17} strokeWidth={2} aria-hidden />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </form>
        {!page && empty ? (
          <ul className="mt-2.5 flex flex-wrap gap-1.5 px-1" aria-label="Suggestions">
            {CHIPS.map((c) => (
              <li key={c.label}>
                <button type="button" onClick={() => send(c.q)} className="h-8 rounded-full bg-surface px-3.5 text-small text-ink-2 ring-1 ring-line ring-inset transition-colors hover:bg-fill hover:text-ink focus-visible:focus-ring">
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
