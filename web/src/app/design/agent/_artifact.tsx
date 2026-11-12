"use client";

import { Check, ChevronDown, Clock, Copy, Globe, MapPin, Phone, Truck, Users, Wheat, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { LogoLoader } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { cn } from "@/lib/cn";

/** Shared pieces of the agent-style interactions (dashboard fix panel + agent artifacts). */

export const SPRING: Transition = { type: "spring", stiffness: 360, damping: 34 };
const INSTANT: Transition = { duration: 0 };

/** Spring, or no animation at all when the user asked for reduced motion. */
export function useSpring(): Transition {
  return useReducedMotion() ? INSTANT : SPRING;
}

const DESKTOP = "(min-width: 1024px)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(DESKTOP);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => true);
}

/** Reveals 0..total one step every `ms`; instant under reduced motion; `frozen` pauses it. */
export function useReveal(total: number, ms: number, frozen = false): number {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce || frozen) return;
    const t = setInterval(() => setN((c) => (c >= total ? c : c + 1)), ms);
    return () => clearInterval(t);
  }, [total, ms, reduce, frozen]);
  return reduce ? total : Math.min(n, total);
}

/** Small square icon button, as in the answer action row. */
export function IconAction({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-sm text-ink-2 ring-1 ring-line transition-colors duration-[var(--duration-fast)] ring-inset hover:bg-fill hover:text-ink focus-visible:focus-ring",
        pressed ? "bg-ink text-white ring-ink hover:bg-ink-2 hover:text-white" : "bg-surface",
      )}
    >
      {children}
    </button>
  );
}

export function CopyAction({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <IconAction
      label={done ? "Copied" : label}
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? <Check size={14} strokeWidth={1.75} aria-hidden /> : <Copy size={14} strokeWidth={1.6} aria-hidden />}
    </IconAction>
  );
}

/**
 * In-page side panel (not a modal). On desktop it grows from zero width next to the content, so
 * the content column narrows smoothly; below 1024px it becomes a full-width sheet. Esc closes,
 * focus moves in on open and back to the trigger on close.
 */
export function ArtifactPanel({
  title,
  actions,
  onClose,
  children,
  contentKey,
}: {
  title: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Changing it cross-fades the body without re-running the open animation. */
  contentKey: string;
}) {
  const desktop = useIsDesktop();
  const t = useSpring();
  const headingId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => back?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // A drawer over the page on every screen size: the page never jumps, and there are three
  // ways out (the X, a click on the dimmed page, Esc).
  const panelMotion = desktop ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } } : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } };

  return (
    <>
      <motion.div
        aria-hidden
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-overlay bg-ink/25"
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        {...panelMotion}
        transition={t}
        className={cn(
          "fixed z-modal flex flex-col overflow-hidden bg-surface shadow-overlay",
          desktop ? "top-2 right-2 bottom-2 w-[min(560px,calc(100vw-1rem))] rounded-[24px]" : "inset-x-0 bottom-0 top-10 rounded-t-[24px]",
        )}
      >
        {!desktop ? <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong" /> : null}
        <header className="flex items-center gap-3 px-6 pt-5 pb-3">
          <h2 id={headingId} className="min-w-0 flex-1 truncate text-h4 font-bold text-ink">
            {title}
          </h2>
          {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fill text-ink transition-colors hover:bg-line focus-visible:focus-ring"
          >
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        </header>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={contentKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.section>
    </>
  );
}

// ---------------------------------------------------------------- generated fixes

export type FixId = "delivery" | "groups" | "robots";

export const FIXES: Record<FixId, { title: string; file: string; lang: "json" | "txt"; branch: string; drafting: string; code: string }> = {
  delivery: {
    title: "Tell AI you deliver",
    file: "restaurant.jsonld",
    lang: "json",
    branch: "recommendr/delivery-schema",
    drafting: "Writing Restaurant schema",
    code: `{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Corner Slice Pizza",
  "servesCuisine": "Pizza",
  "priceRange": "$",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Brooklyn",
    "addressRegion": "NY",
    "addressCountry": "US"
  },
  "hasDeliveryMethod": "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "11:00",
      "closes": "02:00"
    }
  ],
  "url": "https://cornerslice.com"
}`,
  },
  groups: {
    title: "Answer group questions",
    file: "faq-groups.jsonld",
    lang: "json",
    branch: "recommendr/groups-faq",
    drafting: "Writing FAQPage schema",
    code: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Can Corner Slice Pizza seat large groups?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. The back room seats up to 24. Book online."
      }
    },
    {
      "@type": "Question",
      "name": "Do you have gluten-free pizza?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, a 12-inch gluten-free crust for $4 extra."
      }
    }
  ]
}`,
  },
  robots: {
    title: "Let AI read your site",
    file: "robots.txt",
    lang: "txt",
    branch: "recommendr/allow-ai-search",
    drafting: "Updating robots.txt",
    code: `User-agent: *
