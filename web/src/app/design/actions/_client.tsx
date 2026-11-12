"use client";

import { Check, ChevronDown, ChevronRight, Globe2, Home } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { AnswerCard } from "@/components/ui/answer-card";
import { ApprovalCard } from "@/components/ui/approval-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffView, type DiffLine } from "@/components/ui/diff-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { actions, answers, competitors, falseFacts, type Action } from "@/lib/mock";
import { cn } from "@/lib/cn";

const IMPACT_TONE = { High: "lime", Medium: "neutral", Low: "muted" } as const;
const STATUS: Record<string, "New" | "In progress" | "Done"> = { a1: "New", a2: "In progress", a3: "New", a4: "New", a5: "Done", a6: "New", a7: "New" };

const FAQ_JSONLD = `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Does Dera Biryani House have private dining rooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. We have two private family rooms in G-9 Markaz, seating up to 14 guests each. Book by phone on 051 2345 678 at least a day ahead."
      }
    },
    {
      "@type": "Question",
      "name": "Can I book Dera Biryani House for a family event?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Private rooms can be booked for birthdays and family dinners from 12 pm to 1 am, with a set biryani menu from Rs 2,400 per person."
      }
    }
  ]
}`;

const FAQ_HTML = `<section id="private-dining" aria-labelledby="private-dining-title">
  <h2 id="private-dining-title">Private dining</h2>
  <p>Two private family rooms, up to 14 guests each, in G-9 Markaz.
     Book by phone on <a href="tel:+92512345678">051 2345 678</a>.</p>
  <details>
    <summary>Do you have private dining rooms?</summary>
    <p>Yes. Two private family rooms seating up to 14 guests each.</p>
  </details>
  <details>
    <summary>Can I book a room for a family event?</summary>
    <p>Yes, from 12 pm to 1 am, with a set biryani menu from Rs 2,400 per person.</p>
  </details>
</section>`;

const RESTAURANT_JSONLD = `{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Dera Biryani House",
  "url": "https://derabiryani.pk",
  "servesCuisine": ["Pakistani", "Sindhi biryani"],
  "priceRange": "Rs 800–2,400",
  "telephone": "+92-51-2345678",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Shop 14, G-9 Markaz",
    "addressLocality": "Islamabad",
    "postalCode": "44090",
    "addressCountry": "PK"
  },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"], "opens": "12:00", "closes": "01:00" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Friday", "Saturday", "Sunday"], "opens": "12:00", "closes": "02:00" }
  ],
  "acceptsReservations": "True"
}`;

const ABOUT_DIFF: DiffLine[] = [
  { kind: "context", text: "<h1>About Dera Biryani House</h1>" },
  { kind: "context", text: "<p>Sindhi-style biryani in Islamabad since 2016.</p>" },
  { kind: "del", text: "<p>Visit us in F-10 Markaz, open 12 pm to 11 pm.</p>" },
  { kind: "add", text: "<p>Visit us in G-9 Markaz (moved from F-10 in March 2025).</p>" },
  { kind: "add", text: "<p>Open 12 pm to 1 am; Friday to Sunday until 2 am.</p>" },
  { kind: "add", text: '<p>Two private family rooms for up to 14 guests. <a href="#private-dining">Book a room</a>.</p>' },
  { kind: "context", text: '<a href="/menu">See the menu</a>' },
];

function ActionRow({ a, rank, expanded, onToggle }: { a: Action; rank: number; expanded: boolean; onToggle: () => void }) {
  const status = STATUS[a.id] ?? "New";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={cn(
        "grid w-full grid-cols-[24px_1fr] gap-3 px-4 py-3 text-left hover:bg-fill sm:grid-cols-[24px_1fr_auto]",
        expanded && "bg-fill",
      )}
    >
      <span className="font-mono text-small tabular text-ink-3">{rank}</span>
      <span className="min-w-0">
        <span className="flex items-start gap-1.5">
          {expanded ? <ChevronDown size={16} className="mt-0.5 shrink-0" aria-hidden /> : <ChevronRight size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />}
          <span className="text-small font-medium">{a.title}</span>
        </span>
        <span className="mt-1 block pl-5 text-small text-ink-3">{a.evidence}</span>
        <span className="mt-2 flex flex-wrap gap-1.5 pl-5">
          <Badge tone={IMPACT_TONE[a.impact]}>{a.impact} impact</Badge>
          <Badge tone="outline">{a.effort} effort</Badge>
          <Badge tone="muted">
            {a.questions} prompt{a.questions === 1 ? "" : "s"}
          </Badge>
        </span>
      </span>
      <span className="col-start-2 flex flex-col gap-1 pl-5 text-small sm:col-start-auto sm:items-end sm:pl-0">
        <span className="font-mono tabular text-ink">{a.expectedLift}</span>
        <span className={cn("inline-flex items-center gap-1", status === "Done" ? "text-up" : "text-ink-3")}>
          {status === "Done" ? <Check size={12} aria-hidden /> : null}
          {status}
        </span>
      </span>
    </button>
  );
}

