"use client";

import { Delta } from "@/components/ui/delta";
import { IntervalValue } from "@/components/ui/interval-value";
import { Sparkline } from "@/components/ui/sparkline";
import { DataTable, type Column } from "@/components/ui/table";
import { wilson, type Question } from "@/lib/mock";

/**
 * Questions ranked by your mention rate, with interval, average position when mentioned, change
 * (muted unless significant) and an 8-week sparkline. Sorting is by the point estimate.
 */
export function RankTable({ rows, onRowClick, maxHeight }: { rows: Question[]; onRowClick?: (q: Question) => void; maxHeight?: string }) {
  const columns: Column<Question>[] = [
    {
      key: "question",
      header: "Question",
      cell: (q) => (
        // min width keeps questions readable; in narrow containers the table scrolls instead
        <span className="flex min-w-56 flex-col">
          <span className="text-ink">{q.text}</span>
          <span className="text-micro tracking-normal text-ink-3">{q.intent}</span>
        </span>
      ),
      sortValue: (q) => q.text,
    },
    {
      key: "rate",
      header: "Mentioned",
      align: "right",
      width: "7.5rem",
      cell: (q) => {
        const w = wilson(q.x, q.n);
        return <IntervalValue p={w.p} lo={w.lo} hi={w.hi} n={q.n} size="sm" />;
      },
      sortValue: (q) => q.x / q.n,
    },
    {
      key: "rank",
      header: "Avg. position",
      align: "right",
      width: "6.5rem",
      cell: (q) => <span className="font-mono tabular text-ink">{q.rank === null ? <span className="text-ink-3">—</span> : q.rank.toFixed(1)}</span>,
      sortValue: (q) => q.rank ?? 99,
    },
    {
      key: "change",
      header: "Change",
      align: "right",
      width: "6.5rem",
      cell: (q) => <Delta value={(q.x / q.n - q.xPrev / q.nPrev) * 100} significant={q.significant} />,
      sortValue: (q) => q.x / q.n - q.xPrev / q.nPrev,
    },
    { key: "trend", header: "8 weeks", width: "6rem", cell: (q) => <Sparkline values={q.trend} /> },
    { key: "top", header: "Top competitor", width: "11rem", cell: (q) => <span className="text-ink-2">{q.topCompetitor}</span>, sortValue: (q) => q.topCompetitor },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(q) => q.id}
      initialSort={{ key: "rate", dir: "desc" }}
      onRowClick={onRowClick}
      maxHeight={maxHeight}
      caption="Tracked questions ranked by how often AI mentions you"
    />
  );
}
