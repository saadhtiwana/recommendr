"use client";
import type { ReactNode } from "react";
import { Dialog as RDialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = RDialog.Root;
export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;

export function DialogContent({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <RDialog.Portal>
      <RDialog.Overlay className="fixed inset-0 z-overlay animate-fade-in bg-ink/30" />
      <RDialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-modal w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 animate-pop-in rounded-lg border border-line bg-surface shadow-overlay focus-visible:outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <RDialog.Title className="text-h3 font-semibold text-ink">{title}</RDialog.Title>
            {description ? <RDialog.Description className="mt-1 text-small text-ink-3">{description}</RDialog.Description> : null}
          </div>
          <RDialog.Close className="-mt-1 -mr-1 rounded-sm p-1 text-ink-3 hover:bg-fill hover:text-ink focus-visible:focus-ring" aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </RDialog.Close>
        </div>
        <div className="px-5 py-4 text-body text-ink-2">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div> : null}
      </RDialog.Content>
    </RDialog.Portal>
  );
}
