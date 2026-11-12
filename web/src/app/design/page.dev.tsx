import Link from "next/link";
import { PreviewFooter, PreviewHeader } from "@/components/brand/preview-chrome";

const PAGES: { href: string; title: string; judge: string }[] = [
  { href: "/design/brand", title: "Brand", judge: "Logo variants and tones, favicon and app icons, OG image, colour and type sheets, contrast table" },
  { href: "/design/palettes", title: "Palettes", judge: "Highlighter (chosen) next to the earlier candidate, for reference" },
  { href: "/design/components", title: "Components", judge: "Every component in every state" },
  { href: "/design/landing", title: "Landing", judge: "Marketing homepage with the free instant check" },
  { href: "/design/dashboard", title: "Dashboard", judge: "Project overview: visibility with interval, trends, share of voice, answers" },
  { href: "/design/prompt", title: "Prompt detail", judge: "All samples per engine, mention rate with interval, sources, fanouts, history" },
  { href: "/design/actions", title: "Actions", judge: "Ranked fix plan, a generated fix with diff, approval card" },
  { href: "/design/agent", title: "Agent", judge: "Chat with inline citations, step trace, approval for a spend action" },
  { href: "/design/agent-analytics", title: "Agent analytics", judge: "robots.txt audit, crawler heatmap, AI referral traffic" },
  { href: "/design/settings", title: "Settings", judge: "API key vault, usage and quotas, MCP connection, team" },
  { href: "/design/agency", title: "Agency", judge: "Cross-client overview and a white-label report" },
  { href: "/design/onboarding", title: "Onboarding", judge: "Create-project flow" },
];

export default function DesignIndex() {
  return (
    <>
    <PreviewHeader />
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-micro uppercase text-ink-3">Phase 1b · development only</p>
      <h1 className="mt-2 font-serif text-h1">Design previews</h1>
      <p className="mt-3 max-w-prose text-ink-2">
        Highlighter palette, light theme. Mock data uses fictional businesses. Rules and reasoning are in{" "}
        <code className="rounded-sm bg-fill px-1 py-0.5 text-small">docs/design/design-system.md</code>.
      </p>
      <ol className="mt-10 divide-y divide-line border-y border-line">
        {PAGES.map((p, i) => (
          <li key={p.href}>
            <Link href={p.href} className="group flex items-baseline gap-4 py-3 hover:bg-fill">
              <span className="w-6 shrink-0 font-mono text-small tabular text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <span className="w-40 shrink-0 font-medium group-hover:underline">{p.title}</span>
              <span className="text-small text-ink-3">{p.judge}</span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
      <PreviewFooter />
      </>
  );
}
