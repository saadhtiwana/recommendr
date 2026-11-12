"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Plus, Search } from "lucide-react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LineCI } from "@/components/charts/line-ci";
import { CodeBlock } from "@/components/ui/code-block";
import { EngineLogo } from "@/components/brand/engine-logo";
import { cn } from "@/lib/cn";
import { ENGINES, type EngineId } from "@/lib/palette";
import { brandSeries, competitorSeries, modelChanges } from "@/lib/mock";
import { FAQ } from "./_faq";

const GITHUB = "https://github.com/saadhtiwana/recommendr";
const EASE = [0.22, 1, 0.36, 1] as const;

// ------------------------------------------------------------------ shared bits

/** Fades and un-blurs words one by one, like a sentence coming into focus. */
function BlurWords({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="inline-block whitespace-pre"
          initial={reduce ? false : { opacity: 0, filter: "blur(8px)", y: 6 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.045, ease: EASE }}
        >
          {w}{" "}
        </motion.span>
      ))}
    </span>
  );
}

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, muted, className }: { eyebrow?: string; title: string; muted?: string; className?: string }) {
  return (
    <div className={className}>
      {eyebrow ? <p className="mb-3 text-small font-medium text-ink-3">{eyebrow}</p> : null}
      <h2 className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.035em] text-ink">
        {title} {muted ? <span className="text-ink-3/70">{muted}</span> : null}
      </h2>
    </div>
  );
}

// ------------------------------------------------------------------ header

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("sticky top-3 z-sticky mx-auto flex max-w-[1240px] items-center justify-between gap-4 rounded-full px-4 py-2.5 transition-[background,box-shadow] duration-300 md:px-5", scrolled ? "bg-surface/85 shadow-[0_8px_30px_-12px_rgb(17_19_17/0.18)] backdrop-blur-md" : "bg-transparent")}>
      <Link href="/design/landing" aria-label="Recommendr home" className="shrink-0">
        <Logo variant="full" height={26} />
      </Link>
      <nav aria-label="Primary" className="hidden items-center gap-7 text-small font-medium text-ink-2 lg:flex">
        <a href="#how" className="hover:text-ink">How it works</a>
        <a href="#honest" className="hover:text-ink">Honest numbers</a>
        <a href="#agent" className="hover:text-ink">Agent &amp; MCP</a>
        <a href="#who" className="hover:text-ink">Who it&apos;s for</a>
        <a href="#pricing" className="hover:text-ink">Pricing</a>
        <a href="#faq" className="hover:text-ink">FAQ</a>
      </nav>
      <div className="flex items-center gap-2">
        <a href={GITHUB} aria-label="Recommendr on GitHub" className="hidden size-9 items-center justify-center rounded-full bg-surface text-ink-2 shadow-card hover:text-ink sm:inline-flex">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
        </a>
        <Link href="/design/onboarding" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-small font-medium text-white hover:bg-ink-2">
          Get started <ArrowUpRight size={14} aria-hidden />
        </Link>
      </div>
    </header>
  );
}

// ------------------------------------------------------------------ hero

type FanCard =
  | { kind: "answer"; engine: EngineId; q: string; text: [string, string, string]; verdict: string; good: boolean }
  | { kind: "photo"; src: string; alt: string; label: string };

// Alternating answers and sharp photos, like a hand of cards. Answer text is short on purpose:
// the card should read in one glance.
// Three people, two answers. Photos alternate with answers so no card ever covers a face.
const FAN: FanCard[] = [
  { kind: "photo", src: "/media/photos/grocery-tablet.jpg", alt: "Grocery staff checking a tablet", label: "Grocer" },
  { kind: "answer", engine: "chatgpt", q: "best pizza in Brooklyn", text: ["Try ", "Corner Slice Pizza", " for a classic New York slice."], verdict: "Mentioned · #2", good: true },
  { kind: "photo", src: "/media/photos/dentist.jpg", alt: "A dentist in her clinic", label: "Dentist" },
  { kind: "answer", engine: "perplexity", q: "family dentist in Austin", text: ["Lakeline Dental and Bright Smile are the top rated.", "", ""], verdict: "Not mentioned", good: false },
  { kind: "photo", src: "/media/photos/barber.jpg", alt: "A barber with a client", label: "Barber" },
]

/** A lime marker stroke that sweeps across the brand name once the cards have landed. */
function MarkerSweep({ children, delay = 1.35 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="rounded-[5px] bg-[linear-gradient(var(--color-lime),var(--color-lime))] bg-no-repeat px-1 text-lime-ink [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
      initial={reduce ? false : { backgroundSize: "0% 100%" }}
      animate={{ backgroundSize: "100% 100%" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      style={reduce ? { backgroundSize: "100% 100%" } : undefined}
    >
      {children}
    </motion.span>
  );
}

function FanCardView({ card }: { card: FanCard }) {
  if (card.kind === "photo") {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-fill">
        {/* framed from the top third so faces stay in view */}
        <Image src={card.src} alt={card.alt} fill sizes="232px" className="object-cover object-[50%_30%] [filter:saturate(0.95)_sepia(0.05)]" priority />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-small font-medium text-ink backdrop-blur">{card.label}</span>
      </div>
    );
  }
  const [before, brand, after] = card.text;
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-[22px] bg-surface p-5 text-left">
      <div className="flex items-center gap-2 text-ink">
        <EngineLogo engine={card.engine} size={18} />
        <span className="text-small font-medium">{ENGINES[card.engine].label}</span>
      </div>
      <div>
        <p className="text-small text-ink-3">&ldquo;{card.q}&rdquo;</p>
        <p className="mt-2 text-[17px] font-medium leading-snug tracking-[-0.015em] text-ink">
          {before}
          {brand ? <MarkerSweep>{brand}</MarkerSweep> : null}
          {after}
        </p>
      </div>
      <span className={cn("text-small font-medium", card.good ? "text-ink" : "text-ink-3")}>{card.verdict}</span>
    </div>
  );
}

