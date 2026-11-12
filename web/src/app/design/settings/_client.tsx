"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CodeBlock } from "@/components/ui/code-block";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Meter } from "@/components/ui/meter";
import { NewSecretInput, SecretField } from "@/components/ui/secret-field";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { apiKeys } from "@/lib/mock";

const usd = (v: number) => `$${v.toFixed(2)}`;

function KeysTab() {
  const { toast } = useToast();
  const [keys, setKeys] = useState(apiKeys);
  const [revoking, setRevoking] = useState<(typeof apiKeys)[number] | null>(null);
  const [validate, setValidate] = useState<"idle" | "validating" | "valid" | "invalid">("idle");

  return (
    <div className="space-y-6">
      <p className="flex items-start gap-2 text-small text-ink-2">
        <Lock size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
        Keys are encrypted and never shown again. We keep the provider and the last 4 characters so you can tell them apart.
      </p>
      <div className="space-y-3">
        {keys.map((k) => (
          <SecretField
            key={k.id}
            provider={k.provider}
            label={k.label}
            last4={k.last4}
            createdIso={k.createdIso}
            lastUsedIso={k.lastUsedIso}
            status={k.status}
            onReplace={() => toast({ title: `Paste a new ${k.provider} key below to replace ••••${k.last4}` })}
            onRevoke={() => setRevoking(k)}
          />
        ))}
      </div>
      <Panel title="Add a key" description="We check it with one free call to the provider before saving. Only owners and admins can add keys.">
        <NewSecretInput
          provider="Google Gemini"
          state={validate}
          error={validate === "invalid" ? "Google rejected this key (API_KEY_INVALID). Check it's a Gemini API key, not an OAuth client secret." : undefined}
          onValidate={(v) => {
            setValidate("validating");
            // preview only: pretend the provider answered
            setTimeout(() => setValidate(v.startsWith("AIza") ? "valid" : "invalid"), 700);
          }}
        />
      </Panel>
      <Dialog open={revoking !== null} onOpenChange={(o) => !o && setRevoking(null)}>
        <DialogContent
          title={`Revoke ${revoking?.provider ?? ""} key ••••${revoking?.last4 ?? ""}?`}
          description="Runs that need this provider will be marked blocked until you add another key. Past data is kept."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  if (revoking) setKeys((ks) => ks.map((k) => (k.id === revoking.id ? { ...k, status: "revoked" as const } : k)) as typeof apiKeys);
                  toast({ title: "Key revoked", tone: "down" });
                  setRevoking(null);
                }}
              >
                Revoke key
              </Button>
            </>
          }
        />
      </Dialog>
    </div>
  );
}

type UsageRow = { engine: string; project: string; calls: number; costUsd: number; key: string };
const USAGE: UsageRow[] = [
  { engine: "ChatGPT", project: "Dera Biryani House", calls: 1792, costUsd: 21.5, key: "OpenAI ••••Q8xD" },
  { engine: "ChatGPT (extraction)", project: "Dera Biryani House", calls: 1468, costUsd: 3.1, key: "OpenAI ••••Q8xD" },
  { engine: "Claude", project: "Dera Biryani House", calls: 1752, costUsd: 18.4, key: "Anthropic ••••m2Lk" },
  { engine: "Perplexity", project: "Dera Biryani House", calls: 1800, costUsd: 22.95, key: "Perplexity ••••7aQ1" },
  { engine: "Gemini", project: "Dera Biryani House", calls: 0, costUsd: 0, key: "Blocked: key invalid" },
  { engine: "Agent", project: "Dera Biryani House", calls: 61, costUsd: 0.79, key: "OpenAI ••••Q8xD" },
];
const usageColumns: Column<UsageRow>[] = [
  { key: "engine", header: "Engine / use", cell: (r) => r.engine, sortValue: (r) => r.engine },
  { key: "project", header: "Project", cell: (r) => <span className="text-ink-2">{r.project}</span> },
  { key: "key", header: "Charged to", cell: (r) => <span className={r.calls === 0 ? "text-down" : "text-ink-2"}>{r.key}</span> },
  { key: "calls", header: "Calls", align: "right", cell: (r) => r.calls.toLocaleString("en-US"), sortValue: (r) => r.calls },
  { key: "cost", header: "Cost (Nov)", align: "right", cell: (r) => usd(r.costUsd), sortValue: (r) => r.costUsd },
];

function UsageTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Spend by key" description="November so far, against the monthly caps you set. Runs stop at the cap; they are never silently cut short.">
          <div className="space-y-4">
            {apiKeys
              .filter((k) => k.status === "active")
              .map((k) =>
                k.capUsd ? (
                  <Meter key={k.id} label={`${k.provider} ••••${k.last4}`} used={k.spendUsd} limit={k.capUsd} unit="USD" format={(v) => v.toFixed(2)} />
                ) : (
                  <div key={k.id} className="flex items-baseline justify-between text-small">
                    <span className="text-ink-2">{`${k.provider} ••••${k.last4}`}</span>
                    <span className="font-mono tabular text-ink-3">{usd(k.spendUsd)} · no cap</span>
                  </div>
                ),
              )}
          </div>
        </Panel>
        <Panel
          title="Free tier"
          description="Without your own keys. Resets 1 December."
          actions={<Badge tone="muted">Not in use: you have keys</Badge>}
        >
          <div className="space-y-4">
            <Meter label="Projects" used={1} limit={1} unit="" />
            <Meter label="Prompts" used={8} limit={10} unit="" />
            <Meter label="Runs this month (weekly)" used={2} limit={5} unit="" />
            <Meter label="Engines (low-cost models)" used={2} limit={2} unit="" />
            <p className="text-small text-ink-3">
              Free runs share a monthly platform budget. If it runs out before the month ends, free runs pause until the 1st; runs on
              your own keys are unaffected.
            </p>
          </div>
        </Panel>
      </div>
      <Panel title="Usage this month" padded={false}>
        <div className="overflow-x-auto">
          <DataTable columns={usageColumns} rows={USAGE} getRowId={(r) => r.engine} initialSort={{ key: "cost", dir: "desc" }} />
        </div>
      </Panel>
    </div>
  );
}

