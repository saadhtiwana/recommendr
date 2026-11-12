"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Plus, Search } from "lucide-react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LineCI } from "@/components/charts/line-ci";
import { CodeBlock } from "@/components/ui/code-block";
import { IntervalValue } from "@/components/ui/interval-value";
import { EngineLogo } from "@/components/brand/engine-logo";
import { cn } from "@/lib/cn";
import { ENGINES, type EngineId } from "@/lib/palette";
import { brandSeries, competitorSeries, modelChanges, wilson } from "@/lib/mock";
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
      <h2 className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.045em] text-ink">
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
const FAN: FanCard[] = [
  { kind: "photo", src: "/media/photos/grocery-tablet.jpg", alt: "Grocery staff checking a tablet", label: "Grocer" },
  { kind: "answer", engine: "gemini", q: "same-day flowers in Lahore", text: ["", "Gulberg Flower Studio", " delivers until 7 pm."], verdict: "Mentioned · #1", good: true },
  { kind: "photo", src: "/media/photos/boutique-counter.jpg", alt: "Staff serving a customer at a boutique counter", label: "Boutique" },
  { kind: "answer", engine: "chatgpt", q: "best biryani in Islamabad", text: ["Try ", "Dera Biryani House", " for Sindhi-style biryani."], verdict: "Mentioned · #2", good: true },
  { kind: "photo", src: "/media/photos/dentist.jpg", alt: "A dentist in her clinic", label: "Dentist" },
  { kind: "answer", engine: "perplexity", q: "family dentist in Leeds", text: ["Northgate Dental and Kirkstall Smiles are top rated.", "", ""], verdict: "Not mentioned", good: false },
  { kind: "photo", src: "/media/photos/barber.jpg", alt: "A barber with a client", label: "Barber" },
]

// Fan geometry: 160px between card centres (each 220px card shows most of its face), a gentle
// arc that drops toward the edges, and a few degrees of rotation per step.
const FAN_GAP = 160;
const FAN_TILT = 5.5;

function FanCardView({ card }: { card: FanCard }) {
  if (card.kind === "photo") {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-fill">
        <Image src={card.src} alt={card.alt} fill sizes="220px" className="object-cover [filter:saturate(0.95)_sepia(0.05)]" priority />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink backdrop-blur">{card.label}</span>
      </div>
    );
  }
  const [before, brand, after] = card.text;
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-[18px] bg-surface p-4 text-left">
      <div className="flex items-center gap-2 text-ink">
        <EngineLogo engine={card.engine} size={18} />
        <span className="text-small font-medium">{ENGINES[card.engine].label}</span>
      </div>
      <div>
        <p className="text-[12px] text-ink-3">&ldquo;{card.q}&rdquo;</p>
        <p className="mt-1.5 text-[15px] font-medium leading-snug tracking-[-0.01em] text-ink">
          {before}
          {brand ? <span className="rounded-[4px] bg-lime px-1 text-lime-ink [box-decoration-break:clone]">{brand}</span> : null}
          {after}
        </p>
      </div>
      <span className={cn("w-fit rounded-full px-2 py-0.5 text-[11px] font-medium", card.good ? "bg-up-soft text-up" : "bg-fill text-ink-3")}>{card.verdict}</span>
    </div>
  );
}

