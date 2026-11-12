"use client";

import { Check, CircleDollarSign, Send, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

/**
 * Gate for agent actions that spend money or publish. It states exactly what will happen and
 * what it costs, and nothing runs until a person presses Approve (ADR-0027).
 */
export function ApprovalCard({
  title,
  description,
  action,
  estimate,
  details,
  onApprove,
  onDeny,
  state = "pending",
  className,
}: {
  title: string;
  description: ReactNode;
  action: "spend" | "publish";
  estimate?: { costUsd: number; calls: number };
  details: ReactNode;
  onApprove: () => void;
  onDeny: () => void;
  state?: "pending" | "approved" | "denied";
  className?: string;
}) {
  const Icon = action === "spend" ? CircleDollarSign : Send;
  return (
    <section
      aria-label={`Approval needed: ${title}`}
      className={cn("flex flex-col gap-4 rounded-md border border-line border-t-2 border-t-ink bg-surface p-4", className)}
    >
      <div className="flex items-start gap-3">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-ink" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="text-micro font-medium uppercase text-ink-3">
            {action === "spend" ? "Needs your approval · uses your API budget" : "Needs your approval · publishes changes"}
          </div>
          <h3 className="text-h4 font-semibold text-ink">{title}</h3>
          <div className="text-small text-ink-2">{description}</div>
        </div>
      </div>
      <div className="rounded-sm border border-line bg-bg p-3 text-small text-ink-2">{details}</div>
      {estimate && (
        <dl className="grid grid-cols-2 gap-3 text-small sm:max-w-sm">
          <div>
            <dt className="text-ink-3">Estimated cost</dt>
            <dd className="font-mono text-h4 text-ink tabular">${estimate.costUsd.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Provider calls</dt>
            <dd className="font-mono text-h4 text-ink tabular">{estimate.calls.toLocaleString("en-US")}</dd>
          </div>
        </dl>
      )}
      {state === "pending" ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={onApprove}>
            <Check aria-hidden className="size-4" /> Approve
          </Button>
          <Button variant="secondary" onClick={onDeny}>
            <X aria-hidden className="size-4" /> Deny
          </Button>
        </div>
      ) : (
        <p role="status" className={cn("text-small font-medium", state === "approved" ? "text-up" : "text-ink-3")}>
          {state === "approved" ? "Approved. Running now." : "Denied. Nothing was run."}
        </p>
      )}
    </section>
  );
}
