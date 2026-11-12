"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  align?: "left" | "right";
  width?: string;
}

type Sort = { key: string; dir: "asc" | "desc" };

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  initialSort,
  stickyHeader = true,
  dense = true,
  onRowClick,
  maxHeight,
  caption,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  initialSort?: Sort;
  stickyHeader?: boolean;
  dense?: boolean;
  onRowClick?: (row: T) => void;
  maxHeight?: string;
  caption?: string;
  className?: string;
}) {
  const [sort, setSort] = useState<Sort | undefined>(initialSort);
  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !col?.sortValue) return rows;
    const get = col.sortValue;
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * mul;
    });
  }, [rows, columns, sort]);

  const toggle = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));

  return (
    <div className={cn("relative w-full max-w-full overflow-auto rounded-lg border border-line bg-surface [contain:inline-size]", className)} style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full border-collapse text-small">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className={cn(stickyHeader && "sticky top-0 z-sticky")}>
          <tr className="bg-fill">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const right = c.align === "right";
              return (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : c.sortValue ? "none" : undefined}
                  className={cn("border-b border-line px-3 font-medium whitespace-nowrap text-ink-3", dense ? "h-8" : "h-10", right ? "text-right" : "text-left")}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      className={cn("inline-flex items-center gap-1 rounded-xs hover:text-ink focus-visible:focus-ring", right && "flex-row-reverse", active && "text-ink")}
                    >
                      {c.header}
                      {active ? (
                        sort.dir === "asc" ? <ArrowUp size={12} strokeWidth={2} aria-hidden /> : <ArrowDown size={12} strokeWidth={2} aria-hidden />
                      ) : (
                        <ChevronsUpDown size={12} strokeWidth={1.75} className="opacity-50" aria-hidden />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={getRowId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === "Enter") onRowClick(row); } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={cn("border-b border-line last:border-b-0", onRowClick && "cursor-pointer hover:bg-fill focus-visible:bg-lime-soft focus-visible:text-lime-ink focus-visible:outline-none")}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 text-ink", dense ? "h-9" : "h-12", c.align === "right" && "text-right font-mono text-data tabular")}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
