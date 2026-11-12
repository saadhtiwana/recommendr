import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A white card on the page frame: 20px radius, no border, no shadow. Titles are quiet grey labels
 * so the numbers inside carry the weight.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  const hasHeader = title !== undefined || actions !== undefined;
  return (
    <section className={cn("min-w-0 rounded-lg bg-surface", className)}>
      {hasHeader ? (
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            {title !== undefined ? <h3 className="text-body font-semibold text-ink">{title}</h3> : null}
            {description !== undefined ? <p className="mt-1 text-small text-ink-2">{description}</p> : null}
          </div>
          {actions !== undefined ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {/* min-w-0 + overflow-x-auto: wide tables/heatmaps scroll inside the card instead of widening the page.
          relative: contains absolutely positioned sr-only children so they can't escape the clip. */}
      <div className={cn("relative min-w-0 overflow-x-auto", padded && "p-5")}>{children}</div>
    </section>
  );
}