function Fan() {
  const reduce = useReducedMotion();
  const mid = (FAN.length - 1) / 2;
  return (
    // laid out at desktop size and scaled down on smaller screens, so it never reflows
    <div className="relative mx-auto h-[190px] w-full [--fan-scale:0.5] sm:h-[250px] sm:[--fan-scale:0.68] lg:h-[330px] lg:[--fan-scale:0.92]" aria-hidden>
      <div className="absolute left-1/2 top-0 origin-top [transform:translateX(-50%)_scale(var(--fan-scale))]">
        {FAN.map((card, i) => {
          const d = i - mid;
          const angle = d * FAN_TILT;
          const x = d * FAN_GAP;
          const y = d * d * 9;
          return (
            <motion.div
              key={i}
              className="absolute left-[-110px] top-0 h-[260px] w-[220px] rounded-[22px] bg-surface p-1 shadow-[0_24px_50px_-22px_rgb(17_19_17/0.4)]"
              initial={reduce ? false : { x: 0, y: 60, rotate: 0, opacity: 0 }}
              animate={{ x, y, rotate: angle, opacity: 1 }}
              transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.3 + Math.abs(i - mid) * 0.06 }}
              whileHover={reduce ? undefined : { y: y - 22, transition: { type: "spring", stiffness: 320, damping: 22 } }}
              // answers always sit above the photos beside them, so their text stays readable
              style={{ zIndex: (card.kind === "answer" ? 40 : 20) - Math.round(Math.abs(d) * 2) }}
            >
              <FanCardView card={card} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function InstantCheck() {
  return (
    <form
      className="mx-auto flex w-full max-w-[560px] flex-col gap-2 rounded-[26px] bg-surface p-1.5 shadow-[0_10px_40px_-18px_rgb(17_19_17/0.3)] sm:flex-row sm:items-center sm:rounded-full"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Free instant check"
    >
      <label className="flex flex-1 items-center gap-2 px-4">
        <Search size={16} className="shrink-0 text-ink-3" aria-hidden />
        <span className="sr-only">Business name and city</span>
        <input required placeholder="Business name, city" className="h-11 w-full bg-transparent text-body text-ink placeholder:text-ink-3 focus:outline-none" />
      </label>
      <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-lime px-6 text-body font-medium text-lime-ink hover:bg-lime-deep focus-visible:focus-ring">
        Check for free
      </button>
    </form>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="hero-title" className="relative px-4 pb-16 pt-12 md:pt-16">
      <h1 id="hero-title" className="mx-auto max-w-[1100px] text-balance text-center text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[1] tracking-[-0.05em] text-ink">
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
        <BlurWords delay={0.7} text="Free, open source, and honest about the numbers." />
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
        <div className="mt-5 flex items-center justify-center gap-5 text-ink-3" aria-label="Assistants we check">
          {(["chatgpt", "gemini", "perplexity", "claude"] as const).map((e) => (
            <EngineLogo key={e} engine={e} size={18} className="text-ink-3" />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ------------------------------------------------------------------ video carousel

const SLIDES = [
  { id: "48714", label: "Shops", line: "Does AI send buyers to you?" },
  { id: "9039", label: "Marketers", line: "Know what AI says, every week." },
  { id: "48713", label: "Agencies", line: "One report per client." },
  { id: "4385", label: "Restaurants", line: "\u201CWhere should we eat?\u201D Now asked to AI." },
]

const noopSubscribe = () => () => undefined;

function MediaCarousel() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
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
    <section aria-label="Who uses Recommendr, in motion" className="px-3 md:px-6">
      <Reveal>
        <div className="relative mx-auto aspect-[4/5] max-w-[1240px] overflow-hidden rounded-[28px] bg-ink sm:aspect-[16/9] md:aspect-[21/9]">
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
              {allowVideo ? (
                <button type="button" onClick={() => setPlaying((p) => !p)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-small font-medium text-ink focus-visible:focus-ring" aria-pressed={!playing}>
                  {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
                  {playing ? "Pause" : "Play"}
                </button>
              ) : null}
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

function Marquee({ children, speed = 40, className }: { children: ReactNode; speed?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]", className)}>
      {[0, 1].map((k) => (
        <motion.div
          key={k}
          aria-hidden={k === 1}
          className="flex shrink-0 items-center"
          animate={reduce ? undefined : { x: ["0%", "-100%"] }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        >
          {children}
        </motion.div>
      ))}
    </div>
  );
}

function Engines() {
  const engines = ["chatgpt", "gemini", "perplexity", "claude"] as const;
  return (
    <section aria-labelledby="engines-title" className="mx-auto max-w-[1240px] px-5 py-24 md:px-10">
      <Reveal>
        <h2 id="engines-title" className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.045em]">
          Measured where <span className="text-ink-3/70">customers ask.</span>
        </h2>
      </Reveal>
      <Marquee className="mt-12" speed={28}>
        {[...engines, ...engines].map((e, i) => (
          <span key={`${e}-${i}`} className="mx-10 flex items-center gap-3 whitespace-nowrap text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.04em] text-ink-3/55">
            <EngineLogo engine={e} size={34} />
            {ENGINES[e].label}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

// ------------------------------------------------------------------ scroll-revealed statement

function Word({ children, progress, range }: { children: ReactNode; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return <motion.span style={{ opacity }} className="inline">{children}</motion.span>;
}

function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const tokens = "Whether you run a flower shop, a dental clinic or an agency, see who AI recommends instead of you, and why.".split(" ");
  return (
    <section aria-label="What Recommendr shows you" className="mx-auto max-w-[1100px] px-5 py-20 md:px-10 md:py-28">
      <p ref={ref} className="text-[clamp(2rem,4.6vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.045em] text-ink">
        {tokens.map((t, i) => {
          const range: [number, number] = [i / tokens.length, (i + 1) / tokens.length];
          return (
            <Word key={i} progress={scrollYProgress} range={range}>
              {t}{" "}
            </Word>
          );
        })}
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ how it works: product showcase

const TABS = [
  { id: "questions", label: "Questions", title: "The questions your customers ask", body: "Suggested from your website, grouped by intent." },
  { id: "answers", label: "Answers", title: "What each AI actually says", body: "Every answer kept, with its sources." },
  { id: "fixes", label: "Fixes", title: "What to change, ready to paste", body: "Ranked by impact, generated from your facts." },
] as const;

function QuestionsPanel() {
  const rows = [
    { q: "best biryani in Islamabad", tag: "Discovery", p: 0.3 },
    { q: "Sindhi biryani near me", tag: "Specific", p: 0.68 },
    { q: "biryani delivery late night", tag: "Local", p: 0.17 },
    { q: "catering for 100 people", tag: "Specific", p: 0.45 },
  ];
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.q} className="flex items-center gap-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium">{r.q}</p>
            <p className="text-small text-ink-3">{r.tag}</p>
          </div>
          <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-fill sm:block" aria-hidden>
            <div className="h-full rounded-full bg-ink" style={{ width: `${r.p * 100}%` }} />
          </div>
          <span className="w-12 text-right font-mono text-small tabular">{Math.round(r.p * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}

function AnswersPanel() {
  const rows: { e: EngineId; t: ReactNode; v: string; good: boolean }[] = [
    { e: "chatgpt", t: <>Try <mark className="rounded-[4px] bg-lime px-1 text-lime-ink">Dera Biryani House</mark> for Sindhi-style biryani.</>, v: "#2", good: true },
    { e: "gemini", t: <><mark className="rounded-[4px] bg-lime px-1 text-lime-ink">Dera Biryani House</mark> in G-9 comes up most.</>, v: "#1", good: true },
    { e: "perplexity", t: <>Shahi Handi and Lahori Degh are the top picks.</>, v: "Missing", good: false },
  ];
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.e} className="flex items-start gap-4 rounded-[16px] bg-bg p-4">
          <EngineLogo engine={r.e} size={20} className="mt-0.5 text-ink" />
          <p className="flex-1 text-body leading-relaxed">{r.t}</p>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-small font-medium", r.good ? "bg-up-soft text-up" : "bg-fill text-ink-3")}>{r.v}</span>
        </li>
      ))}
    </ul>
  );
}

function FixesPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-[16px] bg-bg p-5">
        <div className="flex items-center gap-2 text-ink-3">
          <EngineLogo engine="claude" size={16} />
          <EngineLogo engine="chatgpt" size={16} />
          <span className="text-small">said this 9 times</span>
        </div>
        <p className="mt-3 text-h3 font-medium tracking-[-0.02em]">&ldquo;No private dining.&rdquo;</p>
        <p className="mt-2 text-small text-up">Truth: two family rooms.</p>
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
    <section id="how" aria-labelledby="how-title" className="mx-auto max-w-[1240px] px-5 py-24 md:px-10">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <h2 id="how-title" className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.045em]">
          Track, compare <span className="text-ink-3/70">&amp; fix.</span>
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
                <p className="mt-1 text-small text-ink-3">{active.body}</p>
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
          <div className="relative min-h-[230px]">
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

// ------------------------------------------------------------------ who it's for

const WHO = [
  { src: "/media/photos/florist-customer.jpg", alt: "A florist handing flowers to a customer", t: "Florists", d: "Are you the shop AI names?" },
  { src: "/media/photos/chef.jpg", alt: "A young chef cooking in a kitchen", t: "Restaurants", d: "See who AI picks instead." },
  { src: "/media/photos/makeup-artist.jpg", alt: "A make-up artist with a client", t: "Salons", d: "Catch wrong prices and hours." },
  { src: "/media/photos/trainer.jpg", alt: "A personal trainer coaching a client", t: "Gyms", d: "Show up for \u201Cnear me\u201D." },
  { src: "/media/photos/vet.jpg", alt: "A vet examining a dog", t: "Clinics", d: "Fix what AI gets wrong." },
]

function WhoItsFor() {
  return (
    <section id="who" aria-labelledby="who-title" className="mx-auto max-w-[1240px] px-5 py-20 md:px-10">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow="Who it's for" title="Built for businesses" muted="AI talks about." />
        </div>
      </Reveal>
      {/* phones: a swipeable row (snap) instead of five full-height photos stacked */}
      <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {WHO.map((w, i) => (
          <Reveal key={w.t} delay={i * 0.06} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-auto">
            <figure className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-fill">
                <Image src={w.src} alt={w.alt} fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 50vw, 100vw" className="object-cover [filter:saturate(0.92)_sepia(0.06)] transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
              </div>
              <figcaption className="mt-3">
                <p className="text-body font-medium">{w.t}</p>
                <p className="mt-0.5 text-small text-ink-2">{w.d}</p>
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
  const a = wilson(3, 10);
  const b = wilson(33, 100);
  return (
    <section id="honest" aria-labelledby="honest-title" className="mx-auto max-w-[1240px] px-3 py-10 md:px-6">
      <div className="rounded-[28px] bg-surface p-6 md:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <p className="mb-3 text-small font-medium text-ink-3">Honest numbers</p>
            <h2 id="honest-title" className="text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.02] tracking-[-0.045em]">
              AI answers vary. <span className="text-ink-3/70">We show by how much.</span>
            </h2>
            <p className="mt-4 max-w-sm text-body text-ink-2">Every number comes with its range.</p>
            <dl className="mt-8 divide-y divide-line border-y border-line">
              <div className="flex items-center justify-between py-4">
                <dt className="text-small text-ink-2">3 of 10 answers</dt>
                <dd><IntervalValue p={a.p} lo={a.lo} hi={a.hi} n={10} size="md" /></dd>
              </div>
              <div className="flex items-center justify-between py-4">
                <dt className="text-small text-ink-2">33 of 100 answers</dt>
                <dd><IntervalValue p={b.p} lo={b.lo} hi={b.hi} n={100} size="md" /></dd>
              </div>
              <div className="flex items-center justify-between py-4">
                <dt className="text-small text-ink-2">Gemini, week on week</dt>
                <dd className="rounded-full bg-fill px-2.5 py-1 text-small text-ink-3">+1.6 pts · noise</dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-[20px] bg-bg p-4">
              <p className="px-1 text-small text-ink-3">You vs. your top competitor, 12 weeks.</p>
              <LineCI
                brand={brandSeries}
                brandLabel="You"
                series={[{ id: "c_shahi", label: "Shahi Handi", color: "teal", points: competitorSeries.c_shahi ?? [], significant: false }]}
                annotations={modelChanges.slice(1).map((m) => ({ date: m.date, label: `ChatGPT model: ${m.to}` }))}
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
  "name": "Dera Biryani House",
  "amenityFeature": {
    "name": "Private family rooms",
    "value": true
  }
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
    <section id="pricing" aria-labelledby="pricing-title" className="mx-auto max-w-[1240px] px-5 py-20 md:px-10">
      <Reveal className="text-center">
        <p className="mb-3 text-small font-medium text-ink-3">Pricing</p>
        <h2 id="pricing-title" className="mx-auto max-w-2xl text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.045em]">
          Free, <span className="text-ink-3/70">three ways.</span>
        </h2>
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
            {p.featured ? <span className="absolute right-5 top-5 rounded-full bg-lime-ink px-2.5 py-1 text-micro font-medium normal-case tracking-normal text-lime">Most people pick this</span> : null}
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

function LimeBand() {
  const bits = ["Free", "Open source", "Your own keys", "Self-host it"];
  return (
    <section aria-label="Recommendr in short" className="px-3 py-10 md:px-6">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[28px] bg-lime py-10 text-lime-ink md:py-14">
        <Marquee speed={30}>
          {bits.map((b) => (
            <span key={b} className="mx-8 flex items-center gap-16 whitespace-nowrap text-[clamp(2.25rem,5.5vw,4.5rem)] font-medium tracking-[-0.05em]">
              {b}
              <span className="size-3 rounded-full bg-lime-ink/70" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ FAQ


function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 md:px-10 lg:grid-cols-[0.8fr_1.2fr]">
      <Reveal>
        <h2 id="faq-title" className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.045em]">
          Questions <span className="text-ink-3/70">people actually ask.</span>
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
    <footer className="px-3 pb-3 md:px-6 md:pb-6">
      <div className="mx-auto grid max-w-[1240px] gap-4 md:grid-cols-2">
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
      <div className="mx-auto mt-4 flex max-w-[1240px] flex-wrap items-start justify-between gap-8 rounded-[24px] bg-surface p-6 md:p-8">
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
          <Engines />
          <Statement />
          <Showcase />
          <WhoItsFor />
          <Honest />
          <Pricing />
          <LimeBand />
          <Faq />
        </main>
        <Footer />
      </div>
    </div>
  );
  // Smooth, eased scrolling (Lenis); native scrolling when the user prefers reduced motion.
  return reduce ? page : <ReactLenis root options={{ lerp: 0.09, anchors: true }}>{page}</ReactLenis>;
}
