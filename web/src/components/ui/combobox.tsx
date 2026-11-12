"use client";
import { useState } from "react";
import { Popover } from "radix-ui";
import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

/** Searchable select (single value). Built on cmdk for filtering + keyboard, Radix Popover for layering. */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  className,
  id,
  "aria-label": ariaLabel,
}: {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(value);
  const current = value ?? internal;
  const selected = options.find((o) => o.value === current);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "inline-flex h-8 w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-small",
            "hover:border-ink-3 focus-visible:focus-ring",
            selected ? "text-ink" : "text-ink-3",
            className,
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown size={16} strokeWidth={1.75} className="text-ink-3" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-dropdown w-[var(--radix-popover-trigger-width)] min-w-56 animate-pop-in rounded-md border border-line bg-surface shadow-overlay"
        >
          <Command>
            <Command.Input placeholder={searchPlaceholder} className="h-9 w-full border-b border-line bg-transparent px-3 text-small text-ink outline-none placeholder:text-ink-3" />
            <Command.List className="max-h-64 overflow-y-auto p-1">
              <Command.Empty className="px-2 py-3 text-small text-ink-3">{emptyText}</Command.Empty>
              {options.map((o) => (
                <Command.Item
                  key={o.value}
                  value={`${o.label} ${o.value}`}
                  onSelect={() => {
                    setInternal(o.value);
                    onValueChange?.(o.value);
                    setOpen(false);
                  }}
                  className="flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-small text-ink data-[selected=true]:bg-fill"
                >
                  <Check size={14} strokeWidth={2} className={o.value === current ? "opacity-100" : "opacity-0"} />
                  <span className="truncate">{o.label}</span>
                  {o.hint ? <span className="ml-auto text-ink-3">{o.hint}</span> : null}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
