"use client";
import type { ReactNode } from "react";
import { Dialog as RDialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Sheet = RDialog.Root;
export const SheetTrigger = RDialog.Trigger;
export const SheetClose = RDialog.Close;

/** Right-hand panel for detail views (an answer, an action) without leaving the page. */
export function SheetContent({
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
      <RDialog.Overlay className="fixed inset-0 z-overlay animate-fade-in bg-ink/20" />
      <RDialog.Content
        className={cn(
          "fixed inset-y-0 right-0 z-modal flex w-full max-w-xl animate-slide-in-right flex-col border-l border-line bg-surface shadow-overlay focus-visible:outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <RDialog.Title className="text-h3 font-semibold text-ink">{title}</RDialog.Title>
            {description ? <RDialog.Description className="mt-1 text-small text-ink-3">{description}</RDialog.Description> : null}
          </div>
          <RDialog.Close className="rounded-sm p-1 text-ink-3 hover:bg-fill hover:text-ink focus-visible:focus-ring" aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </RDialog.Close>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div> : null}
      </RDialog.Content>
    </RDialog.Portal>
  );
}
