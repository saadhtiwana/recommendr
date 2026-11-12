"use client";

import { Download } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import { Avatar } from "@/components/ui/avatar";
import { ScoreRing } from "@/components/ui/score-ring";
import { DataTable, type Column } from "@/components/ui/table";
import { actions, agencyClients, wilson } from "@/lib/mock";

type Client = (typeof agencyClients)[number];
const stats = (c: Client) => {
  const now = wilson(c.x, c.n);
  const prev = wilson(c.xPrev, c.nPrev);
  return { now, prev, delta: Math.round((now.p - prev.p) * 1000) / 10 };
};

const columns: Column<Client>[] = [
  {
    key: "client",
    header: "Client",
    sortValue: (c) => c.name,
    cell: (c) => (
      <span className="flex items-center gap-3 py-1.5">
        <Avatar name={c.name} size={40} />
        <span className="flex flex-col">
          <span className="text-body font-semibold text-ink">{c.name}</span>
          <span className="text-small text-ink-3">{c.city}</span>
        </span>
      </span>
    ),
  },
  {
    key: "vis",
    header: "Visibility",
    align: "right",
    sortValue: (c) => c.x / c.n,
    cell: (c) => {
      const { now } = stats(c);
      return (
        <span className="inline-flex items-center gap-2.5">
          <ScoreRing value={now.p} size={34} stroke={4} />
          <span className="text-body font-semibold tabular">{Math.round(now.p * 100)}%</span>
        </span>
      );
    },
  },
  { key: "delta", header: "Change", align: "right", sortValue: (c) => stats(c).delta, cell: (c) => <Delta value={stats(c).delta} significant={c.significant} /> },
  {
    key: "report",
    header: <span className="sr-only">Report</span>,
    align: "right",
    cell: (c) => (
      <Button size="sm" variant="secondary" asChild>
        <a href="#report" aria-label={`Report for ${c.name}`}>View</a>
      </Button>
    ),
  },
];

const client = agencyClients[0]!;
const s = stats(client);

/** White-label: the agency's name replaces ours. */
function Report() {
  return (
    <article id="report" aria-label="Report preview" className="rounded-lg bg-surface p-6 sm:p-8">
      <header className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <p className="text-h4 font-semibold text-ink">Hudson &amp; Pine Digital</p>
        <Button size="sm" variant="secondary">
          <Download size={14} strokeWidth={1.75} aria-hidden /> Download PDF
        </Button>
      </header>
      <div className="mt-6 flex items-center gap-3">
        <Avatar name={client.name} size={44} />
        <div>
          <h2 className="text-h3 font-bold text-ink">{client.name}</h2>
          <p className="text-small text-ink-3">Nov 3 – 9</p>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-5">
        <ScoreRing value={s.now.p} margin={s.now.half} size={128} />
        <div className="space-y-1">
          <p className="text-body font-semibold text-ink">AI visibility</p>
          <Delta value={s.delta} significant={client.significant} size="md" />
        </div>
      </div>
      <p className="mt-7 text-body font-semibold text-ink">Next steps</p>
      <ol className="mt-3 space-y-3 text-ink">
        {actions.slice(0, 3).map((a, i) => (
          <li key={a.id} className="flex items-center gap-3 text-body">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lime text-small font-bold text-lime-ink tabular">{i + 1}</span>
            {a.title}
          </li>
        ))}
      </ol>
    </article>
  );
}

export function AgencyPreview() {
  return (
    <AppShell
      active="reports"
      title="All clients"
      dateRange={false}
    >
      <div className="grid items-start gap-3 xl:grid-cols-[3fr_2fr]">
        <Panel padded={false}>
          <DataTable columns={columns} rows={agencyClients} getRowId={(c) => c.name} initialSort={{ key: "delta", dir: "desc" }} dense={false} />
        </Panel>
        <Report />
      </div>
    </AppShell>
  );
}