function ExpandedA1() {
  const [approval, setApproval] = useState<"pending" | "approved" | "denied">("pending");
  const evidence = answers.find((x) => x.id === "ans_c07d")!;
  const ff = falseFacts[0]!;
  return (
    <div className="space-y-4 border-t border-line bg-surface px-4 py-5">
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <h3 className="text-micro uppercase text-ink-3">Evidence</h3>
          <p className="mt-1 text-small text-ink-2">
            <q>{ff.claim}</q> appears in <span className="font-mono tabular">{ff.seen}</span> of{" "}
            <span className="font-mono tabular">{ff.of}</span> answers to family-dining prompts. The cited source is a 2024 guide that predates your
            private rooms.
          </p>
          <AnswerCard className="mt-3" answer={evidence} question="family restaurant with biryani and private rooms Islamabad" competitors={competitors} />
        </div>
        <div className="min-w-0 space-y-3">
          <h3 className="text-micro uppercase text-ink-3">Generated fix</h3>
          <p className="text-small text-ink-2">
            Add a <strong className="font-medium">Private dining</strong> section to your About page, with FAQ markup that AI crawlers can read. Review the
            wording and phone number before publishing.
          </p>
          <Tabs defaultValue="jsonld">
            <TabsList aria-label="Fix format">
              <TabsTrigger value="jsonld">FAQ JSON-LD</TabsTrigger>
              <TabsTrigger value="html">HTML section</TabsTrigger>
            </TabsList>
            <TabsContent value="jsonld" className="mt-2">
              <CodeBlock code={FAQ_JSONLD} language="json" filename="faq-private-dining.jsonld" />
            </TabsContent>
            <TabsContent value="html" className="mt-2">
              <CodeBlock code={FAQ_HTML} language="html" filename="about.html (snippet)" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-2 text-micro uppercase text-ink-3">Proposed change</h3>
          <DiffView filename="src/pages/about.html" lines={ABOUT_DIFF} />
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-micro uppercase text-ink-3">Publish</h3>
          <ApprovalCard
            action="publish"
            title="Open a pull request on derabiryani-site"
            description={
              <>
                Recommendr will open a pull request on <span className="font-mono">github.com/dera-hospitality/derabiryani-site</span> with the
                change on the left. Nothing goes live until you merge it.
              </>
            }
            details={
              <ul className="space-y-1 text-small text-ink-2">
                <li>Branch: <span className="font-mono">recommendr/private-dining-faq</span></li>
                <li>Files: <span className="font-mono">src/pages/about.html</span> (+4 −1), <span className="font-mono">faq-private-dining.jsonld</span> (new)</li>
                <li>After merge we re-check the 3 family-dining prompts and report the change with its interval.</li>
              </ul>
            }
            state={approval}
            onApprove={() => setApproval("approved")}
            onDeny={() => setApproval("denied")}
          />
        </div>
      </div>
    </div>
  );
}

function ExpandedA2() {
  return (
    <div className="space-y-3 border-t border-line bg-surface px-4 py-5">
      <p className="text-small text-ink-2">
        Gemini states your hours as 12 pm to 11 pm in 14 of 40 answers, and Perplexity still places you in F-10. Add this to the{" "}
        <span className="font-mono">&lt;head&gt;</span> of every page so engines read your hours and address from your own site.
      </p>
      <CodeBlock code={RESTAURANT_JSONLD} language="json" filename="restaurant.jsonld" />
    </div>
  );
}

function ActionList({ kind }: { kind: Action["kind"] }) {
  const [open, setOpen] = useState<string | null>(kind === "owned" ? "a1" : null);
  const list = actions.filter((a) => a.kind === kind);
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
      {list.map((a) => (
        <li key={a.id}>
          <ActionRow a={a} rank={actions.indexOf(a) + 1} expanded={open === a.id} onToggle={() => setOpen(open === a.id ? null : a.id)} />
          {open === a.id && a.id === "a1" ? <ExpandedA1 /> : null}
          {open === a.id && a.id === "a2" ? <ExpandedA2 /> : null}
          {open === a.id && a.id !== "a1" && a.id !== "a2" ? (
            <p className="border-t border-line px-4 py-4 text-small text-ink-3">Fix not generated yet. Generate a draft to review it here.</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function ActionsPreview() {
  const owned = actions.filter((a) => a.kind === "owned").length;
  return (
    <AppShell
      active="actions"
      title="Actions"
      subtitle={`${actions.length} actions ranked by expected impact and effort. Lift ranges are estimates from similar prompts, not promises.`}
      actions={<Button variant="secondary">Regenerate plan</Button>}
    >
      <Tabs defaultValue="owned">
        <TabsList aria-label="Action type">
          <TabsTrigger value="owned">
            <Home size={14} aria-hidden className="mr-1.5" /> Owned · your site{" "}
            <span className="ml-1 font-mono text-micro tabular text-ink-3">{owned}</span>
          </TabsTrigger>
          <TabsTrigger value="earned">
            <Globe2 size={14} aria-hidden className="mr-1.5" /> Earned · other sites{" "}
            <span className="ml-1 font-mono text-micro tabular text-ink-3">{actions.length - owned}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="owned" className="mt-3">
          <ActionList kind="owned" />
        </TabsContent>
        <TabsContent value="earned" className="mt-3">
          <ActionList kind="earned" />
        </TabsContent>
      </Tabs>
      <div className="mt-6">
        <Panel title="How actions are ranked" description="Impact: prompts affected × current gap × engines involved. Effort: what you can change yourself (owned) vs what needs someone else (earned).">
          <p className="text-small text-ink-3">
            Owned actions change your own site and listings, so they’re usually fastest. Earned actions need another site to mention you; we show
            the evidence and draft the outreach, but can’t guarantee the result.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
