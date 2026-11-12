import { cn } from "@/lib/cn";

export type DiffLine = { kind: "context" | "add" | "del"; text: string };

/** Proposed page change. Additions sit on soft lime (ink text), deletions in down-red on fill. */
export function DiffView({ filename, lines, className }: { filename: string; lines: DiffLine[]; className?: string }) {
  const added = lines.filter((l) => l.kind === "add").length;
  const removed = lines.filter((l) => l.kind === "del").length;
  return (
    <figure className={cn("overflow-hidden rounded-md border border-line bg-surface", className)}>
      <figcaption className="flex items-center justify-between gap-2 border-b border-line bg-fill px-3 py-1.5">
        <span className="font-mono text-micro tracking-normal text-ink-2">{filename}</span>
        <span className="font-mono text-micro tracking-normal tabular">
          <span className="text-up">+{added}</span> <span className="text-down">−{removed}</span>
        </span>
      </figcaption>
      <pre className="overflow-x-auto py-2 text-[0.8125rem] leading-6">
        <code>
          {lines.map((l, i) => (
            <span
              key={i}
              className={cn(
                "grid grid-cols-[2rem_1fr]",
                l.kind === "add" && "bg-lime-soft text-lime-ink",
                l.kind === "del" && "bg-fill text-down",
                l.kind === "context" && "text-ink-2",
              )}
            >
              <span aria-hidden className="select-none text-center">{l.kind === "add" ? "+" : l.kind === "del" ? "−" : " "}</span>
              <span className="whitespace-pre pr-4">
                <span className="sr-only">{l.kind === "add" ? "Added: " : l.kind === "del" ? "Removed: " : ""}</span>
                {l.text}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
