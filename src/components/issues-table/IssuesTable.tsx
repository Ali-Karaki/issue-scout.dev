"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { motion } from "motion/react";
import { createColumns } from "./columns";
import type { NormalizedIssue } from "@/lib/types";
import type { SortColumn } from "@/lib/filters";
import { staggerContainer, staggerItemFade, defaultTransition } from "@/lib/animations";

const SORTABLE_COLUMNS: SortColumn[] = [
  "title",
  "repo",
  "claim",
  "beginner",
  "readiness",
  "comments",
];

interface IssuesTableProps {
  issues: NormalizedIssue[];
  sortColumn: SortColumn | null;
  sortDesc: boolean;
  onSortChange: (column: SortColumn, desc: boolean) => void;
}

export function IssuesTable({
  issues,
  sortColumn,
  sortDesc,
  onSortChange,
}: IssuesTableProps) {
  const columns = useMemo(() => createColumns(), []);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns functions
  const table = useReactTable({
    data: issues,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full min-w-0">
      <table className="w-full min-w-0 table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: "32%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "6%" }} />
        </colgroup>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const columnId = header.column.id as SortColumn | string;
                const canSort =
                  SORTABLE_COLUMNS.includes(columnId as SortColumn);
                const isActive = sortColumn === columnId;
                return (
                  <th
                    key={header.id}
                    className="px-2 py-2 text-left text-xs text-zinc-500 border-b border-zinc-700/50 overflow-hidden"
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={() =>
                          onSortChange(
                            columnId as SortColumn,
                            isActive ? !sortDesc : false
                          )
                        }
                        className="flex items-center gap-1 w-full text-left hover:text-zinc-300 transition focus:outline-none"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <motion.span
                          className="text-amber-500 shrink-0 inline-block"
                          key={isActive ? (sortDesc ? "desc" : "asc") : "none"}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
                        >
                          {isActive ? (sortDesc ? " ↓" : " ↑") : ""}
                        </motion.span>
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <motion.tbody
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          transition={defaultTransition}
        >
          {table.getRowModel().rows.map((row) => (
            <motion.tr
              key={row.id}
              variants={staggerItemFade}
              className="border-b border-zinc-700/50 bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors duration-200"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-2 py-3 align-middle overflow-hidden"
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
