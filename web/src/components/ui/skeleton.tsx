import { cn } from "@/lib/cn";

/** Placeholder block. Give it the final element's size so nothing shifts when data arrives. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-sm bg-[linear-gradient(90deg,var(--color-fill)_0%,var(--color-line)_50%,var(--color-fill)_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        // last line shorter, like real text
        <Skeleton key={i} className={cn("h-3", i === lines - 1 && lines > 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}