const MCP_URL = "https://mcp.recommendr.app/mcp";
const CLAUDE_JSON = `{
  "mcpServers": {
    "recommendr": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;
const CURSOR_JSON = `{
  "mcpServers": {
    "recommendr": {
      "url": "${MCP_URL}"
    }
  }
}`;
const STDIO = `# Self-hosted: run the MCP server locally over stdio
docker compose run --rm backend-web python -m app.mcp --stdio`;

function McpTab() {
  const { toast } = useToast();
  const [scopes, setScopes] = useState({ read: true, generate: false, spend: false });
  const [tokens, setTokens] = useState([
    { id: "t1", name: "Claude Desktop (Saad's laptop)", scopes: "projects:read, fixes:generate", created: "2 Nov 2026", lastUsed: "11 Nov 2026" },
    { id: "t2", name: "Cursor", scopes: "projects:read", created: "9 Nov 2026", lastUsed: "Never" },
  ]);
  return (
    <div className="space-y-6">
      <Panel title="Server" description="Streamable HTTP. Clients sign in with OAuth; you pick the organization and scopes on the consent screen.">
        <CodeBlock code={MCP_URL} language="text" filename="MCP server URL" />
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Create a token" description="For clients that can't do OAuth. Tokens are per organization and shown once.">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setTokens((t) => [...t, { id: `t${t.length + 1}`, name: "New token", scopes: "projects:read", created: "12 Nov 2026", lastUsed: "Never" }]);
              toast({ title: "Token created", description: "Copy it now; it won't be shown again." });
            }}
          >
            <Field label="Name">
              <Input placeholder="e.g. Claude Desktop on my laptop" />
            </Field>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-small font-medium">Scopes</legend>
              <Checkbox checked={scopes.read} onCheckedChange={(v) => setScopes((s) => ({ ...s, read: v === true }))} label="projects:read: visibility, answers, sources, actions" />
              <Checkbox checked={scopes.generate} onCheckedChange={(v) => setScopes((s) => ({ ...s, generate: v === true }))} label="fixes:generate: draft fixes (uses your LLM budget)" />
              <Checkbox
                checked={scopes.spend}
                onCheckedChange={(v) => setScopes((s) => ({ ...s, spend: v === true }))}
                label="checks:start: run checks (spends on your keys; every call asks for confirmation)"
              />
            </fieldset>
            <Button type="submit" variant="primary">
              Create token
            </Button>
          </form>
        </Panel>
        <Panel title="Setup" padded={false}>
          <Tabs defaultValue="claude" className="p-4">
            <TabsList>
              <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="stdio">Self-hosted (stdio)</TabsTrigger>
            </TabsList>
            <TabsContent value="claude" className="pt-4">
              <CodeBlock code={CLAUDE_JSON} language="json" filename="claude_desktop_config.json" />
            </TabsContent>
            <TabsContent value="cursor" className="pt-4">
              <CodeBlock code={CURSOR_JSON} language="json" filename=".cursor/mcp.json" />
            </TabsContent>
            <TabsContent value="stdio" className="pt-4">
              <CodeBlock code={STDIO} language="bash" />
            </TabsContent>
          </Tabs>
        </Panel>
      </div>
      <Panel title="Tokens" padded={false}>
        <ul className="divide-y divide-line">
          {tokens.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-small">
              <span className="font-medium">{t.name}</span>
              <span className="font-mono text-micro text-ink-3">{t.scopes}</span>
              <span className="ml-auto font-mono tabular text-ink-3">
                created {t.created} · last used {t.lastUsed}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setTokens((ts) => ts.filter((x) => x.id !== t.id))}>
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

type Member = { name: string; email: string; role: string; lastActive: string };
const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "client_viewer", label: "Client viewer" },
];
const MEMBERS: Member[] = [
  { name: "Saad Hayat", email: "saad@derahospitality.pk", role: "owner", lastActive: "Today" },
  { name: "Ayesha Tariq", email: "ayesha@derahospitality.pk", role: "admin", lastActive: "Yesterday" },
  { name: "Bilal Qureshi", email: "bilal@derahospitality.pk", role: "member", lastActive: "4 Nov" },
  { name: "Northstar Digital", email: "reports@northstar.digital", role: "client_viewer", lastActive: "10 Nov" },
];

function TeamTab() {
  const memberColumns: Column<Member>[] = [
    {
      key: "name",
      header: "Member",
      sortValue: (r) => r.name,
      cell: (r) => (
        <span className="flex flex-col">
          <span>{r.name}</span>
          <span className="text-micro text-ink-3">{r.email}</span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      width: "12rem",
      cell: (r) => <Select options={ROLES} defaultValue={r.role} aria-label={`Role for ${r.name}`} disabled={r.role === "owner"} />,
    },
    { key: "active", header: "Last active", align: "right", cell: (r) => r.lastActive },
  ];
  return (
    <div className="space-y-6">
      <Panel title="Members" padded={false}>
        <div className="overflow-x-auto">
          <DataTable columns={memberColumns} rows={MEMBERS} getRowId={(r) => r.email} />
        </div>
      </Panel>
      <Panel title="Invite" description="Client viewers see only the projects you share with them, read-only.">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => e.preventDefault()}>
          <Field label="Email" className="flex-1">
            <Input type="email" placeholder="name@company.com" />
          </Field>
          <Field label="Role" className="sm:w-48">
            <Select options={ROLES.filter((r) => r.value !== "owner")} defaultValue="member" />
          </Field>
          <Button type="submit" variant="primary">
            Send invite
          </Button>
        </form>
      </Panel>
    </div>
  );
}

export function SettingsPreview() {
  return (
    <AppShell active="settings" dateRange={false} title="Settings" subtitle="Dera Hospitality · API keys, usage, MCP and team">
      <Tabs defaultValue="keys">
        <TabsList className="mb-6">
          <TabsTrigger value="keys">API keys</TabsTrigger>
          <TabsTrigger value="usage">Usage &amp; quotas</TabsTrigger>
          <TabsTrigger value="mcp">MCP</TabsTrigger>
          <TabsTrigger value="team">Team &amp; roles</TabsTrigger>
        </TabsList>
        <TabsContent value="keys">
          <KeysTab />
        </TabsContent>
        <TabsContent value="usage">
          <UsageTab />
        </TabsContent>
        <TabsContent value="mcp">
          <McpTab />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
