"use client";

import { Dialog as RDialog } from "radix-ui";
import {
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  FileText,
  Gauge,
  Globe2,
  ListChecks,
  Menu,
  MessageSquareQuote,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
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

// Settings lives with Help and All clients at the bottom of the sidebar, like most dashboards.
const BOTTOM: { id: NavId | "help" | "clients"; label: string; icon: typeof Gauge; href: string }[] = [
  { id: "help", label: "Help", icon: CircleHelp, href: "/design/components" },
  { id: "settings", label: "Settings", icon: Settings, href: "/design/settings" },
  { id: "clients", label: "All clients", icon: Building2, href: "/design/agency" },
];

/** One sidebar row: icon + label, active = quiet grey fill. Exported for custom sidebars. */
export function NavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
  collapsed,
  onClick,
}: {
  href?: string;
  icon: typeof Gauge;
  label: string;
  active?: boolean;
  badge?: string;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const cls = cn(
    "flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-small transition-colors duration-[var(--duration-fast)] focus-visible:focus-ring",
    active ? "bg-fill font-medium text-ink" : "text-ink-2 hover:bg-fill hover:text-ink",
    collapsed && "justify-center px-0",
  );
  const body = (
    <>
      <Icon size={17} strokeWidth={1.6} aria-hidden className="shrink-0" />
      <span className={cn("flex-1 truncate text-left", collapsed && "sr-only")}>{label}</span>
      {badge && !collapsed ? <span className="font-mono text-micro tracking-normal tabular text-ink-3">{badge}</span> : null}
    </>
  );
  return href ? (
    <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} title={collapsed ? label : undefined} className={cls}>
      {body}
    </button>
  );
}

