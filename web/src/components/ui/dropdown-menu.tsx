"use client";
import type { ComponentProps, ReactNode } from "react";
import { DropdownMenu as RMenu } from "radix-ui";
import { cn } from "@/lib/cn";

export const DropdownMenu = RMenu.Root;
export const DropdownMenuTrigger = RMenu.Trigger;

export function DropdownMenuContent({ className, sideOffset = 4, ...props }: ComponentProps<typeof RMenu.Content>) {
  return (
    <RMenu.Portal>
      <RMenu.Content
        sideOffset={sideOffset}
        className={cn("z-dropdown min-w-48 animate-pop-in rounded-md border border-line bg-surface p-1 shadow-overlay", className)}
        {...props}
      />
    </RMenu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  shortcut,
  destructive,
  children,
  ...props
}: ComponentProps<typeof RMenu.Item> & { shortcut?: string; destructive?: boolean; children: ReactNode }) {
  return (
    <RMenu.Item
      className={cn(
        "flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-small outline-none select-none data-[disabled]:text-ink-3 data-[highlighted]:bg-fill",
        destructive ? "text-down" : "text-ink",
        className,
      )}
      {...props}
    >
      {children}
      {shortcut ? <span className="ml-auto font-mono text-micro text-ink-3">{shortcut}</span> : null}
    </RMenu.Item>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof RMenu.Label>) {
  return <RMenu.Label className={cn("px-2 pt-1.5 pb-1 text-micro font-medium tracking-[0.06em] text-ink-3 uppercase", className)} {...props} />;
}

export function DropdownMenuSeparator() {
  return <RMenu.Separator className="my-1 h-px bg-line" />;
}
