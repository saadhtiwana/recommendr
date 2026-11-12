"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CrawlerHeatmap } from "@/components/charts/crawler-heatmap";
import { EngineComparison, type EngineRow } from "@/components/charts/engine-comparison";
import { FanoutList } from "@/components/charts/fanout-list";
import { LineCI } from "@/components/charts/line-ci";
import { RankTable } from "@/components/charts/rank-table";
import { SourceBars } from "@/components/charts/source-bars";
import { SovBars } from "@/components/charts/sov-bars";
import { AnswerCard } from "@/components/ui/answer-card";
import { ApprovalCard } from "@/components/ui/approval-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CitationRef, SourceList } from "@/components/ui/citation";
import { CodeBlock } from "@/components/ui/code-block";
import { Combobox } from "@/components/ui/combobox";
import { CommandPalette, useCommandPalette, type CommandGroup } from "@/components/ui/command-palette";
import { Delta } from "@/components/ui/delta";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DiffView } from "@/components/ui/diff-view";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { EngineLabel } from "@/components/ui/engine-label";
import { Field, Input, Textarea } from "@/components/ui/input";
import { IntervalValue } from "@/components/ui/interval-value";
import { Kbd } from "@/components/ui/kbd";
import { Meter } from "@/components/ui/meter";
import { MetricTile } from "@/components/ui/metric-tile";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { NewSecretInput, SecretField } from "@/components/ui/secret-field";
import { Select } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import {
  answers,
  apiKeys,
  brandSeries,
  competitors,
  crawlerHeatmap,
  engineSeries,
  engineStats,
  fanoutTopics,
  modelChanges,
  overview,
  questions,
  shareOfVoice,
  topSources,
  wilson,
  type Question,
} from "@/lib/mock";
import { ENGINE_ORDER, ENGINES } from "@/lib/palette";

const SECTIONS = [
  ["buttons", "Buttons"],
  ["inputs", "Inputs"],
  ["choice", "Select, combobox, choice"],
  ["tabs", "Tabs"],
  ["table", "Table"],
  ["data", "Badges, deltas, intervals"],
  ["tiles", "Metric tiles, meters"],
  ["answers", "Answer cards, citations"],
  ["overlays", "Overlays and command palette"],
  ["feedback", "Toast, tooltip, empty, skeleton"],
  ["agents", "Approval, code, diff"],
  ["secrets", "Secrets"],
  ["charts", "Charts"],
] as const;

