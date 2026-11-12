"use client";

import { Dialog as RDialog } from "radix-ui";
import { Check, ChevronDown, CircleHelp, FileText, Gauge, KeyRound, ListChecks, LogOut, Menu, MessageSquareQuote, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings, User, X, Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CommandPalette, useCommandPalette, type CommandGroup } from "@/components/ui/command-palette";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

export const NAV: { id: NavId; label: string; icon: typeof Gauge; href: string; badge?: string }[] = [
  { id: "overview", label: "Home", icon: Gauge, href: "/design/dashboard" },
  { id: "prompts", label: "Questions", icon: MessageSquareQuote, href: "/design/prompt" },
  { id: "actions", label: "Fixes", icon: ListChecks, href: "/design/actions", badge: "7" },
  { id: "reports", label: "Reports", icon: FileText, href: "/design/agency" },
  { id: "agent-analytics", label: "AI crawlers", icon: Bot, href: "/design/agent-analytics" },
];

const ALL_PAGES = [{ id: "agent", label: "Ask Recommendr", href: "/design/agent" }, ...NAV, { id: "settings", label: "Settings", href: "/design/settings" }];

/** Plain list row for custom side columns (the agent's chat history). */
export function NavItem({ href, icon: Icon, label, active, onClick }: { href?: string; icon: typeof Gauge; label: string; active?: boolean; onClick?: () => void }) {
  const cls = cn(
    "flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-small font-medium transition-colors focus-visible:focus-ring",
    active ? "bg-surface text-ink" : "text-ink-2 hover:bg-surface hover:text-ink",
  );
  const body = (
    <>
      <Icon size={16} strokeWidth={1.8} aria-hidden className="shrink-0" />
      <span className="truncate">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} onClick={onClick} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

const MENU = "min-w-64 rounded-[20px] border-0 p-2";
const ITEM = "h-10 rounded-full px-3 text-body";

/** Which business you're looking at. Separate from the profile menu so neither turns into a junk drawer. */
function BusinessMenu() {
  const others = [
    { name: "Fade Room Barbers", city: "Atlanta, GA" },
    { name: "Bright Smile Dental", city: "Austin, TX" },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden h-10 items-center gap-2 rounded-full bg-surface pr-3 pl-1.5 text-small font-semibold text-ink outline-none hover:bg-fill focus-visible:focus-ring data-[state=open]:bg-fill sm:flex">
        <Avatar name={project.name} size={28} />
        {project.name}
        <ChevronDown size={14} aria-hidden className="text-ink-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={MENU}>
        <DropdownMenuItem className="h-14 rounded-[14px] px-2">
          <Avatar name={project.name} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{project.name}</span>
            <span className="block text-[12px] text-ink-3">{project.brand.city}</span>
          </span>
          <Check size={16} aria-label="Current" />
        </DropdownMenuItem>
        {others.map((o) => (
          <DropdownMenuItem key={o.name} className="h-14 rounded-[14px] px-2">
            <Avatar name={o.name} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{o.name}</span>
              <span className="block text-[12px] text-ink-3">{o.city}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className={ITEM}>
          <Plus size={16} aria-hidden /> Add a business
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Your avatar opens everything about you: profile, settings, keys, help, log out. */
function ProfileMenu() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Your account" className="rounded-full outline-none focus-visible:focus-ring">
        <Avatar name="Maya Chen" size={40} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={MENU}>
        <div className="flex items-center gap-3 px-2 pt-2 pb-3">
          <Avatar name="Maya Chen" size={40} />
          <span className="min-w-0">
            <span className="block text-body font-semibold text-ink">Maya Chen</span>
            <span className="block truncate text-small text-ink-3">maya@cornerslice.nyc</span>
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={ITEM} onSelect={() => router.push("/design/settings")}>
          <User size={16} aria-hidden /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onSelect={() => router.push("/design/settings")}>
          <Settings size={16} aria-hidden /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onSelect={() => router.push("/design/settings")}>
          <KeyRound size={16} aria-hidden /> API keys
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM}>
          <CircleHelp size={16} aria-hidden /> Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={ITEM} destructive>
          <LogOut size={16} aria-hidden /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The agent is the product's front door, so it gets the biggest button in the sidebar. */
function AskButton({ active, collapsed, onNavigate }: { active: boolean; collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/design/agent"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? "Ask Recommendr" : undefined}
      className={cn(
        "group flex h-12 items-center gap-3 rounded-full bg-ink text-white transition-transform duration-200 hover:scale-[1.02] focus-visible:focus-ring",
        collapsed ? "w-12 justify-center" : "pr-3 pl-1.5",
        active && "ring-2 ring-lime ring-offset-2 ring-offset-surface",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime">
        <Logo variant="mark" height={18} />
      </span>
      {collapsed ? <span className="sr-only">Ask Recommendr</span> : (
        <>
          <span className="flex-1 text-small font-semibold">Ask Recommendr</span>
          <kbd className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">⌘J</kbd>
        </>
      )}
    </Link>
  );
}

function SideNav({ active, collapsed, extra, onNavigate }: { active: NavId; collapsed?: boolean; extra?: ReactNode; onNavigate?: () => void }) {
  const row = (on: boolean) =>
    cn(
      "flex h-11 items-center gap-3 rounded-full text-small font-semibold transition-colors focus-visible:focus-ring",
      collapsed ? "w-11 justify-center" : "px-3.5",
      on ? "bg-fill text-ink" : "text-ink-2 hover:bg-fill/70 hover:text-ink",
    );
  return (
    <div className="flex h-full flex-col">
      <AskButton active={active === "agent"} collapsed={collapsed} onNavigate={onNavigate} />
      <ul className="mt-5 flex flex-col gap-1">
        {NAV.map((n) => {
          const on = n.id === active;
          const Icon = n.icon;
          return (
            <li key={n.id}>
              <Link href={n.href} onClick={onNavigate} aria-current={on ? "page" : undefined} title={collapsed ? n.label : undefined} className={row(on)}>
                <Icon size={18} strokeWidth={on ? 2.2 : 1.8} aria-hidden className="shrink-0" />
                {collapsed ? <span className="sr-only">{n.label}</span> : <span className="flex-1">{n.label}</span>}
                {n.badge && !collapsed ? <span className="flex size-6 items-center justify-center rounded-full bg-lime text-[11px] font-bold text-lime-ink tabular">{n.badge}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {extra && !collapsed ? <div className="mt-6 min-h-0 flex-1 overflow-y-auto border-t border-line pt-4">{extra}</div> : <div className="flex-1" />}
      <div className="mt-4 border-t border-line pt-3">
        <Link href="/design/settings" onClick={onNavigate} aria-current={active === "settings" ? "page" : undefined} title={collapsed ? "Settings" : undefined} className={row(active === "settings")}>
          <Settings size={18} strokeWidth={1.8} aria-hidden className="shrink-0" />
          {collapsed ? <span className="sr-only">Settings</span> : "Settings"}
        </Link>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 text-small text-ink-3">
      <span className="flex items-center gap-2">
        <Logo variant="mark" tone="mono" height={16} />© 2026 Recommendr
      </span>
      <nav aria-label="Footer" className="flex flex-wrap gap-5">
        {["Help", "Docs", "GitHub", "Privacy", "Status"].map((l) => (
          <a key={l} href="#" className="hover:text-ink">
            {l}
          </a>
        ))}
      </nav>
    </footer>
  );
}

/**
 * App chrome: a white sidebar (Ask Recommendr first, then the pages, Settings at the bottom),
 * a slim top bar (search, business, you) and a footer. `sidebar` adds content under the nav
 * (the agent's recent chats). Below 1024px the sidebar becomes a drawer.
 */
export function AppShell({
  active,
  title,
  subtitle,
  actions,
  children,
  sidebar,
  footer = true,
}: {
  active: NavId;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  /** kept for older callers; the date range now lives inside pages that need it */
  dateRange?: boolean;
  footer?: boolean;
}) {
  const palette = useCommandPalette();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const groups = useMemo<CommandGroup[]>(
    () => [
      { heading: "Go to", items: ALL_PAGES.map((n) => ({ id: n.id, label: n.label, onSelect: () => router.push(n.href) })) },
      {
        heading: "Do",
        items: [
          { id: "run", label: "Run a check now", shortcut: "R", onSelect: () => undefined },
          { id: "add-prompt", label: "Add a question", shortcut: "P", onSelect: () => undefined },
        ],
      },
    ],
    [router],
  );
  // ⌘J / Ctrl+J opens the agent from anywhere.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        router.push("/design/agent");
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [router]);

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-bg">
          <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface px-4 pt-5 pb-4 transition-[width] duration-300 lg:flex", collapsed ? "w-[84px] items-center" : "w-[264px]")}>
            <div className={cn("mb-6 flex items-center", collapsed ? "flex-col gap-3" : "justify-between pl-1")}>
              <Link href="/design/dashboard" aria-label="Recommendr home" className="rounded-sm focus-visible:focus-ring">
                <Logo variant={collapsed ? "mark" : "full"} height={22} />
              </Link>
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-fill hover:text-ink focus-visible:focus-ring"
              >
                {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
              </button>
            </div>
            <SideNav active={active} collapsed={collapsed} extra={sidebar} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-sticky bg-bg/85 backdrop-blur-md">
              <div className="mx-auto flex max-w-[1120px] items-center gap-2 px-4 py-3 sm:px-8">
                <RDialog.Root open={drawer} onOpenChange={setDrawer}>
                  <RDialog.Trigger aria-label="Open menu" className="flex size-10 items-center justify-center rounded-full bg-surface text-ink focus-visible:focus-ring lg:hidden">
                    <Menu size={18} aria-hidden />
                  </RDialog.Trigger>
                  <RDialog.Portal>
                    <RDialog.Overlay className="fixed inset-0 z-overlay bg-ink/25 data-[state=open]:animate-fade-in" />
                    <RDialog.Content className="fixed inset-y-0 left-0 z-modal flex w-[18rem] max-w-[85vw] flex-col bg-surface px-4 pt-5 pb-4 shadow-overlay focus-visible:outline-none">
                      <RDialog.Title className="sr-only">Menu</RDialog.Title>
                      <div className="mb-6 flex items-center justify-between pl-1">
                        <Logo variant="full" height={22} />
                        <RDialog.Close aria-label="Close menu" className="flex size-10 items-center justify-center rounded-full bg-fill text-ink focus-visible:focus-ring">
                          <X size={18} aria-hidden />
                        </RDialog.Close>
                      </div>
                      <SideNav active={active} extra={sidebar} onNavigate={() => setDrawer(false)} />
                    </RDialog.Content>
                  </RDialog.Portal>
                </RDialog.Root>
                <Link href="/design/dashboard" aria-label="Recommendr home" className="lg:hidden">
                  <Logo variant="mark" height={24} />
                </Link>
                <div className="flex-1" />
                {active !== "agent" ? (
                  <Link href="/design/agent" className="flex h-10 items-center gap-2 rounded-full bg-ink pr-4 pl-1.5 text-small font-semibold text-white lg:hidden">
                    <span className="flex size-7 items-center justify-center rounded-full bg-lime">
                      <Logo variant="mark" height={14} />
                    </span>
                    Ask
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => palette.setOpen(true)}
                  aria-label="Search or jump to"
                  className="flex size-10 items-center justify-center rounded-full bg-surface text-ink-2 hover:text-ink focus-visible:focus-ring"
                >
                  <Search size={17} strokeWidth={1.8} aria-hidden />
                </button>
                <BusinessMenu />
                <ProfileMenu />
              </div>
            </header>

            <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 sm:px-8">
              {title ? (
                <div className="flex flex-wrap items-end justify-between gap-4 pt-6 pb-6">
                  <div className="min-w-0">
                    <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.03em] text-ink sm:text-[2rem]">{title}</h1>
                    {subtitle ? <p className="mt-1 text-body text-ink-3">{subtitle}</p> : null}
                  </div>
                  {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
                </div>
              ) : null}
              <main className="flex min-w-0 flex-1 flex-col">{children}</main>
              {footer ? <AppFooter /> : <div className="pb-4" />}
            </div>
          </div>
        </div>
        <CommandPalette groups={groups} open={palette.open} onOpenChange={palette.setOpen} />
      </ToastProvider>
    </TooltipProvider>
  );
}
