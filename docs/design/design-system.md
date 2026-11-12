# Recommendr Design System

> Phase 1b. Palette: **Highlighter** (final). Light theme only.
> Tokens live in [`web/src/app/globals.css`](../../web/src/app/globals.css); contrast is verified by
> [`web/scripts/check-contrast.mjs`](../../web/scripts/check-contrast.mjs). Preview pages: `/design/*`
> (development only, see [Preview pages](#preview-pages)).

## 1. Direction

**"A measuring instrument with an editorial feel."** Recommendr reports facts about how AI
assistants see a business, with honest uncertainty. The interface should feel like a precise
scientific instrument crossed with a serious publication: calm, exact, trustworthy,
information-dense, never decorative.

The signature idea of the Highlighter palette: **the product's job is to find where *you* are
mentioned, so the one bright colour on screen is a highlighter pen.** It marks your brand in an
AI answer, your confidence band in a chart, the single most important call to action, and what's
selected. Everything else is ink on paper.

What we deliberately avoid: the dark "Linear clone" look (near-black canvas, purple accent,
glassmorphism, glows), which has become the default output of AI design tools and reads as
generic.

**Banned:** purple/indigo/violet; gradient blobs or glows; glassmorphism; emoji as icons; grids of
three identical feature cards; stock illustrations of people; filler copy ("seamless",
"elevate", "unleash", "supercharge", "revolutionize", "effortlessly", "game-changer");
unstyled default component-library looks; centered-everything layouts. Tailwind's default colour
palette is **disabled** in `globals.css` (`--color-*: initial`), so `indigo-500` can't be
used by accident.

## 2. Colour: the Highlighter palette

| Token | Hex | Role |
|---|---|---|
| `bg` | `#FAFAF8` | Page background: a barely warm paper, so white cards read as raised without shadows |
| `surface` | `#FFFFFF` | Cards, tables, inputs |
| `fill` | `#F2F2EE` | Subtle fills: table headers, wells, code blocks, hover |
| `line` | `#E5E5E0` | Hairline borders and grid lines |
| `line-strong` | `#D4D4CE` | Control borders, dividers that must be seen |
| `ink` | `#111311` | Primary text, the user's brand in charts, primary buttons, focus rings |
| `ink-2` | `#4B4F4B` | Secondary text |
| `ink-3` | `#6B706B` | Muted text: labels, footnotes, timestamps, non-significant deltas (passes AA everywhere it is used, no darkening needed) |
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
2. **Primary calls to action are lime pills** (`Button variant="primary"`: lime background,
   lime-ink text, fully rounded) with a small **up-right arrow when the action leaves the page**
   (`leavesPage`: a new route or an external site). **Secondary actions stay ink or outline**
   (`variant="ink"` solid ink with white text, 18.7:1; `variant="secondary"` outline). Use one
   primary pill per view or section, so it still means "this one".
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
| `ink` #111311 | `bg` #FAFAF8 | 17.86:1 | AA pass (AAA) | body text on page |
| `ink` #111311 | `surface` #FFFFFF | 18.67:1 | AA pass (AAA) | body text on cards |
| `ink` #111311 | `fill` #F2F2EE | 16.63:1 | AA pass (AAA) | text in subtle fills, table header |
| `ink-2` #4B4F4B | `bg` #FAFAF8 | 7.98:1 | AA pass (AAA) | secondary text on page |
| `ink-2` #4B4F4B | `surface` #FFFFFF | 8.34:1 | AA pass (AAA) | secondary text on cards |
| `ink-2` #4B4F4B | `fill` #F2F2EE | 7.43:1 | AA pass (AAA) | secondary text in fills |
| `ink-3` #6B706B | `bg` #FAFAF8 | 4.84:1 | AA pass | muted text, labels, footnotes, non-significant deltas |
| `ink-3` #6B706B | `surface` #FFFFFF | 5.05:1 | AA pass | muted text on cards |
| `ink-3` #6B706B | `fill` #F2F2EE | 4.50:1 | AA pass | muted text in fills |
| `lime-ink` #1B4249 | `lime` #D6F69A | 9.11:1 | AA pass (AAA) | primary pill buttons, highlighted brand mention, selected nav, chips |
| `lime-ink` #1B4249 | `lime-deep` #C4EC74 | 8.11:1 | AA pass (AAA) | primary pill hover/pressed |
| `lime-ink` #1B4249 | `lime-soft` #F0FBD9 | 10.15:1 | AA pass (AAA) | soft tags, tinted pricing column, added diff lines |
| `on-dark` #FFFFFF | `overlay` #0B0D0B | 19.51:1 | AA pass (AAA) | headline over darkened imagery (overlay floor; video frame check in phase 2 of the landing work) |
| `on-dark-2` #DBDDDE | `overlay` #0B0D0B | 14.31:1 | AA pass (AAA) | body text over darkened imagery |
| `white` #FFFFFF | `ink` #111311 | 18.67:1 | AA pass (AAA) | primary button text |
| `up` #15803D | `bg` #FAFAF8 | 4.80:1 | AA pass | positive delta text |
| `up` #15803D | `surface` #FFFFFF | 5.02:1 | AA pass | positive delta on cards |
| `down` #B91C1C | `bg` #FAFAF8 | 6.19:1 | AA pass | negative delta text |
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
| `line-strong` #D4D4CE | `surface` | 1.49:1 | below 3:1, see mitigation | input borders |

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
| Display & headings (display, h1, h2) | **Newsreader** (variable, optical-size axis) | An editorial text serif designed for screens. Its `opsz` axis gives 56px headlines a sharper display cut and keeps small serif text sturdy. Compared with **Fraunces** (too quirky; its "wonk" draws attention to itself) and **Instrument Serif** (one weight, condensed, trendy), Newsreader reads as *serious publication*, which is the half of our direction that builds trust. |
| UI (h3, h4, body, small, micro) | **IBM Plex Sans** | Engineered, slightly technical, with true tabular figures and a distinctive but quiet voice. It reads as *instrument* and avoids the default-Inter look. |
| Numbers, percentages, timestamps, model IDs, code | **IBM Plex Mono** | Same skeleton as Plex Sans, so data in mono sits naturally next to UI text; unambiguous 0/O and 1/l for model IDs and keys. |

All three are loaded with `next/font/google`, which **self-hosts** them (downloaded at build,
served from our domain, no request to Google at runtime) with size-adjusted fallbacks to avoid
layout shift ([`web/src/lib/fonts.ts`](../../web/src/lib/fonts.ts)).

**Type scale** (Tailwind `text-*` utilities):

| Token | Size / line-height | Family | Use |
|---|---|---|---|
| `text-display` | 56 / 1.05, −0.02em | serif | Landing hero only |
| `text-h1` | 40 / 1.1, −0.015em | serif | Page titles on marketing; big numbers |
| `text-h2` | 30 / 1.2 | serif | Section titles |
| `text-h3` | 20 / 1.35 | sans 600 | Panel titles |
| `text-h4` | 16 / 1.4 | sans 600 | Sub-sections, card titles |
| `text-body` | 15 / 1.55 | sans 400 | Running text |
| `text-small` | 13 / 1.45 | sans | Controls, table cells, dense UI |
| `text-micro` | 11 / 1.3, +0.06em, uppercase | sans 500 | Labels above values, column groups |
| `text-data` | 13 / 1.4 | mono, tabular | Numbers, intervals, timestamps |

**Tabular numerals wherever data appears** (`tabular` utility = `tabular-nums lining-nums`).
Dashboards use sans for chrome and mono for values; serif appears in the dashboard only for the
page title and the headline visibility number.

## 4. Space, shape, elevation

- **Spacing:** 4px grid (Tailwind's default 0.25rem steps). Dense UI uses 8 / 12 / 16; sections
  use 24 / 32 / 48; marketing sections 96 / 128.
- **Radius:** restrained. `xs 2px` (highlight marks, bars), `sm 4px` (badges, kbd), `md 6px`
  (controls), `lg 8px` (panels, dialogs). Nothing is a pill except status dots.
- **Borders over shadows:** cards are `surface` with a 1px `line` border on `bg`; no shadow.
  Only floating layers (menus, popovers, dialogs, toasts, tooltips) get `shadow-overlay`, because
  they genuinely sit above the page.
- **Rules:** a 2px ink top rule marks things that need a decision (approval cards).

## 5. Motion

| Token | Value | Used for |
|---|---|---|
| `duration-fast` | 120ms | Hover, press, colour changes |
| `duration-base` | 180ms | Menus, popovers, tooltips (fade + 4px rise) |
| `duration-slow` | 240ms | Dialogs, sheets (slide) |
| `ease-out` | cubic-bezier(0.2, 0, 0, 1) | Entering |

**What animates:** overlays entering/leaving, hover/press states, skeleton shimmer, the copy
button's "Copied" state. **What never animates:** numbers (no count-up tickers), charts (no
draw-in), layout (no reflow animations), page transitions. *Why:* an instrument shouldn't
perform; animated numbers suggest precision and drama we don't have. `prefers-reduced-motion`
disables all of it.

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

**Wordmark:** "Recommendr" set in Newsreader (weight 540, optical size 24) with the font's own
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

## 9. Copy voice

Plain, specific, slightly dry. Numbers over adjectives.

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
