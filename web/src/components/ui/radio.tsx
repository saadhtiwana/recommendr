"use client";
import type { ComponentProps, ReactNode } from "react";
import { RadioGroup as RRadio } from "radix-ui";
import { cn } from "@/lib/cn";

export function RadioGroup({ className, ...props }: ComponentProps<typeof RRadio.Root>) {
  return <RRadio.Root className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function Radio({ value, label, description, disabled }: { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-small text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:text-ink-3">
      <RRadio.Item
        value={value}
        disabled={disabled}
        className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-line-strong bg-surface hover:border-ink-3 focus-visible:focus-ring data-[state=checked]:border-ink data-[state=checked]:bg-ink"
      >
        <RRadio.Indicator className="size-1.5 rounded-full bg-white" />
      </RRadio.Item>
      <span>
        {label}
        {description ? <span className="block text-ink-3">{description}</span> : null}
      </span>
    </label>
  );
}
