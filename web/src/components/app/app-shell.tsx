"use client";

import { Dialog as RDialog } from "radix-ui";
import {
  BarChart3,
  Bot,
  Building2,
  CircleAlert,
  FileText,
  Gauge,
  Globe2,
  ListChecks,
  Menu,
  MessageSquareQuote,
  Network,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { CommandPalette, useCommandPalette, type CommandGroup } from "@/components/ui/command-palette";
import { Kbd } from "@/components/ui/kbd";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { project } from "@/lib/mock";
import { Logo } from "@/components/brand/logo";

export type NavId =
  | "overview"
  | "prompts"
  | "competitors"
  | "sources"
  | "fanouts"
  | "perception"
  | "facts"
  | "actions"
  | "agent-analytics"
  | "agent"
  | "reports"
  | "settings";

/** Sidebar entries. `href` points at the preview route when one exists. */
export const NAV: { id: NavId; label: string; icon: typeof Gauge; href: string; badge?: string }[] = [
  { id: "overview", label: "Overview", icon: Gauge, href: "/design/dashboard" },
  { id: "prompts", label: "Prompts", icon: MessageSquareQuote, href: "/design/prompt" },
  { id: "competitors", label: "Competitors", icon: Users, href: "/design/dashboard#competitors" },
  { id: "sources", label: "Sources", icon: Globe2, href: "/design/dashboard#sources" },
  { id: "fanouts", label: "Fanouts", icon: Network, href: "/design/prompt#fanouts" },
  { id: "perception", label: "Perception", icon: BarChart3, href: "/design/dashboard#perception" },
  { id: "facts", label: "Facts", icon: CircleAlert, href: "/design/dashboard#facts", badge: "3" },
  { id: "actions", label: "Actions", icon: ListChecks, href: "/design/actions", badge: "7" },
  { id: "agent-analytics", label: "Agent analytics", icon: Search, href: "/design/agent-analytics" },
  { id: "agent", label: "Agent", icon: Bot, href: "/design/agent" },
  { id: "reports", label: "Reports", icon: FileText, href: "/design/agency#report" },
  { id: "settings", label: "Settings", icon: Settings, href: "/design/settings" },
];

function Sidebar({ active, onNavigate }: { active: NavId; onNavigate?: () => void }) {
  return (
    <nav aria-label="Project" className="flex h-full flex-col gap-1 px-3 py-4">
      <Link href="/design/dashboard" className="mb-4 flex items-center gap-2 px-2" onClick={onNavigate}>
        <Logo variant="full" height={24} />
      </Link>
      <div className="mb-3 rounded-md border border-line bg-surface px-3 py-2">
        <p className="text-micro uppercase text-ink-3">Project</p>
        <p className="truncate text-small font-medium">{project.name}</p>
        <p className="truncate text-small text-ink-3">
          {project.brand.city} · {project.engines.length} engines
        </p>
      </div>
      <ul className="flex flex-col gap-0.5">
        {NAV.map(({ id, label, icon: Icon, href, badge }) => (
          <li key={id}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={id === active ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2.5 rounded-md px-2 text-small transition-colors duration-[var(--duration-fast)]",
                // selected = lime highlighter behind ink text (rule 1)
                id === active ? "bg-lime font-medium text-lime-ink" : "text-ink-2 hover:bg-fill hover:text-ink",
              )}
            >
              <Icon size={16} strokeWidth={1.75} aria-hidden />
              <span className="flex-1">{label}</span>
              {badge ? <span className="font-mono text-micro tabular text-ink-3">{badge}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-line pt-3">
        <Link
          href="/design/agency"
          onClick={onNavigate}
          className="flex h-8 items-center gap-2.5 rounded-md px-2 text-small text-ink-2 hover:bg-fill hover:text-ink"
        >
          <Building2 size={16} strokeWidth={1.75} aria-hidden />
          All clients
        </Link>
      </div>
    </nav>
  );
}

/**
 * Dashboard chrome for the preview pages: sidebar (sheet below 1024px), top bar with the
 * command palette trigger, and providers. Phase 8 reuses this layout with real data.
 */
export function AppShell({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: NavId;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const palette = useCommandPalette();
  const router = useRouter();
  const groups = useMemo<CommandGroup[]>(
    () => [
      {
        heading: "Go to",
        items: NAV.map((n) => ({
          id: n.id,
          label: n.label,
          onSelect: () => router.push(n.href),
        })),
      },
      {
        heading: "Actions",
        items: [
          { id: "run", label: "Run a check now", hint: "Uses your OpenAI and Anthropic keys", shortcut: "R", onSelect: () => undefined },
          { id: "add-prompt", label: "Add a prompt", shortcut: "P", onSelect: () => undefined },
          { id: "add-competitor", label: "Add a competitor", onSelect: () => undefined },
          { id: "ask-agent", label: "Ask the agent", shortcut: "A", onSelect: () => router.push("/design/agent") },
        ],
      },
    ],
    [router],
  );

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-bg">
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-bg lg:block">
            <Sidebar active={active} />
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-sticky flex h-14 items-center gap-3 border-b border-line bg-bg/95 px-4 backdrop-blur-[2px] lg:px-8">
              <RDialog.Root>
                <RDialog.Trigger
                  className="-ml-1 inline-flex size-8 items-center justify-center rounded-md text-ink-2 hover:bg-fill lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu size={18} strokeWidth={1.75} />
                </RDialog.Trigger>
                <RDialog.Portal>
                  <RDialog.Overlay className="fixed inset-0 z-overlay bg-ink/30 data-[state=open]:animate-fade-in" />
                  <RDialog.Content className="fixed inset-y-0 left-0 z-modal w-72 border-r border-line bg-bg shadow-overlay data-[state=open]:animate-fade-in">
                    <RDialog.Title className="sr-only">Navigation</RDialog.Title>
                    <RDialog.Close className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-ink-2 hover:bg-fill" aria-label="Close navigation">
                      <X size={16} />
                    </RDialog.Close>
                    <Sidebar active={active} />
                  </RDialog.Content>
                </RDialog.Portal>
              </RDialog.Root>
              <p className="truncate text-small text-ink-3">
                {project.org} <span aria-hidden>/</span> <span className="text-ink">{project.name}</span>
              </p>
              <button
                type="button"
                onClick={() => palette.setOpen(true)}
                className="ml-auto flex h-8 w-full max-w-64 items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-small text-ink-3 hover:border-ink-3"
              >
                <Search size={14} strokeWidth={1.75} aria-hidden />
                <span className="flex-1 text-left">Search or jump to…</span>
                <Kbd>⌘K</Kbd>
              </button>
            </header>
            <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-serif text-h2 text-ink">{title}</h1>
                  {subtitle ? <p className="mt-1 text-small text-ink-3">{subtitle}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
              </div>
              {children}
            </main>
            <footer className="border-t border-line px-4 py-6 lg:px-8">
              <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
                <Logo variant="full" tone="mono" height={18} className="text-ink-3" />
                <p className="text-small text-ink-3">Free and open source. Bring your own API keys, or self-host it.</p>
              </div>
            </footer>
          </div>
        </div>
        <CommandPalette groups={groups} open={palette.open} onOpenChange={palette.setOpen} />
      </ToastProvider>
    </TooltipProvider>
  );
}
