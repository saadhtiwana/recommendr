import { Flag } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Answer, Competitor } from "@/lib/mock";
import { DECORATION_CLASS, ENGINES } from "@/lib/palette";
import { CitationRef, SourceList } from "./citation";
import { EngineLogo } from "@/components/brand/engine-logo";


/**
 * One sampled AI answer, shown as evidence. The brand is marked like a highlighter pen (lime
 * behind ink), competitors get a 2px underline in their data colour, and sources are numbered
 * footnotes, so a reader can see who was recommended and why at a glance.
 */
export function AnswerCard({
  answer,
  question,
  competitors,
  compact = false,
  onFlag,
  className,
}: {
  answer: Answer;
  question?: string;
  competitors: Competitor[];
  compact?: boolean;
  onFlag?: () => void;
  className?: string;
}) {
  const colorOf = (id: string) => competitors.find((c) => c.id === id)?.color ?? "stone";
  const idPrefix = `${answer.id}-src`;
  return (
    <article className={cn("flex flex-col rounded-md border border-line bg-surface", className)} aria-label={`${ENGINES[answer.engine].label} answer`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-small font-medium text-ink">
          <EngineLogo engine={answer.engine} size={16} />
          {ENGINES[answer.engine].label}
        </span>
        <span className="ml-auto text-small">
          {answer.brandRank ? (
            <span className="text-ink">
              You: <span className="tabular">#{answer.brandRank}</span>
            </span>
          ) : (
            <span className="text-ink-3">You: not mentioned</span>
          )}
        </span>
      </header>
      <div className={cn("flex flex-col gap-3 px-4", compact ? "py-3" : "py-4")}>
        {question && <p className="font-serif text-h4 italic text-ink-2">&ldquo;{question}&rdquo;</p>}
        <p className={cn("text-ink", compact ? "line-clamp-4 text-small leading-relaxed" : "text-body leading-[1.7]")}>
          {answer.segments.map((s, i) => {
            switch (s.kind) {
              case "text":
                return <span key={i}>{s.text}</span>;
              case "brand":
                return (
                  // box-decoration-break keeps the marker look when the mention wraps lines
                  <mark key={i} className="rounded-xs bg-lime px-0.5 font-medium text-lime-ink [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                    {s.text}
                  </mark>
                );
              case "competitor":
                return (
                  <span key={i} className={cn("underline decoration-2 underline-offset-4", DECORATION_CLASS[colorOf(s.competitorId)])}>
                    {s.text}
                  </span>
                );
              case "cite":
                return <CitationRef key={i} n={s.n} idPrefix={idPrefix} />;
            }
          })}
        </p>
      </div>
      {!compact && (
        <footer className="flex flex-col gap-3 border-t border-line px-4 py-3">
          <SourceList sources={answer.sources} idPrefix={idPrefix} />
          {onFlag && (
            <button type="button" onClick={onFlag} className="inline-flex w-fit items-center gap-1.5 rounded-sm px-1.5 py-1 text-small text-ink-3 hover:bg-fill hover:text-ink focus-visible:focus-ring">
              <Flag aria-hidden className="size-3.5" /> Flag a false fact
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
