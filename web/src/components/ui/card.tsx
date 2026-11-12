import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A bordered surface. Elevation is a 1px hairline, never a shadow. */
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
    <section className={cn("min-w-0 rounded-lg border border-line bg-surface", className)}>
      {hasHeader ? (
        <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title !== undefined ? <h3 className="text-h4 font-semibold text-ink">{title}</h3> : null}
            {description !== undefined ? <p className="mt-0.5 text-small text-ink-3">{description}</p> : null}
          </div>
          {actions !== undefined ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {/* min-w-0 + overflow-x-auto: wide tables/heatmaps scroll inside the panel instead of widening the page */}
      <div className={cn("relative min-w-0 overflow-x-auto", padded && "p-4")}>{children}</div>
    </section>
  );
}
