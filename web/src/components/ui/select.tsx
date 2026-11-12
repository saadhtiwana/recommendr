"use client";
import type { ReactNode } from "react";
import { Select as RSelect } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <RSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
      <RSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-8 w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-small text-ink",
          "hover:border-ink-3 focus-visible:focus-ring disabled:bg-fill disabled:text-ink-3 data-[placeholder]:text-ink-3",
          className,
        )}
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon className="text-ink-3">
          <ChevronDown size={16} strokeWidth={1.75} />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={4}
          className="z-dropdown max-h-72 min-w-[var(--radix-select-trigger-width)] animate-pop-in overflow-hidden rounded-md border border-line bg-surface shadow-overlay"
        >
          <RSelect.Viewport className="p-1">
            {options.map((o) => (
              <RSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="relative flex h-8 cursor-default items-center rounded-sm pr-2 pl-7 text-small text-ink outline-none select-none data-[disabled]:text-ink-3 data-[highlighted]:bg-fill data-[state=checked]:font-medium"
              >
                <RSelect.ItemIndicator className="absolute left-2">
                  <Check size={14} strokeWidth={2} />
                </RSelect.ItemIndicator>
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
