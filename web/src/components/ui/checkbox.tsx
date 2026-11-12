"use client";
import type { ComponentProps, ReactNode } from "react";
import { Checkbox as RCheckbox } from "radix-ui";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

export function Checkbox({ label, className, ...props }: ComponentProps<typeof RCheckbox.Root> & { label?: ReactNode }) {
  const box = (
    <RCheckbox.Root
      className={cn(
        "peer grid size-4 shrink-0 place-items-center rounded-xs border border-line-strong bg-surface text-white transition-colors",
        "hover:border-ink-3 focus-visible:focus-ring disabled:opacity-50",
        "data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=indeterminate]:border-ink data-[state=indeterminate]:bg-ink",
        className,
      )}
      {...props}
    >
      <RCheckbox.Indicator>
        {props.checked === "indeterminate" ? <Minus size={12} strokeWidth={2.5} /> : <Check size={12} strokeWidth={2.5} />}
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  );
  if (!label) return box;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-small text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:text-ink-3">
      {box}
      {label}
    </label>
  );
}
