"use client";
import type { ComponentProps } from "react";
import { Tabs as RTabs } from "radix-ui";
import { cn } from "@/lib/cn";

export const Tabs = RTabs.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof RTabs.List>) {
  return <RTabs.List className={cn("flex items-center gap-1 overflow-x-auto border-b border-line", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof RTabs.Trigger>) {
  return (
    <RTabs.Trigger
      className={cn(
        "relative -mb-px h-9 border-b-2 border-transparent px-2.5 text-small whitespace-nowrap text-ink-3 transition-colors",
        "hover:text-ink focus-visible:focus-ring data-[state=active]:border-ink data-[state=active]:font-medium data-[state=active]:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof RTabs.Content>) {
  return <RTabs.Content className={cn("pt-4 focus-visible:focus-ring", className)} {...props} />;
}
