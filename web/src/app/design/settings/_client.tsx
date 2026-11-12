"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { EngineLogo } from "@/components/brand/engine-logo";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { useToast } from "@/components/ui/toast";
import { apiKeys } from "@/lib/mock";
import type { EngineId } from "@/lib/palette";

const LOGO: Record<string, EngineId> = { OpenAI: "chatgpt", Anthropic: "claude", Perplexity: "perplexity", "Google Gemini": "gemini" };
const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(iso));

const MCP_URL = "https://mcp.recommendr.app/mcp";

const MEMBERS = [
  { name: "Maria Lopez", email: "maria@cornerslice.nyc", role: "Owner" },
  { name: "James Carter", email: "james@cornerslice.nyc", role: "Admin" },
  { name: "Priya Shah", email: "priya@cornerslice.nyc", role: "Member" },
  { name: "Hudson & Pine Digital", email: "reports@hudsonpine.co", role: "Client viewer" },
];

const spend = apiKeys.reduce((s, k) => s + k.spendUsd, 0);

function Keys() {
  const [keys, setKeys] = useState(apiKeys);
  return (
    <Panel title="API keys" actions={<Button size="sm" variant="secondary">Add key</Button>} padded={false}>
      <ul className="divide-y divide-line px-5 pb-2">
        {keys.map((k) => (
          <li key={k.id} className="flex items-center gap-3 py-3 text-small">
            <EngineLogo engine={LOGO[k.provider] ?? "chatgpt"} size={16} />
            <span className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
              <span className="block font-medium text-ink sm:w-32">{k.provider}</span>
              <span className="tabular text-ink-2">•••• {k.last4}</span>
              <span className={k.status === "invalid" ? "ml-3 text-down sm:ml-0" : "ml-3 text-ink-3 sm:ml-0"}>
                {k.status === "invalid" ? "Rejected" : `Used ${day(k.lastUsedIso)}`}
              </span>
            </span>
            <Button size="sm" variant="ghost" onClick={() => setKeys((ks) => ks.filter((x) => x.id !== k.id))}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Mcp() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <Panel title="MCP">
      <div className="flex items-center gap-2 rounded-md bg-fill py-1.5 pr-1.5 pl-3">
        <code className="min-w-0 flex-1 truncate font-mono text-small text-ink">{MCP_URL}</code>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(MCP_URL);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <Button className="mt-4" variant="secondary" size="sm" onClick={() => toast({ title: "Token copied" })}>
        Create token
      </Button>
    </Panel>
  );
}

export function SettingsPreview() {
  return (
    <AppShell active="settings" dateRange={false} title="Settings">
      <div className="grid gap-3 lg:grid-cols-2">
        <Keys />
        <Panel title="Usage">
          <p className="text-h1 tabular text-ink">${spend.toFixed(2)}</p>
          <p className="mt-1 text-small text-ink-3">November, on your keys</p>
          <Meter className="mt-5" label="Monthly cap" used={spend} limit={100} unit="USD" warnAt={0.95} format={(v) => v.toFixed(0)} />
        </Panel>
        <Mcp />
        <Panel title="Team" actions={<Button size="sm" variant="secondary">Invite</Button>} padded={false}>
          <ul className="divide-y divide-line px-5 pb-2">
            {MEMBERS.map((m) => (
              <li key={m.email} className="flex items-center justify-between gap-4 py-3 text-small">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{m.name}</span>
                  <span className="block truncate text-ink-3">{m.email}</span>
                </span>
                <span className="shrink-0 text-ink-2">{m.role}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
