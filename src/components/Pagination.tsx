"use client";

import { motion } from "motion/react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const btnClass =
    "min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed";
  const btnActive =
    "bg-amber-600 text-zinc-900 cursor-default";
  const btnInactive =
    "bg-zinc-800 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 cursor-pointer";

  if (totalPages <= 1 && total <= limit) return null;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-4 py-4">
      <span className="text-sm text-zinc-500 order-2 sm:order-1">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center justify-center sm:justify-end gap-2 order-1 sm:order-2 flex-wrap">
        <motion.button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className={`${btnClass} ${btnInactive}`}
          aria-label="Previous page"
          whileHover={{ scale: page > 1 && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: page > 1 && !isLoading ? 0.98 : 1 }}
          transition={{ duration: 0.1 }}
        >
          Previous
        </motion.button>
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 7) return true;
              if (p === 1 || p === totalPages) return true;
              if (Math.abs(p - page) <= 1) return true;
              return false;
            })
            .reduce<number[]>((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1]! > 1) acc.push(-1);
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === -1 ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-zinc-500">
                  …
                </span>
              ) : (
                <motion.button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                  className={`min-w-9 ${btnClass} ${
                    p === page ? btnActive : btnInactive
                  }`}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                  whileHover={p !== page && !isLoading ? { scale: 1.05 } : undefined}
                  whileTap={p !== page && !isLoading ? { scale: 0.97 } : undefined}
                  transition={{ duration: 0.1 }}
                >
                  {p}
                </motion.button>
              )
            )}
        </div>
        <span className="sm:hidden text-sm text-zinc-500 px-2">
          {page}/{totalPages}
        </span>
        <motion.button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className={`${btnClass} ${btnInactive}`}
          aria-label="Next page"
          whileHover={{ scale: page < totalPages && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: page < totalPages && !isLoading ? 0.98 : 1 }}
          transition={{ duration: 0.1 }}
        >
          Next
        </motion.button>
      </div>
    </div>
  );
}