// Card centres are 248px apart (cards are 232px wide), so the arc never overlaps anything.
const FAN_GAP = 248;

/** One fan card: springs out of the pile, then drifts slightly as the hero scrolls away. */
function FanCardMotion({ card, d, gap, progress }: { card: FanCard; d: number; gap: number; progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  // as the hero scrolls away, the outer cards drift a little further out and the arc relaxes
  const spreadX = useTransform(progress, [0, 1], [0, d * 70]);
  const spreadY = useTransform(progress, [0, 1], [0, Math.abs(d) * 40]);
  return (
    <motion.div className="absolute left-[-116px] top-0" style={reduce ? undefined : { x: spreadX, y: spreadY, zIndex: (card.kind === "photo" ? 20 : 10) - Math.abs(d) }}>
      <motion.div
        className="h-[284px] w-[232px] rounded-[26px] bg-surface p-1 shadow-[0_18px_40px_-22px_rgb(17_19_17/0.35)] transition-shadow duration-300 hover:shadow-[0_30px_60px_-24px_rgb(17_19_17/0.45)]"
        initial={reduce ? false : { x: d * 14, y: 46, rotate: d * 7, scale: 0.9, opacity: 0 }}
        animate={{ x: d * gap, y: d * d * 9, rotate: d * 3, scale: 1, opacity: 1 }}
        transition={{
          opacity: { duration: 0.35, delay: 0.2 },
          default: { type: "spring", stiffness: 90, damping: 17, mass: 0.9, delay: 0.55 + Math.abs(d) * 0.08 },
        }}
        whileHover={reduce ? undefined : { y: d * d * 9 - 10, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 22 } }}
      >
        <FanCardView card={card} />
      </motion.div>
    </motion.div>
  );
}

function FanRow({ cards, gap, className, scaleClass }: { cards: FanCard[]; gap: number; className?: string; scaleClass: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 60%", "end start"] });
  const mid = (cards.length - 1) / 2;
  return (
    <div ref={ref} className={cn("relative mx-auto w-full", className)}>
      <div className={cn("absolute left-1/2 top-0 origin-top [transform:translateX(-50%)_scale(var(--fan-scale))]", scaleClass)}>
        {cards.map((card, i) => (
          <FanCardMotion key={i} card={card} d={i - mid} gap={gap} progress={scrollYProgress} />
        ))}
      </div>
    </div>
  );
}

/**
 * Opening animation: the cards start as a tidy pile and spring out, centre first, into a gentle
 * arc. Desktop shows five cards with no overlap; phones show two (an answer and a photo) side by side, sized
 * to fit the screen, so nothing is cut off.
 */
function Fan() {
  return (
    <>
      <FanRow cards={FAN} gap={FAN_GAP} className="hidden h-[270px] sm:block lg:h-[350px]" scaleClass="[--fan-scale:0.75] lg:[--fan-scale:1]" />
      <FanRow cards={FAN.slice(1, 3)} gap={FAN_GAP} className="h-[230px] sm:hidden" scaleClass="[--fan-scale:0.74]" />
    </>
  );
}

const EXAMPLES = ["Corner Slice Pizza, Brooklyn", "Bright Smile Dental, Austin", "Lakeview Florist, Chicago", "Fade Room Barbers, Atlanta"];

/** Types example businesses into the placeholder while the field is empty and unfocused. */
function useTypingPlaceholder(active: boolean): string {
  const [text, setText] = useState(EXAMPLES[0]!);
  useEffect(() => {
    if (!active) return;
    let i = 0, n = 0, deleting = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = EXAMPLES[i % EXAMPLES.length]!;
      n += deleting ? -1 : 1;
      setText(word.slice(0, n));
      if (!deleting && n === word.length) { deleting = true; t = setTimeout(tick, 1600); return; }
      if (deleting && n === 0) { deleting = false; i++; t = setTimeout(tick, 300); return; }
      t = setTimeout(tick, deleting ? 28 : 55);
    };
    t = setTimeout(tick, 1800);
    return () => clearTimeout(t);
  }, [active]);
  return text;
}

