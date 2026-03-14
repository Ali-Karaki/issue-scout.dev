"use client";

import { AnimatePresence, motion } from "motion/react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import type { FilterState } from "@/lib/filters";

interface ResultSummaryProps {
  count: number;
  total?: number;
  filters: FilterState;
  initialFilters: FilterState;
  onRemoveFilter: (updates: Partial<FilterState>) => void;
}

export function ResultSummary({
  count,
  total,
  filters,
  initialFilters,
  onRemoveFilter,
}: ResultSummaryProps) {
  const chips: { label: string; remove: () => void }[] = [];

  if (filters.status === "likely_unclaimed" && filters.excludeStale) {
    chips.push({
      label: "Unclaimed",
      remove: () =>
        onRemoveFilter({ status: initialFilters.status, excludeStale: initialFilters.excludeStale }),
    });
  }
  if (filters.beginnerOnly) {
    chips.push({
      label: "Beginner",
      remove: () => onRemoveFilter({ beginnerOnly: false }),
    });
  }
  if (filters.excludeStale && !(filters.status === "likely_unclaimed" && filters.excludeStale)) {
    chips.push({
      label: "Exclude stale",
      remove: () => onRemoveFilter({ excludeStale: false }),
    });
  }
  if (filters.repo) {
    chips.push({
      label: `Repo: ${filters.repo}`,
      remove: () => onRemoveFilter({ repo: "" }),
    });
  }
  if (filters.label) {
    chips.push({
      label: `Label: ${filters.label}`,
      remove: () => onRemoveFilter({ label: "" }),
    });
  }
  if (filters.project && filters.project !== initialFilters.project) {
    chips.push({
      label: `Project: ${filters.project}`,
      remove: () => onRemoveFilter({ project: initialFilters.project }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="text-sm text-zinc-400">
        <strong className="text-zinc-200 font-medium">
          <AnimatedNumber value={count} duration={0.3} />
        </strong>
        {total !== undefined && total !== count && (
          <span className="text-zinc-500"> of {total}</span>
        )}{" "}
        results
      </span>
      {chips.length > 0 && (
        <>
          <span className="text-zinc-600">·</span>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence mode="popLayout">
              {chips.map(({ label, remove }) => (
                <motion.button
                  key={label}
                  type="button"
                  onClick={remove}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-700/80 text-zinc-300 text-xs hover:bg-zinc-600 hover:text-zinc-200 transition-colors duration-200"
                  aria-label={`Remove ${label} filter`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {label}
                  <span className="text-zinc-500">×</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
