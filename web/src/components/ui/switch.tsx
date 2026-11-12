"use client";
import type { ComponentProps, ReactNode } from "react";
import { Switch as RSwitch } from "radix-ui";
import { cn } from "@/lib/cn";

export function Switch({ label, className, ...props }: ComponentProps<typeof RSwitch.Root> & { label?: ReactNode }) {
  const control = (
    <RSwitch.Root
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-line-strong bg-fill transition-colors",
        "focus-visible:focus-ring disabled:opacity-50 data-[state=checked]:border-ink data-[state=checked]:bg-ink",
        className,
      )}
      {...props}
    >
      <RSwitch.Thumb className="block size-3.5 translate-x-0.5 rounded-full bg-surface shadow-[0_0_0_1px_var(--color-line-strong)] transition-transform duration-[var(--duration-fast)] data-[state=checked]:translate-x-[18px] data-[state=checked]:shadow-none" />
    </RSwitch.Root>
  );
  if (!label) return control;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-small text-ink">
      {control}
      {label}
    </label>
  );
}
