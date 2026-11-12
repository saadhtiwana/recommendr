/* eslint-disable @next/next/no-img-element -- brand sheet shows the literal SVG/PNG files at fixed sizes */
import Link from "next/link";
import type { ReactNode } from "react";
import { DASH, HEX, type DataColor } from "@/lib/palette";
import { MARK_PAIRS, T, TEXT_PAIRS, ratio } from "./_contrast";
import { PreviewFooter, PreviewHeader } from "@/components/brand/preview-chrome";
import { Logo } from "@/components/brand/logo";

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="border-t border-line py-12">
      <h2 id={`${id}-h`} className="font-serif text-h2">{title}</h2>
      {intro ? <p className="mt-2 max-w-prose text-ink-2">{intro}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

const COLORS: { group: string; items: { token: string; hex: string; role: string; rule: string; bgOnly?: boolean }[] }[] = [
  {
    group: "Surfaces",
    items: [
      { token: "bg", hex: HEX.bg, role: "Page background", rule: "Barely warm paper; white cards read as raised without shadows." },
      { token: "surface", hex: HEX.surface, role: "Cards, tables, inputs", rule: "Always with a 1px line border on bg." },
      { token: "fill", hex: HEX.fill, role: "Subtle fills", rule: "Table headers, wells, code, hover." },
      { token: "line", hex: HEX.line, role: "Hairlines", rule: "Borders and chart grid." },
      { token: "line-strong", hex: HEX.lineStrong, role: "Control borders", rule: "Always next to a visible label (1.49:1)." },
    ],
  },
  {
    group: "Ink",
    items: [
      { token: "ink", hex: HEX.ink, role: "Primary text", rule: "Text, brand line in charts, primary buttons, focus ring." },
      { token: "ink-2", hex: HEX.ink2, role: "Secondary text", rule: "Descriptions, secondary values." },
      { token: "ink-3", hex: HEX.ink3, role: "Muted text", rule: "Labels, footnotes, timestamps, non-significant change. AA on bg, surface, fill and lime-soft." },
    ],
  },
  {
    group: "Highlighter",
    items: [
      { token: "lime", hex: HEX.lime, role: "The highlighter", rule: "Primary pill buttons, brand mention marker, selected state, chips. Text on it is always lime-ink.", bgOnly: true },
      { token: "lime-deep", hex: HEX.limeDeep, role: "Pressed lime", rule: "Hover / pressed state of lime elements only.", bgOnly: true },
      { token: "lime-soft", hex: HEX.limeSoft, role: "Soft highlight", rule: "Confidence bands, soft tags, added diff lines.", bgOnly: true },
      { token: "lime-ink", hex: HEX.limeInk, role: "Text on lime", rule: "The only text colour on lime surfaces. Never black on lime." },
      { token: "on-dark", hex: "#FFFFFF", role: "Headline on imagery", rule: "Headlines over the darkened hero video and photos." },
      { token: "on-dark-2", hex: "#DBDDDE", role: "Body on imagery", rule: "Supporting text over darkened imagery." },
    ],
  },
  {
    group: "Data and change",
    items: [
      { token: "teal", hex: HEX.teal, role: "Series 1", rule: "ChatGPT · competitor #1." },
      { token: "sky", hex: HEX.sky, role: "Series 2", rule: "Gemini · competitor #2. Dashed; never text." },
      { token: "amber", hex: HEX.amber, role: "Series 3", rule: "Perplexity · competitor #3. Dotted; never text." },
      { token: "rose", hex: HEX.rose, role: "Series 4", rule: "Claude · competitor #4." },
      { token: "stone", hex: HEX.stone, role: "Others", rule: "Aggregate 'others' series. Never text." },
      { token: "up", hex: HEX.up, role: "Significant increase", rule: "Always with an up arrow." },
      { token: "down", hex: HEX.down, role: "Significant decrease", rule: "Always with a down arrow." },
    ],
  },
];

const SERIES: { label: string; hex: string; width: number; dash?: string; note: string }[] = [
  { label: "Your brand", hex: HEX.ink, width: 2.5, note: "Thick ink line + lime-soft confidence band" },
  ...(["teal", "sky", "amber", "rose", "stone"] as DataColor[]).map((c, i) => ({
    label: ["ChatGPT / competitor 1", "Gemini / competitor 2", "Perplexity / competitor 3", "Claude / competitor 4", "Others"][i]!,
    hex: HEX[c],
    width: 1.5,
    dash: DASH[c],
    note: DASH[c] ? `dash ${DASH[c]}` : "solid",
  })),
];

const TYPE: { cls: string; name: string; spec: string; sample: string }[] = [
  { cls: "font-serif text-display", name: "display", spec: "Newsreader · 56/1.05 · −0.02em", sample: "See if it mentions you." },
  { cls: "font-serif text-h1", name: "h1", spec: "Newsreader · 40/1.1", sample: "Dera Biryani House" },
  { cls: "font-serif text-h2", name: "h2", spec: "Newsreader · 30/1.2", sample: "Why them, not you" },
  { cls: "text-h3 font-semibold", name: "h3", spec: "Plex Sans 600 · 20/1.35", sample: "Visibility by engine" },
  { cls: "text-h4 font-semibold", name: "h4", spec: "Plex Sans 600 · 16/1.4", sample: "Top cited sources" },
  { cls: "text-body", name: "body", spec: "Plex Sans · 15/1.55", sample: "We asked ChatGPT 'best biryani in Islamabad' 10 times. You appeared 3 times. Your top competitor appeared 8." },
  { cls: "text-small", name: "small", spec: "Plex Sans · 13/1.45", sample: "Last run 9 Nov, 03:00 · next refresh in 3 days" },
  { cls: "text-micro uppercase", name: "micro", spec: "Plex Sans 500 · 11/1.3 · +0.06em", sample: "Mention rate" },
  { cls: "font-mono text-data tabular", name: "data", spec: "Plex Mono · 13/1.4 · tabular", sample: "33.0% ±4 · n=594 · gpt-5.1-search · 2026-11-09 03:14" },
];

const FAMILIES = [
  { cls: "font-serif", name: "Newsreader", why: "Editorial text serif with an optical-size axis: sharp at 56px, sturdy small. Serious publication, not quirky (Fraunces) or trendy (Instrument Serif)." },
  { cls: "font-sans", name: "IBM Plex Sans", why: "Engineered and slightly technical, with true tabular figures. Reads as an instrument; avoids the default-Inter look." },
  { cls: "font-mono", name: "IBM Plex Mono", why: "Same skeleton as Plex Sans; unambiguous 0/O and 1/l for model IDs, keys and numbers." },
];

function Ratio({ value, min }: { value: number; min: number }) {
  const pass = value >= min;
  return (
    <span className={pass ? "text-ink" : "text-down"}>
      {value.toFixed(2)}:1 {pass ? (value >= 7 && min === 4.5 ? "AAA" : "pass") : "below"}
    </span>
  );
}

export default function BrandPage() {
  return (
    <>
    <PreviewHeader />
    <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
      <Link href="/design" className="text-small text-ink-3 hover:text-ink hover:underline">← Design previews</Link>
      <h1 className="mt-4 font-serif text-h1">Brand</h1>
      <p className="mt-2 max-w-prose text-ink-2">
        Highlighter palette, light only. The one bright colour is a highlighter pen: it marks your brand in an answer, your
        confidence band, the single hero action and what&apos;s selected. Everything else is ink on paper.
      </p>
      <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-small text-ink-3">
        {["logo", "favicon", "og", "colour", "series", "type", "space", "contrast"].map((s) => (
          <a key={s} href={`#${s}`} className="hover:text-ink hover:underline">{s}</a>
        ))}
      </nav>

      <Section id="logo" title="Logo" intro="A lowercase r sliced by a lime highlighter band: the product highlights businesses inside AI answers. The gap around the band is a real mask, so the logo sits on any background.">
        <div className="grid gap-4 lg:grid-cols-3">
          {([
            { tone: "default", ground: "bg-surface", label: "Default · ink + lime" },
            { tone: "mono", ground: "bg-fill", label: "Mono · currentColor" },
            { tone: "white", ground: "bg-ink", label: "White · on ink" },
          ] as const).map((t) => (
            <figure key={t.tone} className={`rounded-lg border border-line p-6 ${t.ground}`}>
              <div className={`flex flex-col items-start gap-6 ${t.tone === "mono" ? "text-ink" : ""}`}>
                <Logo variant="full" tone={t.tone} height={32} />
                <div className="flex items-end gap-5">
                  <Logo variant="mark" tone={t.tone} height={64} />
                  <Logo variant="mark" tone={t.tone} height={32} />
                  <Logo variant="mark" tone={t.tone} height={24} />
                  <Logo variant="mark" tone={t.tone} height={16} />
                </div>
                <Logo variant="wordmark" tone={t.tone} height={20} />
              </div>
              <figcaption className={`mt-5 text-micro uppercase ${t.tone === "white" ? "text-white" : "text-ink-3"}`}>{t.label}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-6">
            <h3 className="text-h4 font-semibold">Sizes and clear space</h3>
            <ul className="mt-3 space-y-1.5 text-small text-ink-2">
              <li>Mark: 16px minimum, using the favicon tile below that size is legible.</li>
              <li>Full lockup: 96px wide minimum.</li>
              <li>Clear space: the height of the lime band on every side of the mark.</li>
            </ul>
            <div className="mt-5 inline-flex items-center border border-dashed border-line-strong p-[6px]">
              <Logo variant="full" height={32} />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-6">
            <h3 className="text-h4 font-semibold">Don&apos;t</h3>
            <ul className="mt-3 space-y-1.5 text-small text-ink-2">
              <li>Recolour the band (it is always lime, or currentColor in mono).</li>
              <li>Rotate the mark; the band&apos;s angle is part of the drawing.</li>
              <li>Add effects, glows or shadows.</li>
              <li>Stretch or squash it.</li>
              <li>Put the lime band on a lime background.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id="favicon" title="Favicon and app icons" intro="Generated from the same drawing: app/icon.svg, app/favicon.ico, app/apple-icon.png and the 192/512 manifest icons.">
        <div className="flex flex-wrap items-end gap-8 rounded-lg border border-line bg-surface p-6">
          {[
            { src: "/icon.svg", size: 16, label: "16 SVG" },
            { src: "/icon.svg", size: 24, label: "24 SVG" },
            { src: "/icon.svg", size: 32, label: "32 SVG" },
            { src: "/icon-192.png", size: 48, label: "192 PNG @48" },
            { src: "/apple-icon.png", size: 90, label: "apple-icon 180 @90" },
            { src: "/icon-512.png", size: 128, label: "512 PNG @128" },
          ].map((f) => (
            <figure key={f.label} className="flex flex-col items-start gap-2">
              <img src={f.src} alt="" width={f.size} height={f.size} />
              <figcaption className="font-mono text-micro text-ink-3">{f.label}</figcaption>
            </figure>
          ))}
          <figure className="flex flex-col items-start gap-2">
            <div className="flex h-8 items-center gap-2 rounded-t-md border border-b-0 border-line bg-fill px-3 text-small">
              <img src="/icon.svg" alt="" width={16} height={16} />
              Recommendr · Overview
            </div>
            <figcaption className="font-mono text-micro text-ink-3">in a tab</figcaption>
          </figure>
        </div>
      </Section>

      <Section id="og" title="Open Graph image" intro="1200×630, the default og:image and twitter:image for every page.">
        <img src="/brand/og-image.png" alt="Open Graph image: Ask ChatGPT about your industry. See if it mentions you." width={1200} height={630} className="h-auto w-full max-w-3xl rounded-lg border border-line" />
      </Section>

      <Section id="colour" title="Colour" intro="Every token in the system. Tailwind's default palette is disabled, so nothing else exists.">
        <div className="space-y-8">
          {COLORS.map((g) => (
            <div key={g.group}>
              <h3 className="text-micro uppercase text-ink-3">{g.group}</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((c) => (
                  <li key={c.token} className="flex gap-3 rounded-lg border border-line bg-surface p-3">
                    <span className="size-12 shrink-0 rounded-md border border-line" style={{ background: c.hex }} aria-hidden />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{c.token}</span>
                        <span className="font-mono text-small text-ink-3">{c.hex}</span>
                        {c.bgOnly ? <span className="rounded-sm border border-line px-1 text-micro uppercase text-ink-3">background only</span> : null}
                      </span>
                      <span className="block text-small text-ink-2">{c.role}</span>
                      <span className="block text-small text-ink-3">{c.rule}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-lg border border-line bg-surface p-5">
          <p className="text-micro uppercase text-ink-3">The highlighter in use</p>
          <p className="mt-2 max-w-prose">
            For Sindhi-style biryani, <mark className="rounded-xs bg-lime px-0.5 text-lime-ink">Dera Biryani House</mark> is the name that
            comes up most, ahead of <span className="underline decoration-teal decoration-2 underline-offset-4">Shahi Handi</span>.
          </p>
        </div>
      </Section>

      <Section id="series" title="Chart series" intro="Your brand is always ink. Data colours carry a dash pattern and a direct label so colour is never the only cue.">
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {SERIES.map((s) => (
            <li key={s.label} className="flex items-center gap-4 px-4 py-3">
              <svg width="120" height="16" aria-hidden className="shrink-0">
                {s.label === "Your brand" ? <rect x="0" y="2" width="120" height="12" fill={HEX.limeSoft} /> : null}
                <line x1="0" y1="8" x2="120" y2="8" stroke={s.hex} strokeWidth={s.width} strokeDasharray={s.dash} />
              </svg>
              <span className="w-56 text-small font-medium">{s.label}</span>
              <span className="font-mono text-small text-ink-3">{s.hex} · {s.width}px · {s.note}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="type" title="Type" intro="Editorial serif for headlines, an engineered sans for UI, mono for numbers. All self-hosted with next/font.">
        <div className="grid gap-4 md:grid-cols-3">
          {FAMILIES.map((f) => (
            <div key={f.name} className="rounded-lg border border-line bg-surface p-5">
              <p className={`${f.cls} text-h2`}>Aa 0123</p>
              <p className="mt-2 font-medium">{f.name}</p>
              <p className="mt-1 text-small text-ink-2">{f.why}</p>
            </div>
          ))}
        </div>
        <dl className="mt-8 divide-y divide-line border-y border-line">
          {TYPE.map((t) => (
            <div key={t.name} className="grid gap-2 py-4 md:grid-cols-[160px_1fr]">
              <dt>
                <span className="font-mono text-small">{t.name}</span>
                <span className="block text-small text-ink-3">{t.spec}</span>
              </dt>
              <dd className={`${t.cls} min-w-0 break-words`}>{t.sample}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="space" title="Space, radius, elevation, motion">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-micro uppercase text-ink-3">4px grid</p>
            <div className="mt-4 space-y-2">
              {[4, 8, 12, 16, 24, 32, 48].map((px) => (
                <div key={px} className="flex items-center gap-3">
                  <span className="w-10 font-mono text-small tabular text-ink-3">{px}</span>
                  <span className="h-3 bg-ink" style={{ width: px * 3 }} aria-hidden />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-micro uppercase text-ink-3">Radius</p>
            <div className="mt-4 flex flex-wrap gap-4">
              {[
                ["xs", "rounded-xs", "2px · marks"],
                ["sm", "rounded-sm", "4px · badges"],
                ["md", "rounded-md", "6px · controls"],
                ["lg", "rounded-lg", "8px · panels"],
              ].map(([n, cls, d]) => (
                <div key={n} className="text-center">
                  <div className={`size-16 border border-ink-3 bg-fill ${cls}`} />
                  <p className="mt-1 font-mono text-micro text-ink-3">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-micro uppercase text-ink-3">Elevation</p>
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="w-40 rounded-lg border border-line bg-surface p-3 text-small">Card: 1px border, no shadow</div>
              <div className="w-40 rounded-lg border border-line bg-surface p-3 text-small shadow-overlay">Floating layer: border + overlay shadow</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5 lg:col-span-2">
            <p className="text-micro uppercase text-ink-3">Motion</p>
            <table className="mt-3 w-full text-left text-small">
              <tbody className="divide-y divide-line">
                {[
                  ["fast · 120ms", "hover, press, colour change"],
                  ["base · 180ms", "menus, popovers, tooltips (fade + 4px rise)"],
                  ["slow · 240ms", "dialogs, sheets (slide)"],
                  ["never", "numbers, charts, layout, page transitions: an instrument doesn't perform"],
                ].map(([a, b]) => (
                  <tr key={a}><td className="w-40 py-2 font-mono text-ink-3">{a}</td><td className="py-2">{b}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section id="contrast" title="Contrast" intro="Every text/background pair the UI uses, computed from the token values. Normal text needs 4.5:1; graphics need 3:1.">
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-small">
            <thead className="bg-fill text-micro uppercase text-ink-3">
              <tr><th className="px-3 py-2">Sample</th><th className="px-3 py-2">Text on background</th><th className="px-3 py-2 text-right">Ratio</th><th className="px-3 py-2">Used for</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {TEXT_PAIRS.map(([fg, bg, use]) => (
                <tr key={`${fg}-${bg}`}>
                  <td className="px-3 py-2"><span className="rounded-sm border border-line px-2 py-0.5" style={{ color: T[fg], background: T[bg] }}>Aa 33%</span></td>
                  <td className="px-3 py-2 font-mono">{fg} on {bg}</td>
                  <td className="px-3 py-2 text-right font-mono tabular"><Ratio value={ratio(T[fg], T[bg])} min={4.5} /></td>
                  <td className="px-3 py-2 text-ink-2">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-small">
            <thead className="bg-fill text-micro uppercase text-ink-3">
              <tr><th className="px-3 py-2">Mark</th><th className="px-3 py-2">On surface</th><th className="px-3 py-2 text-right">Ratio (≥ 3:1)</th><th className="px-3 py-2">Used for</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MARK_PAIRS.map(([mk, use]) => (
                <tr key={mk}>
                  <td className="px-3 py-2"><span className="block h-1 w-16" style={{ background: T[mk] }} aria-hidden /></td>
                  <td className="px-3 py-2 font-mono">{mk}</td>
                  <td className="px-3 py-2 text-right font-mono tabular"><Ratio value={ratio(T[mk], T.surface)} min={3} /></td>
                  <td className="px-3 py-2 text-ink-2">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-prose text-small text-ink-2">
          <strong className="font-semibold">Mitigation:</strong> sky, amber and stone are below 3:1 on white and input borders are
          1.49:1. Chart series therefore always carry a dash pattern, a direct ink label and an accessible data table, and data
          colours are never used for text. Inputs always have a visible label and the 2px ink focus ring.
        </p>
      </Section>
    </main>
      <PreviewFooter />
      </>
  );
}