function InstantCheck() {
  const reduce = useReducedMotion();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const typed = useTypingPlaceholder(!reduce && !focused && value === "");
  return (
    <form
      className="mx-auto flex w-full max-w-[560px] flex-col gap-2 rounded-[26px] bg-surface p-1.5 shadow-[0_10px_40px_-18px_rgb(17_19_17/0.3)] transition-shadow duration-300 focus-within:shadow-[0_14px_50px_-18px_rgb(17_19_17/0.4)] sm:flex-row sm:items-center sm:rounded-full"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Free instant check"
    >
      <label className="flex flex-1 items-center gap-2 px-4">
        <Search size={16} className="shrink-0 text-ink-3" aria-hidden />
        <span className="sr-only">Business name and city</span>
        <input
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={reduce || focused ? "Business name, city" : typed}
          className="h-11 w-full bg-transparent text-body text-ink placeholder:text-ink-3 focus:outline-none"
        />
      </label>
      <button type="submit" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-lime px-6 text-body font-medium text-lime-ink transition-colors hover:bg-lime-deep focus-visible:focus-ring">
        Check for free <ArrowRight size={16} aria-hidden />
      </button>
    </form>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="hero-title" className="relative px-4 pb-16 pt-12 md:pt-16">
      <h1 id="hero-title" className="mx-auto max-w-[1100px] text-balance text-center text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[1] tracking-[-0.035em] text-ink">
        <BlurWords text="Ask AI about your industry." />
        <br />
        <BlurWords text="See if it" delay={0.25} />{" "}
        <motion.span
          className="relative inline-block whitespace-nowrap"
          initial={reduce ? false : { opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.45, ease: EASE }}
        >
          {/* a highlighter stroke across the lower half of the words, not a box */}
          <motion.span
            aria-hidden
            className="absolute inset-x-[-0.04em] bottom-[0.08em] h-[0.42em] -z-10 origin-left -skew-x-6 rounded-[0.08em] bg-lime"
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 1, ease: EASE }}
          />
          <span className="relative text-lime-ink">mentions you.</span>
        </motion.span>
      </h1>

      <p className="mx-auto mt-5 max-w-md text-center text-body text-ink-2 md:text-[17px]">
        <BlurWords delay={0.7} text="Free and open source. Use the free tier or your own API keys." />
      </p>

      <div className="mt-12 md:mt-14">
        <Fan />
      </div>

      <motion.div
        className="mt-6 px-1"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.2, ease: EASE }}
      >
        <InstantCheck />
        <ul className="mx-auto mt-6 flex max-w-[560px] flex-wrap items-center justify-center gap-x-5 gap-y-2 text-small text-ink-3" aria-label="Assistants we check">
          {(["chatgpt", "gemini", "perplexity", "claude"] as const).map((e) => (
            <li key={e} className="flex items-center gap-1.5">
              <EngineLogo engine={e} size={15} />
              {ENGINES[e].label}
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}

// ------------------------------------------------------------------ video carousel

const SLIDES = [
  { id: "48714", label: "Retail", line: "Clothing store, Chicago" },
  { id: "9039", label: "Marketing", line: "In-house marketer, Denver" },
  { id: "48713", label: "Agencies", line: "Small agency, Austin" },
  { id: "4385", label: "Restaurants", line: "Restaurant, Brooklyn" },
]

const noopSubscribe = () => () => undefined;

function MediaCarousel() {
  const [i, setI] = useState(0);
  // always plays (no play/pause control); arrows and the progress bar move between slides
  const playing = true;
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  // Server render and first paint show the poster; video starts only on the client, and never
  // for reduced motion or Save-Data.
  const saveData = useSyncExternalStore(
    noopSubscribe,
    () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData),
    () => true,
  );
  const allowVideo = !reduce && !saveData;

  useEffect(() => {
    if (!allowVideo || !playing) return;
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), 9000);
    return () => clearTimeout(t);
  }, [i, playing, allowVideo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) void v.play().catch(() => undefined);
    else v.pause();
  }, [playing, i, allowVideo]);

  const s = SLIDES[i]!;
  return (
    <section aria-label="Who uses Recommendr, in motion" className="mx-auto max-w-[1240px] px-5 md:px-10">
      <Reveal>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-ink sm:aspect-[16/9] md:aspect-[21/9]">
          <AnimatePresence mode="sync">
            <motion.div key={s.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: EASE }}>
              {allowVideo ? (
                <video ref={videoRef} className="h-full w-full object-cover" muted loop playsInline autoPlay aria-hidden poster={`/media/video/${s.id}-poster.jpg`} preload="metadata">
                  <source src={`/media/video/${s.id}.webm`} type="video/webm" />
                  <source src={`/media/video/${s.id}.mp4`} type="video/mp4" />
                </video>
              ) : (
                <Image src={`/media/video/${s.id}-poster.jpg`} alt="" fill sizes="(min-width: 1280px) 1240px, 100vw" className="object-cover" />
              )}
            </motion.div>
          </AnimatePresence>
          {/* dark gradient where the text sits, so white text always passes contrast */}
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_13_11/0.78),rgb(11_13_11/0.15)_55%,transparent)]" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 md:p-8">
            <div className="max-w-xl">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-small font-medium text-on-dark backdrop-blur">{s.label}</span>
              <AnimatePresence mode="wait">
                <motion.p key={s.id} className="mt-3 text-[clamp(1.25rem,2.6vw,2rem)] font-medium leading-tight tracking-[-0.03em] text-on-dark" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45 }}>
                  {s.line}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous" onClick={() => setI((n) => (n - 1 + SLIDES.length) % SLIDES.length)} className="inline-flex size-10 items-center justify-center rounded-full bg-white text-ink focus-visible:focus-ring">
                <ArrowLeft size={16} aria-hidden />
              </button>
              <button type="button" aria-label="Next" onClick={() => setI((n) => (n + 1) % SLIDES.length)} className="inline-flex size-10 items-center justify-center rounded-full bg-white text-ink focus-visible:focus-ring">
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </div>
          <div className="absolute left-5 right-5 top-5 flex gap-1.5 md:left-8 md:right-8">
            {SLIDES.map((sl, n) => (
              <button key={sl.id} type="button" onClick={() => setI(n)} aria-label={`Show ${sl.label}`} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                {n === i ? <motion.span key={`${i}-${playing}`} className="block h-full bg-white" initial={{ width: n === i && playing && allowVideo ? "0%" : "100%" }} animate={{ width: "100%" }} transition={{ duration: playing && allowVideo ? 9 : 0, ease: "linear" }} /> : n < i ? <span className="block h-full w-full bg-white/70" /> : null}
              </button>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ------------------------------------------------------------------ engines marquee


// ------------------------------------------------------------------ how it works: product showcase

const TABS = [
  { id: "questions", label: "Questions", title: "What customers ask" },
  { id: "answers", label: "Answers", title: "What each AI says" },
  { id: "fixes", label: "Fixes", title: "What to fix" },
] as const;

const ALL_ENGINES = ["chatgpt", "gemini", "perplexity", "claude"] as const;

function QuestionsPanel() {
  const rows: { q: string; tag: string; hits: EngineId[] }[] = [
    { q: "best pizza in Brooklyn", tag: "Discovery", hits: ["chatgpt", "gemini", "claude"] },
    { q: "late night pizza delivery", tag: "Local", hits: ["gemini"] },
    { q: "pizza for a group of 20", tag: "Specific", hits: ["chatgpt", "perplexity"] },
    { q: "gluten-free pizza near me", tag: "Specific", hits: [] },
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {rows.map((r, i) => (
        <motion.li
          key={r.q}
          className="flex flex-col justify-between gap-6 rounded-[20px] bg-bg p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
        >
          <div>
            <span className="rounded-full bg-surface px-2.5 py-1 text-small text-ink-3">{r.tag}</span>
            <p className="mt-3 text-[20px] font-medium leading-tight tracking-[-0.02em]">&ldquo;{r.q}&rdquo;</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {ALL_ENGINES.map((e) => {
                const hit = r.hits.includes(e);
                return (
                  <span key={e} className={cn("flex size-8 items-center justify-center rounded-full", hit ? "bg-lime text-lime-ink" : "bg-surface text-ink-3/50")} title={`${ENGINES[e].label}: ${hit ? "mentions you" : "doesn't mention you"}`}>
                    <EngineLogo engine={e} size={15} />
                  </span>
                );
              })}
            </div>
            <span className={cn("text-small font-medium", r.hits.length ? "text-ink" : "text-down")}>{r.hits.length} of 4</span>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

function AnswersPanel() {
  const rows: { e: EngineId; t: ReactNode; v: string; good: boolean }[] = [
    { e: "chatgpt", t: <>For a classic New York slice, try <mark className="rounded-[4px] bg-lime px-1 text-lime-ink">Corner Slice Pizza</mark> on 7th Ave.</>, v: "#2", good: true },
    { e: "gemini", t: <><mark className="rounded-[4px] bg-lime px-1 text-lime-ink">Corner Slice Pizza</mark> is a local favorite.</>, v: "#1", good: true },
    { e: "perplexity", t: <>Fulton Ave Pizza and Prospect Pie Co. are the top picks.</>, v: "Not mentioned", good: false },
  ];
  return (
    <div className="space-y-4">
      <div className="ml-auto w-fit max-w-[80%] rounded-[18px] rounded-br-md bg-ink px-4 py-2.5 text-body text-white">best pizza in Brooklyn?</div>
      {rows.map((r, i) => (
        <motion.div
          key={r.e}
          className="flex items-end gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.12, ease: EASE }}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-card">
            <EngineLogo engine={r.e} size={18} />
          </span>
          <div className="max-w-[85%] rounded-[18px] rounded-bl-md bg-bg px-4 py-3">
            <p className="text-body leading-relaxed">{r.t}</p>
          </div>
          <span className={cn("mb-3 shrink-0 text-small font-medium", r.good ? "text-ink" : "text-ink-3")}>{r.v}</span>
        </motion.div>
      ))}
    </div>
  );
}

function FixesPanel() {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col justify-between gap-6 rounded-[20px] bg-bg p-5">
        <div>
          <div className="flex items-center gap-2 text-ink-3">
            <EngineLogo engine="claude" size={16} />
            <EngineLogo engine="chatgpt" size={16} />
            <span className="text-small">AI says</span>
          </div>
          <p className="relative mt-3 w-fit text-h3 font-medium tracking-[-0.02em] text-ink-2">
            &ldquo;They don&apos;t deliver.&rdquo;
            {/* the false claim gets struck through once the panel appears */}
            <motion.span
              aria-hidden
              className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-down"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            />
          </p>
        </div>
        <div>
          <span className="text-small text-ink-3">Truth</span>
          <p className="mt-1 text-h3 font-medium tracking-[-0.02em] text-up">Delivery until 2 am.</p>
        </div>
      </div>
      <CodeBlock code={JSONLD} language="json" filename="restaurant.jsonld" />
    </div>
  );
}

function Showcase() {
  const [tab, setTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  // auto-advance like a product tour; pauses while the pointer is over it
  useEffect(() => {
    if (paused || reduce) return;
    const t = setTimeout(() => setTab((n) => (n + 1) % TABS.length), 6000);
    return () => clearTimeout(t);
  }, [tab, paused, reduce]);
  const active = TABS[tab]!;
  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto max-w-[1240px] px-5 py-16 md:px-10 md:py-20">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <h2 id="how-title" className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.035em]">
          How it works
        </h2>
        <div role="tablist" aria-label="Product tour" className="flex rounded-full bg-surface p-1">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={i === tab}
              onClick={() => setTab(i)}
              className={cn("relative h-9 rounded-full px-4 text-small font-medium transition-colors duration-300 focus-visible:focus-ring", i === tab ? "text-white" : "text-ink-2 hover:text-ink")}
            >
              {i === tab ? <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 380, damping: 32 }} /> : null}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-10 rounded-[28px] bg-surface p-5 md:p-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <AnimatePresence mode="wait">
              <motion.div key={active.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EASE }}>
                <p className="text-h3 font-medium tracking-[-0.02em]">{active.title}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-1.5" aria-hidden>
              {TABS.map((t, i) => (
                <span key={t.id} className="h-1 w-10 overflow-hidden rounded-full bg-fill">
                  {i === tab ? (
                    <motion.span
                      key={`${tab}-${paused}`}
                      className="block h-full bg-ink"
                      initial={{ width: paused || reduce ? "100%" : "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: paused || reduce ? 0 : 6, ease: "linear" }}
                    />
                  ) : null}
                </span>
              ))}
            </div>
          </div>
          {/* fixed height: auto-advancing tabs must not move the rest of the page */}
          <div className="relative min-h-[330px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                role="tabpanel"
                initial={{ opacity: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                {tab === 0 ? <QuestionsPanel /> : tab === 1 ? <AnswersPanel /> : <FixesPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ------------------------------------------------------------------ agent + MCP

const MCP_CONFIG = `{
  "mcpServers": {
    "recommendr": { "url": "https://mcp.recommendr.app/mcp" }
  }
}`;

type Beat =
  | { kind: "user"; text: string }
  | { kind: "tool"; working: string; done: string }
  | { kind: "answer"; text: string; chips: string[] }
  | { kind: "actions" };

const SCRIPTS: Record<"agent" | "mcp", Beat[]> = {
  agent: [
    { kind: "user", text: "Why did Perplexity stop recommending us?" },
    { kind: "tool", working: "Reading Perplexity answers", done: "Read 48 Perplexity answers from the last 4 weeks" },
    { kind: "tool", working: "Checking the sites they cite", done: "Checked the sites those answers cite" },
    { kind: "answer", text: "Perplexity started citing a new Eater NY list of Brooklyn pizzerias. You aren't on it, and it appears in 9 of Perplexity's last 12 answers.", chips: ["Perplexity answers", "eater.com"] },
    { kind: "actions" },
  ],
  mcp: [
    { kind: "user", text: "Is Corner Slice showing up on ChatGPT this week?" },
    { kind: "tool", working: "Looking up your Recommendr results", done: "Looked up your ChatGPT results for this week" },
    { kind: "answer", text: "Yes. ChatGPT mentioned Corner Slice Pizza in 47% of answers this week, up 14 points from last week.", chips: ["150 ChatGPT answers"] },
  ],
};

// When each beat appears (ms after the previous one); answers then stream word by word.
const BEAT_DELAY: Record<Beat["kind"], number> = { user: 400, tool: 900, answer: 900, actions: 1500 };

/** Reveals text word by word, like a streamed reply. */
function StreamText({ text, onDone }: { text: string; onDone?: () => void }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const [n, setN] = useState(reduce ? words.length : 0);
  useEffect(() => {
    if (n >= words.length) { onDone?.(); return; }
    const t = setTimeout(() => setN((x) => x + 1), 45);
    return () => clearTimeout(t);
  }, [n, words.length, onDone]);
  return (
    <>
      {words.slice(0, n).join(" ")}
      {n < words.length ? <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-ink" aria-hidden /> : null}
    </>
  );
}

/** One quiet line per step, in plain language: a small spinner while working, a check when done. */
/** One quiet line per step, in plain language: a small spinner while working, a check when done. */
function ToolRow({ beat, done }: { beat: Extract<Beat, { kind: "tool" }>; done: boolean }) {
  return (
    <p className="flex items-center gap-2 text-small text-ink-3">
      {done ? (
        <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2.5 6.2 5 8.5l4.5-5" /></svg>
      ) : (
        <span className="size-3 animate-spin rounded-full border-[1.5px] border-ink-3/60 border-t-transparent" aria-hidden />
      )}
      {done ? beat.done : `${beat.working}…`}
    </p>
  );
}

/** After approval: the check visibly runs, then the agent replies with the result as a message. */
function CheckProgress() {
  const reduce = useReducedMotion();
  const TOTAL = 40;
  const [n, setN] = useState(reduce ? TOTAL : 0);
  useEffect(() => {
    if (n >= TOTAL) return;
    const t = setTimeout(() => setN((x) => x + 1), 70);
    return () => clearTimeout(t);
  }, [n]);
  if (n < TOTAL) {
    return (
      <div className="space-y-2">
        <p className="text-small text-ink-3">
          Checking Perplexity <span className="tabular">{n} of {TOTAL}</span> answers
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-fill" aria-hidden>
          <div className="h-full rounded-full bg-ink transition-[width] duration-100" style={{ width: `${(n / TOTAL) * 100}%` }} />
        </div>
      </div>
    );
  }
  return (
    <motion.p className="text-body leading-relaxed text-ink" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
      Done. Perplexity mentioned you in 3 of 40 answers this time, about the same as last week.
    </motion.p>
  );
}

function ChatWindow({ mode, playing, runId, onReplay }: { mode: "agent" | "mcp"; playing: boolean; runId: number; onReplay: () => void }) {
  const reduce = useReducedMotion();
  const beats = SCRIPTS[mode];
  // the parent remounts this component (via key) to restart the script on mode change or replay
  const [shown, setShown] = useState(reduce ? beats.length : 0); // beats visible
  const [toolsDone, setToolsDone] = useState(reduce ? beats.length : 0);
  const [streamed, setStreamed] = useState(Boolean(reduce));
  const [approval, setApproval] = useState<"idle" | "asking" | "approved">("idle");


  useEffect(() => {
    if (!playing || reduce || shown >= beats.length) return;
    const prev = beats[shown - 1];
    // wait for the streamed answer to finish before showing what follows it
    if (prev?.kind === "answer" && !streamed) return;
    const next = beats[shown]!;
    const t = setTimeout(() => {
      setShown((s) => s + 1);
      if (next.kind === "tool") setTimeout(() => setToolsDone((d) => d + 1), 700);
    }, BEAT_DELAY[next.kind]);
    return () => clearTimeout(t);
  }, [playing, shown, beats, streamed, reduce]);

  const finished = shown >= beats.length && streamed;
  let toolIndex = 0;

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-[24px] bg-surface shadow-[0_30px_80px_-40px_rgb(17_19_17/0.45)]">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        {mode === "agent" ? <Logo variant="mark" height={20} /> : <EngineLogo engine="claude" size={18} className="text-ink" />}
        <span className="text-small font-medium">{mode === "agent" ? "Recommendr agent" : "Claude"}</span>
        <button type="button" onClick={onReplay} disabled={!finished} className="ml-auto rounded-full px-2.5 py-1 text-small text-ink-3 transition-opacity hover:bg-fill hover:text-ink disabled:opacity-0">
          Replay
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5" aria-live="polite">
        <AnimatePresence initial={false}>
          {beats.slice(0, shown).map((b, i) => {
            const key = `${mode}-${runId}-${i}`;
            const enter = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: EASE } };
            if (b.kind === "user")
              return (
                <motion.div key={key} {...enter} className="ml-auto max-w-[85%] rounded-[18px] rounded-br-md bg-ink px-4 py-2.5 text-body text-white">
                  {b.text}
                </motion.div>
              );
            if (b.kind === "tool") {
              const idx = toolIndex++;
              return (
                <motion.div key={key} {...enter}>
                  <ToolRow beat={b} done={toolsDone > idx} />
                </motion.div>
              );
            }
            if (b.kind === "answer")
              return (
                <motion.div key={key} {...enter} className="max-w-[92%]">
                  <p className="text-body leading-relaxed text-ink">
                    <StreamText text={b.text} onDone={() => setStreamed(true)} />
                  </p>
                  {streamed ? (
                    <motion.div className="mt-2.5 flex flex-wrap gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      {b.chips.map((c) => (
                        <span key={c} className="text-small text-ink-3 underline decoration-line-strong underline-offset-4">{c}</span>
                      ))}
                    </motion.div>
                  ) : null}
                </motion.div>
              );
            return (
              <motion.div key={key} {...enter} className="mt-auto">
                <AnimatePresence mode="wait">
                  {approval === "asking" ? (
                    <motion.div key="ask" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3 rounded-[16px] border border-line p-3.5">
                      <div className="mr-auto">
                        <p className="text-small font-medium">Re-check Perplexity now?</p>
                        <p className="text-small text-ink-3">About 40 answers · $0.38 on your key</p>
                      </div>
                      <button type="button" onClick={() => setApproval("idle")} className="h-9 rounded-full px-3.5 text-small text-ink-2 hover:bg-fill">Not now</button>
                      <button type="button" onClick={() => setApproval("approved")} className="h-9 rounded-full bg-ink px-4 text-small font-medium text-white hover:bg-ink-2">Approve</button>
                    </motion.div>
                  ) : approval === "approved" ? (
                    <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <CheckProgress />
                    </motion.div>
                  ) : (
                    <motion.div key="btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2">
                      <button type="button" className="h-10 rounded-full bg-lime px-4 text-small font-medium text-lime-ink hover:bg-lime-deep">Draft outreach to Eater</button>
                      <button type="button" onClick={() => setApproval("asking")} className="h-10 rounded-full bg-fill px-4 text-small font-medium hover:bg-line">Re-check now</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentAndMcp() {
  const [mode, setMode] = useState<"agent" | "mcp">("agent");
  const [runId, setRunId] = useState(0);
  const [inView, setInView] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section id="agent" aria-labelledby="agent-title" className="mx-auto max-w-[1240px] px-5 py-16 md:px-10 md:py-24">
      <div ref={ref} className="rounded-[32px] bg-[linear-gradient(180deg,var(--color-surface),var(--color-bg))] p-5 sm:p-8 md:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <h2 id="agent-title" className="text-[clamp(2.25rem,4.6vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.035em]">
              Ask questions about your results
            </h2>
            <p className="mt-4 max-w-md text-body text-ink-2">
              The agent answers from your own data and links to the AI answers it used. You can also connect the MCP server and ask from Claude or Cursor.
            </p>
            <div role="tablist" aria-label="Where to ask" className="mt-8 inline-flex rounded-full bg-fill p-1">
              {(["agent", "mcp"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  type="button"
                  aria-selected={mode === m}
                  onClick={() => { setMode(m); setRunId((r) => r + 1); }}
                  className={cn("relative h-10 rounded-full px-4 text-small font-medium transition-colors duration-300 focus-visible:focus-ring", mode === m ? "text-ink" : "text-ink-3 hover:text-ink")}
                >
                  {mode === m ? <motion.span layoutId="agent-mode" className="absolute inset-0 rounded-full bg-surface shadow-card" transition={{ type: "spring", stiffness: 380, damping: 32 }} /> : null}
                  <span className="relative flex items-center gap-2">
                    {m === "agent" ? <Logo variant="mark" height={16} /> : <EngineLogo engine="claude" size={15} />}
                    {m === "agent" ? "Recommendr agent" : "In Claude, via MCP"}
                  </span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {mode === "mcp" ? (
                <motion.div className="mt-8 overflow-hidden rounded-[18px] bg-ink" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                  <div className="flex items-center justify-between px-4 pt-3 text-small text-on-dark-2">
                    <span className="font-mono">claude_desktop_config.json</span>
                    <button
                      type="button"
                      onClick={() => { void navigator.clipboard?.writeText(MCP_CONFIG); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                      className="rounded-full px-2.5 py-1 text-on-dark hover:bg-white/10"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto px-4 pb-4 pt-2 font-mono text-[12.5px] leading-relaxed text-on-dark-2">{MCP_CONFIG}</pre>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <ChatWindow key={`${mode}-${runId}`} mode={mode} playing={inView} runId={runId} onReplay={() => setRunId((r) => r + 1)} />
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ who it's for

const WHO = [
  { src: "/media/photos/florist-customer.jpg", alt: "A florist handing flowers to a customer", t: "Florists", d: "", pos: "18% 30%" },
  { src: "/media/photos/chef.jpg", alt: "A young chef cooking in a kitchen", t: "Restaurants", d: "", pos: "78% 30%" },
  { src: "/media/photos/makeup-artist.jpg", alt: "A make-up artist with a client", t: "Salons", d: "" },
  { src: "/media/photos/trainer.jpg", alt: "A personal trainer coaching a client", t: "Gyms", d: "" },
  { src: "/media/photos/vet.jpg", alt: "A vet examining a dog", t: "Clinics", d: "" },
]

function WhoItsFor() {
  return (
    <section id="who" aria-labelledby="who-title" className="mx-auto max-w-[1240px] px-5 py-16 md:px-10 md:py-20">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle title="For local businesses and the agencies that work with them" />
        </div>
      </Reveal>
      {/* phones: a swipeable row (snap) instead of five full-height photos stacked */}
      <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {WHO.map((w, i) => (
          <Reveal key={w.t} delay={i * 0.06} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-auto">
            <figure className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-fill">
                <Image src={w.src} alt={w.alt} fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 50vw, 100vw" className="object-cover object-[50%_25%] [filter:saturate(0.95)_sepia(0.05)] transition-transform duration-700 ease-out group-hover:scale-[1.04]" style={{ objectPosition: "pos" in w ? w.pos : "50% 25%" }} />
              </div>
              <figcaption className="mt-3">
                <p className="text-body font-medium">{w.t}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ honest numbers

function Honest() {
  return (
    <section id="honest" aria-labelledby="honest-title" className="mx-auto max-w-[1240px] px-5 py-8 md:px-10">
      <div className="rounded-[28px] bg-surface p-6 md:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <h2 id="honest-title" className="text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Every result shows its margin of error
            </h2>
            <p className="mt-4 max-w-sm text-body text-ink-2">AI gives a different answer each time, so we ask several times and report the range.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-[20px] bg-bg p-4">
              <p className="px-1 text-small text-ink-3">You vs. your top competitor, 12 weeks.</p>
              <LineCI
                brand={brandSeries}
                brandLabel="You"
                series={[{ id: "c_shahi", label: "Fulton Ave Pizza", color: "teal", points: competitorSeries.c_shahi ?? [], significant: false }]}
                annotations={modelChanges.slice(1).map((m) => ({ date: m.date, label: "Model update" }))}
                height={300}
                title="Your visibility against your top competitor over 12 weeks"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ fix example

const JSONLD = `{
  "@type": "Restaurant",
  "name": "Corner Slice Pizza",
  "servesCuisine": "Pizza",
  "description": "Delivery until 2 am",
  "openingHours": "Mo-Su 11:00-02:00",
  "areaServed": "Brooklyn, NY"
}`;

// ------------------------------------------------------------------ pricing

function Pricing() {
  const reduce = useReducedMotion();
  const plans = [
    { name: "Free", price: "$0", sub: "No API keys", items: ["1 business", "10 questions", "Weekly checks"], cta: "Start free", href: "/design/onboarding", featured: false },
    { name: "Your own keys", price: "$0", sub: "Your API keys", items: ["Unlimited businesses", "All 4 AIs", "Pay providers at cost"], cta: "Add your keys", href: "/design/onboarding", featured: true },
    { name: "Self-hosted", price: "$0", sub: "Your server", items: ["docker compose up", "No limits", "Your data stays yours"], cta: "Read the guide", href: `${GITHUB}/blob/main/docs/self-hosting.md`, featured: false },
  ];
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="mx-auto max-w-[1240px] px-5 py-16 md:px-10 md:py-20">
      <Reveal className="text-center">
        <h2 id="pricing-title" className="mx-auto max-w-2xl text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.035em]">
          Pricing
        </h2>
        <p className="mt-3 text-body text-ink-2">All plans are free. With your own keys you pay the AI providers directly.</p>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-[1000px] items-center gap-5 md:grid-cols-3">
        {plans.map((p, i) => (
          <motion.article
            key={p.name}
            className={cn("relative flex flex-col rounded-[24px] p-6", p.featured ? "z-10 bg-lime text-lime-ink shadow-[0_30px_60px_-25px_rgb(27_66_73/0.45)] md:py-9" : "bg-surface")}
            initial={reduce ? false : { opacity: 0, y: 30, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: p.featured ? -2.5 : 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
            whileHover={reduce ? undefined : { rotate: 0, y: -4 }}
          >
            <h3 className={cn("text-body font-medium", p.featured ? "text-lime-ink" : "text-ink-2")}>{p.name}</h3>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-[44px] font-medium tracking-[-0.04em]">{p.price}</span>
              <span className={cn("text-small", p.featured ? "text-lime-ink" : "text-ink-3")}>{p.sub}</span>
            </p>
            <ul className="mt-5 space-y-2 text-small">
              {p.items.map((it) => (
                <li key={it} className="flex gap-2"><Plus size={14} className="mt-0.5 shrink-0" aria-hidden />{it}</li>
              ))}
            </ul>
            <a href={p.href} className={cn("mt-7 inline-flex h-11 items-center justify-center gap-1.5 rounded-full text-small font-medium focus-visible:focus-ring", p.featured ? "bg-lime-ink text-white hover:opacity-90" : "bg-ink text-white hover:bg-ink-2")}>
              {p.cta} <ArrowUpRight size={14} aria-hidden />
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ lime band

// ------------------------------------------------------------------ FAQ


function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 md:px-10 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
      <Reveal>
        <h2 id="faq-title" className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.035em]">
          FAQ
        </h2>
      </Reveal>
      <div className="divide-y divide-line border-y border-line">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-body font-medium [&::-webkit-details-marker]:hidden">
              {f.q}
              <Plus size={18} className="shrink-0 text-ink-3 transition-transform duration-300 group-open:rotate-45" aria-hidden />
            </summary>
            <p className="mt-3 max-w-2xl text-body text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ footer

function Footer() {
  return (
    <footer className="mx-auto max-w-[1240px] px-5 pb-6 pt-8 md:px-10 md:pb-10">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { src: "/media/photos/cafe-counter.jpg", t: "Self-host it", d: "One Docker Compose file.", href: `${GITHUB}/blob/main/docs/self-hosting.md`, cta: "Self-hosting guide" },
          { src: "/media/photos/florist-orders.jpg", t: "Read the source", d: "AGPL-3.0 on GitHub.", href: GITHUB, cta: "View on GitHub" },
        ].map((c) => (
          <a key={c.t} href={c.href} className="group relative block aspect-[16/10] overflow-hidden rounded-[24px] bg-ink focus-visible:focus-ring">
            <Image src={c.src} alt="" fill sizes="(min-width: 768px) 620px, 100vw" className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_13_11/0.82),rgb(11_13_11/0.2)_60%,transparent)]" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[clamp(1.5rem,3vw,2.25rem)] font-medium tracking-[-0.035em] text-on-dark">{c.t}</p>
              <p className="mt-1 max-w-sm text-small text-on-dark-2">{c.d}</p>
              <span className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-small font-medium text-ink">
                {c.cta} <ArrowUpRight size={14} aria-hidden />
              </span>
            </div>
          </a>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-8 rounded-[24px] bg-surface p-6 md:p-8">
        <div className="max-w-xs">
          <Logo variant="full" height={24} />
          <p className="mt-3 text-small text-ink-2">See if AI recommends you.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-16 gap-y-2 text-small sm:grid-cols-3">
          <a href="#how" className="text-ink-2 hover:text-ink">How it works</a>
          <a href={GITHUB} className="text-ink-2 hover:text-ink">GitHub</a>
          <a href="#pricing" className="text-ink-2 hover:text-ink">Pricing</a>
          <a href={`${GITHUB}/blob/main/docs/self-hosting.md`} className="text-ink-2 hover:text-ink">Self-hosting</a>
          <a href="#faq" className="text-ink-2 hover:text-ink">FAQ</a>
          <a href={`${GITHUB}/blob/main/SECURITY.md`} className="text-ink-2 hover:text-ink">Security</a>
        </nav>
        <p className="w-full border-t border-line pt-4 text-small text-ink-3">
          AGPL-3.0 · Not affiliated with OpenAI, Google, Perplexity or Anthropic · Footage: Mixkit
        </p>
      </div>
    </footer>
  );
}

// ------------------------------------------------------------------ page

export function Landing() {
  const reduce = useReducedMotion();
  const page = (
    <div className="min-h-screen bg-canvas p-2 md:p-3">
      {/* the page is a rounded frame floating on the canvas */}
      <div className="relative overflow-clip rounded-[24px] bg-bg shadow-frame md:rounded-[32px]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(60%_50%_at_50%_0%,rgb(255_255_255/0.9),transparent)]" />
        <div className="relative px-2 pt-1 md:px-4">
          <Header />
        </div>
        <main className="relative">
          <Hero />
          <MediaCarousel />
          <Showcase />
          <AgentAndMcp />
          <WhoItsFor />
          <Honest />
          <Pricing />
          <Faq />
        </main>
        <Footer />
      </div>
    </div>
  );
  // Smooth, eased scrolling (Lenis); native scrolling when the user prefers reduced motion.
  return reduce ? page : <ReactLenis root options={{ lerp: 0.09, anchors: true }}>{page}</ReactLenis>;
}
