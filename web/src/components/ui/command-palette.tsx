"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Dialog as RDialog } from "radix-ui";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { Kbd } from "./kbd";

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  icon?: ReactNode;
  onSelect: () => void;
}
export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

/** Open state + global Cmd/Ctrl+K toggle. */
export function useCommandPalette(): { open: boolean; setOpen: (open: boolean) => void } {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({
  groups,
  open: openProp,
  onOpenChange,
}: {
  groups: CommandGroup[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const own = useCommandPalette();
  // controlled when open/onOpenChange are passed; otherwise owns its state and the ⌘K shortcut
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : own.open;
  const setOpen = controlled ? (onOpenChange ?? (() => undefined)) : own.setOpen;
  return (
    <RDialog.Root open={open} onOpenChange={setOpen}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-overlay animate-fade-in bg-ink/30" />
        <RDialog.Content className="fixed top-[12vh] left-1/2 z-modal w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 animate-pop-in overflow-hidden rounded-lg border border-line bg-surface shadow-overlay focus-visible:outline-none">
          <RDialog.Title className="sr-only">Command palette</RDialog.Title>
          <RDialog.Description className="sr-only">Search pages and actions</RDialog.Description>
          <Command loop>
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search size={16} strokeWidth={1.75} className="text-ink-3" aria-hidden />
              <Command.Input placeholder="Search pages, prompts and actions…" className="h-11 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3" />
              <Kbd>esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,24rem)] overflow-y-auto p-1">
              <Command.Empty className="px-3 py-6 text-small text-ink-3">Nothing found.</Command.Empty>
              {groups.map((g) => (
                <Command.Group
                  key={g.heading}
                  heading={g.heading}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:uppercase"
                >
                  {g.items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.hint ?? ""}`}
                      onSelect={() => {
                        item.onSelect();
                        setOpen(false);
                      }}
                      className="flex h-9 cursor-default items-center gap-2.5 rounded-sm px-2 text-small text-ink data-[selected=true]:bg-lime-soft data-[selected=true]:text-lime-ink"
                    >
                      {item.icon ? <span className="text-ink-3">{item.icon}</span> : null}
                      <span className="truncate">{item.label}</span>
                      {item.hint ? <span className="truncate text-ink-3">{item.hint}</span> : null}
                      {item.shortcut ? <Kbd className="ml-auto">{item.shortcut}</Kbd> : null}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
            <div className="flex items-center gap-4 border-t border-line px-3 py-2 text-micro text-ink-3">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
              <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
              <span className="flex items-center gap-1"><Kbd>esc</Kbd> close</span>
            </div>
          </Command>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
