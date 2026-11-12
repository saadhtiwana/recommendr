import { ArrowUpRight } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/cn";
import { Kbd } from "./kbd";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary: ink pill. accent: lime pill (lime-ink text), the one standout action in a view.
   * secondary: white pill with a hairline. ink: alias of primary. hero: accent at lg size.
   */
  variant?: "primary" | "accent" | "ink" | "secondary" | "ghost" | "destructive" | "hero";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  /** Trailing keyboard hint, e.g. "⌘K". */
  kbd?: string;
  /** Adds a small up-right arrow: use when the action leaves the page (new route or external site). */
  leavesPage?: boolean;
}

const LIME = "rounded-full bg-lime text-lime-ink hover:bg-lime-deep active:bg-lime-deep";
const INK = "rounded-full bg-ink text-white hover:bg-ink-2";

const VARIANTS = {
  primary: INK,
  ink: INK,
  accent: LIME,
  hero: LIME,
  secondary: "rounded-full bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-fill",
  ghost: "rounded-full text-ink-2 hover:bg-fill hover:text-ink",
  destructive: "rounded-full bg-down text-white hover:opacity-90",
} as const;

const SIZES = {
  sm: "h-8 gap-1.5 px-2.5 text-small",
  md: "h-9 gap-2 px-3 text-small",
  lg: "h-12 gap-2 px-4 text-body",
} as const;

// Pills read better with a little more horizontal room than squared buttons.
const PILL_PAD = { sm: "px-3", md: "px-4", lg: "px-6" } as const;

const KBD_TONE: Partial<Record<NonNullable<ButtonProps["variant"]>, string>> = {
  accent: "border-lime-ink/20 bg-lime-ink/10 text-lime-ink",
  hero: "border-lime-ink/20 bg-lime-ink/10 text-lime-ink",
  primary: "border-transparent bg-white/15 text-white",
  ink: "border-transparent bg-white/15 text-white",
  destructive: "border-transparent bg-white/15 text-white",
};

export function Button({
  variant = "secondary",
  size,
  asChild,
  kbd,
  leavesPage,
  className,
  children,
  type,
  ...props
}: ButtonProps) {
  const isPill = variant !== "ghost";
  const s = size ?? (variant === "hero" ? "lg" : "md");
  const Comp = asChild ? Slot.Root : "button";
  // Siblings of the label. Kept as a flat array (not a fragment): Radix Slot requires
  // <Slot.Slottable> to be a direct child when asChild is used.
  const trailing = [
    kbd ? <Kbd key="kbd" className={KBD_TONE[variant]}>{kbd}</Kbd> : null,
    leavesPage ? <ArrowUpRight key="arrow" size={s === "lg" ? 16 : 14} strokeWidth={2} aria-hidden className="-mr-0.5" /> : null,
  ];
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors duration-[var(--duration-fast)] select-none",
        // focus ring is always ink, never lime (lime fails 3:1 on white)
        "focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[s],
        isPill && PILL_PAD[s],
        className,
      )}
      {...props}
    >
      {asChild ? [<Slot.Slottable key="label">{children}</Slot.Slottable>, ...trailing] : [<span key="label" className="contents">{children}</span>, ...trailing]}
    </Comp>
  );
}
