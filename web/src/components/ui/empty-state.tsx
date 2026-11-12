import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ title, description, action, icon }: { title: ReactNode; description?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-line-strong px-5 py-6">
      <span className="text-ink-3">{icon ?? <Inbox size={20} strokeWidth={1.75} aria-hidden />}</span>
      <div>
        <p className="text-h4 font-semibold text-ink">{title}</p>
        {description ? <p className="mt-1 max-w-prose text-small text-ink-3">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