Allow: /

# Let AI search engines read and cite your site
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: GPTBot
Disallow: /admin/

Sitemap: https://cornerslice.com/sitemap.xml`,
  },
};

// What each fix means in plain words: what AI says now, what it will see after, and the facts added.
const PLAIN: Record<FixId, { now: string; after: string; facts: { icon: ReactNode; label: string }[] }> = {
  delivery: {
    now: "\u201CThey don\u2019t deliver.\u201D",
    after: "Delivers in Brooklyn until 2 am",
    facts: [
      { icon: <Truck size={18} strokeWidth={1.8} aria-hidden />, label: "Delivery" },
      { icon: <Clock size={18} strokeWidth={1.8} aria-hidden />, label: "Until 2 am" },
      { icon: <MapPin size={18} strokeWidth={1.8} aria-hidden />, label: "Brooklyn, NY" },
    ],
  },
  groups: {
    now: "\u201CNot set up for large groups.\u201D",
    after: "Takes groups of up to 30, and has gluten-free crusts",
    facts: [
      { icon: <Users size={18} strokeWidth={1.8} aria-hidden />, label: "Groups of 30" },
      { icon: <Wheat size={18} strokeWidth={1.8} aria-hidden />, label: "Gluten-free" },
      { icon: <Phone size={18} strokeWidth={1.8} aria-hidden />, label: "Book by phone" },
    ],
  },
  robots: {
    now: "ChatGPT and Perplexity can\u2019t read your site",
    after: "All four AIs can read and cite your site",
    facts: [
      { icon: <Globe size={18} strokeWidth={1.8} aria-hidden />, label: "ChatGPT search" },
      { icon: <Globe size={18} strokeWidth={1.8} aria-hidden />, label: "Perplexity" },
      { icon: <Globe size={18} strokeWidth={1.8} aria-hidden />, label: "Your website" },
    ],
  },
};

/**
 * A fix explained in plain words for a business owner: before and after, the facts it adds,
 * one main action (behind approval) and the code tucked away for whoever edits the website.
 */
export function FixArtifact({ id }: { id: FixId; onClose?: () => void }) {
  const fix = FIXES[id];
  const plain = PLAIN[id];
  const [pr, setPr] = useState<"idle" | "pending" | "approved">("idle");
  const [showCode, setShowCode] = useState(false);
  const t = useSpring();

  return (
    <>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        <div className="grid gap-3">
          <div className="rounded-[20px] bg-bg p-5">
            <p className="text-small font-semibold text-ink-3">AI says now</p>
            <p className="relative mt-2 w-fit text-h3 font-semibold text-ink-2">
              {plain.now}
              <motion.span
                aria-hidden
                className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-down"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </p>
          </div>
          <div className="rounded-[20px] bg-lime-soft p-5">
            <p className="text-small font-semibold text-lime-ink">After this fix</p>
            <p className="mt-2 text-h3 font-semibold text-lime-ink">{plain.after}</p>
          </div>
        </div>

        <ul className="grid grid-cols-3 gap-3">
          {plain.facts.map((f, i) => (
            <motion.li
              key={f.label}
              className="flex flex-col items-center gap-2 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...t, delay: 0.15 + i * 0.07 }}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-fill text-ink">{f.icon}</span>
              <span className="text-small font-semibold text-ink">{f.label}</span>
            </motion.li>
          ))}
        </ul>

        <div>
          <button type="button" onClick={() => setShowCode((v) => !v)} aria-expanded={showCode} className="flex w-full items-center justify-between rounded-[14px] px-1 py-2 text-small font-semibold text-ink-2 hover:text-ink">
            {showCode ? "Hide code" : "Show code for your web developer"}
            <ChevronDown size={16} aria-hidden className={cn("transition-transform duration-300", showCode && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={t} className="overflow-hidden">
                <div className="pt-2">
                  <CodeBlock code={fix.code} language={fix.lang} filename={fix.file} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <footer className="border-t border-line p-4">
        {/* the button is the approval: one click, a short wait, then done. No second confirm card. */}
        <Button
          variant={pr === "approved" ? "secondary" : "accent"}
          size="lg"
          className="w-full"
          disabled={pr !== "idle"}
          onClick={() => {
            setPr("pending");
            setTimeout(() => {
              setPr("approved");
              // lets pages that list fixes (the dashboard) mark this one as done
              window.dispatchEvent(new CustomEvent("recommendr:fix-approved", { detail: id }));
            }, 1100);
          }}
        >
          {pr === "pending" ? (
            <>
              <LogoLoader size={16} /> Adding
            </>
          ) : pr === "approved" ? (
            <>
              <Check size={16} aria-hidden /> Added to your site
            </>
          ) : (
            "Add it to my site"
          )}
        </Button>
      </footer>
    </>
  );
}
