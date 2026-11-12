import { cn } from "@/lib/cn";

// Soft tints from the data palette, picked by name so each client keeps its colour.
const TINTS = [
  "bg-[#E3F1F1] text-[#14605F]",
  "bg-[#E6F0FB] text-[#21579A]",
  "bg-[#FBF0DD] text-[#7A5310]",
  "bg-[#FBE7E9] text-[#8E2A33]",
  "bg-lime-soft text-lime-ink",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** A round initials badge for a business or person. */
export function Avatar({ name, size = 40, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", TINTS[hash(name) % TINTS.length], className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
