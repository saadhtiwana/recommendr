# Recommendr Design System

> Phase 1b. Palette: **Highlighter** (final). Light theme only.
> Tokens live in [`web/src/app/globals.css`](../../web/src/app/globals.css); contrast is verified by
> [`web/scripts/check-contrast.mjs`](../../web/scripts/check-contrast.mjs). Preview pages: `/design/*`
> (development only, see [Preview pages](#preview-pages)).

## 1. Direction

> **Revised (v2, after review):** the first pass ("a measuring instrument with an editorial feel":
> serif headlines, paper tones, hairline borders) read as generic and was rejected. v2 follows the
> references the product owner chose: soft framed pages, tight modern grotesk type, white rounded
> cards, real imagery and motion on the marketing site. The honesty rules (intervals, muted
> non-significant changes, no zeros for missing data) are unchanged.

**Look:** the page is a large rounded frame (`bg`, 24 to 32px radius) floating on a soft grey
`canvas`. Inside it, white cards (`surface`, 20px radius, no borders, no shadows) carry the
content. Headlines are big, tight Geist (negative tracking, often with the second half of the
sentence in muted grey: "Measured where *customers ask.*"). Very few colours: ink, greys, the lime
highlighter, and data colours inside charts.

**Marketing site:** motion is part of the brand. Headlines come into focus word by word (blur to
sharp), a fanned stack of real AI-answer cards springs open in the hero, floating chips annotate
it, sections reveal as they scroll in, a statement sentence fills in as you scroll, marquees
carry the assistant names and the lime band. Real footage and photos of the kinds of businesses we
serve (see Imagery). Every animation respects `prefers-reduced-motion`.

**Product (dashboard):** calm and data-first like the marketing site's cards: framed shell, white
sidebar card, KPI cards with soft change badges, smooth area charts with confidence bands. No
stock imagery in the product.

**Banned:** purple/indigo/violet; gradient blobs or glows; glassmorphism; emoji as icons; grids of
three identical feature cards; fake social proof (names, quotes, ratings or logos implying
customers we don't have); filler copy ("seamless", "elevate", "unleash", "supercharge",
"revolutionize", "effortlessly", "game-changer"). Tailwind's default colour palette is
**disabled** in `globals.css` (`--color-*: initial`).

## 2. Colour: the Highlighter palette

| Token | Hex | Role |
|---|---|---|
| `canvas` | `#E7E8EA` | The soft grey the framed page floats on |
| `bg` | `#F5F5F6` | The page frame; white cards read as raised on it without borders or shadows |
| `surface` | `#FFFFFF` | Cards, tables, inputs |
| `fill` | `#F0F0F2` | Subtle fills: table headers, wells, code blocks, hover |
| `line` | `#E8E8EB` | Hairline borders and grid lines |
| `line-strong` | `#D6D7DB` | Control borders, dividers that must be seen |
| `ink` | `#111311` | Primary text, the user's brand in charts, primary buttons, focus rings |
| `ink-2` | `#45484D` | Secondary text |
| `ink-3` | `#5F636A` | Muted text: labels, footnotes, timestamps, non-significant deltas (darkened from #6B6F76 so it passes AA on fills and on the canvas) |
| `lime` | `#D6F69A` | **The highlighter.** Primary pill buttons, brand mention marker, selected state, chips |
| `lime-deep` | `#C4EC74` | Hover / pressed state of lime elements |
| `lime-soft` | `#F0FBD9` | Confidence bands, soft highlights, soft tags, added lines in diffs |
| `lime-ink` | `#1B4249` | **The only text colour on lime surfaces** (deep teal-ink, 9.1:1 on lime). Never black on lime |
| `on-dark` | `#FFFFFF` | Headlines over darkened imagery (hero video, photos) |
| `on-dark-2` | `#DBDDDE` | Body text over darkened imagery |
| `teal` | `#1F8A8A` | Data series 1 (ChatGPT; competitor #1) |
| `sky` | `#4C9BE8` | Data series 2 (Gemini; competitor #2) |
| `amber` | `#E8A33D` | Data series 3 (Perplexity; competitor #3) |
| `rose` | `#E06C75` | Data series 4 (Claude; competitor #4) |
| `stone` | `#9CA3AF` | "Others" / aggregate series |
| `up` | `#15803D` | Significant increase (always with ↗ arrow) |
| `down` | `#B91C1C` | Significant decrease (always with ↘ arrow) |
| `up-soft` / `down-soft` | `#EAF7EE` / `#FBE7E7` | Soft change badges; text in `up` / `down` |
| `up-soft` / `down-soft` | `#EAF7EE` / `#FBE7E7` | Soft change badges ("+7.1 pts"); text in `up` / `down` |

**Why these engine assignments:** none of the engines gets its provider's brand colour (OpenAI's
green, Google's blue, Perplexity's teal-blue, Anthropic's clay). Brand colours would imply
endorsement and fight each other; ours are neutral data colours assigned once and used everywhere
([`web/src/lib/palette.ts`](../../web/src/lib/palette.ts)). Competitors take data colours in rank
order; "others" is always stone. The user's brand is never a data colour: it's always **ink**.

### Usage rules

1. **Lime is a highlighter, never ink.** Use it only as a *background*: primary pill buttons,
   highlighted brand mentions in answer cards, selected states, chips and key tags, chart confidence
   bands. **Never** use lime for text, icons, thin lines or borders on white. **Text on any lime
   surface is `lime-ink` #1B4249, never black.** *Why:* lime on white is about 1.3:1, invisible as
   a line; behind deep teal-ink it is 9.1:1 and reads like a marker pen, the product's metaphor.
   Teal-ink instead of black keeps lime elements calm and slightly softer than the ink body text.
2. **Buttons are pills.** `primary` = ink pill with white text (18.7:1); `accent` = **lime pill
   with lime-ink text**, reserved for the one standout action in a view (the hero's "Run the free
   check"); `secondary` = white pill with a hairline. A small **up-right arrow** marks actions that
   leave the page (`leavesPage`).
3. **Charts:** the user's brand is a **thick ink line (2.5px)** with its **confidence band filled
   in lime-soft**; competitors and engines use the data colours with **thinner lines (1.5px)**
   and their own dash pattern; **non-significant changes render muted**. *Why:* the eye should
   find "me" first and see "how sure are we" as part of the line, not as a footnote.
4. **Answer cards:** the brand mention is highlighted with a **lime background, like a marker**;
   competitors get a **2px underline in their data colour**; citations are **numbered footnotes in
   muted text**. *Why:* this is how a careful reader annotates a printout, and it makes the
   product's most recognizable component readable at a glance.
5. **Focus rings: 2px ink with a 2px offset, never lime.** *Why:* a focus indicator must contrast
   3:1 with its surroundings. Lime doesn't on white.
6. **Lime should cover only a small share of any screen** (rule of thumb: under 5% of pixels,
   a few marks per view). *Why:* a highlighter used everywhere highlights nothing.
7. **Change is never colour alone:** up/down always pair the colour with an arrow and an
   accessible label; non-significant changes use muted text and a flat arrow.

### Contrast (verified)

Generated by `node scripts/check-contrast.mjs` (exits non-zero if any text pair fails AA). Every
text/background pair the UI actually uses:

<!-- BEGIN:contrast (generated) -->
### Text on background (WCAG 2.x AA: 4.5:1 normal text)

| Text | Background | Ratio | Result | Used for |
|---|---|---|---|---|
| `ink` #111311 | `bg` #F5F5F6 | 17.13:1 | AA pass (AAA) | body text on page |
| `ink` #111311 | `surface` #FFFFFF | 18.67:1 | AA pass (AAA) | body text on cards |
| `ink` #111311 | `fill` #F0F0F2 | 16.40:1 | AA pass (AAA) | text in subtle fills, table header |
| `ink-2` #45484D | `bg` #F5F5F6 | 8.43:1 | AA pass (AAA) | secondary text on page |
| `ink-2` #45484D | `surface` #FFFFFF | 9.18:1 | AA pass (AAA) | secondary text on cards |
| `ink-2` #45484D | `fill` #F0F0F2 | 8.07:1 | AA pass (AAA) | secondary text in fills |
| `ink-3` #5F636A | `bg` #F5F5F6 | 5.54:1 | AA pass | muted text, labels, footnotes, non-significant deltas |
| `ink-3` #5F636A | `surface` #FFFFFF | 6.04:1 | AA pass | muted text on cards |
| `ink-3` #5F636A | `fill` #F0F0F2 | 5.30:1 | AA pass | muted text in fills |
| `lime-ink` #1B4249 | `lime` #D6F69A | 9.11:1 | AA pass (AAA) | primary pill buttons, highlighted brand mention, selected nav, chips |
| `lime-ink` #1B4249 | `lime-deep` #C4EC74 | 8.11:1 | AA pass (AAA) | primary pill hover/pressed |
| `lime-ink` #1B4249 | `lime-soft` #F0FBD9 | 10.15:1 | AA pass (AAA) | soft tags, tinted pricing column, added diff lines |
| `on-dark` #FFFFFF | `overlay` #0B0D0B | 19.51:1 | AA pass (AAA) | headline over darkened imagery (overlay floor; video frame check in phase 2 of the landing work) |
| `on-dark-2` #DBDDDE | `overlay` #0B0D0B | 14.31:1 | AA pass (AAA) | body text over darkened imagery |
| `white` #FFFFFF | `ink` #111311 | 18.67:1 | AA pass (AAA) | primary button text |
| `up` #15803D | `up-soft` #EAF7EE | 4.55:1 | AA pass | positive change badge |
| `down` #B91C1C | `down-soft` #FBE7E7 | 5.45:1 | AA pass | negative change badge |
| `ink-3` #5F636A | `canvas` #E7E8EA | 4.92:1 | AA pass | muted text on the canvas |
| `up` #15803D | `bg` #F5F5F6 | 4.60:1 | AA pass | positive delta text |
| `up` #15803D | `surface` #FFFFFF | 5.02:1 | AA pass | positive delta on cards |
| `down` #B91C1C | `bg` #F5F5F6 | 5.94:1 | AA pass | negative delta text |
| `down` #B91C1C | `surface` #FFFFFF | 6.47:1 | AA pass | negative delta on cards |

### Graphics on cards (WCAG 1.4.11 non-text contrast: 3:1)

| Mark | On | Ratio | Result | Used for |
|---|---|---|---|---|
| `ink` #111311 | `surface` | 18.67:1 | pass | brand line in charts, focus ring |
| `teal` #1F8A8A | `surface` | 4.15:1 | pass | data series |
| `sky` #4C9BE8 | `surface` | 2.93:1 | below 3:1, see mitigation | data series |
| `amber` #E8A33D | `surface` | 2.16:1 | below 3:1, see mitigation | data series |
| `rose` #E06C75 | `surface` | 3.20:1 | pass | data series |
| `stone` #9CA3AF | `surface` | 2.54:1 | below 3:1, see mitigation | 'other' series |
| `line-strong` #D6D7DB | `surface` | 1.44:1 | below 3:1, see mitigation | input borders |

### Chart series separation under colour-vision deficiency (min pairwise ΔE76)

| Vision | Closest pair | ΔE |
|---|---|---|
| normal | teal / stone | 31.9 |
| protan | teal / rose | 11.7 |
| deutan | teal / stone | 16.6 |
| tritan | teal / sky | 14.2 |
<!-- END:contrast -->

**Known limitation and mitigation:** `sky` (2.93:1), `amber` (2.16:1) and `stone` (2.54:1) are
below the 3:1 WCAG 1.4.11 guideline for graphics, and `line-strong` input borders are 1.49:1.
These are the chosen palette values, so we never rely on them alone:

- **Every chart series** is also identified by a **dash pattern** (`DASH` in `palette.ts`),
  a **direct end-of-line label** in ink, and a **data table** for screen readers. Data colours are
  never used for text.
- **Inputs** always have a visible text label, and get the 2px ink focus ring; the placeholder is
  never the only label.
- Series stay distinguishable under colour-vision deficiency (Machado 2009 simulation): minimum
  pairwise ΔE ≥ 11.7 for protanopia, 16.6 for deuteranopia and 14.2 for tritanopia (table above).

### Text over imagery

Over the hero video and photos, headlines use `on-dark` (#FFFFFF) and body text `on-dark-2`
(#DBDDDE), always on a dark gradient overlay that is strongest where the text sits. The table above
checks them against the overlay's darkest-required floor (#0B0D0B); the real check is against the
**brightest frame of the video under the overlay**, done when the hero video is added.

## 3. Typography

| Role | Family | Why |
|---|---|---|
| Headlines and UI | **Geist** | A tight, modern grotesk that holds up at 90px with −0.055em tracking and stays clean at 13px. One family for everything keeps the look calm. (`font-serif` is kept as an alias to Geist so older classes still work.) |
| Numbers, percentages, timestamps, model IDs, code | **Geist Mono** | Same proportions as Geist; tabular figures for columns of numbers. |

Both are self-hosted through `next/font/google` (downloaded at build, served from our domain,
size-adjusted fallbacks so there's no layout shift).

| Token | Size / line-height / tracking | Use |
|---|---|---|
| `text-hero` | 88 / 0.98 / −0.055em | Landing hero (fluid with `clamp`) |
| `text-display` | 60 / 1 / −0.045em | Section headlines on marketing pages |
| `text-h1` | 40 / 1.05 / −0.035em | Page titles in the app ("Overview") |
| `text-h2` | 30 / 1.15 / −0.03em | Card headline numbers, sub-sections |
| `text-h3` | 20 / 1.3 / −0.015em | Panel titles |
| `text-h4`, `text-body`, `text-small`, `text-micro`, `text-data` | 16 / 15 / 13 / 11 / 13 | UI text; `text-data` is mono |

Tabular numerals wherever data appears (`tabular`).

## Imagery

Footage and stills come from **Mixkit** (free commercial license, no attribution required) and
are downloaded, re-encoded and served from `/public/media` (never hotlinked). Every file is
recorded in [`web/public/media/CREDITS.md`](../../web/public/media/CREDITS.md);
`pnpm media` reproduces them (`web/scripts/fetch-media.mjs`, needs ffmpeg).

- Video: 8 to 10 s loops, no audio, 1280×720, H.264 + VP9, posters in JPG and AVIF; all four clips
  together are about 4 MB. Video plays only on the client after first paint and never with
  `prefers-reduced-motion` or Save-Data (poster only). Text on video sits on a dark gradient.
- Photos: one consistent treatment: 4:5 crop, 20px radius, a slight warm grade
  (`saturate(0.92) sepia(0.06)`).
- **Rules:** never attach names, quotes, ratings or company names to stock people; never present
  them as customers or testimonials (no testimonials section until we have real users); no stock
  imagery inside the dashboard or product UI.

## 4. Space, shape, elevation

- **Spacing:** 4px grid. Cards pad 20px; app sections gap 16px; marketing sections 80 to 112px.
- **Radius:** `sm 6px` (chips, kbd), `md 10px` (inputs), `lg 20px` (cards), `xl 28px` (the page
  frame, media panels); buttons and badges are full pills.
- **Elevation:** white cards on the light-grey frame need no border or shadow. `shadow-frame` lifts
  the whole page off the canvas; `shadow-overlay` is for menus, dialogs and toasts; the landing
  page's floating cards use a soft long shadow.

## 5. Motion

| What | How |
|---|---|
| Headline words | blur 8px → 0, fade, 6px rise, 45ms stagger, 600ms, ease `[0.22, 1, 0.36, 1]` |
| Hero fan | spring (stiffness 70, damping 16) from a stacked pile to the fan, staggered from the centre out; hover lifts a card |
| Floating chips | slow vertical bob (4 to 5 s loop) |
| Section reveals | fade + 24px rise + blur, once, when 15% visible |
| Statement sentence | words fill from 18% to 100% opacity, tied to scroll position |
| Marquees | linear, 30 to 40 s per loop |
| Video carousel | crossfade + slight scale-down, 9 s per slide with a progress bar |
| App UI | 120 to 240ms state changes and overlays only |

**Never animate** numbers (no count-ups), chart data (no draw-ins) or layout. All of it switches
off with `prefers-reduced-motion` (and video never loads then).

## 6. Layers

`z-sticky 10` (sticky table headers, top bars) · `z-dropdown 40` · `z-overlay 50` (dialog
backdrop) · `z-modal 60` · `z-toast 70` · `z-tooltip 80`. Never use ad-hoc z-index numbers.

## 7. Components

`web/src/components/ui/` (Radix primitives via `radix-ui`, styled from scratch) and
`web/src/components/charts/` (visx, no default chart theme).

| Group | Components |
|---|---|
| Actions | Button (primary, secondary, ghost, destructive, hero), Kbd, DropdownMenu, CommandPalette (Cmd/Ctrl+K) |
| Inputs | Input, Textarea, Field, Select, Combobox, Checkbox, Switch, Radio, SecretField / NewSecretInput |
| Structure | Panel, Tabs, DataTable (dense, sortable, sticky header), Dialog, Sheet, Tooltip, Toast, EmptyState, Skeleton |
| Data | Badge, Delta, IntervalValue ("62% ±9"), MetricTile, Meter, Sparkline, EngineLabel |
| AI answers | AnswerCard, CitationRef, SourceList |
| Agents & fixes | ApprovalCard (spend / publish), CodeBlock (copy), DiffView |
| Charts | LineCI (confidence bands, model-change annotations), SovBars, RankTable, EngineComparison, SourceBars, FanoutList, CrawlerHeatmap, ChartLegend |

**Uncertainty is the visual signature:**
- Rates render as **`62% ±9`**: the ± half-width is part of the number, in muted mono, with the
  exact interval and *n* in a tooltip and screen-reader text.
- Time series carry their **confidence band**; model changes are annotated with a dashed rule.
- **Non-significant changes look muted** (ink-3, flat arrow); only significant changes get colour.
- Missing data is a **hatched gap labelled "incomplete"**, never a zero.

**Keyboard-first:** Cmd/Ctrl+K command palette everywhere in the app; visible `Kbd` hints on
primary actions; every control reachable and operable by keyboard with the ink focus ring.

**Skeletons match the final layout** (same heights and columns) so nothing shifts when data
arrives; fonts use size-adjusted fallbacks for the same reason.

## 8. Logo

**Concept: a lowercase "r" sliced by a lime highlighter band.** The product's core act is
highlighting a business inside an AI answer; the logo does the same to its own initial. The band
is the same lime as the brand-mention highlight in answer cards, so the logo teaches the
product's visual language. The heavy, rounded "r" stays legible at favicon size, and the
diagonal band gives the mark motion without decoration.

**The knockout gap is a real mask.** The band is separated from the letter by a 1-unit gap made
with an SVG `<mask>` that removes that part of the "r". It is not a white stroke, so the gap shows
whatever is behind the logo and the mark works on paper, white, ink, photos or tinted panels.

| Asset | Use |
|---|---|
| `components/brand/logo.tsx` | **Use this in the app.** Inline SVG (no `<img>`, no extra request). `variant`: `mark` · `full` · `wordmark`. `tone`: `default` (ink + lime) · `mono` (currentColor) · `white` (white letter, lime band; for ink/photo backgrounds). Accessible: `role="img"`, `aria-label="Recommendr"`. Mask ids come from `useId`, so several logos can share a page |
| `public/brand/logo-mark.svg`, `logo-full.svg`, `logo-mark-mono.svg`, `wordmark.svg` | Static files for docs, email, press, the README |
| `src/app/icon.svg` | Favicon (paper tile + mark), App Router `icon` convention |
| `src/app/favicon.ico` | 16/32/48px PNG-in-ICO for legacy browsers and crawlers |
| `src/app/apple-icon.png` | 180px Apple touch icon |
| `public/icon-192.png`, `public/icon-512.png` | Web app manifest icons (`src/app/manifest.ts`) |
| `public/brand/og-template.svg` → `og-image.png` | 1200×630 default Open Graph and Twitter image (root layout metadata) |

All PNG/ICO files are generated from the SVGs by `node scripts/gen-brand.mjs`.

**Wordmark:** "Recommendr" set in Geist (weight 600, −0.035em tracking) with the font's own
kerning (shaped with HarfBuzz), +0.004em tracking, outlined to paths so it renders identically
without the font. The cap height matches the mark's body.

**Minimum sizes:** mark **16px** (use the favicon variant, the paper tile, at 16 to 20px); full
lockup **96px wide**.

**Clear space:** at least **the height of the lime band** on every side of the mark (and of the
full lockup).

**Don'ts:**
- Don't recolour the band. It is lime, or currentColor in the mono version.
- Don't rotate the mark. The band's angle is part of the drawing.
- Don't add effects: no shadows, glows, gradients or outlines.
- Don't stretch, squash or re-space the lockup.
- Never place the lime band on a lime background.

## Assistant logos

ChatGPT/OpenAI, Gemini, Perplexity and Claude marks come from Simple Icons (CC0 SVGs,
`web/public/logos/`, component `EngineLogo`). They are shown in one colour (`currentColor`) only
to name the assistants we query; they're trademarks of their owners and imply no endorsement.

## 9. Copy voice

Short. One line per idea; if nobody would read it, cut it. Plain, specific, numbers over adjectives.

- Hero: *"Ask ChatGPT about your industry. See if it mentions you."*
- Proof: *"We asked ChatGPT 'best biryani in Islamabad' 10 times. You appeared 3 times. Your top
  competitor appeared 8."*
- Open source: *"Free and open source. Bring your own API keys, or self-host it."*
- Uncertainty is stated, not hidden: "33% ±4 (594 answers)", "Not a significant change".
- Expected impact is a range, never a promise: "+4 to +11 pts on 3 questions".

## 10. Preview pages

Development-only routes under `/design`, written as `page.dev.tsx` files. `next.config.ts`
registers the `dev.tsx` page extension **only outside production**, so `next build` never emits
them. Stop `pnpm dev` before running `pnpm build`: the dev server's generated route types include
`/design`, and the production type-check would pick them up. Mock data ([`web/src/lib/mock.ts`](../../web/src/lib/mock.ts)) uses **fictional**
businesses, because previews show false facts and competitor gaps.

| Route | What to judge |
|---|---|
| `/design/brand` | Logo in every variant and tone, favicon and app icons, OG image, colour and type sheets, contrast table |
| `/design/palettes` | Highlighter (chosen) vs the earlier "Instrument" vermilion candidate, for reference |
| `/design/components` | Every component in every state |
| `/design/landing` | Marketing homepage |
| `/design/dashboard` | Project overview |
| `/design/prompt` | Single prompt detail |
| `/design/actions` | Fix plan with generated fix, diff and approval |
| `/design/agent` | Agent chat with citations, step trace, approval |
| `/design/agent-analytics` | robots.txt audit, crawler heatmap, AI referrals |
| `/design/settings` | Key vault, usage and quotas, MCP connection, team |
| `/design/agency` | Cross-client overview, white-label report |
| `/design/onboarding` | Create-project flow |

## 11. How phase 8 must use this system

1. **Tokens only.** Use the Tailwind token classes (`bg-surface`, `text-ink-3`, `border-line`,
   …). No raw hex in components except SVG charts, which import `HEX` from `palette.ts`. No new
   colours without an ADR-style note in this document and a re-run of `check-contrast.mjs`.
2. **Compose, don't restyle.** Build pages from `components/ui` and `components/charts`. If a
   component is missing, add it to the library (with a `/design/components` entry), not inline in
   a page.
3. **Follow the Highlighter rules** (section 2) on every screen: primary calls to action are lime
   pills (`leavesPage` arrow when they navigate away), secondary actions ink or outline, text on
   lime is always `lime-ink`, brand = ink line + lime-soft band, focus ring = ink.
4. **Every rate is an `IntervalValue`, every change is a `Delta`** with its `significant` flag
   from the API. Never show a bare percentage or a coloured change without significance.
5. **Missing data is "incomplete", never zero** (ADR-0020): charts show a hatched gap, tables say
   "incomplete" or "blocked: add your key".
6. **Marketing pages** are statically rendered, semantic HTML (`header`, `main`, `section`,
   `article`, `footer`), with JSON-LD and `llms.txt`; the landing preview is the template.
7. **Dashboard pages** fetch through the typed client generated from the OpenAPI schema, render
   skeletons with the final layout, and register their actions in the command palette.
8. **Accessibility gates:** keyboard path for every action, visible focus, labels on all inputs,
   charts with an accessible summary and data table, contrast re-verified for any new pair.
9. **Responsive:** check 1440, 1024 and 390px. Below 1024px the sidebar collapses into a sheet;
   tables scroll horizontally inside their panel (sticky first column); charts keep their
   labels.
10. **Copy** follows section 9; run the banned-word list in review.
