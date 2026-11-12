"use client";

import { Check, ChevronDown, Clock, FileText, Globe, MessagesSquare, Newspaper, Store, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffView, type DiffLine } from "@/components/ui/diff-view";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { actions, type Action } from "@/lib/mock";

type Fix = { file: string; lang: "json" | "html" | "txt"; code: string; diff?: DiffLine[] };

const RESTAURANT_JSONLD = `{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Corner Slice Pizza",
  "url": "https://cornerslice.nyc",
  "telephone": "+1-718-555-0142",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "412 7th Ave",
    "addressLocality": "Brooklyn",
    "addressRegion": "NY",
    "postalCode": "11215",
    "addressCountry": "US"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "11:00",
    "closes": "02:00"
  }
}`;

/** Fixes for owned actions open a pull request; earned ones are drafts you send yourself. */
const FIXES: Record<string, Fix> = {
  a1: {
    file: "src/pages/index.html",
    lang: "html",
    code: `<section id="delivery">
  <h2>Delivery</h2>
  <p>We deliver anywhere in Brooklyn, 11 am to 2 am every day.</p>
  <a href="/order">Order delivery</a>
</section>`,
    diff: [
      { kind: "context", text: "<h1>Corner Slice Pizza</h1>" },
      { kind: "del", text: "<p>Pickup on 7th Ave.</p>" },
      { kind: "add", text: "<p>Pickup on 7th Ave, or delivery anywhere in Brooklyn until 2 am.</p>" },
      { kind: "add", text: '<a href="#delivery">Order delivery</a>' },
    ],
  },
  a2: { file: "public/restaurant.jsonld", lang: "json", code: RESTAURANT_JSONLD },
  a3: {
    file: "email to brooklynbites.com",
    lang: "txt",
    code: `Hi Brooklyn Bites team,

Thanks for your best pizza in Brooklyn list. We're Corner Slice Pizza on 7th Ave
in Park Slope: classic New York slices, open until 2 am, with delivery
across Brooklyn. Would you consider us for the next update?

Happy to host you for a slice any time.
Maria Lopez, Corner Slice Pizza`,
  },
  a4: {
    file: "public/robots.txt",
    lang: "txt",
    code: `User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /`,
    diff: [
      { kind: "del", text: "User-agent: OAI-SearchBot" },
      { kind: "del", text: "Disallow: /" },
      { kind: "del", text: "User-agent: PerplexityBot" },
      { kind: "del", text: "Disallow: /" },
      { kind: "context", text: "User-agent: *" },
      { kind: "context", text: "Allow: /" },
    ],
  },
  a5: { file: "DoorDash hours", lang: "txt", code: "Monday to Sunday: 11:00 am to 2:00 am" },
  a6: {
    file: "public/llms.txt",
    lang: "txt",
    code: `# Corner Slice Pizza

> New York-style pizzeria at 412 7th Ave, Brooklyn, NY. Open 11 am to 2 am daily.

- [Menu](https://cornerslice.nyc/menu)
- [Delivery](https://cornerslice.nyc/delivery)
- [Catering](https://cornerslice.nyc/catering)`,
  },
  a7: {
    file: "reply on r/brooklyn",
    lang: "txt",
    code: "Owner of Corner Slice here: we're on 7th Ave and deliver across Brooklyn until 2 am. Come by for a plain slice.",
  },
};

// One round, tinted icon per fix so the list scans at a glance.
const LOOK: Record<string, { icon: typeof Truck; tint: string }> = {
  a1: { icon: Truck, tint: "bg-lime text-lime-ink" },
  a2: { icon: Clock, tint: "bg-[#E6F0FB] text-[#21579A]" },
  a3: { icon: Newspaper, tint: "bg-[#FBF0DD] text-[#7A5310]" },
  a4: { icon: Globe, tint: "bg-[#E3F1F1] text-[#14605F]" },
  a5: { icon: Store, tint: "bg-[#FBE7E9] text-[#8E2A33]" },
  a6: { icon: FileText, tint: "bg-fill text-ink" },
  a7: { icon: MessagesSquare, tint: "bg-fill text-ink" },
};

function FixIcon({ id, size = 48 }: { id: string; size?: number }) {
  const look = LOOK[id] ?? { icon: FileText, tint: "bg-fill text-ink" };
  const Icon = look.icon;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full", look.tint)} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.42)} strokeWidth={1.8} aria-hidden />
    </span>
  );
}

