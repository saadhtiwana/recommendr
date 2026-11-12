"use client";

import { useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { EngineLogo } from "@/components/brand/engine-logo";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { crawlerHeatmap } from "@/lib/mock";
import type { EngineId } from "@/lib/palette";

const CRAWLERS: { bot: string; owner: EngineId; allowed: boolean }[] = [
  { bot: "GPTBot", owner: "chatgpt", allowed: true },
  { bot: "OAI-SearchBot", owner: "chatgpt", allowed: false },
  { bot: "ChatGPT-User", owner: "chatgpt", allowed: true },
  { bot: "PerplexityBot", owner: "perplexity", allowed: false },
  { bot: "ClaudeBot", owner: "claude", allowed: true },
  { bot: "Google-Extended", owner: "gemini", allowed: true },
];

const ROBOTS_FIX = `# cornerslice.nyc/robots.txt
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: *
Disallow: /admin/
Allow: /

Sitemap: https://cornerslice.nyc/sitemap.xml`;

// Daily visits from all AI crawlers, 14 days ending Nov 12.
const DAILY = crawlerHeatmap[0]!.days.map((_, d) => crawlerHeatmap.reduce((s, r) => s + r.days[d]!.visits, 0));
const MAX = Math.max(...DAILY);
const TOTAL = DAILY.reduce((s, v) => s + v, 0);

export function AgentAnalyticsPreview() {
  const [showFix, setShowFix] = useState(false);
  const blocked = CRAWLERS.filter((c) => !c.allowed).length;
  return (
    <AppShell active="agent-analytics" title="AI crawlers">
      <div className="grid items-start gap-3 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="robots.txt"
          actions={
            <Button variant="accent" size="sm" onClick={() => setShowFix((v) => !v)}>
              Allow {blocked} blocked
            </Button>
          }
        >
          <ul className="divide-y divide-line">
            {CRAWLERS.map((c) => (
              <li key={c.bot} className="flex items-center gap-3 py-3 text-body">
                <EngineLogo engine={c.owner} size={16} className="text-ink-2" />
                <span className="flex-1 text-ink">{c.bot}</span>
                <span className={c.allowed ? "text-small text-ink-3" : "text-small font-medium text-down"}>{c.allowed ? "Allowed" : "Blocked"}</span>
              </li>
            ))}
          </ul>
          {showFix ? <CodeBlock className="mt-4" code={ROBOTS_FIX} language="txt" filename="robots.txt" /> : null}
        </Panel>

        <Panel title="Visits, 14 days">
          <p className="text-h1 tabular text-ink">{TOTAL.toLocaleString("en-US")}</p>
          <div className="mt-6 flex h-32 items-end gap-1.5" role="img" aria-label={`AI crawler visits per day, ${TOTAL} in 14 days`}>
            {DAILY.map((v, i) => (
              <span key={i} className="flex-1 rounded-t-xs bg-ink" style={{ height: `${(v / MAX) * 100}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-small text-ink-3">
            <span>Oct 30</span>
            <span>Nov 12</span>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
