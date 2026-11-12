import type { Source } from "@/lib/mock";

/** Superscript footnote marker, muted so citations never compete with the answer text. */
export function CitationRef({ n, href, idPrefix = "src" }: { n: number; href?: string; idPrefix?: string }) {
  return (
    <sup className="ml-px text-[0.68em] text-ink-3 tabular">
      <a href={href ?? `#${idPrefix}-${n}`} className="rounded-xs px-px hover:text-ink hover:underline focus-visible:focus-ring" aria-label={`Source ${n}`}>
        [{n}]
      </a>
    </sup>
  );
}

/** Numbered source list matching CitationRef numbers; domains shown so readers can judge them. */
export function SourceList({ sources, idPrefix = "src" }: { sources: Source[]; idPrefix?: string }) {
  return (
    <ol className="flex flex-col gap-1">
      {sources.map((s) => (
        <li key={s.n} id={`${idPrefix}-${s.n}`} className="flex gap-2 text-small leading-snug">
          <span className="w-5 shrink-0 text-ink-3 tabular">{s.n}.</span>
          <span className="min-w-0">
            <a href={s.url} target="_blank" rel="noreferrer" className="text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink hover:decoration-ink">
              {s.title}
            </a>{" "}
            <span className="text-small text-ink-3">{s.domain}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
