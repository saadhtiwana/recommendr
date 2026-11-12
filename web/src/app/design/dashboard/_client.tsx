"use client";

import { ArrowDownRight, ArrowUpRight, Check, Globe, Truck, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { overview, wilson } from "@/lib/mock";
import { type FixId } from "../agent/_artifact";
import { ArtifactView, Chat, type Artifact } from "../agent/_chat";

const vis = wilson(overview.visibility.x, overview.visibility.n);
const visPrev = wilson(overview.visibilityPrev.x, overview.visibilityPrev.n);
const visDelta = Math.round((vis.p - visPrev.p) * 1000) / 10;
const pct = (p: number) => `${Math.round(p * 100)}%`;

// Short labels on purpose; full evidence lives in the generated fix.
// The three fixes that matter most this week, in plain words.
const NEXT: { id: FixId; title: string; why: string; icon: typeof Truck; tint: string }[] = [
  { id: "delivery", title: "Tell AI you deliver", why: "Claude and ChatGPT say you don\u2019t.", icon: Truck, tint: "bg-lime text-lime-ink" },
  { id: "groups", title: "Answer group questions", why: "AI says you can\u2019t host big groups.", icon: Users, tint: "bg-[#E6F0FB] text-[#21579A]" },
  { id: "robots", title: "Let AI read your site", why: "ChatGPT search can\u2019t see your pages.", icon: Globe, tint: "bg-[#E3F1F1] text-[#14605F]" },
];

/** A change: small arrow + number in the body font, coloured text only (no pill, no mono). */
function Stat({ value, label, change, up, href }: { value: string; label: string; change?: string; up?: boolean; href?: string }) {
  return (
    <div className="flex flex-col gap-1 bg-surface p-6">
      <div className="flex items-baseline gap-3">
        <span className={cn("text-[2.5rem] leading-none font-bold tracking-[-0.04em] tabular", href ? "text-down" : "text-ink")}>{value}</span>
        {change ? (
          <span className={cn("flex items-center gap-0.5 text-small font-semibold", up ? "text-up" : "text-down")}>
            {up ? <ArrowUpRight size={14} aria-hidden /> : <ArrowDownRight size={14} aria-hidden />}
            <span className="sr-only">{up ? "up" : "down"}</span>
            {change}
          </span>
        ) : null}
      </div>
      <p className="text-small text-ink-3">{label}</p>
      {href ? (
        <a href={href} className="mt-1 w-fit text-small font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          See them
        </a>
      ) : null}
    </div>
  );
}

function ReadyToFix({ activeFix, onOpen }: { activeFix: FixId | null; onOpen: (id: FixId) => void }) {
  const [done, setDone] = useState<FixId[]>([]);
  const { toast } = useToast();
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<FixId>).detail;
      setDone((d) => (d.includes(id) ? d : [...d, id]));
      toast({ title: "Fix sent", tone: "up" });
    };
    window.addEventListener("recommendr:fix-approved", on);
    return () => window.removeEventListener("recommendr:fix-approved", on);
  }, [toast]);
  const left = NEXT.length - done.length;
  return (
    <section aria-labelledby="fix-h">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="fix-h" className="text-h4 font-bold text-ink">Ready to fix</h2>
        <span className="text-small font-semibold text-ink-3">{left === 0 ? "All done" : `${left} left`}</span>
      </div>
      <ul className="grid gap-3 @3xl:grid-cols-3">
        {NEXT.map((f) => {
          const isDone = done.includes(f.id);
          const Icon = f.icon;
          return (
            <motion.li
              key={f.id}
              layout
              className={cn("relative flex flex-col gap-4 rounded-[22px] bg-surface p-5 transition-shadow", activeFix === f.id && "ring-2 ring-ink")}
            >
              <div className="flex items-center gap-3">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isDone ? "done" : "todo"}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24 }}
                    className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", isDone ? "bg-ink text-white" : f.tint)}
                  >
                    {isDone ? <Check size={20} strokeWidth={2.4} aria-hidden /> : <Icon size={19} strokeWidth={1.8} aria-hidden />}
                  </motion.span>
                </AnimatePresence>
                <div className="min-w-0">
                  <p className="text-body font-bold text-ink">{f.title}</p>
                  <p className="truncate text-small text-ink-3">{isDone ? "Sent to your website" : f.why}</p>
                </div>
              </div>
              {isDone ? (
                <Button variant="secondary" onClick={() => onOpen(f.id)}>View</Button>
              ) : (
                <Button variant="accent" onClick={() => onOpen(f.id)} aria-expanded={activeFix === f.id}>
                  Fix it
                </Button>
              )}
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}

export function DashboardPreview() {
  const router = useRouter();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const close = useCallback(() => setArtifact(null), []);
  const activeFix = artifact?.kind === "fix" ? artifact.id : null;

  return (
    <AppShell
      active="overview"
      title="Good morning, Maya"
      subtitle="AI mentions Corner Slice more this week. 3 fixes are ready."
    >
      <div className="flex min-w-0 flex-1 items-start">
        <div className="@container flex min-w-0 flex-1 flex-col gap-8">
          <Chat variant="inline" onArtifact={setArtifact} onSubmit={(q) => router.push(`/design/agent?q=${encodeURIComponent(q)}`)} />

          <section aria-label="This week" className="grid gap-px overflow-hidden rounded-[22px] bg-line sm:grid-cols-3">
            <Stat value={pct(vis.p)} label="of AI answers mention you" change={`${visDelta.toFixed(1)} pts`} up />
            <Stat value={`#${overview.averageRank.value.toFixed(1)}`} label="average spot when listed" change="0.6" up />
            <Stat value={String(overview.falseFacts)} label="wrong things AI says" href="/design/actions" />
          </section>

          <ReadyToFix activeFix={activeFix} onOpen={(id) => setArtifact({ kind: "fix", id })} />
        </div>

        <AnimatePresence>{artifact ? <ArtifactView key="artifact" artifact={artifact} onClose={close} /> : null}</AnimatePresence>
      </div>
    </AppShell>
  );
}