function SidebarCard({
  collapsed,
  onToggle,
  onNavigate,
  children,
  bottom = true,
  active,
}: {
  active?: NavId;
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  children: ReactNode;
  bottom?: boolean;
}) {
  return (
    <nav aria-label="Project" className="flex h-full flex-col rounded-lg bg-surface px-3 pt-5 pb-3">
      <div className={cn("mb-7 flex items-center gap-2 pl-2", collapsed && "flex-col pl-0")}>
        <Link href="/design/dashboard" onClick={onNavigate} className="rounded-sm focus-visible:focus-ring" aria-label="Recommendr home">
          <Logo variant={collapsed ? "mark" : "full"} height={22} />
        </Link>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("inline-flex size-7 items-center justify-center rounded-sm text-ink-3 hover:bg-fill hover:text-ink focus-visible:focus-ring", !collapsed && "ml-auto")}
          >
            {collapsed ? <PanelLeftOpen size={16} strokeWidth={1.6} /> : <PanelLeftClose size={16} strokeWidth={1.6} />}
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {bottom ? (
        <ul className="mt-4 flex flex-col gap-0.5">
          {BOTTOM.map((b) => (
            <li key={b.id}>
              <NavItem href={b.href} icon={b.icon} label={b.label} active={b.id === active} collapsed={collapsed} onClick={onNavigate} />
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}

function ProjectNav({ active, collapsed, onNavigate }: { active: NavId; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {NAV.filter((n) => n.id !== "settings").map(({ id, label, icon, href, badge }) => (
        <li key={id}>
          <NavItem href={href} icon={icon} label={label} badge={badge} active={id === active} collapsed={collapsed} onClick={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

/** White pill used for the page-level controls (date range, project). */
export function PillButton({ icon, children, className }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface px-3.5 text-small font-medium text-ink transition-colors duration-[var(--duration-fast)] hover:bg-fill focus-visible:focus-ring",
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
      <ChevronDown size={14} strokeWidth={1.75} aria-hidden className="text-ink-3" />
    </button>
  );
}

/**
 * Dashboard chrome for the preview pages: the whole app sits in a rounded frame on the canvas,
 * with the sidebar as its own white card (a drawer below 1024px). `sidebar` swaps the project
 * nav for custom content (the agent's chat history). Phase 8 reuses this layout with real data.
 */
export function AppShell({
  active,
  title,
  subtitle,
  actions,
  children,
  sidebar,
  dateRange = true,
  footer = true,
}: {
  active: NavId;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Replaces the project nav inside the sidebar card (bottom links are hidden too). */
  sidebar?: ReactNode;
  /** Show the "Last 7 days" pill in the page header. */
  dateRange?: boolean;
  footer?: boolean;
}) {
  const palette = useCommandPalette();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
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

  const navBody = (isCollapsed: boolean, onNavigate?: () => void) =>
    sidebar ?? <ProjectNav active={active} collapsed={isCollapsed} onNavigate={onNavigate} />;

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="min-h-screen bg-canvas lg:p-2.5">
          <div className="flex min-h-screen gap-3 bg-bg p-2 shadow-frame sm:p-3 lg:min-h-[calc(100vh-20px)] lg:rounded-xl">
            <aside className={cn("sticky top-[22px] hidden h-[calc(100vh-44px)] shrink-0 lg:block", collapsed ? "w-[68px]" : "w-[232px]")}>
              <SidebarCard active={active} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} bottom={!sidebar}>
                {navBody(collapsed)}
              </SidebarCard>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col px-1 sm:px-2 lg:px-4">
              <header className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-3 pb-5 lg:pt-5 lg:pb-6">
                <RDialog.Root open={drawer} onOpenChange={setDrawer}>
                  <RDialog.Trigger
                    className="inline-flex size-9 items-center justify-center rounded-full bg-surface text-ink-2 hover:bg-fill focus-visible:focus-ring lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu size={18} strokeWidth={1.75} />
                  </RDialog.Trigger>
                  <RDialog.Portal>
                    <RDialog.Overlay className="fixed inset-0 z-overlay bg-ink/30 data-[state=open]:animate-fade-in" />
                    <RDialog.Content className="fixed inset-y-2 left-2 z-modal w-[17rem] max-w-[calc(100vw-1rem)] rounded-lg shadow-overlay data-[state=open]:animate-fade-in focus-visible:outline-none">
                      <RDialog.Title className="sr-only">Navigation</RDialog.Title>
                      <RDialog.Close
                        className="absolute top-4 right-3 inline-flex size-8 items-center justify-center rounded-sm text-ink-2 hover:bg-fill focus-visible:focus-ring"
                        aria-label="Close navigation"
                      >
                        <X size={16} />
                      </RDialog.Close>
                      <SidebarCard active={active} collapsed={false} onNavigate={() => setDrawer(false)} bottom={!sidebar}>
                        {navBody(false, () => setDrawer(false))}
                      </SidebarCard>
                    </RDialog.Content>
                  </RDialog.Portal>
                </RDialog.Root>

                <div className="min-w-0 flex-1 basis-56">
                  <h1 className="truncate text-[2rem] leading-[1.1] font-medium tracking-[-0.04em] text-ink sm:text-[2.375rem]">{title}</h1>
                  {subtitle ? <p className="mt-1 truncate text-small text-ink-3">{subtitle}</p> : null}
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => palette.setOpen(true)}
                    aria-label="Search or jump to"
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-surface px-3 text-small text-ink-3 hover:bg-fill focus-visible:focus-ring"
                  >
                    <Search size={15} strokeWidth={1.75} aria-hidden />
                    <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
                  </button>
                  {dateRange ? <PillButton icon={<CalendarDays size={15} strokeWidth={1.6} aria-hidden />}>Last 7 days</PillButton> : null}
                  <PillButton className="max-w-[14rem]">{project.name}</PillButton>
                  {actions}
                </div>
              </header>

              <main className="flex min-w-0 flex-1 flex-col pb-3">{children}</main>

              {footer ? (
                <footer className="flex flex-wrap items-center justify-between gap-3 py-5">
                  <Logo variant="full" tone="mono" height={16} className="text-ink-3" />
                  <p className="text-small text-ink-3">Free and open source. Bring your own API keys, or self-host it.</p>
                </footer>
              ) : null}
            </div>
          </div>
        </div>
        <CommandPalette groups={groups} open={palette.open} onOpenChange={palette.setOpen} />
      </ToastProvider>
    </TooltipProvider>
  );
}