/** Impact as three circles: ●●● high, ●●○ medium, ●○○ low. */
function ImpactDots({ impact }: { impact: Action["impact"] }) {
  const n = impact === "High" ? 3 : impact === "Medium" ? 2 : 1;
  return (
    <span className="flex items-center gap-2 text-small font-semibold text-ink-2" aria-label={`${impact} impact`}>
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("size-2.5 rounded-full", i < n ? "bg-ink" : "bg-line-strong")} />
        ))}
      </span>
      {impact} impact
    </span>
  );
}

/** Expected effect in plain words: "+4 to +11 pts on 3 questions" -> "Could add 4 to 11 points on 3 questions". */
function outcome(lift: string): string {
  if (!/^\+\d/.test(lift)) return lift === "Small" ? "A small boost" : lift === "Uncertain" ? "Hard to predict, but cheap to try" : lift;
  return `Could add ${lift.replace(/\+/g, "").replace(/ pts\b/, " points")}`;
}

function FixSheet({ a }: { a: Action }) {
  const [opened, setOpened] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const fix = FIXES[a.id]!;
  const owned = a.kind === "owned";
  return (
    <SheetContent
      title={a.title}
      footer={
        opened ? (
          <p role="status" className="inline-flex items-center gap-2 text-body font-semibold text-ink">
            <Check size={16} aria-hidden /> {owned ? "Sent to your website" : "Marked as done"}
          </p>
        ) : (
          <Button variant="accent" size="lg" className="w-full" onClick={() => setOpened(true)}>
            {owned ? "Add it to my site" : "Mark as done"}
          </Button>
        )
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-[20px] bg-bg p-5">
          <FixIcon id={a.id} />
          <p className="text-body font-semibold text-ink">{a.evidence}</p>
        </div>
        <div className="rounded-[20px] bg-lime-soft p-5">
          <p className="text-small font-semibold text-lime-ink">After this fix</p>
          <p className="mt-1.5 text-h4 font-bold text-lime-ink">{outcome(a.expectedLift)}</p>
        </div>
        <ImpactDots impact={a.impact} />
        <div>
          <button type="button" onClick={() => setShowCode((v) => !v)} aria-expanded={showCode} className="flex w-full items-center justify-between py-2 text-small font-semibold text-ink-2 hover:text-ink">
            {showCode ? "Hide code" : "Show code for your web developer"}
            <ChevronDown size={16} aria-hidden className={cn("transition-transform duration-300", showCode && "rotate-180")} />
          </button>
          {showCode ? (
            <div className="space-y-4 pt-2">
              <CodeBlock code={fix.code} language={fix.lang} filename={fix.file} />
              {fix.diff ? <DiffView filename={fix.file} lines={fix.diff} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </SheetContent>
  );
}

export function ActionsPreview() {
  const [open, setOpen] = useState<Action | null>(null);
  const first = actions.filter((a) => a.impact === "High");
  const rest = actions.filter((a) => a.impact !== "High");
  return (
    <AppShell active="actions" title="Fixes">
      <h2 className="mb-3 text-h4 font-bold text-ink">Start here</h2>
      <ul className="grid gap-3 lg:grid-cols-3">
        {first.map((a, i) => (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-5 rounded-[24px] bg-surface p-6"
          >
            <FixIcon id={a.id} size={52} />
            <div className="flex-1">
              <p className="text-h4 font-bold leading-snug text-ink">{a.title}</p>
              <p className="mt-2 text-small text-ink-3">{a.evidence}</p>
            </div>
            <ImpactDots impact={a.impact} />
            <Button variant="accent" size="lg" className="w-full" onClick={() => setOpen(a)}>
              Fix it
            </Button>
          </motion.li>
        ))}
      </ul>

      <h2 className="mb-3 mt-10 text-h4 font-bold text-ink">More fixes</h2>
      <ul className="space-y-2.5">
        {rest.map((a) => (
          <li key={a.id} className="flex items-center gap-4 rounded-[20px] bg-surface p-4">
            <FixIcon id={a.id} size={42} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{a.title}</p>
              <p className="truncate text-small text-ink-3">{a.evidence}</p>
            </div>
            <span className="hidden sm:block">
              <ImpactDots impact={a.impact} />
            </span>
            <Button variant="secondary" onClick={() => setOpen(a)}>
              Fix it
            </Button>
          </li>
        ))}
      </ul>

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        {open ? <FixSheet key={open.id} a={open} /> : null}
      </Sheet>
    </AppShell>
  );
}
