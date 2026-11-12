import Link from "next/link";
import type { CSSProperties } from "react";
import { PreviewFooter, PreviewHeader } from "@/components/brand/preview-chrome";

/**
 * Reference only. Highlighter is the chosen palette and is what the tokens implement.
 * "Instrument" is the earlier vermilion candidate, rendered with inline styles because its
 * colours deliberately do not exist as tokens any more.
 */
type Spec = {
  name: string;
  chosen: boolean;
  paper: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  mark: CSSProperties; // how "your brand" is marked in an answer
  primary: CSSProperties;
  accentButton?: CSSProperties;
  brandSeries: string;
  series: string[];
  note: string;
};

const PALETTES: Spec[] = [
  {
    name: "Highlighter",
    chosen: true,
    paper: "#FAFAF8",
    card: "#FFFFFF",
    ink: "#111311",
    muted: "#6B706B",
    line: "#E5E5E0",
    mark: { background: "#D6F69A", color: "#111311", padding: "0 2px", borderRadius: 2 },
    primary: { background: "#111311", color: "#FFFFFF" },
    accentButton: { background: "#D6F69A", color: "#111311" },
    brandSeries: "#111311",
    series: ["#1F8A8A", "#4C9BE8", "#E8A33D", "#E06C75", "#9CA3AF"],
    note: "Lime is a highlighter behind ink: it marks your mention, your confidence band and the one hero action.",
  },
  {
    name: "Instrument",
    chosen: false,
    paper: "#F7F5F0",
    card: "#FCFBF8",
    ink: "#1A1916",
    muted: "#6A665D",
    line: "#E2DDD2",
    mark: { color: "#A42E0C", fontWeight: 600 },
    primary: { background: "#C93A12", color: "#FFFFFF" },
    brandSeries: "#C93A12",
    series: ["#2F7AC6", "#7C8590", "#86944C", "#70484C", "#224F6D", "#AF8383"],
    note: "Vermilion accent as ink: brand text, primary actions and significant changes all shared one colour.",
  },
];

function Specimen({ p }: { p: Spec }) {
  return (
    <article
      aria-labelledby={`pal-${p.name}`}
      className={`rounded-lg border p-5 ${p.chosen ? "border-ink" : "border-line"}`}
      style={{ background: p.paper, color: p.ink }}
    >
      <header className="flex items-center gap-2">
        <h2 id={`pal-${p.name}`} className="font-serif text-h3">{p.name}</h2>
        {p.chosen ? (
          <span className="rounded-sm bg-lime-soft px-1.5 py-0.5 text-micro uppercase text-lime-ink">Chosen</span>
        ) : (
          <span className="rounded-sm border border-line px-1.5 py-0.5 text-micro uppercase text-ink-3">Rejected · reference</span>
        )}
      </header>
      <p className="mt-1 text-small" style={{ color: p.muted }}>{p.note}</p>

      <div className="mt-5 rounded-md border p-4" style={{ background: p.card, borderColor: p.line }}>
        <p className="font-mono text-micro uppercase" style={{ color: p.muted }}>ChatGPT · gpt-5.1-search · sample 3</p>
        <p className="mt-2 text-small leading-relaxed">
          For pizza in Brooklyn, locals point to Fulton Ave Pizza. <span style={p.mark}>Corner Slice Pizza</span> is a strong choice
          if you want a classic New York slice<sup style={{ color: p.muted }}>2</sup>.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5" aria-label="Chart series">
        <span className="h-1.5 w-10 rounded-xs" style={{ background: p.brandSeries }} title="Your brand" />
        {p.series.map((c) => (
          <span key={c} className="h-1.5 w-8 rounded-xs" style={{ background: c }} title={c} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex h-8 items-center rounded-md px-3 text-small font-medium" style={p.primary}>Run a check</span>
        {p.accentButton ? (
          <span className="inline-flex h-8 items-center rounded-md px-3 text-small font-medium" style={p.accentButton}>Check my business</span>
        ) : null}
        <span className="inline-flex h-8 items-center rounded-md border px-3 text-small" style={{ borderColor: p.line, background: p.card }}>Export</span>
      </div>
    </article>
  );
}

export default function PalettesPage() {
  return (
    <>
    <PreviewHeader />
    <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
      <Link href="/design" className="text-small text-ink-3 hover:text-ink hover:underline">← Design previews</Link>
      <h1 className="mt-4 font-serif text-h1">Palettes</h1>
      <p className="mt-2 max-w-prose text-ink-2">
        Highlighter won because its one bright colour does the product&apos;s core act: finding and marking where you are mentioned.
        Instrument used its accent as ink, so the same vermilion meant &ldquo;your brand&rdquo;, &ldquo;click here&rdquo; and
        &ldquo;something changed&rdquo;. Light theme only for both.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {PALETTES.map((p) => (
          <Specimen key={p.name} p={p} />
        ))}
      </div>
    </main>
      <PreviewFooter />
      </>
  );
}
