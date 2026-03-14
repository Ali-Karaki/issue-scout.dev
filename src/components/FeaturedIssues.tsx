"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { motion } from "motion/react";
import { IssueCard } from "./IssueCard";
import type { NormalizedIssue } from "@/lib/types";
import { staggerContainer, staggerItem, fadeIn, defaultTransition } from "@/lib/animations";

interface IssuesResponse {
  issues: NormalizedIssue[];
}

export function FeaturedIssues() {
  const [issues, setIssues] = useState<NormalizedIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/issues?limit=6&page=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: IssuesResponse | null) => {
        if (data?.issues?.length) setIssues(data.issues);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <motion.div
        className="space-y-4"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={defaultTransition}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-zinc-800/40 animate-pulse"
          />
        ))}
      </motion.div>
    );
  }

  if (issues.length === 0) {
    return (
      <motion.p
        className="text-zinc-500 text-center py-12"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={defaultTransition}
      >
        Issues will appear here once the cache is refreshed.
      </motion.p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-zinc-300">Featured issues</h2>
        <Link
          href="/issues"
          className="text-amber-500 hover:text-amber-400 no-underline text-sm font-medium transition-colors duration-200"
        >
          View all
        </Link>
      </div>
      <motion.div
        className="space-y-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={defaultTransition}
      >
        {issues.slice(0, 6).map((issue) => (
          <motion.div key={issue.id} variants={staggerItem}>
            <IssueCard issue={issue} compact />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
