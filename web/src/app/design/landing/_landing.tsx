"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Plus, Search } from "lucide-react";
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
  { kind: "photo", src: "/media/photos/florist-tablet.jpg", alt: "A florist checking orders on a tablet", label: "Florist" },
  { kind: "answer", engine: "gemini", q: "same-day flowers in Lahore", text: ["", "Gulberg Flower Studio", " delivers until 7 pm."], verdict: "Mentioned · #1", good: true },
  { kind: "photo", src: "/media/video/48714-poster.jpg", alt: "A shop owner smiling in her clothing store", label: "Boutique" },
  { kind: "answer", engine: "chatgpt", q: "best biryani in Islamabad", text: ["Try ", "Dera Biryani House", " for Sindhi-style biryani."], verdict: "Mentioned · #2", good: true },
  { kind: "photo", src: "/media/photos/clinic-reception.jpg", alt: "A clinic receptionist talking with a visitor", label: "Clinic" },
  { kind: "answer", engine: "perplexity", q: "family dentist in Leeds", text: ["Northgate Dental and Kirkstall Smiles are top rated.", "", ""], verdict: "Not mentioned", good: false },
  { kind: "photo", src: "/media/photos/agency-team.jpg", alt: "A small team planning around a table", label: "Agency" },
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
        <motion.span
          className="absolute left-[-300px] top-[-34px] z-30 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-small font-medium text-white shadow-lg"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, -6, 0] }}
          transition={{ opacity: { delay: 1.1, duration: 0.4 }, y: { delay: 1.1, duration: 4, repeat: Infinity, ease: "easeInOut" } }}
        >
          ChatGPT mentioned you
        </motion.span>
        <motion.span
          className="absolute left-[170px] top-[-30px] z-30 whitespace-nowrap rounded-full bg-lime px-3 py-1.5 text-small font-medium text-lime-ink shadow-lg"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, -8, 0] }}
          transition={{ opacity: { delay: 1.3, duration: 0.4 }, y: { delay: 1.3, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        >
          3 of 10 answers
        </motion.span>
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

function PhotoPill({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="relative mx-1 inline-block h-[0.82em] w-[1.5em] translate-y-[0.08em] overflow-hidden rounded-full align-baseline">
      <Image src={src} alt={alt} fill sizes="80px" className="object-cover [filter:saturate(0.92)_sepia(0.06)]" />
    </span>
  );
}

function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const tokens: (string | { img: string; alt: string })[] = [
    "Whether", "you", "run", "a", "flower", "shop", { img: "/media/photos/florist-tablet.jpg", alt: "florist" }, "a", "dental", "clinic", { img: "/media/photos/clinic-reception.jpg", alt: "clinic reception" },
    "or", "an", "agency", { img: "/media/photos/agency-team.jpg", alt: "agency team" }, "see", "who", "AI", "recommends", "instead", "of", "you,", "and", "why.",
  ];
  return (
    <section aria-label="What Recommendr shows you" className="mx-auto max-w-[1100px] px-5 py-20 md:px-10 md:py-28">
      <p ref={ref} className="text-[clamp(2rem,4.6vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.045em] text-ink">
        {tokens.map((t, i) => {
          const range: [number, number] = [i / tokens.length, (i + 1) / tokens.length];
          return (
            <Word key={i} progress={scrollYProgress} range={range}>
              {typeof t === "string" ? <>{t} </> : <><PhotoPill src={t.img} alt={t.alt} />{" "}</>}
            </Word>
          );
        })}
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ how it works (split, scattered product cards)

function FloatCard({ children, className, delay = 0, drift = 8 }: { children: ReactNode; className?: string; delay?: number; drift?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("absolute rounded-[22px] bg-surface p-4 shadow-[0_20px_50px_-24px_rgb(17_19_17/0.35)]", className)}
      initial={reduce ? false : { opacity: 0, y: 40, rotate: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      <motion.div animate={reduce ? undefined : { y: [0, -drift, 0] }} transition={{ duration: 6 + delay * 4, repeat: Infinity, ease: "easeInOut" }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Pick your questions", d: "We suggest them from your website." },
    { n: "02", t: "We ask four AIs, many times", d: "Every answer kept, with the source." },
    { n: "03", t: "Fix what's wrong", d: "Ranked fixes, ready to paste." },
  ];
  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 md:px-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
      <div>
        <Reveal>
          <p className="mb-3 text-small font-medium text-ink-3">How it works</p>
          <h2 id="how-title" className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1] tracking-[-0.045em]">
            Track, compare <span className="text-ink-3/70">&amp; fix</span> how AI sees you.
          </h2>
        </Reveal>
        <ol className="mt-10 space-y-6">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <li className="flex gap-5 border-t border-line pt-5">
                <span className="font-mono text-small text-ink-3">{s.n}</span>
                <div>
                  <h3 className="text-h4 font-medium tracking-[-0.01em]">{s.t}</h3>
                  <p className="mt-1 max-w-md text-body text-ink-2">{s.d}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
      <div className="relative h-[520px] overflow-hidden rounded-[28px] bg-fill sm:h-[560px]">
        <FloatCard className="left-[6%] top-[7%] w-[min(300px,80%)]" delay={0.05}>
          <p className="text-small text-ink-3">AI visibility · all engines</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-[40px] font-medium tracking-[-0.04em]">33%</span>
            <span className="font-mono text-body text-ink-3">±4</span>
            <span className="ml-auto rounded-full bg-up-soft px-2 py-0.5 text-micro font-medium normal-case tracking-normal text-up">+7.1 pts</span>
          </div>
          <p className="mt-1 text-small text-ink-2">196 of 594 answers</p>
        </FloatCard>
        <FloatCard className="right-[5%] top-[30%] w-[min(310px,82%)]" delay={0.18} drift={10}>
          <div className="flex items-center gap-2 text-small font-medium"><EngineLogo engine="gemini" size={16} />Gemini</div>
          <p className="mt-2 text-small leading-relaxed">For Sindhi biryani, try <mark className="rounded-[4px] bg-lime px-1 text-lime-ink">Dera Biryani House</mark>.</p>
        </FloatCard>
        <FloatCard className="bottom-[8%] left-[8%] w-[min(290px,78%)]" delay={0.3} drift={7}>
          <p className="text-micro font-medium text-down">False fact</p>
          <p className="mt-1.5 text-small">&ldquo;No private dining.&rdquo;</p>
          <p className="mt-1 text-small text-ink-3">You have two family rooms.</p>
        </FloatCard>
        <motion.span
          className="absolute bottom-[30%] right-[10%] rounded-full bg-lime px-3 py-1.5 text-small font-medium text-lime-ink shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, type: "spring" }}
        >
          Fix ready
        </motion.span>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ who it's for

const WHO = [
  { src: "/media/photos/florist-tablet.jpg", alt: "A florist checking orders on a tablet", t: "Florists", d: "Are you the shop AI names?" },
  { src: "/media/video/48714-poster.jpg", alt: "A shop owner smiling in her clothing store", t: "Boutiques", d: "Get found for \u201Cnear me\u201D." },
  { src: "/media/photos/clinic-reception.jpg", alt: "A clinic receptionist talking with a visitor", t: "Clinics", d: "Catch wrong hours and prices." },
  { src: "/media/video/4385-poster.jpg", alt: "Diners in a bright restaurant", t: "Restaurants", d: "See who AI picks instead." },
  { src: "/media/photos/agency-team.jpg", alt: "A small team planning around a table", t: "Agencies", d: "One report per client." },
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

function FixExample() {
  return (
    <section aria-labelledby="fix-title" className="mx-auto grid max-w-[1240px] gap-10 px-5 py-24 md:px-10 lg:grid-cols-2 lg:items-center">
      <Reveal>
        <SectionTitle eyebrow="False facts, fixed" title="Catch what AI" muted="gets wrong." />
        <div className="mt-8 rounded-[20px] bg-surface p-5">
          <div className="flex items-center gap-2 text-ink-3"><EngineLogo engine="claude" size={16} /><EngineLogo engine="chatgpt" size={16} /><span className="text-small">said this 9 times</span></div>
          <p className="mt-3 text-h3 font-medium tracking-[-0.02em]">&ldquo;No private dining.&rdquo;</p>
          <p className="mt-2 text-small text-up">Truth: two family rooms.</p>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <CodeBlock code={JSONLD} language="json" filename="restaurant.jsonld" />
      </Reveal>
    </section>
  );
}

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
          {bits.map((b, i) => (
            <span key={b} className="mx-6 flex items-center gap-6 whitespace-nowrap text-[clamp(2.25rem,5.5vw,4.5rem)] font-medium tracking-[-0.05em]">
              {b}
              <span className="relative inline-block h-[0.7em] w-[1.3em] overflow-hidden rounded-full">
                <Image src={WHO[i % WHO.length]!.src} alt="" fill sizes="90px" className="object-cover [filter:saturate(0.92)_sepia(0.06)]" />
              </span>
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
          { src: "/media/video/9039-poster.jpg", t: "Self-host it", d: "One Docker Compose file.", href: `${GITHUB}/blob/main/docs/self-hosting.md`, cta: "Self-hosting guide" },
          { src: "/media/video/48713-poster.jpg", t: "Read the source", d: "AGPL-3.0 on GitHub.", href: GITHUB, cta: "View on GitHub" },
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
  return (
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
          <HowItWorks />
          <WhoItsFor />
          <Honest />
          <FixExample />
          <Pricing />
          <LimeBand />
          <Faq />
        </main>
        <Footer />
      </div>
    </div>
  );
}
