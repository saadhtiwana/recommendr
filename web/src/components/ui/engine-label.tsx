import { cn } from "@/lib/cn";
import { BG_CLASS, ENGINES, type EngineId } from "@/lib/palette";

/** Engine name with its data-colour dot. The dot is decorative: the name carries the meaning. */
export function EngineLabel({ engine, model, className }: { engine: EngineId; model?: string; className?: string }) {
  const e = ENGINES[engine];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-small text-ink", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", BG_CLASS[e.color])} />
      <span className="font-medium">{e.label}</span>
      {model && <span className="font-mono text-micro tracking-normal text-ink-3">{model}</span>}
    </span>
  );
}