function Section({ id, title, children, note }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 border-t border-line py-10">
      <h2 id={`${id}-h`} className="font-serif text-h2">{title}</h2>
      {note ? <p className="mt-1 max-w-prose text-small text-ink-3">{note}</p> : null}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 md:grid-cols-[140px_1fr] md:items-start">
      <p className="pt-1.5 text-micro uppercase text-ink-3">{label}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const JSON_LD = `{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Corner Slice Pizza",
  "servesCuisine": ["Pizza", "New York-style pizza"],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "412 7th Ave",
    "addressLocality": "Brooklyn",
    "addressRegion": "NY",
    "postalCode": "11215",
    "addressCountry": "US"
  },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "11:00", "closes": "02:00" }
  ],
  "hasDeliveryMethod": "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"
}`;

const LLMS_TXT = `# Corner Slice Pizza

> New York-style pizzeria on 7th Ave in Park Slope, Brooklyn. Slices, whole pies, delivery and catering.

## Key facts
- Address: 412 7th Ave, Brooklyn, NY 11215 (moved from 5th Ave in March 2025)
- Hours: 11 am to 2 am every day
- Delivery: across Brooklyn until 2 am
- Catering: office parties and groups of 20+

## Pages
- [Menu](https://cornerslice.nyc/menu)
- [Catering](https://cornerslice.nyc/catering)
- [Delivery](https://cornerslice.nyc/delivery)`;

type QRow = Question & { rate: ReturnType<typeof wilson> };
const tableRows: QRow[] = [...questions, ...questions.slice(0, 5).map((q) => ({ ...q, id: `${q.id}-b`, text: `${q.text} (Spanish)` }))].map((q) => ({
  ...q,
  rate: wilson(q.x, q.n),
}));
const columns: Column<QRow>[] = [
  { key: "text", header: "Prompt", cell: (r) => <span className="block max-w-[28ch] truncate">{r.text}</span>, sortValue: (r) => r.text },
  { key: "intent", header: "Intent", cell: (r) => <Badge tone="outline">{r.intent}</Badge>, sortValue: (r) => r.intent },
  { key: "rate", header: "Mentioned", align: "right", cell: (r) => <IntervalValue p={r.rate.p} lo={r.rate.lo} hi={r.rate.hi} n={r.n} size="sm" />, sortValue: (r) => r.rate.p },
  { key: "delta", header: "Change", align: "right", cell: (r) => <Delta value={(r.x / r.n - r.xPrev / r.nPrev) * 100} significant={r.significant} size="sm" />, sortValue: (r) => r.x / r.n - r.xPrev / r.nPrev },
  { key: "rank", header: "Avg rank", align: "right", cell: (r) => (r.rank === null ? <span className="text-ink-3">not ranked</span> : r.rank.toFixed(1)), sortValue: (r) => r.rank ?? 99 },
  { key: "top", header: "Top competitor", cell: (r) => r.topCompetitor, sortValue: (r) => r.topCompetitor },
];

const engineRows: EngineRow[] = ENGINE_ORDER.map((e) => ({
  engine: e,
  ...engineStats[e],
  ...(e === "claude" ? { incomplete: "partial" as const } : {}),
}));

function ToastButtons() {
  const { toast } = useToast();
  return (
    <>
      <Button onClick={() => toast({ title: "Check queued", description: "120 samples across 4 engines. Estimated $1.44 on your keys." })}>Neutral toast</Button>
      <Button onClick={() => toast({ title: "Visibility up 7.1 pts", description: "Significant after FDR control (q = 0.10).", tone: "up" })}>Up toast</Button>
      <Button onClick={() => toast({ title: "Anthropic key rejected", description: "Claude results for this run are blocked, not zero.", tone: "down" })}>Down toast</Button>
    </>
  );
}

export function ComponentsGallery() {
  const [tileLoading, setTileLoading] = useState(true);
  const palette = useCommandPalette(); // owns the Cmd/Ctrl+K shortcut
  const [approval, setApproval] = useState<"pending" | "approved" | "denied">("pending");
  const groups: CommandGroup[] = [
    { heading: "Go to", items: SECTIONS.map(([id, label]) => ({ id, label, onSelect: () => document.getElementById(id)?.scrollIntoView() })) },
    { heading: "Actions", items: [{ id: "run", label: "Run a check now", hint: "Uses your keys", shortcut: "R", onSelect: () => undefined }] },
  ];
  const v = wilson(overview.visibility.x, overview.visibility.n);
  const vPrev = wilson(overview.visibilityPrev.x, overview.visibilityPrev.n);

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
          <Link href="/design" className="text-small text-ink-3 hover:text-ink hover:underline">← Design previews</Link>
          <h1 className="mt-4 font-serif text-h1">Components</h1>
          <p className="mt-2 max-w-prose text-ink-2">
            Every component in every state. Press <Kbd>⌘K</Kbd> or <Kbd>Ctrl K</Kbd> to open the command palette.
          </p>

          <div className="mt-8 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10">
            <nav aria-label="Components" className="mb-6 lg:mb-0">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-small lg:sticky lg:top-6 lg:flex-col lg:gap-1">
                {SECTIONS.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} className="text-ink-3 hover:text-ink hover:underline">{label}</a></li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0">
              <Section id="buttons" title="Buttons" note="Primary calls to action are lime pills with lime-ink text; an up-right arrow marks actions that leave the page. Secondary actions are ink or outline.">
                {(["primary", "ink", "secondary", "ghost", "destructive"] as const).map((variant) => (
                  <Row key={variant} label={variant}>
                    {(["sm", "md", "lg"] as const).map((size) => (
                      <Button key={size} variant={variant} size={size}>{variant === "destructive" ? "Revoke key" : "Run a check"}</Button>
                    ))}
                    <Button variant={variant} disabled>Disabled</Button>
                  </Row>
                ))}
                <Row label="primary pill, leaves page"><Button variant="primary" size="lg" leavesPage>Check my business</Button></Row>
                <Row label="with icon / kbd">
                  <Button variant="primary" kbd="R"><Plus size={16} strokeWidth={1.75} aria-hidden />New check</Button>
                  <Button variant="secondary" kbd="⌘K"><Search size={16} strokeWidth={1.75} aria-hidden />Search</Button>
                  <Button variant="ghost" aria-label="Delete prompt"><Trash2 size={16} strokeWidth={1.75} aria-hidden /></Button>
                </Row>
              </Section>

              <Section id="inputs" title="Inputs">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Business name" hint="As customers would type it."><Input placeholder="Corner Slice Pizza" /></Field>
                  <Field label="Website" error="Enter a domain like cornerslice.nyc"><Input defaultValue="cornerslice" /></Field>
                  <Field label="City"><Input defaultValue="Brooklyn, NY" disabled /></Field>
                  <Field label="Verified fact" hint="We check AI answers against this."><Textarea rows={3} defaultValue="Delivers across Brooklyn until 2 am." /></Field>
                </div>
              </Section>

              <Section id="choice" title="Select, combobox, choice">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Cadence">
                    <Select defaultValue="weekly" options={[{ value: "daily", label: "Daily (≈ $41/month on your keys)" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly", disabled: true }]} />
                  </Field>
                  <Field label="Category">
                    <Combobox
                      placeholder="Choose a category"
                      options={[
                        { value: "pizzeria", label: "Pizzeria", hint: "1,240 businesses" },
                        { value: "italian", label: "Italian restaurant" },
                        { value: "dentist", label: "Dentist" },
                        { value: "crm", label: "CRM software" },
                        { value: "physio", label: "Physiotherapy clinic" },
                      ]}
                    />
                  </Field>
                  <Field label="Select (disabled)"><Select disabled placeholder="No engines available" options={[]} /></Field>
                </div>
                <Row label="checkbox">
                  <Checkbox label="ChatGPT" defaultChecked />
                  <Checkbox label="Gemini" />
                  <Checkbox label="All engines" checked="indeterminate" />
                  <Checkbox label="Claude (needs key)" disabled />
                </Row>
                <Row label="switch">
                  <Switch label="Share public questions" defaultChecked />
                  <Switch label="Weekly email" />
                  <Switch label="Daily runs" disabled />
                </Row>
                <RadioGroup defaultValue="byok" aria-label="Plan" className="max-w-xl">
                  <Radio value="free" label="Free tier" description="1 project, 10 prompts, weekly, 2 engines." />
                  <Radio value="byok" label="Your own keys" description="All engines, your cadence, you pay providers directly." />
                  <Radio value="self" label="Self-hosted" description="Docker Compose on your machine." disabled />
                </RadioGroup>
              </Section>

              <Section id="tabs" title="Tabs">
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All engines</TabsTrigger>
                    {ENGINE_ORDER.map((e) => <TabsTrigger key={e} value={e}>{ENGINES[e].label}</TabsTrigger>)}
                  </TabsList>
                  <TabsContent value="all" className="pt-3 text-small text-ink-2">594 answers this week across 4 engines.</TabsContent>
                  {ENGINE_ORDER.map((e) => (
                    <TabsContent key={e} value={e} className="pt-3 text-small text-ink-2">{engineStats[e].n} answers from {engineStats[e].model}.</TabsContent>
                  ))}
                </Tabs>
              </Section>

              <Section id="table" title="Table" note="Dense, sortable, sticky header. Numbers right-aligned in tabular mono.">
                <DataTable columns={columns} rows={tableRows} getRowId={(r) => r.id} initialSort={{ key: "rate", dir: "desc" }} maxHeight="360px" caption="Prompts by mention rate" />
              </Section>

              <Section id="data" title="Badges, deltas, intervals">
                <Row label="badge">
                  <Badge>Discovery</Badge><Badge tone="outline">Weekly</Badge><Badge tone="lime">Your brand</Badge><Badge tone="up">Improving</Badge><Badge tone="down">False fact</Badge><Badge tone="muted">Incomplete</Badge>
                </Row>
                <Row label="delta">
                  <Delta value={7.1} significant /><Delta value={-9.4} significant /><Delta value={2.3} significant={false} /><Delta value={-1.2} significant={false} /><Delta value={0} significant={false} />
                </Row>
                <Row label="interval">
                  <IntervalValue p={v.p} lo={v.lo} hi={v.hi} n={overview.visibility.n} size="sm" />
                  <IntervalValue p={v.p} lo={v.lo} hi={v.hi} n={overview.visibility.n} size="md" />
                  <IntervalValue p={0.3} lo={0.13} hi={0.55} n={10} size="lg" bar />
                  <IntervalValue p={v.p} lo={v.lo} hi={v.hi} n={overview.visibility.n} size="xl" />
                </Row>
                <Row label="engine"><>{ENGINE_ORDER.map((e) => <EngineLabel key={e} engine={e} model={engineStats[e].model} />)}</></Row>
                <Row label="sparkline">
                  <Sparkline values={questions[1]!.trend} label="Classic slice prompt, 8 weeks" />
                  <Sparkline values={questions[0]!.trend} dot label="Best pizza prompt, 8 weeks" />
                  <Sparkline values={questions[5]!.trend} width={120} height={28} label="Cheap pizza prompt, 8 weeks" />
                </Row>
              </Section>

              <Section id="tiles" title="Metric tiles, meters" note="Skeletons take the same size as the tile they stand in for.">
                <div className="flex items-center gap-3"><Switch label="Loading state" checked={tileLoading} onCheckedChange={setTileLoading} /></div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricTile loading={tileLoading} label="Visibility" value={<IntervalValue p={v.p} lo={v.lo} hi={v.hi} n={overview.visibility.n} size="xl" />} delta={<Delta value={(v.p - vPrev.p) * 100} significant />} footnote="594 answers, 4 engines" />
                  <MetricTile loading={tileLoading} label="Average rank" value={<span className="font-mono text-h2 tabular">2.8</span>} delta={<Delta value={0.6} significant={false} unit="%" />} footnote="When mentioned" />
                  <MetricTile loading={tileLoading} label="Share of voice" value={<span className="font-mono text-h2 tabular">21%</span>} delta={<Delta value={4} significant={false} />} footnote="vs 4 competitors" />
                  <MetricTile loading={false} label="False facts" value={<span className="font-mono text-h2 tabular">3</span>} footnote="2 high severity" />
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  <Meter label="Free tier prompts" used={6} limit={10} unit="prompts" />
                  <Meter label="OpenAI key, November" used={51.3} limit={60} unit="USD" format={(n) => `$${n.toFixed(2)}`} />
                  <Meter label="Samples this week" used={128} limit={120} unit="samples" />
                </div>
              </Section>

              <Section id="answers" title="Answer cards, citations" note="Your brand is highlighted like a marker; competitors are underlined in their data colour; sources are numbered footnotes.">
                <div className="grid gap-4 lg:grid-cols-2">
                  {answers.slice(0, 2).map((a) => (
                    <AnswerCard key={a.id} answer={a} question={questions.find((q) => q.id === a.questionId)?.text} competitors={competitors} onFlag={() => undefined} />
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {answers.slice(2).map((a) => (
                    <AnswerCard key={a.id} answer={a} competitors={competitors} compact />
                  ))}
                </div>
                <Panel title="Citation footnotes on their own">
                  <p className="text-small">Gemini says Corner Slice is open until 11 pm<CitationRef n={1} idPrefix="demo" /> and located on 5th Ave<CitationRef n={2} idPrefix="demo" />.</p>
                  <div className="mt-3"><SourceList idPrefix="demo" sources={answers[2]!.sources.slice(0, 2)} /></div>
                </Panel>
              </Section>

              <Section id="overlays" title="Overlays and command palette">
                <Row label="palette">
                  <Button variant="secondary" kbd="⌘K" onClick={() => palette.setOpen(true)}><Search size={16} strokeWidth={1.75} aria-hidden />Open command palette</Button>
                </Row>
                <Row label="menu">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button>Prompt actions</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>best pizza in Brooklyn</DropdownMenuLabel>
                      <DropdownMenuItem shortcut="R">Run now</DropdownMenuItem>
                      <DropdownMenuItem shortcut="E">Edit</DropdownMenuItem>
                      <DropdownMenuItem>Mark as private</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive>Delete prompt</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Row>
                <Row label="dialog / sheet">
                  <Dialog>
                    <DialogTrigger asChild><Button>Revoke key…</Button></DialogTrigger>
                    <DialogContent
                      title="Revoke OpenAI key ending Q8xD?"
                      description="Runs that need ChatGPT will be blocked until you add a new key. Past results stay."
                      footer={<><DialogClose asChild><Button>Cancel</Button></DialogClose><DialogClose asChild><Button variant="destructive">Revoke key</Button></DialogClose></>}
                    />
                  </Dialog>
                  <Sheet>
                    <SheetTrigger asChild><Button>Open answer in sheet</Button></SheetTrigger>
                    <SheetContent title="Answer ans_7f3a" description="ChatGPT · sample 3 of 5" footer={<SheetClose asChild><Button>Close</Button></SheetClose>}>
                      <AnswerCard answer={answers[0]!} competitors={competitors} compact />
                    </SheetContent>
                  </Sheet>
                </Row>
              </Section>

              <Section id="feedback" title="Toast, tooltip, empty, skeleton">
                <Row label="toast"><ToastButtons /></Row>
                <Row label="tooltip">
                  <Tooltip content="Wilson 95% interval: 29.3% to 36.9%, n = 594"><Button variant="ghost">33% ±4</Button></Tooltip>
                  <Tooltip content="Model changed from gpt-5-search to gpt-5.1-search on 2 Nov" side="right"><Button variant="ghost">Model change</Button></Tooltip>
                </Row>
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel padded>
                    <EmptyState title="No prompts yet" description="Add the questions your customers ask, or let us suggest 20 from your website." action={<Button variant="primary">Suggest prompts</Button>} />
                  </Panel>
                  <Panel padded>
                    <EmptyState title="No false facts found" description="We checked 594 answers against your 6 verified facts this week." />
                  </Panel>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel title="Loading answer">
                    <div className="space-y-3"><Skeleton className="h-4 w-48" /><SkeletonText lines={4} /><Skeleton className="h-3 w-32" /></div>
                  </Panel>
                  <Panel title="Loaded answer">
                    <p className="text-small text-ink-2">Perplexity lists Fulton Ave Pizza, Bleecker Street Slice and Prospect Pie Co., without you. Reviewers single out the coal-oven crust and late-night delivery.</p>
                  </Panel>
                </div>
              </Section>

              <Section id="agents" title="Approval, code, diff">
                <div className="grid gap-4 lg:grid-cols-2">
                  <ApprovalCard
                    title="Run a check on 10 prompts now"
                    description="The agent wants fresh samples before answering. Nothing runs until you approve."
                    action="spend"
                    estimate={{ costUsd: 1.44, calls: 120 }}
                    details={<p className="text-small">10 prompts × 4 engines × 3 samples, billed to your OpenAI, Anthropic, Perplexity and Gemini keys.</p>}
                    state={approval}
                    onApprove={() => setApproval("approved")}
                    onDeny={() => setApproval("denied")}
                  />
                  <ApprovalCard
                    title="Open a pull request on cornerslice.nyc"
                    description="Adds Restaurant JSON-LD and a delivery FAQ. You'll review the diff on GitHub before merging."
                    action="publish"
                    details={<p className="font-mono text-small">github.com/cornerslice/site · branch recommendr/fix-hours</p>}
                    state="pending"
                    onApprove={() => undefined}
                    onDeny={() => undefined}
                  />
                  <ApprovalCard title="Run a check on 3 prompts" description="Approved by Maria Lopez." action="spend" estimate={{ costUsd: 0.43, calls: 36 }} details={null} state="approved" onApprove={() => undefined} onDeny={() => undefined} />
                  <ApprovalCard title="Publish llms.txt" description="Denied: wording needs review." action="publish" details={null} state="denied" onApprove={() => undefined} onDeny={() => undefined} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <CodeBlock code={JSON_LD} language="json" filename="restaurant.jsonld" />
                  <CodeBlock code={LLMS_TXT} language="txt" filename="llms.txt" />
                </div>
                <DiffView
                  filename="app/delivery/page.html"
                  lines={[
                    { kind: "context", text: "<h2>Dine with us</h2>" },
                    { kind: "del", text: "<p>Pickup only.</p>" },
                    { kind: "add", text: "<p>Pickup, or delivery anywhere in Brooklyn until 2 am.</p>" },
                    { kind: "add", text: '<a href="tel:+17185550142">Call to order: (718) 555-0142</a>' },
                    { kind: "context", text: "<h2>Opening hours</h2>" },
                    { kind: "del", text: "<p>11 am to 11 pm daily</p>" },
                    { kind: "add", text: "<p>11 am to 2 am every day</p>" },
                  ]}
                />
              </Section>

              <Section id="secrets" title="Secrets" note="Keys are never shown after saving: provider, last 4 characters, dates and status only.">
                <div className="space-y-3">
                  {apiKeys.map((k) => (
                    <SecretField key={k.id} provider={k.provider} label={k.label} last4={k.last4} createdIso={k.createdIso} lastUsedIso={k.lastUsedIso} status={k.status} onRevoke={() => undefined} onReplace={() => undefined} />
                  ))}
                  <SecretField provider="Perplexity" label="Old key" last4="9kQw" createdIso="2026-07-01" lastUsedIso={null} status="revoked" />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <NewSecretInput provider="OpenAI" onValidate={() => undefined} />
                  <NewSecretInput provider="Anthropic" onValidate={() => undefined} state="validating" />
                  <NewSecretInput provider="Perplexity" onValidate={() => undefined} state="valid" />
                  <NewSecretInput provider="Google Gemini" onValidate={() => undefined} state="invalid" error="Google rejected this key (API_KEY_INVALID)." />
                </div>
              </Section>

              <Section id="charts" title="Charts" note="Your brand is the thick ink line with a lime-soft confidence band. Engines and competitors are thinner, dashed and labelled.">
                <Panel title="Visibility by engine" description="Weekly mention rate with 95% intervals; dashed rules mark provider model changes.">
                  <LineCI
                    brand={brandSeries}
                    brandLabel="Corner Slice (all engines)"
                    series={ENGINE_ORDER.map((e) => ({ id: e, label: ENGINES[e].label, color: ENGINES[e].color, points: engineSeries[e], significant: engineStats[e].significant }))}
                    annotations={modelChanges.map((m) => ({ date: m.date, label: `${ENGINES[m.engine].label}: ${m.to}` }))}
                    height={300}
                  />
                </Panel>
                <Panel title="Share of voice" description="Mentions of each business as a share of all tracked mentions.">
                  <SovBars
                    rows={shareOfVoice}
                    entities={[{ key: "brand", label: "Corner Slice Pizza", color: "brand" }, ...competitors.map((c) => ({ key: c.id, label: c.name, color: c.color })), { key: "others", label: "Others", color: "stone" }]}
                  />
                </Panel>
                <Panel title="Prompts" description="Mention rate, change and 8-week trend.">
                  <RankTable rows={questions} maxHeight="320px" />
                </Panel>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Panel title="Engines, this week vs last" description="Claude shown as partial: a provider outage cut samples short.">
                    <EngineComparison rows={engineRows} />
                  </Panel>
                  <Panel title="Top cited sources">
                    <SourceBars rows={topSources} showEngines />
                  </Panel>
                  <Panel title="Fanout topics" description="Searches the engines ran before answering.">
                    <FanoutList rows={fanoutTopics} />
                  </Panel>
                  <Panel title="AI crawler visits" description="From uploaded server logs, last 14 days.">
                    <CrawlerHeatmap rows={crawlerHeatmap} startIso="2026-10-27" blocked={["OAI-SearchBot", "PerplexityBot"]} />
                  </Panel>
                </div>
              </Section>
            </div>
          </div>
        </div>
        <CommandPalette groups={groups} open={palette.open} onOpenChange={palette.setOpen} />
      </ToastProvider>
    </TooltipProvider>
  );
}
